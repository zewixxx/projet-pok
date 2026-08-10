import { describe, expect, it } from "vitest";
import type { ReplayHand } from "../replay.types";
import { computeReplayState, effectiveStackBb } from "./replayEngine";
import { MOCK_HANDS } from "../fixtures/mockHand";

describe("replayEngine", () => {
  it("déduit le stack du hero après un raise", () => {
    const hand = MOCK_HANDS[0];
    const hero = hand.players.find(p => p.isHero)!;
    const heroRaiseIdx = hand.actions.findIndex(
      a => a.playerId === hero.id && a.type === "raise",
    );

    const state = computeReplayState(hand, heroRaiseIdx);
    const stack = effectiveStackBb(hero.stackBb, state.totalInvested, hero.id);

    expect(stack).toBe(45);
    expect(state.pot).toBeGreaterThan(0);
    expect(state.streetBets[hero.id]).toBe(7);
  });

  it("déduit le stack après un bet flop", () => {
    const hand = MOCK_HANDS[0];
    const hero = hand.players.find(p => p.isHero)!;
    const betIdx = hand.actions.findIndex(
      a => a.playerId === hero.id && a.type === "bet" && a.street === "flop",
    );

    const state = computeReplayState(hand, betIdx);
    const stack = effectiveStackBb(hero.stackBb, state.totalInvested, hero.id);

    // 52 - 7 (3bet) - 6 (cbet) = 39
    expect(stack).toBe(39);
  });

  it("poste SB/BB en heads-up (BTN = SB)", () => {
    const hand: ReplayHand = {
      id: "hu",
      label: "HU",
      blindsBb: { small: 0.5, big: 1 },
      players: [
        { id: "btn", name: "Hero", stackBb: 20, seatIndex: 0, position: "BTN", isHero: true },
        { id: "bb", name: "Villain", stackBb: 20, seatIndex: 1, position: "BB" },
      ],
      actions: [{ playerId: "btn", type: "raise", amountBb: 2.5, street: "preflop" }],
      boards: [],
    };

    const state = computeReplayState(hand, 0);
    expect(state.streetBets.btn).toBe(2.5);
    expect(effectiveStackBb(20, state.totalInvested, "btn")).toBe(17.5);
    expect(effectiveStackBb(20, state.totalInvested, "bb")).toBe(19);
  });
});
