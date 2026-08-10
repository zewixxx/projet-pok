/**
 * Bilan de la dernière session + axes de travail (liés aux leaks).
 */

import { LEAKS, SESSIONS } from "./dashboardData";
import type { LeakEntry, SessionPoint } from "../types";

export interface SessionFocusItem {
  id: string;
  title: string;
  summary: string;
  impact: string;
  leakId: string;
}

export interface SessionDebrief {
  session: SessionPoint;
  dateLabel: string;
  resultLabel: string;
  isWin: boolean;
  highlights: string[];
  focusItems: SessionFocusItem[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Lie chaque axe de travail à une fuite (pour ouvrir l’exemple au clic). */
const FOCUS_BY_LEAK: Record<string, Omit<SessionFocusItem, "leakId">> = {
  l1: {
    id: "focus-bb-cbet",
    title: "Défense BB vs c-bet",
    summary: "Tu as foldé trop de mains jouables face aux mises flop.",
    impact: "Priorité #1 — gros impact EV",
  },
  l2: {
    id: "focus-sb-call",
    title: "Calls SB trop larges",
    summary: "Plusieurs calls hors position avec des mains moyennes.",
    impact: "Priorité #2 — spots préflop",
  },
  l3: {
    id: "focus-river-bluff",
    title: "Bluffs river manqués",
    summary: "Tu check trop souvent river après avoir misé flop/turn.",
    impact: "Priorité #3 — agressivité late street",
  },
};

export function getLastSessionDebrief(): SessionDebrief | null {
  if (!SESSIONS.length) return null;
  const session = SESSIONS[SESSIONS.length - 1];
  const isWin = session.netEuros > 0;

  const leakIds = ["l1", "l2", "l3"];
  const focusItems: SessionFocusItem[] = leakIds
    .map((leakId) => {
      const meta = FOCUS_BY_LEAK[leakId];
      const leak = LEAKS.find((l) => l.id === leakId);
      if (!meta || !leak) return null;
      return { ...meta, leakId };
    })
    .filter((x): x is SessionFocusItem => Boolean(x));

  const highlights = [
    `${session.hands} mains jouées`,
    `Buy-in ${session.buyIn} €`,
    session.place > 0
      ? `Place #${session.place}/${session.total.toLocaleString("fr-FR")}`
      : "Tournoi non classé",
    isWin
      ? `Résultat +${session.netEuros.toLocaleString("fr-FR")} €`
      : `Résultat ${session.netEuros.toLocaleString("fr-FR")} €`,
  ];

  return {
    session,
    dateLabel: formatDate(session.date),
    resultLabel: isWin ? "Session positive" : "Session à digérer",
    isWin,
    highlights,
    focusItems,
  };
}

export function getLeakById(id: string): LeakEntry | undefined {
  return LEAKS.find((l) => l.id === id);
}

export function getNextLeak(currentId: string): LeakEntry | null {
  const idx = LEAKS.findIndex((l) => l.id === currentId);
  if (idx < 0) return null;
  return LEAKS[(idx + 1) % LEAKS.length] ?? null;
}
