import { describe, expect, it } from "vitest";
import { MOCK_HANDS } from "../fixtures/mockHand";
import { resolveHeroAnalysis } from "./generateHeroAnalysis";

describe("resolveHeroAnalysis", () => {
  it("retourne les données pré-calculées si présentes", () => {
    const hand = MOCK_HANDS[0];
    const { tip, ev } = resolveHeroAnalysis(hand, 3);

    expect(tip?.headline).toContain("relance");
    expect(ev?.options.some(o => o.isPlayed)).toBe(true);
  });

  it("génère une analyse pour une action hero sans données baked-in", () => {
    const hand = MOCK_HANDS[0];
    const heroRaiseFlop = hand.actions.findIndex(
      a => a.playerId === "btn" && a.type === "bet" && a.street === "flop",
    );

    const { tip, ev } = resolveHeroAnalysis(hand, heroRaiseFlop);

    expect(tip).toBeDefined();
    expect(ev?.options.length).toBeGreaterThan(1);
  });

  it("ne retourne rien pour une action vilain", () => {
    const hand = MOCK_HANDS[0];
    expect(resolveHeroAnalysis(hand, 0)).toEqual({});
  });
});
