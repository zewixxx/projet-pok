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
  /** « moteur » : texte du moteur de calcul. « ia » : reformulé par l'IA locale. */
  source?: "moteur" | "ia";
}

export type MistakeKind =
  | "overfold"
  | "overcall"
  | "passive-call"
  | "missed-bet"
  | "overaggression"
  | "sizing";

/** Ce que le moteur d'analyse a retenu d'un spot du héros. */
export interface SpotInsight {
  kind: MistakeKind | "correct";
  street: Street;
  heroPosition: string;
  equityPct: number;
  potOddsPct?: number;
  potBb: number;
  toCallBb: number;
  stackBb: number;
  villainId?: string;
  villainPosition?: string;
  /** Probabilité 0-1 de chaque main (« AKs », « 72o ») dans la range estimée. */
  villainRange?: Record<string, number>;
  villainRangeLabel?: string;
  villainRangePct?: string;
  confidence: "haute" | "moyenne" | "faible";
  evLossBb: number;
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
  /** Ante par joueur, en bb. */
  anteBb?: number;
  players: ReplayPlayer[];
  actions: HandAction[];
  boards: StreetBoard[];
  /** Keyed by action index (0-based) */
  coachTips?: Record<number, CoachTip>;
  /** Keyed by action index (0-based) */
  evComparisons?: Record<number, EvComparison>;
  /** Vrai quand le moteur a analysé cette main : pas de repli sur de fausses analyses. */
  analyzed?: boolean;
  /** Clé : index d'action du héros. */
  spots?: Record<number, SpotInsight>;
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
