export type PokerPosition = "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB";

export interface ReviewHand {
  handId: string;
  tournamentId: string;
  dateIso: string;
  position: PokerPosition;
  stackBb: number;
  phase: "early" | "middle" | "bubble" | "itm" | "ft";
  tag: string;
  keyAction: "all-in" | "3bet" | "squeeze" | "overbet" | "none";
  /** Legacy : perte EV (≥ 0) */
  evLoss: number;
  /**
   * Impact EV signé (bb) :
   *   négatif = erreur coûteuse (EV−)
   *   positif = beau coup (EV+)
   */
  evImpact: number;
  holeCards?: [string, string];
  summary?: string;
}
