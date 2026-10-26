/**
 * Types partagés par le moteur d'analyse.
 *
 * Les formes de ReplayHand, CoachTip et EvComparison reprennent celles de
 * src/features/review/replay.types.ts : les résultats passent tels quels à
 * l'interface par IPC. Le dossier electron/ ne peut pas importer depuis src/,
 * donc on garde ici une copie. Toute évolution est à reporter des deux côtés.
 */

export type ActionType = "fold" | "call" | "bet" | "raise" | "check" | "allin";
export type Street = "preflop" | "flop" | "turn" | "river";
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

export interface CoachTip {
  quality: TipQuality;
  headline: string;
  detail: string;
  evDiffBb?: number;
  /** « moteur » : texte du moteur de calcul. « ia » : reformulé par l'IA locale. */
  source?: "moteur" | "ia";
}

export interface EvOption {
  type: ActionType;
  amountBb?: number;
  evBb: number;
  isPlayed?: boolean;
}

export interface EvComparison {
  options: EvOption[];
}

export type MistakeKind =
  | "overfold"
  | "overcall"
  | "passive-call"
  | "missed-bet"
  | "overaggression"
  | "sizing";

/** Ce que le moteur a retenu d'un spot : sert à la review et à l'IA. */
export interface SpotInsight {
  kind: MistakeKind | "correct";
  street: Street;
  heroPosition: string;
  equityPct: number;
  /** Équité minimale pour payer, en %. Absent si on ne paie rien. */
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

export interface ReplayHand {
  id: string;
  label: string;
  blindsBb: { small: number; big: number };
  /** Ante par joueur, en bb. */
  anteBb?: number;
  players: ReplayPlayer[];
  actions: HandAction[];
  boards: StreetBoard[];
  coachTips?: Record<number, CoachTip>;
  evComparisons?: Record<number, EvComparison>;
  /** Vrai quand le moteur a analysé cette main : pas de repli sur de fausses analyses. */
  analyzed?: boolean;
  spots?: Record<number, SpotInsight>;
}

export interface Leak {
  id: string;
  category: string;
  description: string;
  detail: string;
  /** Pertes d'EV par 100 mains, en bb. */
  costBb100: number;
  occurrences: number;
  totalLossBb: number;
  severity: "critical" | "major" | "minor";
  sampleHandIds: string[];
}

export interface AnalysisSummary {
  handsAnalyzed: number;
  spotsAnalyzed: number;
  mistakes: number;
  totalLossBb: number;
  analyzedAt: string;
  engine: string;
}

export interface TournamentAnalysis {
  version: number;
  tournamentId: string;
  hands: ReplayHand[];
  leaks: Leak[];
  summary: AnalysisSummary;
}

export interface AnalyzeOptions {
  /** Nombre de tirages par calcul d'équité. */
  samples?: number;
}
