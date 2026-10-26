import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ingestDirectory, readDatasetFile, readTournamentHands } from "../ingest/dataset";
import { HAND_6MAX, SUMMARY } from "../ingest/fixtures";
import { buildLeaks } from "./leaks";
import {
  analyzeTournament,
  AnalysisCancelled,
  isAnalysisCurrent,
  loadAnalysis,
  saveAnalysis,
  threadsForPower,
} from "./tournament";
import type { ReplayHand } from "./types";

let tmp: string;
beforeEach(() => {
  tmp = mkdtempSync(path.join(os.tmpdir(), "pok-test-"));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function makeHands(n: number): string {
  const all: string[] = [];
  for (let i = 0; i < n; i += 1) {
    all.push(HAND_6MAX.replace("14-1776448350", `${20 + i}-17764483${50 + i}`).replace("10:12:30", `10:12:${String(10 + i).padStart(2, "0")}`));
  }
  return all.join("\n\n");
}

describe("ingestDirectory", () => {
  it("regroupe les mains par tournoi, joint le résumé et reste idempotent", () => {
    const src = path.join(tmp, "src");
    const dataset = path.join(tmp, "dataset");
    mkdirSync(src, { recursive: true });
    writeFileSync(path.join(src, "hands.txt"), makeHands(3), "utf8");
    writeFileSync(path.join(src, "summary.txt"), SUMMARY, "utf8");

    const stats = ingestDirectory(src, dataset);
    expect(stats).toMatchObject({ handsTotal: 3, tournamentsTotal: 1, sessionsTotal: 1, hero: "zewix", filesSummary: 1 });
    expect(stats.totalProfitNet).toBe(-2);

    const data = readDatasetFile(dataset)!;
    expect(data.tournaments[0]).toMatchObject({ id: "1081305540", place: 693, totalPlayers: 4265, fileKey: "1081305540" });
    expect(readTournamentHands(dataset, "1081305540")).toHaveLength(3);

    const again = ingestDirectory(src, dataset);
    expect(again.handsTotal).toBe(3);
    expect(again.tournamentsTotal).toBe(1);
  });
});

describe("analyzeTournament", () => {
  it("analyse toutes les mains, avec progression, et sauvegarde le résultat", async () => {
    const src = path.join(tmp, "src");
    const dataset = path.join(tmp, "dataset");
    mkdirSync(src, { recursive: true });
    writeFileSync(path.join(src, "hands.txt"), makeHands(4), "utf8");
    ingestDirectory(src, dataset);
    const hands = readTournamentHands(dataset, "1081305540");

    const progress: Array<[number, number]> = [];
    const result = await analyzeTournament({
      tournamentId: "1081305540",
      hands,
      threads: 0,
      samples: 300,
      onProgress: (d, t) => progress.push([d, t]),
    });

    expect(progress[0]).toEqual([0, 4]);
    expect(progress[progress.length - 1]).toEqual([4, 4]);
    expect(result.hands.every((h) => h.analyzed)).toBe(true);
    expect(result.summary.handsAnalyzed).toBe(4);
    expect(result.summary.spotsAnalyzed).toBe(12);

    const dir = path.join(tmp, "analysis");
    saveAnalysis(dir, "1081305540", result);
    const loaded = loadAnalysis(dir, "1081305540");
    expect(isAnalysisCurrent(loaded, hands.map((h) => h.id))).toBe(true);
    expect(isAnalysisCurrent(loaded, ["autre"])).toBe(false);
    expect(isAnalysisCurrent(null, [])).toBe(false);
    expect(readFileSync(path.join(dir, "1081305540.json"), "utf8").length).toBeGreaterThan(100);
  });

  it("peut être annulée", async () => {
    const ctrl = new AbortController();
    ctrl.abort();

    const src = path.join(tmp, "src");
    mkdirSync(src, { recursive: true });
    writeFileSync(path.join(src, "h.txt"), makeHands(3), "utf8");
    ingestDirectory(src, path.join(tmp, "ds"));
    const real = readTournamentHands(path.join(tmp, "ds"), "1081305540");
    await expect(
      analyzeTournament({ tournamentId: "x", hands: real, threads: 0, samples: 200, signal: ctrl.signal }),
    ).rejects.toBeInstanceOf(AnalysisCancelled);
  });
});

describe("threadsForPower", () => {
  it("convertit un pourcentage en threads, entre 1 et le nombre de coeurs", () => {
    // 8 threads logiques ≈ 4 cœurs utiles
    expect(threadsForPower(20, 8)).toBe(1);
    expect(threadsForPower(50, 8)).toBe(2);
    expect(threadsForPower(75, 8)).toBe(3);
    expect(threadsForPower(100, 8)).toBe(4);
    expect(threadsForPower(100, 16)).toBe(8);
    expect(threadsForPower(100, 1)).toBe(1);
    expect(threadsForPower(0, 4)).toBe(1);
    expect(threadsForPower(100, 4)).toBe(2);
  });
});

describe("buildLeaks", () => {
  it("regroupe les erreurs par type, rue et zone", () => {
    const mk = (id: string, kind: "overfold" | "overcall", pos: string, loss: number): ReplayHand => ({
      id,
      label: id,
      blindsBb: { small: 0.5, big: 1 },
      players: [],
      actions: [],
      boards: [],
      coachTips: { 0: { quality: "mistake", headline: "", detail: "" } },
      spots: {
        0: { kind, street: "preflop", heroPosition: pos, equityPct: 40, potBb: 3, toCallBb: 1, stackBb: 20, confidence: "moyenne", evLossBb: loss },
      },
    });
    const leaks = buildLeaks([mk("a", "overfold", "BB", 1), mk("b", "overfold", "SB", 2), mk("c", "overcall", "BTN", 0.5), mk("d", "overfold", "BB", 0)]);
    expect(leaks).toHaveLength(2);
    expect(leaks[0].id).toBe("overfold-preflop-blinds");
    expect(leaks[0].occurrences).toBe(3);
    expect(leaks[0].totalLossBb).toBe(3);
    expect(leaks[0].costBb100).toBe(75);
    expect(leaks[0].severity).toBe("critical");
    expect(leaks[1].sampleHandIds).toEqual(["c"]);
  });
});
