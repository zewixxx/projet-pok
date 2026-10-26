/** Aides de navigation dans une série de mains : décisions du héros, erreurs, frise colorée. */

import type { ReplayHand } from "../replay.types";
import type { HandMark } from "../components/replay/TableControls";

export interface Spot {
  handIndex: number;
  actionIndex: number;
}

/** Index des actions jouées par le héros. */
export function heroActionIndexes(hand: ReplayHand): number[] {
  const heroId = hand.players.find((p) => p.isHero)?.id;
  if (!heroId) return [];
  const out: number[] = [];
  hand.actions.forEach((a, i) => {
    if (a.playerId === heroId) out.push(i);
  });
  return out;
}

/** Index des actions du héros marquées « erreur » par le coach. */
export function mistakeActionIndexes(hand: ReplayHand): number[] {
  if (!hand.coachTips) return [];
  return Object.entries(hand.coachTips)
    .filter(([, tip]) => tip.quality === "mistake")
    .map(([key]) => Number(key))
    .filter((i) => i >= 0 && i < hand.actions.length)
    .sort((a, b) => a - b);
}

/** Pire erreur d'une main (plus grosse perte d'EV), sinon première erreur. */
export function worstMistakeIndex(hand: ReplayHand): number | null {
  const mistakes = mistakeActionIndexes(hand);
  if (mistakes.length === 0) return null;
  let best = mistakes[0];
  let bestLoss = -1;
  for (const i of mistakes) {
    const loss = hand.spots?.[i]?.evLossBb ?? Math.abs(hand.coachTips?.[i]?.evDiffBb ?? 0);
    if (loss > bestLoss) {
      best = i;
      bestLoss = loss;
    }
  }
  return best;
}

/**
 * Prochain coup (strictement après la position actuelle) retenu par `pick`.
 * Boucle au début de la série quand on arrive au bout. Renvoie null s'il n'y en a aucun.
 */
export function nextSpot(
  hands: ReplayHand[],
  handIndex: number,
  actionIndex: number,
  pick: (hand: ReplayHand) => number[],
): Spot | null {
  if (hands.length === 0) return null;

  const here = pick(hands[handIndex]).find((i) => i > actionIndex);
  if (here != null) return { handIndex, actionIndex: here };

  for (let step = 1; step <= hands.length; step++) {
    const h = (handIndex + step) % hands.length;
    const first = pick(hands[h])[0];
    if (first != null) return { handIndex: h, actionIndex: first };
  }
  return null;
}

/** Couleur de la frise pour une main : erreur > beau coup > correct > non analysée. */
export function handMark(hand: ReplayHand): HandMark {
  const tips = Object.values(hand.coachTips ?? {});
  if (tips.length === 0) return "none";
  if (tips.some((t) => t.quality === "mistake")) return "mistake";
  if (tips.some((t) => t.quality === "good")) return "good";
  return "ok";
}
