/**
 * Hook : charge les mains du tournoi sélectionné à la demande.
 */

import { useEffect, useState, useRef } from "react";
import type { ReplayHand } from "../review/replay.types";
import type { Tournament } from "../review/tournament.types";
import { loadTournamentHands, type ImportedTournament } from "./index";

interface UseImportedHandsResult {
  hands: ReplayHand[];
  loading: boolean;
  error: string | null;
}

export function useImportedHands(
  tournamentId: string,
  tournaments: Tournament[],
  fallback: ReplayHand[] = [],
): UseImportedHandsResult {
  const [hands, setHands]     = useState<ReplayHand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const fallbackRef           = useRef(fallback);
  fallbackRef.current         = fallback;

  useEffect(() => {
    const tournament = tournaments.find(t => t.id === tournamentId) as ImportedTournament | undefined;
    if (!tournament) {
      setHands(fallbackRef.current);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadTournamentHands(tournament)
      .then(loaded => {
        if (cancelled) return;
        setHands(loaded.length > 0 ? loaded : fallbackRef.current);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(String(err));
        setHands(fallbackRef.current);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tournamentId, tournaments]);

  return { hands, loading, error };
}
