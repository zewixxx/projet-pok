import { describe, expect, it } from "vitest";
import { fmtBb, fmtBbAuto, fmtBbSigned, fmtDuration, fmtEuros, fmtPct, pluralize, signed } from "./format";

const NBSP = "\u00a0";
const MINUS = "\u2212";

describe("formats français", () => {
  it("signe les nombres avec un vrai signe moins et une virgule", () => {
    expect(signed(1.5)).toBe("+1,5");
    expect(signed(-0.28, 2)).toBe(`${MINUS}0,28`);
    expect(signed(0)).toBe("0,0");
    expect(signed(-0.001, 2)).toBe("0,00");
  });

  it("affiche les grosses blindes", () => {
    expect(fmtBb(12.5)).toBe(`12,5${NBSP}bb`);
    expect(fmtBb(-3, 0)).toBe(`${MINUS}3${NBSP}bb`);
    expect(fmtBbAuto(3)).toBe(`3${NBSP}bb`);
    expect(fmtBbAuto(2.54)).toBe(`2,5${NBSP}bb`);
    expect(fmtBbSigned(0.74)).toBe(`+0,74${NBSP}bb`);
    expect(fmtBbSigned(-1.2)).toBe(`${MINUS}1,20${NBSP}bb`);
  });

  it("affiche les euros sans bruit de virgule flottante", () => {
    expect(fmtEuros(25.059999999999945, { sign: true })).toBe(`+25,06${NBSP}€`);
    expect(fmtEuros(-12, { sign: true })).toBe(`${MINUS}12${NBSP}€`);
    expect(fmtEuros(0, { sign: true })).toBe(`0${NBSP}€`);
    expect(fmtEuros(5)).toBe(`5${NBSP}€`);
    expect(fmtEuros(-3)).toBe(`${MINUS}3${NBSP}€`);
  });

  it("formate pourcentages et durées", () => {
    expect(fmtPct(48.4)).toBe(`48${NBSP}%`);
    expect(fmtDuration(45)).toBe(`45${NBSP}s`);
    expect(fmtDuration(60)).toBe(`1${NBSP}min`);
    expect(fmtDuration(125)).toBe(`2${NBSP}min 5${NBSP}s`);
  });

  it("accorde le pluriel", () => {
    expect(pluralize(1, "cœur", "cœurs")).toBe("cœur");
    expect(pluralize(2, "cœur", "cœurs")).toBe("cœurs");
  });
});
