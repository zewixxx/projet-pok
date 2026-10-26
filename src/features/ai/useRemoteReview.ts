/**
 * Données réelles de l'application de bureau : tournois importés, mains analysées,
 * progression de l'analyse. Inactif dans le navigateur (pas d'API Electron).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReplayHand } from "../review/replay.types";
import type { Tournament } from "../review/tournament.types";
import {
  getAiApi,
  type AiSettings,
  type AiTournamentItem,
  type AnalysisLeak,
  type AnalysisProgress,
} from "./types";

export type AnalysisStatus = "idle" | "running" | "error";

export interface RemoteTournament extends Tournament {
  fileKey: string;
  analyzed: boolean;
  totalLossBb?: number;
}

export interface RemoteReview {
  available: boolean;
  /** null tant que la liste n'est pas chargée. */
  tournaments: RemoteTournament[] | null;
  hands: ReplayHand[];
  leaks: AnalysisLeak[];
  analyzed: boolean;
  loadingHands: boolean;
  status: AnalysisStatus;
  progress: AnalysisProgress | null;
  error: string | null;
  settings: AiSettings | null;
  logicalCpus: number;
  startAnalysis: () => void;
  cancelAnalysis: () => void;
  refreshTournaments: () => void;
}

function toTournament(item: AiTournamentItem): RemoteTournament {
  return {
    id: item.id,
    name: item.name,
    dateIso: item.dateIso,
    handsCount: item.handsCount,
    place: item.place,
    totalPlayers: item.totalPlayers,
    buyInEuros: item.buyInEuros,
    prizeEuros: item.prizeEuros,
    handIds: item.handIds,
    fileKey: item.fileKey,
    analyzed: item.analysis != null,
    mistakes: item.analysis?.mistakes,
    totalLossBb: item.analysis?.totalLossBb,
  };
}

interface RemoteReviewOptions {
  /** Autorise le démarrage automatique de l'analyse (seulement quand l'utilisateur est dans la review). */
  autoStart?: boolean;
}

export function useRemoteReview(selectedId: string, { autoStart = true }: RemoteReviewOptions = {}): RemoteReview {
  const api = getAiApi();
  const available = api != null;

  const [tournaments, setTournaments] = useState<RemoteTournament[] | null>(null);
  const [hands, setHands] = useState<ReplayHand[]>([]);
  const [leaks, setLeaks] = useState<AnalysisLeak[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [loadingHands, setLoadingHands] = useState(false);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [logicalCpus, setLogicalCpus] = useState(8);

  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const settingsRef = useRef<AiSettings | null>(null);
  settingsRef.current = settings;
  const autoStarted = useRef<Set<string>>(new Set());

  const refreshTournaments = useCallback(() => {
    if (!api) return;
    void api.listTournaments().then((list) => {
      // Les plus récents d'abord.
      const sorted = [...list].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      setTournaments(sorted.map(toTournament));
    });
  }, [api]);

  const loadHands = useCallback(
    (id: string) => {
      if (!api || !id) return;
      setLoadingHands(true);
      void api
        .getTournament(id)
        .then((res) => {
          if (selectedRef.current !== id) return;
          setHands(res.hands);
          setAnalyzed(res.analyzed);
          setLeaks(res.leaks);
        })
        .finally(() => {
          if (selectedRef.current === id) setLoadingHands(false);
        });
    },
    [api],
  );

  const startAnalysis = useCallback(() => {
    if (!api || !selectedRef.current) return;
    const id = selectedRef.current;
    setError(null);
    void api.startAnalysis(id).then((res) => {
      if (res.ok) {
        setStatus("running");
        setProgress({ tournamentId: id, phase: "moteur", done: 0, total: 0 });
      } else {
        setStatus("error");
        setError(res.error ?? "Impossible de lancer l'analyse.");
      }
    });
  }, [api]);

  const cancelAnalysis = useCallback(() => {
    if (api) void api.cancelAnalysis();
  }, [api]);

  // Chargement initial : liste des tournois, réglages, analyse éventuellement en cours.
  useEffect(() => {
    if (!api) return;
    refreshTournaments();
    void api.getSettings().then(setSettings);
    void api.getHardware().then((hw) => setLogicalCpus(hw.logicalCpus));
    void api.currentAnalysis().then((cur) => {
      if (cur && cur.tournamentId === selectedRef.current) setStatus("running");
    });
  }, [api, refreshTournaments]);

  // Abonnement aux événements de l'analyse.
  useEffect(() => {
    if (!api) return;
    const offProgress = api.onProgress((p) => {
      if (p.tournamentId !== selectedRef.current) return;
      setStatus("running");
      setProgress(p);
    });
    const offDone = api.onDone((p) => {
      refreshTournaments();
      if (p.tournamentId === selectedRef.current) {
        setStatus("idle");
        setProgress(null);
        loadHands(p.tournamentId);
      }
    });
    const offError = api.onError((p) => {
      if (p.tournamentId !== selectedRef.current) return;
      setStatus(p.cancelled ? "idle" : "error");
      setProgress(null);
      setError(p.cancelled ? null : p.error);
    });
    return () => {
      offProgress();
      offDone();
      offError();
    };
  }, [api, refreshTournaments, loadHands]);

  // Changement de tournoi : on recharge ses mains.
  useEffect(() => {
    if (!api || !selectedId) return;
    setHands([]);
    setLeaks([]);
    setAnalyzed(false);
    setError(null);
    loadHands(selectedId);
  }, [api, selectedId, loadHands]);

  // Analyse automatique à l'ouverture d'un tournoi pas encore analysé (uniquement depuis la review).
  useEffect(() => {
    if (!api || !autoStart || !settings?.autoAnalyze || !selectedId) return;
    if (loadingHands || analyzed || hands.length === 0 || status !== "idle") return;
    if (autoStarted.current.has(selectedId)) return;
    autoStarted.current.add(selectedId);
    startAnalysis();
  }, [api, autoStart, settings, selectedId, loadingHands, analyzed, hands.length, status, startAnalysis]);

  return {
    available,
    tournaments,
    hands,
    leaks,
    analyzed,
    loadingHands,
    status,
    progress,
    error,
    settings,
    logicalCpus,
    startAnalysis,
    cancelAnalysis,
    refreshTournaments,
  };
}
