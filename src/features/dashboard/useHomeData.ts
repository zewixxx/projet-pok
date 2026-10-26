/**
 * Données de la page d'accueil.
 *  - application de bureau avec tournois importés → données réelles (tournois + fuites du moteur)
 *  - application de bureau sans import → état vide (onboarding)
 *  - navigateur (pas d'API Electron) → données d'exemple, clairement signalées
 */

import { useEffect, useMemo, useState } from "react";
import { getAiApi, type AnalysisLeak } from "../ai/types";
import type { RemoteReview, RemoteTournament } from "../ai/useRemoteReview";
import { computeByLimit } from "../winamax-analyzer/utils/report";
import type { LimitBucket } from "../winamax-analyzer/types";
import { LEAKS, POSITION_STATS, SESSIONS } from "./data/dashboardData";
import type { LeakEntry, PositionStat, SessionPoint } from "./types";

export type HomeMode = "loading" | "empty" | "real" | "demo";

export interface HomeLeak {
  id: string;
  category: string;
  description: string;
  detail?: string;
  costBb100: number;
  occurrences: number;
  totalLossBb?: number;
  severity: "critical" | "major" | "minor";
  /** Mains d'exemple (réel). */
  sampleHandIds: string[];
  /** Fuite de démonstration : ouvre le parcours pas à pas. */
  demo?: LeakEntry;
}

export interface HomeTournamentRow {
  id: string;
  name: string;
  dateIso: string;
  buyIn: number;
  place: number;
  total: number;
  net: number | null;
  hands: number;
  analyzed?: boolean;
  mistakes?: number;
  totalLossBb?: number;
}

export interface AnalysisSummary {
  analyzed: number;
  total: number;
  mistakes: number;
  lossBb: number;
}

export interface HomeData {
  mode: HomeMode;
  sessions: SessionPoint[];
  byLimit: LimitBucket[];
  leaks: HomeLeak[];
  recent: HomeTournamentRow[];
  analysis: AnalysisSummary | null;
  positions: PositionStat[] | null;
  /** Premier tournoi (le plus récent) à analyser, s'il y en a un. */
  nextToAnalyze: HomeTournamentRow | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Transforme les tournois importés en points de courbe (ordre chronologique). */
export function sessionsFromTournaments(newestFirst: RemoteTournament[]): SessionPoint[] {
  const played = newestFirst.filter((t) => t.place > 0 && t.buyInEuros >= 0).reverse();
  let cumul = 0;
  return played.map((t) => {
    const net = round2((t.prizeEuros ?? 0) - t.buyInEuros);
    cumul = round2(cumul + net);
    return {
      date: t.dateIso,
      label: t.name,
      buyIn: t.buyInEuros,
      netEuros: net,
      // Pas d'ajustement all-in côté données réelles : EV = résultat réel.
      evEuros: net,
      cumulEuros: cumul,
      cumulEv: cumul,
      sdEuros: net,
      cumulSd: cumul,
      place: t.place,
      total: t.totalPlayers,
      hands: t.handsCount,
    };
  });
}

function leaksFromAnalysis(leaks: AnalysisLeak[]): HomeLeak[] {
  return leaks.map((l) => ({
    id: l.id,
    category: l.category,
    description: l.description,
    detail: l.detail,
    costBb100: l.costBb100,
    occurrences: l.occurrences,
    totalLossBb: l.totalLossBb,
    severity: l.severity,
    sampleHandIds: l.sampleHandIds,
  }));
}

function demoLeaks(): HomeLeak[] {
  return LEAKS.map((l) => ({
    id: l.id,
    category: l.category,
    description: l.description,
    costBb100: l.costBb100,
    occurrences: l.occurrences,
    severity: l.severity,
    sampleHandIds: [],
    demo: l,
  }));
}

const EMPTY: HomeData = {
  mode: "loading",
  sessions: [],
  byLimit: [],
  leaks: [],
  recent: [],
  analysis: null,
  positions: null,
  nextToAnalyze: null,
};

export function useHomeData(remote: RemoteReview): HomeData {
  const api = getAiApi();
  const [allLeaks, setAllLeaks] = useState<AnalysisLeak[]>([]);
  const tournaments = remote.tournaments;

  // Les fuites cumulées sont recalculées à chaque fin d'analyse (la liste des tournois est alors rafraîchie).
  useEffect(() => {
    if (!api || !tournaments || tournaments.length === 0) {
      setAllLeaks([]);
      return;
    }
    let cancelled = false;
    void api.allLeaks().then((res) => {
      if (!cancelled) setAllLeaks(res.leaks);
    });
    return () => {
      cancelled = true;
    };
  }, [api, tournaments]);

  return useMemo<HomeData>(() => {
    if (!api) {
      const sessions = SESSIONS;
      const recent = [...sessions]
        .reverse()
        .slice(0, 8)
        .map<HomeTournamentRow>((s, i) => ({
          id: `demo-${i}`,
          name: s.label,
          dateIso: s.date,
          buyIn: s.buyIn,
          place: s.place,
          total: s.total,
          net: s.netEuros,
          hands: s.hands,
        }));
      return {
        mode: "demo",
        sessions,
        byLimit: computeByLimit(sessions),
        leaks: demoLeaks(),
        recent,
        analysis: null,
        positions: POSITION_STATS,
        nextToAnalyze: null,
      };
    }

    if (tournaments === null) return EMPTY;
    if (tournaments.length === 0) return { ...EMPTY, mode: "empty" };

    const sessions = sessionsFromTournaments(tournaments);
    const rows = tournaments.map<HomeTournamentRow>((t) => ({
      id: t.id,
      name: t.name,
      dateIso: t.dateIso,
      buyIn: t.buyInEuros,
      place: t.place,
      total: t.totalPlayers,
      net: t.place > 0 ? round2((t.prizeEuros ?? 0) - t.buyInEuros) : null,
      hands: t.handsCount,
      analyzed: t.analyzed,
      mistakes: t.mistakes,
      totalLossBb: t.totalLossBb,
    }));
    const analyzedRows = rows.filter((r) => r.analyzed);

    return {
      mode: "real",
      sessions,
      byLimit: computeByLimit(sessions),
      leaks: leaksFromAnalysis(allLeaks),
      recent: rows,
      analysis: {
        analyzed: analyzedRows.length,
        total: rows.length,
        mistakes: analyzedRows.reduce((s, r) => s + (r.mistakes ?? 0), 0),
        lossBb: analyzedRows.reduce((s, r) => s + (r.totalLossBb ?? 0), 0),
      },
      positions: null,
      nextToAnalyze: rows.find((r) => !r.analyzed && r.hands > 0) ?? null,
    };
  }, [api, tournaments, allLeaks]);
}
