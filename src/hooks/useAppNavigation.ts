import { useMemo, useState } from "react";
import type { AppPage } from "../components/BurgerNav";
import { buildLeakReview, type LeakReviewPayload } from "../features/dashboard/data/leakReviews";
import { getNextLeak } from "../features/dashboard/data/sessionDebrief";
import type { LeakEntry } from "../features/dashboard/types";
import { useImportedHands } from "../features/import/useImportedHands";
import { replayHandsToReviewHands } from "../features/import/replayToReviewHands";
import { MOCK_HANDS } from "../features/review/fixtures/mockHand";
import { MOCK_TOURNAMENTS } from "../features/review/fixtures/mockTournaments";

const FALLBACK = MOCK_HANDS;

/** État de navigation + données review — sorti d’App pour respecter SRP. */
export function useAppNavigation() {
  const [activePage, setActivePage] = useState<AppPage>("dashboard");
  const [selectedTournamentId, setSelectedTournamentId] = useState(
    MOCK_TOURNAMENTS[0]?.id ?? "",
  );
  const [leakReview, setLeakReview] = useState<LeakReviewPayload | null>(null);
  const [focusHandId, setFocusHandId] = useState<string | null>(null);

  const selectedTournament = MOCK_TOURNAMENTS.find((t) => t.id === selectedTournamentId);
  const { hands: replayHands, loading } = useImportedHands(
    selectedTournamentId,
    MOCK_TOURNAMENTS,
    FALLBACK,
  );

  const reviewHands = useMemo(() => {
    if (leakReview) return [];
    if (!selectedTournament || loading || replayHands.length === 0) return [];
    return replayHandsToReviewHands(
      replayHands,
      selectedTournament.id,
      selectedTournament.dateIso,
    );
  }, [replayHands, selectedTournament, loading, leakReview]);

  const openLeakReview = (leak: LeakEntry) => {
    const payload = buildLeakReview(leak);
    if (!payload) return;
    setLeakReview(payload);
    setActivePage("review");
  };

  const openNextLeak = () => {
    if (!leakReview) return;
    const next = getNextLeak(leakReview.leak.id);
    if (!next) return;
    openLeakReview(next);
  };

  const exitLeakReview = () => {
    setLeakReview(null);
    setActivePage("dashboard");
  };

  const goToPage = (page: AppPage) => {
    if (page === "dashboard" || page === "winamax") setLeakReview(null);
    if (page === "review" && leakReview) setLeakReview(null);
    setActivePage(page);
  };

  const selectTournament = (id: string) => {
    setSelectedTournamentId(id);
    setFocusHandId(null);
  };

  const activeHands = leakReview
    ? leakReview.hands
    : replayHands.length > 0
      ? replayHands
      : FALLBACK;

  return {
    activePage,
    selectedTournamentId,
    leakReview,
    focusHandId,
    setFocusHandId,
    reviewHands,
    loading,
    activeHands,
    inLeakMode: Boolean(leakReview),
    tournaments: MOCK_TOURNAMENTS,
    openLeakReview,
    openNextLeak,
    exitLeakReview,
    goToPage,
    selectTournament,
  };
}
