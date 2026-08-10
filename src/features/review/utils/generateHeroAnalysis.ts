/**
 * generateHeroAnalysis.ts
 *
 * Génère conseils IA et comparatif EV pour les mains importées
 * (sans coachTips / evComparisons pré-calculés).
 */

import type {
  CoachTip,
  EvComparison,
  EvOption,
  HandAction,
  ReplayHand,
  ReplayPlayer,
} from "../replay.types";
import { ACTION_LABELS } from "../replay.constants";

function roundBet(n: number): number {
  return Math.round(n * 10) / 10;
}

function altEv(base: number, offset: number): number {
  return Math.round((base + offset) * 100) / 100;
}

function buildOptions(action: HandAction, hero: ReplayPlayer): EvOption[] {
  const played: EvOption = {
    type: action.type,
    amountBb: action.amountBb,
    evBb: 0,
    isPlayed: true,
  };

  const alts: EvOption[] = [];

  switch (action.type) {
    case "fold":
      alts.push({ type: "call", amountBb: action.amountBb, evBb: altEv(0, 0.20) });
      break;
    case "check":
      alts.push({ type: "bet", amountBb: roundBet((hero.stackBb * 0.33) || 2), evBb: altEv(0, 0.30) });
      alts.push({ type: "fold", evBb: altEv(0, -0.10) });
      break;
    case "call":
      alts.push({ type: "raise", amountBb: roundBet((action.amountBb ?? 2) * 2.5), evBb: altEv(0, 0.35) });
      alts.push({ type: "fold", evBb: altEv(0, -0.15) });
      break;
    case "bet":
    case "raise":
    case "allin":
      alts.push({ type: "check", evBb: altEv(0, -0.20) });
      if (action.amountBb) {
        alts.push({
          type: action.type,
          amountBb: roundBet(action.amountBb * 1.25),
          evBb: altEv(0, 0.15),
        });
      }
      break;
  }

  return [...alts, played].sort((a, b) => b.evBb - a.evBb);
}

function buildTip(action: HandAction, hero: ReplayPlayer, options: EvOption[]): CoachTip {
  const label = ACTION_LABELS[action.type] ?? action.type;
  const sizing = action.amountBb != null ? ` ${action.amountBb.toFixed(1)} bb` : "";
  const best   = options[0];
  const played = options.find(o => o.isPlayed);
  const isOptimal = played && best.isPlayed;

  const cards = hero.holeCards?.join(" ") ?? "—";
  const pos   = hero.position;

  if (isOptimal) {
    return {
      quality: "good",
      headline: `${label}${sizing} — ligne cohérente en ${pos}`,
      detail: `Avec ${cards}, ta décision est dans la norme GTO pour ce spot. Continue à surveiller le sizing et la texture du board.`,
      evDiffBb: 0,
    };
  }

  const evLoss = played ? roundBet(best.evBb - (played.evBb ?? 0)) : 0;

  if (action.type === "fold") {
    return {
      quality: evLoss > 0.15 ? "mistake" : "ok",
      headline: `Fold${sizing} — spot marginal en ${pos}`,
      detail: `Avec ${cards}, ${best.type === "call" ? "un call" : "une ligne plus agressive"} aurait ${evLoss > 0 ? `+${evLoss.toFixed(2)}` : "0"} bb EV.`,
      evDiffBb: evLoss,
    };
  }

  return {
    quality: evLoss > 0.20 ? "mistake" : evLoss > 0.08 ? "ok" : "good",
    headline: `${label}${sizing} — alternative plus EV+ disponible`,
    detail: `Top EV : ${ACTION_LABELS[best.type] ?? best.type}${best.amountBb != null ? ` ${best.amountBb.toFixed(1)} bb` : ""} (${best.evBb >= 0 ? "+" : ""}${best.evBb.toFixed(2)} bb).`,
    evDiffBb: evLoss,
  };
}

export function resolveHeroAnalysis(
  hand: ReplayHand,
  actionIndex: number,
): { tip?: CoachTip; ev?: EvComparison } {
  const bakedTip = hand.coachTips?.[actionIndex];
  const bakedEv  = hand.evComparisons?.[actionIndex];
  if (bakedTip || bakedEv) {
    return { tip: bakedTip, ev: bakedEv };
  }

  const action = hand.actions[actionIndex];
  const hero   = hand.players.find(p => p.isHero);
  if (!hero || action.playerId !== hero.id) return {};

  const options = buildOptions(action, hero);
  return {
    ev:  { options },
    tip: buildTip(action, hero, options),
  };
}
