import { describe, expect, it } from "vitest";
import { parseCard } from "./cards";
import {
  bandWeights,
  CELL_COUNT,
  cellCombos,
  cellKey,
  cellOf,
  comboCardsOf,
  openPct,
  PCT_FROM_TOP,
  preflopActionWeights,
  shovePct,
  TOTAL_COMBOS,
} from "./ranges";

const cell = (a: string, b: string) => cellOf(parseCard(a), parseCard(b));

describe("cases de la grille", () => {
  it("nomme les mains comme les joueurs", () => {
    expect(cellKey(cell("Ah", "Ad"))).toBe("AA");
    expect(cellKey(cell("Ah", "Kh"))).toBe("AKs");
    expect(cellKey(cell("Kd", "Ah"))).toBe("AKo");
    expect(cellKey(cell("7s", "2c"))).toBe("72o");
  });

  it("couvre exactement 1326 mains", () => {
    let total = 0;
    for (let i = 0; i < CELL_COUNT; i += 1) {
      total += cellCombos(i);
      expect(comboCardsOf(i)).toHaveLength(cellCombos(i));
    }
    expect(total).toBe(TOTAL_COMBOS);
  });

  it("place AA devant 72o dans le classement", () => {
    expect(PCT_FROM_TOP[cell("Ah", "Ad")]).toBeLessThan(0.01);
    expect(PCT_FROM_TOP[cell("7s", "2c")]).toBeGreaterThan(0.9);
    expect(PCT_FROM_TOP[cell("Ah", "Ad")]).toBeLessThan(PCT_FROM_TOP[cell("Ks", "Kd")]);
  });

  it("garde un classement réaliste : paires, as assortis et broadways devant", () => {
    expect(PCT_FROM_TOP[cell("Ah", "Qh")]).toBeLessThan(PCT_FROM_TOP[cell("Ah", "5d")]);
    expect(PCT_FROM_TOP[cell("Js", "Ts")]).toBeLessThan(PCT_FROM_TOP[cell("9s", "2d")]);
  });
});

describe("modèle préflop", () => {
  it("ouvre plus large au bouton qu'en première position", () => {
    expect(openPct(2)).toBeGreaterThan(openPct(8));
  });

  it("pousse plus large avec un petit stack", () => {
    expect(shovePct(6, 2)).toBeGreaterThan(shovePct(15, 2));
  });

  it("une ouverture au bouton contient K9s mais pas 72o", () => {
    const weights = preflopActionWeights({
      type: "raise",
      raisesBefore: 0,
      limpersBefore: 0,
      behind: 2,
      openerBehind: null,
      isBigBlind: false,
      isSmallBlind: false,
      stackBb: 40,
      amountBb: 2.5,
      facingAllIn: false,
    });
    expect(weights[cell("Ks", "9s")]).toBe(1);
    expect(weights[cell("7s", "2c")]).toBeLessThan(0.1);
  });

  it("un 3-bet est bien plus serré qu'une ouverture", () => {
    const base = {
      type: "raise" as const,
      limpersBefore: 0,
      behind: 2,
      openerBehind: 4,
      isBigBlind: false,
      isSmallBlind: false,
      stackBb: 40,
      amountBb: 8,
      facingAllIn: false,
    };
    const open = preflopActionWeights({ ...base, raisesBefore: 0 });
    const threeBet = preflopActionWeights({ ...base, raisesBefore: 1 });
    const count = (w: Float64Array) => w.reduce((n, v, i) => n + (v === 1 ? cellCombos(i) : 0), 0);
    expect(count(threeBet)).toBeLessThan(count(open) / 2);
  });

  it("bandWeights respecte les bornes", () => {
    const w = bandWeights(0, 5);
    const kept = w.reduce((n, v, i) => n + (v === 1 ? cellCombos(i) : 0), 0);
    expect(kept / TOTAL_COMBOS).toBeGreaterThan(0.035);
    expect(kept / TOTAL_COMBOS).toBeLessThan(0.065);
  });
});
