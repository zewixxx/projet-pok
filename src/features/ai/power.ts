/**
 * Même calcul que electron/analysis/tournament.ts (usableCores / threadsForPower).
 * À garder synchronisé : sert à afficher à l'utilisateur ce que son réglage change.
 */

export function usableCores(logicalCpus: number): number {
  const logical = Math.max(1, logicalCpus);
  return logical >= 4 ? Math.max(2, Math.floor(logical / 2)) : logical;
}

export function threadsForPower(powerPercent: number, logicalCpus: number): number {
  const cores = usableCores(logicalCpus);
  const pct = Math.min(100, Math.max(5, powerPercent));
  return Math.min(cores, Math.max(1, Math.round((pct / 100) * cores)));
}

/** Estimation du temps d'analyse (secondes) : ~0,1 s par main et par thread, mesuré sur un portable i5. */
export function estimateSeconds(hands: number, threads: number): number {
  const perHand = 0.1;
  const speedup = threads <= 1 ? 1 : 1 + (threads - 1) * 0.65;
  return Math.max(1, Math.round((hands * perHand) / speedup));
}
