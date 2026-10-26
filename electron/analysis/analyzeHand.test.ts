import { describe, expect, it } from "vitest";
import { analyzeHand } from "./analyzeHand";
import type { HandAction, ReplayHand, ReplayPlayer } from "./types";

function player(
  id: string,
  position: string,
  seatIndex: number,
  stackBb: number,
  hole?: [string, string],
): ReplayPlayer {
  return { id, name: id, position, seatIndex, stackBb, isHero: !!hole, holeCards: hole };
}

/** Hero en BB face à un tapis du bouton, sur 3 joueurs (BTN, SB, BB). */
function shoveVsBb(heroCards: [string, string], heroAction: HandAction["type"]): ReplayHand {
  const actions: HandAction[] = [
    { playerId: "btn", type: "allin", amountBb: 10, street: "preflop" },
    { playerId: "sb", type: "fold", street: "preflop" },
    heroAction === "call"
      ? { playerId: "hero", type: "call", amountBb: 9, street: "preflop" }
      : { playerId: "hero", type: "fold", street: "preflop" },
  ];
  return {
    id: "t-shove",
    label: "test",
    blindsBb: { small: 0.5, big: 1 },
    players: [
      player("btn", "BTN", 0, 10),
      player("sb", "SB", 1, 30),
      player("hero", "BB", 2, 30, heroCards),
    ],
    actions,
    boards: [],
  };
}

describe("analyzeHand", () => {
  it("valide un call avec AA face à un tapis court", () => {
    const out = analyzeHand(shoveVsBb(["As", "Ah"], "call"), { samples: 600 });
    expect(out.analyzed).toBe(true);
    const idx = out.actions.length - 1;
    expect(out.coachTips?.[idx]?.quality).toBe("good");
    expect(out.spots?.[idx]?.kind).toBe("correct");
  });

  it("signale un call avec 72o face à un tapis", () => {
    const out = analyzeHand(shoveVsBb(["7c", "2d"], "call"), { samples: 600 });
    const idx = out.actions.length - 1;
    expect(out.coachTips?.[idx]?.quality).toBe("mistake");
    expect(out.spots?.[idx]?.kind).toBe("overcall");
    expect((out.spots?.[idx]?.evLossBb ?? 0) > 0).toBe(true);
  });

  it("signale un fold avec AA face à un tapis", () => {
    const out = analyzeHand(shoveVsBb(["As", "Ah"], "fold"), { samples: 600 });
    const idx = out.actions.length - 1;
    expect(out.coachTips?.[idx]?.quality).toBe("mistake");
    expect(out.spots?.[idx]?.kind).toBe("overfold");
  });

  it("valide un fold avec 72o face à un tapis", () => {
    const out = analyzeHand(shoveVsBb(["7c", "2d"], "fold"), { samples: 600 });
    const idx = out.actions.length - 1;
    expect(out.coachTips?.[idx]?.quality).not.toBe("mistake");
  });

  it("n'analyse que les actions du héros et est déterministe", () => {
    const hand = shoveVsBb(["Kd", "Qd"], "call");
    const a = analyzeHand(hand, { samples: 400 });
    const b = analyzeHand(hand, { samples: 400 });
    expect(Object.keys(a.coachTips ?? {})).toEqual(["2"]);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("inclut l'option jouée dans la comparaison d'EV", () => {
    const out = analyzeHand(shoveVsBb(["Kd", "Qd"], "call"), { samples: 400 });
    const options = out.evComparisons?.[2]?.options ?? [];
    expect(options.some((o) => o.isPlayed)).toBe(true);
    expect(options.some((o) => o.type === "fold")).toBe(true);
  });

  it("ne marque pas comme erreur le fold de 72o au bouton à l'ouverture", () => {
    const hand: ReplayHand = {
      id: "t-open",
      label: "test",
      blindsBb: { small: 0.5, big: 1 },
      players: [
        player("hero", "BTN", 0, 30, ["7c", "2d"]),
        player("sb", "SB", 1, 30),
        player("bb", "BB", 2, 30),
      ],
      actions: [{ playerId: "hero", type: "fold", street: "preflop" }],
      boards: [],
    };
    const out = analyzeHand(hand, { samples: 400 });
    expect(out.coachTips?.[0]?.quality).not.toBe("mistake");
  });

  it("analyse une main jusqu'à la river sans erreur", () => {
    const hand: ReplayHand = {
      id: "t-river",
      label: "test",
      blindsBb: { small: 0.5, big: 1 },
      players: [
        player("hero", "BTN", 0, 40, ["Ah", "Kh"]),
        player("sb", "SB", 1, 40),
        player("bb", "BB", 2, 40),
      ],
      actions: [
        { playerId: "hero", type: "raise", amountBb: 2.5, street: "preflop" },
        { playerId: "sb", type: "fold", street: "preflop" },
        { playerId: "bb", type: "call", amountBb: 1.5, street: "preflop" },
        { playerId: "bb", type: "check", street: "flop" },
        { playerId: "hero", type: "bet", amountBb: 2.5, street: "flop" },
        { playerId: "bb", type: "call", amountBb: 2.5, street: "flop" },
        { playerId: "bb", type: "check", street: "turn" },
        { playerId: "hero", type: "bet", amountBb: 6, street: "turn" },
        { playerId: "bb", type: "fold", street: "turn" },
      ],
      boards: [
        { street: "flop", cards: ["Kd", "7c", "2s"] },
        { street: "turn", cards: ["9h"] },
      ],
    };
    const out = analyzeHand(hand, { samples: 400 });
    expect(out.analyzed).toBe(true);
    expect(Object.keys(out.coachTips ?? {}).sort()).toEqual(["0", "4", "7"]);
    const flop = out.spots?.[4];
    expect(flop?.equityPct).toBeGreaterThan(55);
    expect(flop?.villainRange).toBeTruthy();
  });
});
