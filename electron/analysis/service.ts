/**
 * Service d'analyse : relie le jeu de données, le moteur, la sauvegarde et l'interface.
 * Indépendant d'Electron (les chemins et l'émission d'événements sont injectés).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { readDatasetFile, readTournamentHands, type DatasetTournament } from "../ingest/dataset";
import { buildLeaks } from "./leaks";
import {
  analyzeTournament,
  AnalysisCancelled,
  isAnalysisCurrent,
  loadAnalysis,
  saveAnalysis,
  summarize,
  threadsForPower,
} from "./tournament";
import type { Leak, ReplayHand, TournamentAnalysis } from "./types";

export interface AiSettings {
  /** Part de la machine consacrée à l'analyse, 5 à 100. Plafond approximatif. */
  powerPercent: number;
  /** Lance l'analyse en ouvrant un tournoi pas encore analysé. */
  autoAnalyze: boolean;
  /** Reformule les conseils avec le modèle de langage local (s'il est installé). */
  llmEnabled: boolean;
}

export const DEFAULT_SETTINGS: AiSettings = { powerPercent: 50, autoAnalyze: true, llmEnabled: false };

export function sanitizeSettings(raw: Partial<AiSettings> | null | undefined): AiSettings {
  const p = Number(raw?.powerPercent);
  return {
    powerPercent: Number.isFinite(p) ? Math.min(100, Math.max(5, Math.round(p))) : DEFAULT_SETTINGS.powerPercent,
    autoAnalyze: typeof raw?.autoAnalyze === "boolean" ? raw.autoAnalyze : DEFAULT_SETTINGS.autoAnalyze,
    llmEnabled: typeof raw?.llmEnabled === "boolean" ? raw.llmEnabled : DEFAULT_SETTINGS.llmEnabled,
  };
}

export function loadSettings(file: string): AiSettings {
  try {
    if (existsSync(file)) return sanitizeSettings(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    /* repli sur les valeurs par défaut */
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(file: string, settings: AiSettings): AiSettings {
  const clean = sanitizeSettings(settings);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(clean, null, 2), "utf8");
  return clean;
}

export interface TournamentListItem extends DatasetTournament {
  analysis: null | { mistakes: number; totalLossBb: number; analyzedAt: string; spots: number };
}

export interface AnalysisProgress {
  tournamentId: string;
  phase: "moteur" | "texte";
  done: number;
  total: number;
}

export type AnalysisEvent =
  | { channel: "analysis:progress"; payload: AnalysisProgress }
  | { channel: "analysis:done"; payload: { tournamentId: string; mistakes: number; leaks: number } }
  | { channel: "analysis:error"; payload: { tournamentId: string; error: string; cancelled: boolean } };

export interface AnalysisServiceDeps {
  datasetDir: string;
  analysisDir: string;
  settingsFile: string;
  workerFile: string;
  logicalCpus: number;
  emit: (event: AnalysisEvent) => void;
  /** Étape facultative après le moteur : reformulation par l'IA locale. */
  refine?: (
    analysis: TournamentAnalysis,
    hooks: { onProgress: (done: number, total: number) => void; signal: AbortSignal; powerPercent: number },
  ) => Promise<void>;
  /** Pour les tests : 0 = calcul dans le thread courant. */
  forceThreads?: number;
  samples?: number;
}

interface Running {
  tournamentId: string;
  controller: AbortController;
  promise: Promise<void>;
}

export class AnalysisService {
  private running: Running | null = null;

  constructor(private readonly deps: AnalysisServiceDeps) {}

  getSettings(): AiSettings {
    return loadSettings(this.deps.settingsFile);
  }

  setSettings(settings: AiSettings): AiSettings {
    return saveSettings(this.deps.settingsFile, settings);
  }

  currentTask(): { tournamentId: string } | null {
    return this.running ? { tournamentId: this.running.tournamentId } : null;
  }

  listTournaments(): TournamentListItem[] {
    const data = readDatasetFile(this.deps.datasetDir);
    if (!data) return [];
    return data.tournaments.map((t) => {
      const analysis = loadAnalysis(this.deps.analysisDir, t.fileKey);
      const current = isAnalysisCurrent(analysis, t.handIds);
      return {
        ...t,
        analysis:
          current && analysis
            ? {
                mistakes: analysis.summary.mistakes,
                totalLossBb: analysis.summary.totalLossBb,
                analyzedAt: analysis.summary.analyzedAt,
                spots: analysis.summary.spotsAnalyzed,
              }
            : null,
      };
    });
  }

  private find(tournamentId: string): DatasetTournament | undefined {
    return readDatasetFile(this.deps.datasetDir)?.tournaments.find((t) => t.id === tournamentId);
  }

  /** Mains du tournoi : analysées si une analyse à jour existe, brutes sinon. */
  getHands(tournamentId: string): { hands: ReplayHand[]; analyzed: boolean; leaks: Leak[] } {
    const t = this.find(tournamentId);
    if (!t) return { hands: [], analyzed: false, leaks: [] };
    const analysis = loadAnalysis(this.deps.analysisDir, t.fileKey);
    if (analysis && isAnalysisCurrent(analysis, t.handIds)) {
      return { hands: analysis.hands, analyzed: true, leaks: analysis.leaks };
    }
    return { hands: readTournamentHands(this.deps.datasetDir, tournamentId), analyzed: false, leaks: [] };
  }

  /** Leaks cumulés de tous les tournois analysés. */
  allLeaks(): { leaks: Leak[]; handsAnalyzed: number } {
    const data = readDatasetFile(this.deps.datasetDir);
    if (!data) return { leaks: [], handsAnalyzed: 0 };
    const hands: ReplayHand[] = [];
    for (const t of data.tournaments) {
      const a = loadAnalysis(this.deps.analysisDir, t.fileKey);
      if (a && isAnalysisCurrent(a, t.handIds)) hands.push(...a.hands);
    }
    return { leaks: buildLeaks(hands), handsAnalyzed: hands.length };
  }

  start(tournamentId: string): { ok: boolean; error?: string; alreadyRunning?: boolean } {
    if (this.running) {
      return { ok: this.running.tournamentId === tournamentId, alreadyRunning: true, error: this.running.tournamentId === tournamentId ? undefined : "Une autre analyse est en cours." };
    }
    const t = this.find(tournamentId);
    if (!t) return { ok: false, error: "Tournoi introuvable." };
    const hands = readTournamentHands(this.deps.datasetDir, tournamentId);
    if (hands.length === 0) return { ok: false, error: "Aucune main à analyser pour ce tournoi." };

    const controller = new AbortController();
    const settings = this.getSettings();
    const threads = this.deps.forceThreads ?? threadsForPower(settings.powerPercent, this.deps.logicalCpus);
    const { emit } = this.deps;

    const promise = (async () => {
      try {
        const analysis = await analyzeTournament({
          tournamentId,
          hands,
          threads,
          workerFile: this.deps.workerFile,
          samples: this.deps.samples,
          signal: controller.signal,
          onProgress: (done, total) =>
            emit({ channel: "analysis:progress", payload: { tournamentId, phase: "moteur", done, total } }),
        });

        if (this.deps.refine) {
          try {
            await this.deps.refine(analysis, {
              signal: controller.signal,
              powerPercent: settings.powerPercent,
              onProgress: (done, total) =>
                emit({ channel: "analysis:progress", payload: { tournamentId, phase: "texte", done, total } }),
            });
            analysis.summary = summarize(analysis.hands);
          } catch (err) {
            if (controller.signal.aborted) throw new AnalysisCancelled();
            // Le texte IA est un bonus : on garde l'analyse du moteur.
          }
        }

        saveAnalysis(this.deps.analysisDir, t.fileKey, analysis);
        emit({
          channel: "analysis:done",
          payload: { tournamentId, mistakes: analysis.summary.mistakes, leaks: analysis.leaks.length },
        });
      } catch (err) {
        const cancelled = err instanceof AnalysisCancelled || controller.signal.aborted;
        emit({
          channel: "analysis:error",
          payload: {
            tournamentId,
            cancelled,
            error: cancelled ? "Analyse annulée." : err instanceof Error ? err.message : String(err),
          },
        });
      } finally {
        this.running = null;
      }
    })();

    this.running = { tournamentId, controller, promise };
    return { ok: true };
  }

  cancel(): boolean {
    if (!this.running) return false;
    this.running.controller.abort();
    return true;
  }

  /** Attend la fin de l'analyse en cours (tests). */
  async idle(): Promise<void> {
    await this.running?.promise;
  }
}
