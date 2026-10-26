/**
 * Service du modèle de langage : statut, téléchargement explicite, reformulation.
 * Indépendant d'Electron (chemins et événements injectés).
 */

import { rmSync } from "fs";
import type { TournamentAnalysis } from "../analysis/types";
import { threadsForPower } from "../analysis/tournament";
import { LlmRunner, refineTips, type TextRewriter } from "./llm";
import {
  DownloadCancelled,
  downloadModel,
  findModel,
  isModelInstalled,
  modelPath,
  MODELS,
  recommendModel,
  type ModelSpec,
} from "./models";

export interface LlmStatus {
  recommended: { id: string; label: string; sizeMb: number };
  /** Modèle réellement utilisé, s'il est installé. */
  installed: { id: string; label: string; sizeMb: number } | null;
  downloading: { id: string; receivedBytes: number; totalBytes: number } | null;
  totalMemGb: number;
}

export type LlmEvent =
  | { channel: "llm:download-progress"; payload: { id: string; receivedBytes: number; totalBytes: number } }
  | { channel: "llm:download-done"; payload: { id: string } }
  | { channel: "llm:download-error"; payload: { id: string; error: string; cancelled: boolean } };

export interface LlmServiceDeps {
  modelsDir: string;
  totalMemGb: number;
  logicalCpus: number;
  isEnabled: () => boolean;
  emit: (event: LlmEvent) => void;
  /** Pour les tests : remplace le vrai téléchargement. */
  download?: typeof downloadModel;
  /** Pour les tests : remplace le vrai modèle. */
  createRunner?: () => { load: (path: string, threads: number) => Promise<void>; dispose: () => Promise<void> } & TextRewriter;
}

/** Nombre de conseils reformulés par tournoi : borné pour garder une durée raisonnable. */
const TIPS_BY_MODEL: Record<string, number> = {
  "qwen2.5-0.5b": 8,
  "qwen2.5-1.5b": 12,
  "qwen2.5-3b": 20,
  "qwen2.5-7b": 30,
};

export class LlmService {
  private downloading: { spec: ModelSpec; controller: AbortController; received: number; total: number } | null = null;

  constructor(private readonly deps: LlmServiceDeps) {}

  private pick(): ModelSpec | null {
    const rec = recommendModel(this.deps.totalMemGb);
    if (isModelInstalled(this.deps.modelsDir, rec)) return rec;
    // À défaut, le plus gros modèle déjà installé.
    const others = [...MODELS].reverse().filter((m) => isModelInstalled(this.deps.modelsDir, m));
    return others[0] ?? null;
  }

  status(): LlmStatus {
    const rec = recommendModel(this.deps.totalMemGb);
    const used = this.pick();
    const brief = (m: ModelSpec) => ({ id: m.id, label: m.label, sizeMb: m.sizeMb });
    return {
      recommended: brief(rec),
      installed: used ? brief(used) : null,
      downloading: this.downloading
        ? { id: this.downloading.spec.id, receivedBytes: this.downloading.received, totalBytes: this.downloading.total }
        : null,
      totalMemGb: this.deps.totalMemGb,
    };
  }

  /** Lance le téléchargement du modèle conseillé. Toujours déclenché par l'utilisateur. */
  startDownload(modelId?: string): { ok: boolean; error?: string } {
    if (this.downloading) return { ok: false, error: "Un téléchargement est déjà en cours." };
    const spec = modelId ? findModel(modelId) : recommendModel(this.deps.totalMemGb);
    if (!spec) return { ok: false, error: "Modèle inconnu." };
    if (isModelInstalled(this.deps.modelsDir, spec)) return { ok: true };

    const controller = new AbortController();
    const state = { spec, controller, received: 0, total: spec.sizeMb * 1024 * 1024 };
    this.downloading = state;
    const download = this.deps.download ?? downloadModel;

    void download(
      this.deps.modelsDir,
      spec,
      (received, total) => {
        state.received = received;
        state.total = total;
        this.deps.emit({
          channel: "llm:download-progress",
          payload: { id: spec.id, receivedBytes: received, totalBytes: total },
        });
      },
      controller.signal,
    )
      .then(() => this.deps.emit({ channel: "llm:download-done", payload: { id: spec.id } }))
      .catch((err: unknown) => {
        const cancelled = err instanceof DownloadCancelled || controller.signal.aborted;
        this.deps.emit({
          channel: "llm:download-error",
          payload: {
            id: spec.id,
            cancelled,
            error: cancelled ? "Téléchargement annulé." : err instanceof Error ? err.message : String(err),
          },
        });
      })
      .finally(() => {
        this.downloading = null;
      });
    return { ok: true };
  }

  cancelDownload(): boolean {
    if (!this.downloading) return false;
    this.downloading.controller.abort();
    return true;
  }

  remove(): { ok: boolean } {
    for (const m of MODELS) rmSync(modelPath(this.deps.modelsDir, m), { force: true });
    return { ok: true };
  }

  /** Reformule les conseils des plus grosses erreurs. Sans effet si désactivé ou sans modèle. */
  async refine(
    analysis: TournamentAnalysis,
    hooks: { onProgress: (done: number, total: number) => void; signal: AbortSignal; powerPercent: number },
  ): Promise<void> {
    if (!this.deps.isEnabled()) return;
    const spec = this.pick();
    if (!spec) return;

    const runner = this.deps.createRunner ? this.deps.createRunner() : new LlmRunner();
    try {
      await runner.load(modelPath(this.deps.modelsDir, spec), threadsForPower(hooks.powerPercent, this.deps.logicalCpus));
      await refineTips(analysis, runner, {
        maxTips: TIPS_BY_MODEL[spec.id] ?? 10,
        signal: hooks.signal,
        onProgress: hooks.onProgress,
      });
    } finally {
      await runner.dispose().catch(() => undefined);
    }
  }
}
