/**
 * replay.constants.ts
 *
 * Shared display labels for action types and streets.
 * Single source of truth — import here instead of re-declaring locally.
 */

import type { ActionType, Street } from "./replay.types";

export const ACTION_LABELS: Record<ActionType, string> = {
  fold:  "Fold",
  call:  "Call",
  bet:   "Bet",
  raise: "Raise",
  check: "Check",
  allin: "All-in",
};

/** Title-case street names (for feed text, EV panel, etc.) */
export const STREET_LABELS: Record<Street, string> = {
  preflop: "Préflop",
  flop:    "Flop",
  turn:    "Turn",
  river:   "River",
};

/** All-caps street names (for header badges / prominent labels). */
export const STREET_LABELS_UPPER: Record<Street, string> = {
  preflop: "PRÉFLOP",
  flop:    "FLOP",
  turn:    "TURN",
  river:   "RIVER",
};
