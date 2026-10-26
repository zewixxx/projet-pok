import { useCallback, useEffect, useMemo, useState } from "react";
import { useRemoteReview } from "../features/ai/useRemoteReview";
import { buildLeakReview, type LeakReviewPayload } from "../features/dashboard/data/leakReviews";
import { getNextLeak } from "../features/dashboard/data/leakNavigation";
import type { LeakEntry } from "../features/dashboard/types";
import { useHomeData, type HomeLeak } from "../features/dashboard/useHomeData";
import { replayHandsToReviewHands } from "../features/import/replayToReviewHands";
import { useImportedHands } from "../features/import/useImportedHands";
import { MOCK_HANDS } from "../features/review/fixtures/mockHand";
import { MOCK_TOURNAMENTS } from "../features/review/fixtures/mockTournaments";
import type { AppPage } from "../shell/navigation";

const FALLBACK = MOCK_HANDS;

/** Demande d'ouverture d'une main précise dans la review. `token` force le déclenchement à chaque clic. */
export interface ReviewFocus {
  handId: string;
  token: number;
}

export type ReviewMode = "loading" | "real" | "demo" | "empty";

/** État de navigation + données review, sorti d'App. */
export function useAppNavigation() {
  const [activePage, setActivePage] = useState<AppPage>("home");
  const [selectedTournamentId, setSelectedTournamentId] = useState(MOCK_TOURNAMENTS[0]?.id ?? "");
  const [leakReview, setLeakReview] = useState<LeakReviewPayload | null>(null);
  const [focus, setFocus] = useState<ReviewFocus | null>(null);
  const [demoRequested, setDemoRequested] = useState(false);

  // Application de bureau avec des tournois importés : on les utilise à la place des données de démo.
  const remote = useRemoteReview(selectedTournamentId, { autoStart: activePage === "review" && !leakReview });
  const home = useHomeData(remote);

  const hasRealTournaments = remote.available && (remote.tournaments?.length ?? 0) > 0;
  const reviewMode: ReviewMode = !remote.available
    ? "demo"
    : remote.tournaments === null
      ? "loading"
      : hasRealTournaments
        ? "real"
        : demoRequested
          ? "demo"
          : "empty";
  const useRemoteData = reviewMode === "real";

  const tournaments = useRemoteData ? remote.tournaments! : MOCK_TOURNAMENTS;

  useEffect(() => {
    if (useRemoteData && !tournaments.some((t) => t.id === selectedTournamentId)) {
      setSelectedTournamentId(tournaments[0].id);
      setFocus(null);
    }
  }, [useRemoteData, tournaments, selectedTournamentId]);

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);
  const imported = useImportedHands(selectedTournamentId, MOCK_TOURNAMENTS, FALLBACK);

  const replayHands = useRemoteData ? (remote.analyzed ? remote.hands : []) : imported.hands;
  const loading = useRemoteData ? remote.loadingHands : imported.loading;
  /** Vrai quand des tournois réels existent mais que celui-ci n'est pas encore analysé. */
  const needsAnalysis = useRemoteData && !remote.analyzed;

  const reviewHands = useMemo(() => {
    if (leakReview) return [];
    if (!selectedTournament || loading || replayHands.length === 0) return [];
    return replayHandsToReviewHands(replayHands, selectedTournament.id, selectedTournament.dateIso);
  }, [replayHands, selectedTournament, loading, leakReview]);

  const activeHands = leakReview
    ? leakReview.hands
    : replayHands.length > 0
      ? replayHands
      : useRemoteData
        ? []
        : FALLBACK;

  const goToPage = useCallback((page: AppPage) => {
    setLeakReview(null);
    setActivePage(page);
  }, []);

  const openLeakReview = useCallback((leak: LeakEntry) => {
    const payload = buildLeakReview(leak);
    if (!payload) return;
    setLeakReview(payload);
    setActivePage("review");
  }, []);

  const openNextLeak = () => {
    if (!leakReview) return;
    const next = getNextLeak(leakReview.leak.id);
    if (next) openLeakReview(next);
  };

  const exitLeakReview = () => {
    setLeakReview(null);
    setActivePage("home");
  };

  const selectTournament = (id: string) => {
    setSelectedTournamentId(id);
    setFocus(null);
  };

  /** Ouvre un tournoi (et éventuellement une main précise) dans la review. */
  const openTournament = (id: string, handId?: string) => {
    setLeakReview(null);
    setSelectedTournamentId(id);
    setFocus(handId ? { handId, token: Date.now() } : null);
    setActivePage("review");
  };

  /** Depuis une fuite de l'accueil : parcours démo, ou vraie main d'exemple du tournoi concerné. */
  const openLeak = (leak: HomeLeak) => {
    if (leak.demo) {
      openLeakReview(leak.demo);
      return;
    }
    const handId = leak.sampleHandIds[0];
    const owner = handId ? remote.tournaments?.find((t) => t.handIds.includes(handId)) : undefined;
    if (owner) openTournament(owner.id, handId);
    else goToPage("review");
  };

  const openDemoReview = () => {
    setDemoRequested(true);
    setLeakReview(null);
    setActivePage("review");
  };

  return {
    activePage,
    selectedTournamentId,
    leakReview,
    inLeakMode: Boolean(leakReview),
    focus,
    reviewHands,
    loading,
    activeHands,
    tournaments,
    remote,
    home,
    reviewMode,
    useRemoteData,
    needsAnalysis,
    selectedTournament,
    goToPage,
    selectTournament,
    openTournament,
    openLeak,
    openLeakReview,
    openNextLeak,
    exitLeakReview,
    openDemoReview,
  };
}

export type AppNavigation = ReturnType<typeof useAppNavigation>;
