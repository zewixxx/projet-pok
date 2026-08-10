/**
 * Tournois réels importés depuis history/ via scripts/import-history.mjs
 */

import type { Tournament } from "../tournament.types";
import { REAL_TOURNAMENTS, type ImportedTournament } from "../../import";

const FALLBACK: ImportedTournament[] = [{
  id: "demo",
  name: "Aucune donnée — lancez : node scripts/import-history.mjs",
  dateIso: new Date().toISOString().slice(0, 10),
  handsCount: 0,
  place: 0,
  totalPlayers: 0,
  buyInEuros: 0,
  handIds: [],
  fileKey: "demo",
}];

export const MOCK_TOURNAMENTS: Tournament[] =
  REAL_TOURNAMENTS.length > 0 ? REAL_TOURNAMENTS : FALLBACK;
