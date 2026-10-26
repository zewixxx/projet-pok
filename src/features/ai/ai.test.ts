import { describe, expect, it } from "vitest";
import { replayHandsToReviewHands } from "../import/replayToReviewHands";
import { villainRangeFromEngine } from "../review/data/rangeDetection";
import type { ReplayHand } from "../review/replay.types";
import { computeReplayState } from "../review/utils/replayEngine";
import { resolveHeroAnalysis } from "../review/utils/generateHeroAnalysis";
import { estimateSeconds, threadsForPower } from "./power";

function hand(partial: Partial<ReplayHand> = {}): ReplayHand {
  return {
    id: "h1",
    label: "test",
    blindsBb: { small: 0.5, big: 1 },
    players: [
      { id: "hero", name: "Hero", stackBb: 20, seatIndex: 0, position: "BTN", isHero: true, holeCards: ["Ah", "Kd"] },
      { id: "sb", name: "SB", stackBb: 20, seatIndex: 1, position: "SB" },
      { id: "bb", name: "BB", stackBb: 20, seatIndex: 2, position: "BB" },
    ],
    actions: [
      { playerId: "hero", type: "raise", amountBb: 2.2, street: "preflop" },
      { playerId: "sb", type: "fold", street: "preflop" },
      { playerId: "bb", type: "fold", street: "preflop" },
    ],
    boards: [],
    ...partial,
  };
}

describe("ante dans le moteur de replay", () => {
  it("ajoute l'ante de chaque joueur au pot", () => {
    const base = computeReplayState(hand(), 0);
    const withAnte = computeReplayState(hand({ anteBb: 0.1 }), 0);
    expect(withAnte.pot).toBeCloseTo(base.pot + 0.3, 5);
    // L'ante n'est pas une mise de la rue.
    expect(withAnte.streetBets.bb).toBe(1);
    expect(withAnte.totalInvested.bb).toBeCloseTo(1.1, 5);
  });
});

describe("analyses du moteur dans la review", () => {
  it("ne fabrique pas de fausse analyse sur une main analysée", () => {
    expect(resolveHeroAnalysis(hand({ analyzed: true }), 0)).toEqual({});
    // Sans le drapeau, l'ancien comportement (démo) reste inchangé.
    expect(resolveHeroAnalysis(hand(), 0).tip).toBeTruthy();
  });

  it("utilise la range du moteur : décision du héros, puis prochaine décision", () => {
    const h = hand({
      analyzed: true,
      spots: {
        0: {
          kind: "correct",
          street: "preflop",
          heroPosition: "BTN",
          equityPct: 55,
          potBb: 1.5,
          toCallBb: 1,
          stackBb: 20,
          villainId: "bb",
          villainPosition: "BB",
          villainRange: { AA: 1, "72o": 0 },
          villainRangeLabel: "Paie l'ouverture",
          villainRangePct: "40.0%",
          confidence: "moyenne",
          evLossBb: 0,
        },
      },
    });
    const range = villainRangeFromEngine(h, 0);
    expect(range?.playerId).toBe("bb");
    expect(range?.probs.AA).toBe(1);
    expect(villainRangeFromEngine(h, 2)?.pct).toBe("40.0%");
    expect(villainRangeFromEngine(hand(), 0)).toBeNull();
  });

  it("compte la perte d'une erreur une seule fois", () => {
    const h = hand({
      analyzed: true,
      coachTips: { 0: { quality: "mistake", headline: "Fold trop serré", detail: "", evDiffBb: 1.2 } },
      evComparisons: {
        0: { options: [{ type: "raise", evBb: 1.5 }, { type: "fold", evBb: 0.3, isPlayed: true }] },
      },
      spots: {
        0: {
          kind: "overfold",
          street: "preflop",
          heroPosition: "BTN",
          equityPct: 55,
          potBb: 1.5,
          toCallBb: 1,
          stackBb: 20,
          confidence: "moyenne",
          evLossBb: 1.2,
        },
      },
    });
    const [review] = replayHandsToReviewHands([h], "t1", "2026-04-17");
    expect(review.evImpact).toBe(-1.2);
    expect(review.summary).toBe("Fold trop serré");
  });
});

describe("puissance", () => {
  it("reste identique au calcul du processus principal", () => {
    expect(threadsForPower(20, 8)).toBe(1);
    expect(threadsForPower(50, 8)).toBe(2);
    expect(threadsForPower(100, 8)).toBe(4);
    expect(threadsForPower(100, 16)).toBe(8);
    expect(threadsForPower(100, 1)).toBe(1);
  });

  it("estime une durée plus courte avec plus de cœurs", () => {
    expect(estimateSeconds(150, 4)).toBeLessThan(estimateSeconds(150, 1));
    expect(estimateSeconds(1, 1)).toBeGreaterThanOrEqual(1);
  });
});
