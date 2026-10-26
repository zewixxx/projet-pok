/**
 * Analyse complète d'un tournoi : toutes les mains, en parallèle, avec progression.
 * Résultat sauvegardé sur disque pour que la review soit instantanée ensuite.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { analyzeHand, ENGINE_NAME } from "./analyzeHand";
import { buildLeaks } from "./leaks";
import { WorkerPool } from "./pool";
import type { ReplayHand, TournamentAnalysis } from "./types";

/** À incrémenter quand le moteur change : les anciens résultats sont alors recalculés. */
/** À incrémenter quand le contenu d'une analyse change (textes, calculs) : les anciennes sont refaites. */
export const ANALYSIS_VERSION = 2;

const CHUNK = 4;

export class AnalysisCancelled extends Error {
  constructor() {
    super("Analyse annulée.");
  }
}

export interface AnalyzeTournamentOptions {
  tournamentId: string;
  hands: ReplayHand[];
  /** Nombre de threads. 0 = dans le thread courant (tests). */
  threads: number;
  /** Chemin du worker compilé. Requis si threads > 0. */
  workerFile?: string;
  samples?: number;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

/**
 * Nombre de cœurs réellement utiles pour ce calcul. Avec l'hyper-threading,
 * les threads logiques se partagent un cœur : au-delà, on ne va pas plus vite
 * (mesuré : 4 threads > 8 threads sur un i5 4 cœurs / 8 threads).
 */
export function usableCores(logicalCpus: number): number {
  const logical = Math.max(1, logicalCpus);
  return logical >= 4 ? Math.max(2, Math.floor(logical / 2)) : logical;
}

export function threadsForPower(powerPercent: number, logicalCpus: number): number {
  const cores = usableCores(logicalCpus);
  const pct = Math.min(100, Math.max(5, powerPercent));
  return Math.min(cores, Math.max(1, Math.round((pct / 100) * cores)));
}

export function summarize(hands: ReplayHand[]): TournamentAnalysis["summary"] {
  let spots = 0;
  let mistakes = 0;
  let loss = 0;
  for (const h of hands) {
    for (const [key, spot] of Object.entries(h.spots ?? {})) {
      spots += 1;
      if (h.coachTips?.[Number(key)]?.quality === "mistake") {
        mistakes += 1;
        loss += spot.evLossBb;
      }
    }
  }
  return {
    handsAnalyzed: hands.length,
    spotsAnalyzed: spots,
    mistakes,
    totalLossBb: Math.round(loss * 100) / 100,
    analyzedAt: new Date().toISOString(),
    engine: ENGINE_NAME,
  };
}

export async function analyzeTournament(opts: AnalyzeTournamentOptions): Promise<TournamentAnalysis> {
  const { hands, onProgress, signal } = opts;
  const total = hands.length;
  const results: ReplayHand[] = new Array(total);
  let done = 0;
  onProgress?.(0, total);

  if (opts.threads <= 0 || !opts.workerFile) {
    for (let i = 0; i < total; i += 1) {
      if (signal?.aborted) throw new AnalysisCancelled();
      results[i] = analyzeHand(hands[i], { samples: opts.samples });
      done += 1;
      onProgress?.(done, total);
      // Laisse respirer la boucle d'événements : l'annulation reste réactive.
      await new Promise((r) => setImmediate(r));
    }
  } else {
    const pool = new WorkerPool(opts.workerFile, Math.min(opts.threads, Math.ceil(total / CHUNK) || 1));
    const onAbort = () => void pool.close();
    signal?.addEventListener("abort", onAbort);
    try {
      const jobs: Promise<void>[] = [];
      for (let start = 0; start < total; start += CHUNK) {
        const slice = hands.slice(start, start + CHUNK);
        jobs.push(
          pool.run<ReplayHand[]>({ kind: "analyze", hands: slice, samples: opts.samples }).then((out) => {
            out.forEach((h, i) => {
              results[start + i] = h;
            });
            done += slice.length;
            onProgress?.(done, total);
          }),
        );
      }
      await Promise.all(jobs);
    } catch (err) {
      if (signal?.aborted) throw new AnalysisCancelled();
      throw err;
    } finally {
      signal?.removeEventListener("abort", onAbort);
      await pool.close();
    }
  }

  if (signal?.aborted) throw new AnalysisCancelled();
  return {
    version: ANALYSIS_VERSION,
    tournamentId: opts.tournamentId,
    hands: results,
    leaks: buildLeaks(results),
    summary: summarize(results),
  };
}

// ─── Sauvegarde ─────────────────────────────────────────────────────────────

const fileOf = (dir: string, key: string) => path.join(dir, `${key}.json`);

export function saveAnalysis(dir: string, key: string, analysis: TournamentAnalysis): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(fileOf(dir, key), JSON.stringify(analysis), "utf8");
}

export function loadAnalysis(dir: string, key: string): TournamentAnalysis | null {
  const file = fileOf(dir, key);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as TournamentAnalysis;
  } catch {
    return null;
  }
}

/** Une analyse est valide si elle vient du moteur actuel et couvre exactement les mêmes mains. */
export function isAnalysisCurrent(analysis: TournamentAnalysis | null, handIds: string[]): boolean {
  if (!analysis || analysis.version !== ANALYSIS_VERSION) return false;
  if (analysis.hands.length !== handIds.length) return false;
  return analysis.hands.every((h, i) => h.id === handIds[i]);
}
