import { describe, expect, it } from "vitest";
import type { ReplayHand } from "../replay.types";
import { handMark, heroActionIndexes, mistakeActionIndexes, nextSpot, worstMistakeIndex } from "./navigation";

function makeHand(id: string, opts: { heroActions: number[]; tips?: Record<number, "good" | "ok" | "mistake">; losses?: Record<number, number> }): ReplayHand {
  const total = Math.max(...opts.heroActions, 0) + 2;
  return {
    id,
    label: id,
    blindsBb: { small: 0.5, big: 1 },
    players: [
      { id: "h", name: "Toi", stackBb: 20, seatIndex: 0, position: "BTN", isHero: true },
      { id: "v", name: "Vilain", stackBb: 20, seatIndex: 1, position: "BB" },
    ],
    actions: Array.from({ length: total }, (_, i) => ({
      playerId: opts.heroActions.includes(i) ? "h" : "v",
      type: "check" as const,
      street: "preflop" as const,
    })),
    boards: [],
    coachTips: opts.tips
      ? Object.fromEntries(
          Object.entries(opts.tips).map(([k, quality]) => [
            k,
            { quality, headline: "x", detail: "y", evDiffBb: opts.losses?.[Number(k)] },
          ]),
        )
      : undefined,
  };
}

describe("navigation du replay", () => {
  const hands = [
    makeHand("a", { heroActions: [0, 2] }),
    makeHand("b", { heroActions: [1], tips: { 1: "mistake" } }),
    makeHand("c", { heroActions: [0, 3], tips: { 0: "good", 3: "mistake" } }),
  ];

  it("liste les actions du héros", () => {
    expect(heroActionIndexes(hands[0])).toEqual([0, 2]);
  });

  it("liste les erreurs d'une main", () => {
    expect(mistakeActionIndexes(hands[2])).toEqual([3]);
    expect(mistakeActionIndexes(hands[0])).toEqual([]);
  });

  it("trouve la prochaine décision dans la même main, puis dans les mains suivantes", () => {
    expect(nextSpot(hands, 0, 0, heroActionIndexes)).toEqual({ handIndex: 0, actionIndex: 2 });
    expect(nextSpot(hands, 0, 2, heroActionIndexes)).toEqual({ handIndex: 1, actionIndex: 1 });
  });

  it("boucle au début quand il n'y a plus rien après", () => {
    expect(nextSpot(hands, 2, 3, mistakeActionIndexes)).toEqual({ handIndex: 1, actionIndex: 1 });
  });

  it("renvoie null quand aucun coup ne correspond", () => {
    expect(nextSpot([hands[0]], 0, 0, mistakeActionIndexes)).toBeNull();
  });

  it("choisit la plus grosse erreur d'une main", () => {
    const hand = makeHand("d", { heroActions: [0, 2], tips: { 0: "mistake", 2: "mistake" }, losses: { 0: 0.4, 2: 1.9 } });
    expect(worstMistakeIndex(hand)).toBe(2);
    expect(worstMistakeIndex(hands[0])).toBeNull();
  });

  it("colore la frise : erreur > beau coup > correct > non analysée", () => {
    expect(handMark(hands[0])).toBe("none");
    expect(handMark(hands[1])).toBe("mistake");
    expect(handMark(hands[2])).toBe("mistake");
    expect(handMark(makeHand("e", { heroActions: [0], tips: { 0: "good" } }))).toBe("good");
    expect(handMark(makeHand("f", { heroActions: [0], tips: { 0: "ok" } }))).toBe("ok");
  });
});
