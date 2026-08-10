import type { AnalyzerDataset, AnalyzerReport, LimitBucket } from "../types";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const LIMIT_BANDS: Array<{ label: string; min: number; max: number }> = [
  { label: "Micro (< 5€)", min: 0, max: 5 },
  { label: "Low (5–20€)", min: 5, max: 20 },
  { label: "Mid (20–50€)", min: 20, max: 50 },
  { label: "High (≥ 50€)", min: 50, max: Number.POSITIVE_INFINITY },
];

export function computeByLimit(sessions: AnalyzerDataset["sessions"]): LimitBucket[] {
  return LIMIT_BANDS.map((band) => {
    const subset = sessions.filter((s) => s.buyIn >= band.min && s.buyIn < band.max);
    const invested = subset.reduce((a, s) => a + s.buyIn, 0);
    const profit = subset.reduce((a, s) => a + s.netEuros, 0);
    const itm = subset.filter((s) => s.netEuros > 0).length;
    return {
      label: band.label,
      minBuyIn: band.min,
      maxBuyIn: band.max,
      tournaments: subset.length,
      invested: round2(invested),
      profit: round2(profit),
      roi: invested > 0 ? Math.round((profit / invested) * 100) : 0,
      itmRate: subset.length ? Math.round((itm / subset.length) * 100) : 0,
    };
  }).filter((b) => b.tournaments > 0);
}

export function buildAnalysisReport(
  dataset: AnalyzerDataset | null,
  extraUnavailable: string[] = [],
): AnalyzerReport {
  const unavailable = [...extraUnavailable];
  const generatedAt = new Date().toISOString();

  if (!dataset || !dataset.sessions?.length) {
    unavailable.push("Aucune donnée synchronisée depuis Winamax.");
    return {
      generatedAt,
      hero: dataset?.hero ?? "—",
      overview: {
        tournaments: 0,
        hands: 0,
        invested: 0,
        profit: 0,
        roi: 0,
        itmRate: 0,
        abi: 0,
        avgPlace: 0,
        bestFinish: 0,
      },
      byLimit: [],
      unavailable,
      highlights: [],
      leaks: [
        {
          id: "no-data",
          title: "Leaks indisponibles",
          detail: "Synchronise d’abord un export officiel Winamax.",
          severity: "minor",
          available: false,
        },
      ],
    };
  }

  const sessions = dataset.sessions;
  const invested = sessions.reduce((a, s) => a + s.buyIn, 0);
  const profit = sessions.reduce((a, s) => a + s.netEuros, 0);
  const hands = sessions.reduce((a, s) => a + s.hands, 0);
  const itm = sessions.filter((s) => s.netEuros > 0).length;
  const places = sessions.map((s) => s.place).filter((p) => p > 0);
  const byLimit = computeByLimit(sessions);

  if ((dataset.stats?.filesSummary ?? sessions.length) === 0) {
    unavailable.push("Summaries manquants dans l’export.");
  }
  if (hands === 0) {
    unavailable.push(
      "Mains absentes ou non associées : leaks postflop / préflop détaillés non calculables.",
    );
  }

  const highlights: string[] = [];
  const roi = invested > 0 ? Math.round((profit / invested) * 100) : 0;
  const abi = sessions.length ? round1(invested / sessions.length) : 0;

  if (roi >= 20) highlights.push(`ROI solide à ${roi}% sur ${sessions.length} tournois.`);
  else if (roi <= -15) highlights.push(`ROI négatif (${roi}%) — priorité à la sélection de jeux / ABI.`);
  else highlights.push(`ROI neutre (${roi}%) — marge d’amélioration sur les spots moyens.`);

  const worstLimit = [...byLimit].sort((a, b) => a.roi - b.roi)[0];
  if (worstLimit && worstLimit.tournaments >= 5) {
    highlights.push(`Zone faible : ${worstLimit.label} (ROI ${worstLimit.roi}%).`);
  }

  const leaks = buildSessionLeaks(sessions, hands > 0);

  return {
    generatedAt,
    hero: dataset.hero || dataset.stats?.hero || "—",
    overview: {
      tournaments: sessions.length,
      hands,
      invested: round2(invested),
      profit: round2(profit),
      roi,
      itmRate: Math.round((itm / sessions.length) * 100),
      abi,
      avgPlace: places.length
        ? Math.round(places.reduce((a, b) => a + b, 0) / places.length)
        : 0,
      bestFinish: places.length ? Math.min(...places) : 0,
    },
    byLimit,
    unavailable,
    highlights,
    leaks,
  };
}

function buildSessionLeaks(
  sessions: AnalyzerDataset["sessions"],
  handsAvailable: boolean,
): AnalyzerReport["leaks"] {
  const leaks: AnalyzerReport["leaks"] = [];

  if (!handsAvailable) {
    leaks.push({
      id: "hh-missing",
      title: "Leaks main-par-main",
      detail:
        "Non disponible : l’export ne contient pas assez de hand histories pour une analyse action-by-action.",
      severity: "major",
      available: false,
    });
  }

  const recent = sessions.slice(-30);
  const recentItm = recent.filter((s) => s.netEuros > 0).length;
  const recentItmRate = recent.length ? recentItm / recent.length : 0;
  if (recent.length >= 10 && recentItmRate < 0.12) {
    leaks.push({
      id: "low-itm",
      title: "ITM bas sur les 30 derniers",
      detail: `ITM ${(recentItmRate * 100).toFixed(0)}% — travailler la survie early / mid game.`,
      severity: "critical",
      available: true,
    });
  }

  const highAbi = sessions.filter((s) => s.buyIn >= 20);
  const lowAbi = sessions.filter((s) => s.buyIn < 5);
  const highRoi =
    highAbi.length > 0
      ? highAbi.reduce((a, s) => a + s.netEuros, 0) / highAbi.reduce((a, s) => a + s.buyIn, 0)
      : 0;
  const lowRoi =
    lowAbi.length > 0
      ? lowAbi.reduce((a, s) => a + s.netEuros, 0) / lowAbi.reduce((a, s) => a + s.buyIn, 0)
      : 0;
  if (highAbi.length >= 5 && lowAbi.length >= 5 && highRoi + 0.1 < lowRoi) {
    leaks.push({
      id: "abi-leak",
      title: "Fuite aux limites plus hautes",
      detail: "ROI nettement plus faible en mid/high qu’en micro — downstakes ou resserrer la sélection.",
      severity: "major",
      available: true,
    });
  }

  const bustEarly = sessions.filter((s) => s.total > 0 && s.place / s.total > 0.7).length;
  if (sessions.length >= 15 && bustEarly / sessions.length > 0.55) {
    leaks.push({
      id: "early-bust",
      title: "Éliminations précoces fréquentes",
      detail: "Plus de la moitié des finishes dans le dernier tercile — revoir open/3-bet early.",
      severity: "major",
      available: true,
    });
  }

  if (leaks.filter((l) => l.available).length === 0) {
    leaks.push({
      id: "ok",
      title: "Pas de leak macro évident",
      detail: handsAvailable
        ? "Les indicateurs session sont stables. Passe en Review pour les spots EV."
        : "Indicateurs session OK, mais analyse fine bloquée sans HH complètes.",
      severity: "minor",
      available: true,
    });
  }

  return leaks;
}
