/** Types domaine du dashboard — indépendants des sources de données. */

export interface SessionPoint {
  /** ISO date */
  date: string;
  /** Tournament name (short) */
  label: string;
  /** Buy-in in euros */
  buyIn: number;
  /** Net profit/loss in euros for this session (prize - buyIn) */
  netEuros: number;
  /** Cumulative profit from all sessions so far */
  cumulEuros: number;
  /** EV-adjusted result for this session (all-in luck removed) */
  evEuros: number;
  /** Cumulative EV-adjusted profit */
  cumulEv: number;
  /** Money won/lost in hands that went to showdown */
  sdEuros: number;
  /** Cumulative showdown winnings */
  cumulSd: number;
  /** Finish place */
  place: number;
  /** Total players */
  total: number;
  /** Hands played */
  hands: number;
}

export interface PositionStat {
  position: "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB";
  vpip: number;
  pfr: number;
  threebet: number;
  evPerHand: number;
  handsPlayed: number;
}

export interface LeakEntry {
  id: string;
  category: string;
  description: string;
  costBb100: number;
  occurrences: number;
  severity: "critical" | "major" | "minor";
}

export interface DashboardStats {
  totalHands: number;
  totalTournaments: number;
  totalInvested: number;
  totalProfit: number;
  roi: number;
  itmRate: number;
  avgPlace: number;
  bestFinish: number;
  winRate: number;
  currentStreak: { type: "win" | "loss"; count: number };
}
