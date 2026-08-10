import { describe, expect, it } from "vitest";
import { buildAnalysisReport, computeByLimit } from "./report";
import type { AnalyzerDataset } from "../types";

const sample: AnalyzerDataset = {
  hero: "TestHero",
  sessions: [
    {
      date: "2026-01-01",
      label: "Expresso",
      buyIn: 2,
      netEuros: 4,
      cumulEuros: 4,
      evEuros: 4,
      cumulEv: 4,
      sdEuros: 4,
      cumulSd: 4,
      place: 1,
      total: 3,
      hands: 12,
    },
    {
      date: "2026-01-02",
      label: "ATOM",
      buyIn: 25,
      netEuros: -25,
      cumulEuros: -21,
      evEuros: -25,
      cumulEv: -21,
      sdEuros: -25,
      cumulSd: -21,
      place: 80,
      total: 100,
      hands: 40,
    },
  ],
  tournaments: [],
  stats: {
    importedAt: "2026-01-03T00:00:00.000Z",
    handsTotal: 52,
    tournamentsTotal: 2,
    sessionsTotal: 2,
    totalInvested: 27,
    totalProfitNet: -21,
    hero: "TestHero",
    filesHistory: 2,
    filesSummary: 2,
  },
};

describe("winamax analyzer report", () => {
  it("calcule ROI / ITM / ABI et buckets de limite", () => {
    const report = buildAnalysisReport(sample);
    expect(report.overview.tournaments).toBe(2);
    expect(report.overview.invested).toBe(27);
    expect(report.overview.profit).toBe(-21);
    expect(report.overview.abi).toBe(13.5);
    expect(report.byLimit.length).toBeGreaterThan(0);
    expect(computeByLimit(sample.sessions).some((b) => b.label.startsWith("Micro"))).toBe(true);
  });

  it("signale l’absence de données clairement", () => {
    const report = buildAnalysisReport(null);
    expect(report.unavailable.length).toBeGreaterThan(0);
    expect(report.overview.tournaments).toBe(0);
  });
});
