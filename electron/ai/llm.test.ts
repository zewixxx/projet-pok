import { describe, expect, it } from "vitest";
import type { ReplayHand, TournamentAnalysis } from "../analysis/types";
import { isAcceptableRewrite, refineTips } from "./llm";
import { findModel, isModelInstalled, MODELS, recommendModel } from "./models";

function analysisWith(losses: number[]): TournamentAnalysis {
  const hands: ReplayHand[] = losses.map((loss, i) => ({
    id: `h${i}`,
    label: "t",
    blindsBb: { small: 0.5, big: 1 },
    players: [{ id: "hero", name: "Hero", stackBb: 20, seatIndex: 0, position: "BB", isHero: true, holeCards: ["7c", "2d"] }],
    actions: [{ playerId: "hero", type: "call", amountBb: 9, street: "preflop" }],
    boards: [],
    coachTips: { 0: { quality: "mistake", headline: "Call trop large en BB", detail: "Texte du moteur", evDiffBb: loss, source: "moteur" } },
    spots: {
      0: { kind: "overcall", street: "preflop", heroPosition: "BB", equityPct: 31, potOddsPct: 47, potBb: 11, toCallBb: 9, stackBb: 20, confidence: "haute", evLossBb: loss },
    },
  }));
  return { version: 1, tournamentId: "t", hands, leaks: [], summary: { handsAnalyzed: hands.length, spotsAnalyzed: hands.length, mistakes: hands.length, totalLossBb: 0, analyzedAt: "", engine: "" } };
}

describe("choix du modèle selon la machine", () => {
  it("adapte la taille à la mémoire", () => {
    expect(recommendModel(4).id).toBe("qwen2.5-0.5b");
    expect(recommendModel(7.8).id).toBe("qwen2.5-1.5b");
    expect(recommendModel(16).id).toBe("qwen2.5-3b");
    expect(recommendModel(32).id).toBe("qwen2.5-7b");
    expect(findModel("qwen2.5-3b")?.file).toContain("3b");
    expect(new Set(MODELS.map((m) => m.id)).size).toBe(MODELS.length);
  });

  it("n'annonce pas installé un modèle absent", () => {
    expect(isModelInstalled("C:/dossier/inexistant", MODELS[0])).toBe(false);
  });
});

describe("garde-fou des reformulations", () => {
  const facts = "Équité estimée : 31 %. Équité requise : 47 %. Perte d'EV : 2.4 bb.";

  it("accepte un texte qui reprend les chiffres fournis", () => {
    expect(isAcceptableRewrite("Avec 31 % d'équité contre 47 % requis, tu perds 2.4 bb en payant : c'est un fold.", facts)).toBe(true);
    expect(isAcceptableRewrite("Avec 31 % d'équité contre 47 % requis, tu perds 2,4 bb en payant : c'est un fold.", facts)).toBe(true);
  });

  it("refuse un chiffre inventé, un texte trop court ou vide", () => {
    expect(isAcceptableRewrite("Tu as 85 % d'équité, c'est un call évident pour toi ici.", facts)).toBe(false);
    expect(isAcceptableRewrite("Fold.", facts)).toBe(false);
    expect(isAcceptableRewrite("", facts)).toBe(false);
  });
});

describe("refineTips", () => {
  it("reformule d'abord les plus grosses pertes, dans la limite demandée", async () => {
    const analysis = analysisWith([0.6, 3.1, 1.2]);
    const seen: string[] = [];
    const result = await refineTips(
      analysis,
      {
        rewrite: async (prompt) => {
          seen.push(prompt);
          return "Avec 31 % d'équité pour 47 % requis, tu perds de l'EV en payant : te coucher est meilleur.";
        },
      },
      { maxTips: 2 },
    );
    expect(result).toEqual({ rewritten: 2, rejected: 0 });
    expect(analysis.hands[1].coachTips![0].source).toBe("ia");
    expect(analysis.hands[2].coachTips![0].source).toBe("ia");
    expect(analysis.hands[0].coachTips![0].source).toBe("moteur");
    expect(analysis.hands[0].coachTips![0].detail).toBe("Texte du moteur");
  });

  it("garde le texte du moteur si la reformulation est refusée ou plante", async () => {
    const analysis = analysisWith([2, 1]);
    let n = 0;
    const result = await refineTips(
      analysis,
      {
        rewrite: async () => {
          n += 1;
          if (n === 1) return "Tu as 99 % d'équité et tu devrais payer sans hésiter ici.";
          throw new Error("boom");
        },
      },
      { maxTips: 5 },
    );
    expect(result).toEqual({ rewritten: 0, rejected: 2 });
    expect(analysis.hands[0].coachTips![0].detail).toBe("Texte du moteur");
  });

  it("s'arrête à l'annulation", async () => {
    const analysis = analysisWith([2, 1, 3]);
    const ctrl = new AbortController();
    let calls = 0;
    await refineTips(
      analysis,
      {
        rewrite: async () => {
          calls += 1;
          ctrl.abort();
          return "Avec 31 % d'équité pour 47 % requis, te coucher est meilleur ici.";
        },
      },
      { maxTips: 5, signal: ctrl.signal },
    );
    expect(calls).toBe(1);
  });
});
