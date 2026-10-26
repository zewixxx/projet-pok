import { mkdirSync, mkdtempSync, rmSync, truncateSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ReplayHand, TournamentAnalysis } from "../analysis/types";
import { LlmService, type LlmEvent } from "./service";
import { DownloadCancelled, MODELS, modelPath } from "./models";

let dir: string;
let events: LlmEvent[];
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), "pok-llm-"));
  events = [];
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** Crée un faux fichier modèle assez gros pour passer la vérification de taille. */
function installFake(id: string): void {
  const spec = MODELS.find((m) => m.id === id)!;
  mkdirSync(dir, { recursive: true });
  const file = modelPath(dir, spec);
  writeFileSync(file, "");
  // Fichier creux : la taille est déclarée sans rien écrire, donc instantané.
  truncateSync(file, Math.ceil(spec.sizeMb * 1024 * 1024 * 0.95));
}

function analysis(): TournamentAnalysis {
  const hand: ReplayHand = {
    id: "h",
    label: "t",
    blindsBb: { small: 0.5, big: 1 },
    players: [{ id: "hero", name: "H", stackBb: 20, seatIndex: 0, position: "BB", isHero: true, holeCards: ["7c", "2d"] }],
    actions: [{ playerId: "hero", type: "call", amountBb: 9, street: "preflop" }],
    boards: [],
    coachTips: { 0: { quality: "mistake", headline: "Call trop large", detail: "moteur", evDiffBb: 2.4, source: "moteur" } },
    spots: { 0: { kind: "overcall", street: "preflop", heroPosition: "BB", equityPct: 31, potOddsPct: 47, potBb: 11, toCallBb: 9, stackBb: 20, confidence: "haute", evLossBb: 2.4 } },
  };
  return { version: 1, tournamentId: "t", hands: [hand], leaks: [], summary: { handsAnalyzed: 1, spotsAnalyzed: 1, mistakes: 1, totalLossBb: 2.4, analyzedAt: "", engine: "" } };
}

function service(extra: Partial<ConstructorParameters<typeof LlmService>[0]> = {}) {
  return new LlmService({ modelsDir: dir, totalMemGb: 7.8, logicalCpus: 8, isEnabled: () => true, emit: (e) => events.push(e), ...extra });
}

describe("LlmService", () => {
  it("recommande un modèle adapté et n'en installe aucun tout seul", () => {
    const s = service().status();
    expect(s.recommended.id).toBe("qwen2.5-1.5b");
    expect(s.installed).toBeNull();
    expect(s.downloading).toBeNull();
  });

  it("détecte le modèle installé", () => {
    installFake("qwen2.5-1.5b");
    expect(service().status().installed?.id).toBe("qwen2.5-1.5b");
  });

  it("télécharge sur demande, publie la progression puis la fin", async () => {
    const svc = service({
      download: async (_d, _s, onProgress) => {
        onProgress(50, 100);
        return "ok";
      },
    });
    expect(svc.startDownload().ok).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    expect(events.map((e) => e.channel)).toEqual(["llm:download-progress", "llm:download-done"]);
    expect(svc.status().downloading).toBeNull();
  });

  it("refuse deux téléchargements simultanés et sait annuler", async () => {
    const svc = service({
      download: (_d, _s, _p, signal) =>
        new Promise<string>((_resolve, reject) => signal.addEventListener("abort", () => reject(new DownloadCancelled()))),
    });
    expect(svc.startDownload().ok).toBe(true);
    expect(svc.startDownload().ok).toBe(false);
    expect(svc.cancelDownload()).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    const last = events[events.length - 1];
    expect(last.channel).toBe("llm:download-error");
    if (last.channel === "llm:download-error") expect(last.payload.cancelled).toBe(true);
    expect(svc.cancelDownload()).toBe(false);
  });

  it("ne fait rien sans modèle ou si c'est désactivé", async () => {
    const a = analysis();
    let loaded = false;
    const createRunner = () => ({
      load: async () => {
        loaded = true;
      },
      dispose: async () => undefined,
      rewrite: async () => "Avec 31 % d'équité pour 47 % requis, te coucher est meilleur ici.",
    });
    const hooks = { onProgress: () => undefined, signal: new AbortController().signal, powerPercent: 50 };

    await service({ createRunner }).refine(a, hooks); // pas de modèle installé
    expect(loaded).toBe(false);

    installFake("qwen2.5-1.5b");
    await service({ createRunner, isEnabled: () => false }).refine(a, hooks);
    expect(loaded).toBe(false);
    expect(a.hands[0].coachTips![0].source).toBe("moteur");
  });

  it("reformule quand un modèle est installé et activé, puis libère le modèle", async () => {
    installFake("qwen2.5-1.5b");
    const a = analysis();
    let disposed = false;
    let threads = 0;
    await service({
      createRunner: () => ({
        load: async (_p, t) => {
          threads = t;
        },
        dispose: async () => {
          disposed = true;
        },
        rewrite: async () => "Avec 31 % d'équité pour 47 % requis, te coucher est meilleur ici.",
      }),
    }).refine(a, { onProgress: () => undefined, signal: new AbortController().signal, powerPercent: 100 });
    expect(a.hands[0].coachTips![0].source).toBe("ia");
    expect(disposed).toBe(true);
    expect(threads).toBe(4);
  });
});
