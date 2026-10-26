import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ingestDirectory } from "../ingest/dataset";
import { HAND_6MAX, SUMMARY } from "../ingest/fixtures";
import { AnalysisService, sanitizeSettings, type AnalysisEvent } from "./service";

let tmp: string;
let events: AnalysisEvent[];

beforeEach(() => {
  tmp = mkdtempSync(path.join(os.tmpdir(), "pok-svc-"));
  events = [];
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

function setup(extra: Partial<ConstructorParameters<typeof AnalysisService>[0]> = {}) {
  const src = path.join(tmp, "src");
  mkdirSync(src, { recursive: true });
  const hands = [0, 1, 2].map((i) => HAND_6MAX.replace("14-1776448350", `${30 + i}-1776448${400 + i}`)).join("\n\n");
  writeFileSync(path.join(src, "h.txt"), hands, "utf8");
  writeFileSync(path.join(src, "s.txt"), SUMMARY, "utf8");
  const datasetDir = path.join(tmp, "dataset");
  ingestDirectory(src, datasetDir);
  return new AnalysisService({
    datasetDir,
    analysisDir: path.join(tmp, "analysis"),
    settingsFile: path.join(tmp, "settings.json"),
    workerFile: "",
    logicalCpus: 8,
    forceThreads: 0,
    samples: 250,
    emit: (e) => events.push(e),
    ...extra,
  });
}

describe("AnalysisService", () => {
  it("liste les tournois, analyse, puis sert les mains analysées", async () => {
    const svc = setup();
    const before = svc.listTournaments();
    expect(before).toHaveLength(1);
    expect(before[0].analysis).toBeNull();
    expect(svc.getHands("1081305540").analyzed).toBe(false);

    expect(svc.start("1081305540").ok).toBe(true);
    expect(svc.start("1081305540").alreadyRunning).toBe(true);
    await svc.idle();

    expect(events.some((e) => e.channel === "analysis:progress")).toBe(true);
    expect(events[events.length - 1].channel).toBe("analysis:done");

    const after = svc.listTournaments();
    expect(after[0].analysis?.spots).toBe(9);
    const served = svc.getHands("1081305540");
    expect(served.analyzed).toBe(true);
    expect(served.hands).toHaveLength(3);
    expect(served.hands[0].spots).toBeTruthy();
    expect(svc.allLeaks().handsAnalyzed).toBe(3);
  });

  it("refuse un tournoi inconnu", () => {
    const svc = setup();
    expect(svc.start("nope")).toMatchObject({ ok: false });
  });

  it("appelle l'étape de reformulation et n'échoue pas si elle plante", async () => {
    let called = false;
    const svc = setup({
      refine: async () => {
        called = true;
        throw new Error("modèle absent");
      },
    });
    svc.start("1081305540");
    await svc.idle();
    expect(called).toBe(true);
    expect(events[events.length - 1].channel).toBe("analysis:done");
  });

  it("annule proprement", async () => {
    const svc = setup();
    svc.start("1081305540");
    expect(svc.cancel()).toBe(true);
    await svc.idle();
    const last = events[events.length - 1];
    expect(last.channel).toBe("analysis:error");
    if (last.channel === "analysis:error") expect(last.payload.cancelled).toBe(true);
    expect(svc.listTournaments()[0].analysis).toBeNull();
  });

  it("enregistre et assainit les réglages de puissance", () => {
    const svc = setup();
    expect(svc.getSettings().powerPercent).toBe(50);
    expect(svc.setSettings({ powerPercent: 40, autoAnalyze: false, llmEnabled: true })).toEqual({
      powerPercent: 40,
      autoAnalyze: false,
      llmEnabled: true,
    });
    expect(svc.getSettings().llmEnabled).toBe(true);
    expect(sanitizeSettings({}).llmEnabled).toBe(false);
    expect(svc.getSettings().powerPercent).toBe(40);
    expect(sanitizeSettings({ powerPercent: 900 }).powerPercent).toBe(100);
    expect(sanitizeSettings({ powerPercent: -3 }).powerPercent).toBe(5);
    expect(sanitizeSettings({ powerPercent: Number.NaN }).powerPercent).toBe(50);
  });
});
