export type ActionType = "fold" | "call" | "bet" | "raise" | "check" | "allin";
export type Street    = "preflop" | "flop" | "turn" | "river";
export type TipQuality = "good" | "ok" | "mistake";

export interface ReplayPlayer {
  id: string;
  name: string;
  stackBb: number;
  seatIndex: number;
  position: string;
  isHero?: boolean;
  holeCards?: [string, string];
}

export interface HandAction {
  playerId: string;
  type: ActionType;
  amountBb?: number;
  street: Street;
}

export interface StreetBoard {
  street: Exclude<Street, "preflop">;
  cards: string[];
}

/** Coaching tip attached to a specific action index */
export interface CoachTip {
  quality: TipQuality;
  headline: string;
  detail: string;
  evDiffBb?: number;
}

/** One candidate action with its expected value */
export interface EvOption {
  type: ActionType;
  amountBb?: number;
  evBb: number;
  /** True for the action actually played */
  isPlayed?: boolean;
}

/** Full EV comparison for one decision point */
export interface EvComparison {
  /** Options sorted by descending EV */
  options: EvOption[];
}

export interface ReplayHand {
  id: string;
  label: string;
  blindsBb: { small: number; big: number };
  players: ReplayPlayer[];
  actions: HandAction[];
  boards: StreetBoard[];
  /** Keyed by action index (0-based) */
  coachTips?: Record<number, CoachTip>;
  /** Keyed by action index (0-based) */
  evComparisons?: Record<number, EvComparison>;
}

/** Player enriched with runtime state for the current replay snapshot */
export interface ReplayPlayerState extends ReplayPlayer {
  hasFolded: boolean;
  isActor: boolean;
  /** Total amount put in the current street (stays visible until next street) */
  streetBetBb: number;
  /** Display seat index: hero is always 0, others follow clockwise */
  visualSeatIndex: number;
}
