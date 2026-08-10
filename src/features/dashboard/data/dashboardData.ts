/**
 * Données dashboard : sessions importées + placeholders (leaks / positions).
 * Les types vivent dans ../types pour éviter un cycle import ↔ dashboard.
 */

import { REAL_SESSIONS } from "../../import";
import type { DashboardStats, LeakEntry, PositionStat, SessionPoint } from "../types";
import { computeDashboardStats } from "../utils/sessionStats";

/** Sessions tournois importées depuis history/ */
export const SESSIONS: SessionPoint[] = REAL_SESSIONS;

/** Placeholder — calcul futur depuis les mains */
export const POSITION_STATS: PositionStat[] = [
  { position: "UTG", vpip: 14, pfr: 12, threebet: 5, evPerHand: 2.1, handsPlayed: 312 },
  { position: "MP", vpip: 18, pfr: 15, threebet: 7, evPerHand: 3.4, handsPlayed: 298 },
  { position: "CO", vpip: 26, pfr: 22, threebet: 8, evPerHand: 5.8, handsPlayed: 291 },
  { position: "BTN", vpip: 38, pfr: 32, threebet: 10, evPerHand: 8.2, handsPlayed: 305 },
  { position: "SB", vpip: 24, pfr: 18, threebet: 9, evPerHand: -1.4, handsPlayed: 284 },
  { position: "BB", vpip: 32, pfr: 8, threebet: 5, evPerHand: -3.8, handsPlayed: 301 },
];

/** Placeholder — calcul futur */
export const LEAKS: LeakEntry[] = [
  {
    id: "l1",
    category: "Postflop",
    description: "Overfold BB vs c-bet (fréquence fold 68%, optimal 52%)",
    costBb100: 4.2,
    occurrences: 87,
    severity: "critical",
  },
  {
    id: "l2",
    category: "Préflop",
    description: "Call trop loose SB face aux opens BTN",
    costBb100: 2.8,
    occurrences: 62,
    severity: "critical",
  },
  {
    id: "l3",
    category: "Postflop",
    description: "Underbluff river en position (fréquence 14%, optimal 28%)",
    costBb100: 2.1,
    occurrences: 43,
    severity: "major",
  },
  {
    id: "l4",
    category: "ICM",
    description: "Trop tight preflop spots bulle (fold EV+ 0.8bb en moyenne)",
    costBb100: 1.7,
    occurrences: 31,
    severity: "major",
  },
  {
    id: "l5",
    category: "Postflop",
    description: "C-bet sizing trop petit sur boards secs (30% pot vs optimal 55%)",
    costBb100: 1.2,
    occurrences: 58,
    severity: "minor",
  },
];

export const DASHBOARD_STATS: DashboardStats = computeDashboardStats(SESSIONS);
