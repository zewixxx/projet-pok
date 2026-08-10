import type { DashboardStats, SessionPoint } from "../types";

const EMPTY_STATS: DashboardStats = {
  totalHands: 0,
  totalTournaments: 0,
  totalInvested: 0,
  totalProfit: 0,
  roi: 0,
  itmRate: 0,
  avgPlace: 0,
  bestFinish: 0,
  winRate: 0,
  currentStreak: { type: "loss", count: 0 },
};

export interface PeriodStats {
  profit: number;
  invested: number;
  roi: number;
  itmRate: number;
  hands: number;
  tournaments: number;
  bestFinish: number;
  avgPlace: number;
  avgBuyIn: number;
}

export function fmtEuros(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M€`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k€`;
  return `${n}€`;
}

/** Recalcule les cumuls d’une sous-période (rebase au 1er point). */
export function rebaseForPeriod(sessions: SessionPoint[]): SessionPoint[] {
  let cumul = 0;
  let cumulEv = 0;
  let cumulSd = 0;
  return sessions.map((s) => {
    cumul += s.netEuros;
    cumulEv += s.evEuros;
    cumulSd += s.sdEuros;
    return { ...s, cumulEuros: cumul, cumulEv, cumulSd };
  });
}

export function computePeriodStats(sessions: SessionPoint[]): PeriodStats | null {
  if (!sessions.length) return null;
  const invested = sessions.reduce((sum, x) => sum + x.buyIn, 0);
  const profit = sessions.reduce((sum, x) => sum + x.netEuros, 0);
  const hands = sessions.reduce((sum, x) => sum + x.hands, 0);
  const cashes = sessions.filter((x) => x.netEuros > 0).length;
  const places = sessions.map((x) => x.place);
  return {
    profit,
    invested,
    roi: invested > 0 ? Math.round((profit / invested) * 100) : 0,
    itmRate: Math.round((cashes / sessions.length) * 100),
    hands,
    tournaments: sessions.length,
    bestFinish: Math.min(...places),
    avgPlace: Math.round(places.reduce((a, b) => a + b, 0) / places.length),
    avgBuyIn: Math.round(invested / sessions.length),
  };
}

export function computeDashboardStats(sessions: SessionPoint[]): DashboardStats {
  if (!sessions.length) return { ...EMPTY_STATS };

  const last = sessions[sessions.length - 1];
  const invested = sessions.reduce((sum, x) => sum + x.buyIn, 0);
  const totalHands = sessions.reduce((sum, x) => sum + x.hands, 0);
  const cashes = sessions.filter((x) => x.netEuros > 0).length;
  const avgPlace = Math.round(
    sessions.reduce((sum, x) => sum + x.place, 0) / sessions.length,
  );
  const places = sessions.map((x) => x.place).filter((p) => p > 0);
  const bestFinish = places.length ? Math.min(...places) : 0;

  const lastResult = last.netEuros > 0 ? "win" : "loss";
  let streak = 0;
  for (let i = sessions.length - 1; i >= 0; i--) {
    const r = sessions[i].netEuros > 0 ? "win" : "loss";
    if (r !== lastResult) break;
    streak++;
  }

  return {
    totalHands,
    totalTournaments: sessions.length,
    totalInvested: invested,
    totalProfit: last.cumulEuros,
    roi: invested > 0 ? Math.round((last.cumulEuros / invested) * 100) : 0,
    itmRate: Math.round((cashes / sessions.length) * 100),
    avgPlace,
    bestFinish,
    winRate: 0,
    currentStreak: { type: lastResult, count: streak },
  };
}
