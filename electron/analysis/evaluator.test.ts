import { describe, expect, it } from "vitest";
import { hashSeed, makeRng, parseCard } from "./cards";
import { equityVsRanges, makeRangeSet } from "./equity";
import { categoryOf, evaluate } from "./evaluator";

const hand = (text: string) => text.split(" ").map(parseCard);
const score = (text: string) => {
  const cards = hand(text);
  return evaluate(cards, cards.length);
};

describe("evaluate", () => {
  it("classe les catégories dans le bon ordre", () => {
    const order = [
      "As Kd 9c 7h 4s 3d 2c", // carte haute
      "As Ad 9c 7h 4s 3d 2c", // paire
      "As Ad 9c 9h 4s 3d 2c", // double paire
      "As Ad Ac 7h 4s 3d 2c", // brelan
      "5s 6d 7c 8h 9s 2d 2c", // quinte
      "As Ks 9s 7s 4s 3d 2c", // couleur
      "As Ad Ac 7h 7s 3d 2c", // full
      "As Ad Ac Ah 4s 3d 2c", // carré
      "9s Ts Js Qs Ks 3d 2c", // quinte flush
    ].map(score);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]).toBeGreaterThan(order[i - 1]);
    }
    expect(order.map(categoryOf)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("gère la roue et départage par les kickers", () => {
    expect(score("As 2d 3c 4h 5s Kd 9c")).toBeLessThan(score("2s 3d 4c 5h 6s Kd 9c"));
    expect(score("As Ad Kc 7h 4s 3d 2c")).toBeGreaterThan(score("As Ad Qc 7h 4s 3d 2c"));
    expect(score("Ks Kd Qc Qh As 3d 2c")).toBeGreaterThan(score("Ks Kd Qc Qh Js 3d 2c"));
  });

  it("choisit le meilleur full avec deux brelans", () => {
    expect(score("As Ad Ac Ks Kd Kc 2h")).toBe(score("As Ad Ac Kh Kd 2c 3s"));
  });
});

describe("equityVsRanges", () => {
  const single = (a: string, b: string) => makeRangeSet([{ c1: parseCard(a), c2: parseCard(b), w: 1 }]);

  it("AA contre KK gagne environ 82 %", () => {
    const rng = makeRng(hashSeed("aa-kk"));
    const res = equityVsRanges([parseCard("Ah"), parseCard("Ad")], [], [single("Ks", "Kc")], 20000, rng);
    expect(res.equity).toBeGreaterThan(0.79);
    expect(res.equity).toBeLessThan(0.85);
  });

  it("AKs contre 72o gagne environ 66 %", () => {
    const rng = makeRng(hashSeed("aks-72o"));
    const res = equityVsRanges([parseCard("Ah"), parseCard("Kh")], [], [single("7s", "2c")], 20000, rng);
    expect(res.equity).toBeGreaterThan(0.63);
    expect(res.equity).toBeLessThan(0.7);
  });

  it("donne le même résultat avec la même graine", () => {
    const run = () =>
      equityVsRanges(
        [parseCard("Qh"), parseCard("Qd")],
        hand("2s 7d Kc"),
        [single("As", "Kd")],
        2000,
        makeRng(42),
      ).equity;
    expect(run()).toBe(run());
  });

  it("tient compte du board : tirage couleur au nut + overcard contre une overpair", () => {
    // 9 coeurs + 3 As = 12 outs au flop, soit environ 45 %.
    const rng = makeRng(7);
    const res = equityVsRanges(
      [parseCard("Ah"), parseCard("5h")],
      hand("9h 7h 2c"),
      [single("Ks", "Kd")],
      20000,
      rng,
    );
    expect(res.equity).toBeGreaterThan(0.4);
    expect(res.equity).toBeLessThan(0.49);
  });

  it("voit qu'un brelan de rois bat un tirage couleur quand le board peut doubler", () => {
    const rng = makeRng(7);
    const res = equityVsRanges(
      [parseCard("Ah"), parseCard("5h")],
      hand("Kh 9h 2c"),
      [single("Ks", "Kd")],
      20000,
      rng,
    );
    expect(res.equity).toBeGreaterThan(0.22);
    expect(res.equity).toBeLessThan(0.32);
  });
});
