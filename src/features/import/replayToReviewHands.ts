/**
 * Convertit des ReplayHand importées en ReviewHand pour le panneau EV+/EV−.
 */

import type { CoachTip, EvComparison, ReplayHand } from "../review/replay.types";
import type { ReviewHand, PokerPosition } from "../review/types";

const POSITIONS = new Set<PokerPosition>(["UTG", "MP", "CO", "BTN", "SB", "BB"]);

function inferKeyAction(hand: ReplayHand, heroId?: string): ReviewHand["keyAction"] {
  if (!heroId) return "none";
  const heroActs = hand.actions.filter((a) => a.playerId === heroId);
  if (heroActs.some((a) => a.type === "allin")) return "all-in";
  if (heroActs.filter((a) => a.type === "raise").length >= 2) return "3bet";
  if (heroActs.some((a) => a.type === "raise" && (a.amountBb ?? 0) > 8)) return "squeeze";
  if (heroActs.some((a) => a.type === "bet" && (a.amountBb ?? 0) > 5)) return "overbet";
  return "none";
}

function inferPhase(stackBb: number): ReviewHand["phase"] {
  if (stackBb <= 12) return "bubble";
  if (stackBb <= 20) return "itm";
  if (stackBb <= 35) return "middle";
  if (stackBb <= 50) return "early";
  return "ft";
}

function scoreEvComparison(ev: EvComparison): number {
  const played = ev.options.find((o) => o.isPlayed);
  const bestOpt = [...ev.options].sort((a, b) => b.evBb - a.evBb)[0];
  if (played && bestOpt && bestOpt.evBb > played.evBb + 0.05) {
    return -(bestOpt.evBb - played.evBb);
  }
  return 0;
}

function scoreTip(tip: CoachTip): number {
  const diff = tip.evDiffBb ?? 0;
  if (tip.quality === "mistake") return -Math.abs(diff);
  if (tip.quality === "good") return Math.max(0.15, Math.abs(diff) || 0.25);
  return 0;
}

/** Score EV signé à partir des coachTips / EV déjà attachés à la main. */
function computeEvImpact(hand: ReplayHand): { evImpact: number; summary: string } {
  let impact = 0;
  let worst = "";
  let best = "";

  // Main analysée par le moteur : on compte la perte réelle de chaque erreur, une seule fois.
  if (hand.analyzed && hand.spots) {
    let worstLoss = 0;
    for (const [key, spot] of Object.entries(hand.spots)) {
      const tip = hand.coachTips?.[Number(key)];
      if (!tip) continue;
      if (tip.quality === "mistake") {
        impact -= spot.evLossBb;
        if (spot.evLossBb >= worstLoss) {
          worstLoss = spot.evLossBb;
          worst = tip.headline;
        }
      } else if (tip.quality === "good") {
        impact += 0.15;
        best = tip.headline;
      }
    }
    const rounded = Math.round(impact * 100) / 100;
    const summary =
      rounded <= -0.5 ? worst || "Erreur coûteuse" : rounded >= 0.5 ? best || "Beau coup" : "Spot neutre";
    return { evImpact: rounded, summary };
  }

  for (const tip of Object.values(hand.coachTips ?? {})) {
    impact += scoreTip(tip);
    if (tip.quality === "mistake") {
      const diff = Math.abs(tip.evDiffBb ?? 0);
      if (!worst || diff > 0.2) worst = tip.headline;
    } else if (tip.quality === "good") {
      best = tip.headline;
    }
  }

  for (const ev of Object.values(hand.evComparisons ?? {})) {
    impact += scoreEvComparison(ev);
  }

  const rounded = Math.round(impact * 100) / 100;
  const summary =
    rounded <= -0.5
      ? worst || "Erreur coûteuse"
      : rounded >= 0.5
        ? best || "Beau coup"
        : "Spot neutre";

  return { evImpact: rounded, summary };
}

export function replayHandsToReviewHands(
  hands: ReplayHand[],
  tournamentId: string,
  dateIso: string,
): ReviewHand[] {
  return hands.map((h) => {
    const hero = h.players.find((p) => p.isHero);
    const pos = hero?.position;
    const position: PokerPosition = POSITIONS.has(pos as PokerPosition)
      ? (pos as PokerPosition)
      : "BTN";
    const { evImpact, summary } = computeEvImpact(h);

    return {
      handId: h.id,
      tournamentId,
      dateIso,
      position,
      stackBb: hero?.stackBb ?? 20,
      phase: inferPhase(hero?.stackBb ?? 20),
      tag: "imported",
      keyAction: inferKeyAction(h, hero?.id),
      evLoss: Math.max(0, -evImpact),
      evImpact,
      holeCards: hero?.holeCards,
      summary,
    };
  });
}
