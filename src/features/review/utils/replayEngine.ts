/**
 * replayEngine.ts
 *
 * Calcule pot, mises street et stacks effectifs à partir des actions.
 * Gère correctement raise/all-in (montant total) vs call/bet (incrémental).
 */

import type { HandAction, ReplayHand, ReplayPlayer, Street } from "../replay.types";

export interface ReplayComputedState {
  pot: number;
  streetBets: Record<string, number>;
  totalInvested: Record<string, number>;
  foldedIds: Set<string>;
}

function emptyRecord(ids: string[]): Record<string, number> {
  return Object.fromEntries(ids.map(id => [id, 0]));
}

/** Poste SB/BB au début du preflop */
function postBlinds(
  players: ReplayPlayer[],
  blinds: { small: number; big: number },
  streetInvested: Record<string, number>,
  totalInvested: Record<string, number>,
  anteBb = 0,
): number {
  let streetMax = 0;
  const headsUp = players.length === 2;

  // L'ante va dans le pot sans compter comme mise de la rue.
  if (anteBb > 0) {
    for (const p of players) totalInvested[p.id] = anteBb;
  }

  for (const p of players) {
    if (p.position === "SB" || (headsUp && p.position === "BTN")) {
      streetInvested[p.id] = blinds.small;
      totalInvested[p.id]  = (totalInvested[p.id] ?? 0) + blinds.small;
      streetMax = Math.max(streetMax, blinds.small);
    } else if (p.position === "BB") {
      streetInvested[p.id] = blinds.big;
      totalInvested[p.id]  = (totalInvested[p.id] ?? 0) + blinds.big;
      streetMax = Math.max(streetMax, blinds.big);
    }
  }
  return streetMax;
}

function applyAction(
  action: HandAction,
  streetInvested: Record<string, number>,
  totalInvested: Record<string, number>,
  streetMax: number,
): number {
  const pid  = action.playerId;
  const prev = streetInvested[pid] ?? 0;

  switch (action.type) {
    case "fold":
    case "check":
      return streetMax;

    case "call":
    case "bet":
      if (action.amountBb != null) {
        streetInvested[pid] = prev + action.amountBb;
        totalInvested[pid]    = (totalInvested[pid] ?? 0) + action.amountBb;
        return Math.max(streetMax, streetInvested[pid]);
      }
      return streetMax;

    case "raise":
    case "allin":
      if (action.amountBb != null) {
        const increment = Math.max(0, action.amountBb - prev);
        streetInvested[pid] = action.amountBb;
        totalInvested[pid]  = (totalInvested[pid] ?? 0) + increment;
        return Math.max(streetMax, action.amountBb);
      }
      return streetMax;

    default:
      return streetMax;
  }
}

export function computeReplayState(
  hand: ReplayHand,
  actionIndex: number,
): ReplayComputedState {
  const ids = hand.players.map(p => p.id);
  const streetInvested = emptyRecord(ids);
  const totalInvested  = emptyRecord(ids);
  const foldedIds      = new Set<string>();

  let streetMax    = postBlinds(hand.players, hand.blindsBb, streetInvested, totalInvested, hand.anteBb ?? 0);
  let currentStreet: Street = "preflop";

  for (let i = 0; i <= actionIndex; i++) {
    const action = hand.actions[i];

    if (action.street !== currentStreet) {
      for (const id of ids) streetInvested[id] = 0;
      streetMax = 0;
      currentStreet = action.street;
    }

    if (action.type === "fold") foldedIds.add(action.playerId);

    streetMax = applyAction(action, streetInvested, totalInvested, streetMax);
  }

  const pot = ids.reduce((sum, id) => sum + (totalInvested[id] ?? 0), 0);

  return { pot, streetBets: { ...streetInvested }, totalInvested, foldedIds };
}

/** Stack effectif = stack de départ − total investi */
export function effectiveStackBb(
  startingStackBb: number,
  totalInvested: Record<string, number>,
  playerId: string,
): number {
  const invested = totalInvested[playerId] ?? 0;
  return Math.max(0, Math.round((startingStackBb - invested) * 10) / 10);
}
