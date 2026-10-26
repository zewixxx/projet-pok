import { describe, expect, it } from "vitest";
import { analyzeHand } from "../analysis/analyzeHand";
import { HAND_6MAX, SUMMARY } from "./fixtures";
import { parseHandHistory, parseSummary } from "./winamaxParser";

describe("winamaxParser", () => {
  it("lit une main de tournoi : positions, montants en bb, actions", () => {
    const [parsed] = parseHandHistory(HAND_6MAX);
    expect(parsed.tournamentId).toBe("1081305540");
    expect(parsed.tournamentName).toBe("ATOM PKO");
    expect(parsed.buyInEuros).toBe(5);
    expect(parsed.hero).toBe("zewix");

    const { hand } = parsed;
    expect(hand.id).toBe("4644171931283619977-14-1776448350");
    expect(hand.anteBb).toBeCloseTo(0.13, 2);
    expect(hand.blindsBb.small).toBe(0.5);

    const pos = Object.fromEntries(hand.players.map((p) => [p.name, p.position]));
    expect(pos).toEqual({ Alice: "UTG", Bob: "MP", Carl: "CO", zewix: "BTN", Dan: "SB", Eve: "BB" });

    const hero = hand.players.find((p) => p.isHero);
    expect(hero?.holeCards).toEqual(["Ah", "Kd"]);
    expect(hero?.stackBb).toBe(40);

    expect(hand.actions.find((a) => a.type === "raise")?.amountBb).toBe(3);
    expect(hand.actions.find((a) => a.street === "flop" && a.type === "bet")?.amountBb).toBe(4.5);
    const shove = hand.actions.find((a) => a.type === "allin");
    expect(shove?.street).toBe("turn");
    expect(shove?.amountBb).toBe(10);

    expect(hand.boards).toEqual([
      { street: "flop", cards: ["Kc", "7d", "2s"] },
      { street: "turn", cards: ["9h"] },
    ]);
  });

  it("ignore les mains sans cartes du héros et les blocs illisibles", () => {
    const noHero = HAND_6MAX.replace(/Dealt to .*\n/, "");
    expect(parseHandHistory(noHero)).toHaveLength(0);
    expect(parseHandHistory("n'importe quoi")).toHaveLength(0);
  });

  it("sépare plusieurs mains dans un même fichier", () => {
    const second = HAND_6MAX.replace("14-1776448350", "15-1776448397");
    expect(parseHandHistory(`${HAND_6MAX}\n\n${second}`)).toHaveLength(2);
  });

  it("produit une main que le moteur sait analyser", () => {
    const [parsed] = parseHandHistory(HAND_6MAX);
    const out = analyzeHand(parsed.hand, { samples: 300 });
    expect(out.analyzed).toBe(true);
    expect(Object.keys(out.coachTips ?? {}).length).toBe(3);
  });

  it("lit un résumé de tournoi", () => {
    const s = parseSummary(SUMMARY);
    expect(s).toMatchObject({
      tournamentId: "1081305540",
      tournamentName: "ATOM PKO",
      hero: "zewix",
      buyInEuros: 5,
      totalPlayers: 4265,
      place: 693,
      prizeEuros: 3,
    });
    expect(s?.startedAt).toBe("2026-04-17T10:00:00Z");
    expect(parseSummary("rien")).toBeNull();
  });
});
