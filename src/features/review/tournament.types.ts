export type PlaceCategory = "win" | "podium" | "ft" | "itm" | "bust";

export interface Tournament {
  id: string;
  name: string;
  dateIso: string;
  handsCount: number;
  place: number;
  totalPlayers: number;
  buyInEuros: number;
  prizeEuros?: number;
  /** IDs of the ReplayHand entries belonging to this tournament */
  handIds: string[];
  /** Renseigné pour les tournois réels : le moteur a déjà analysé ce tournoi. */
  analyzed?: boolean;
  mistakes?: number;
}

export function getPlaceCategory(place: number, totalPlayers: number): PlaceCategory {
  if (place === 1) return "win";
  if (place <= 3) return "podium";
  if (place <= 9) return "ft";
  if (place <= Math.ceil(totalPlayers * 0.15)) return "itm";
  return "bust";
}
