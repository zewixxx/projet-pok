/**
 * Couche d'import — données réelles générées par scripts/import-history.mjs
 *
 * Mains stockées par tournoi dans ./hands/{fileKey}.json (chargement à la demande).
 */

import type { SessionPoint } from "../dashboard/types";
import type { ReplayHand } from "../review/replay.types";
import type { Tournament } from "../review/tournament.types";
import rawData from "./realData.json";

export interface ImportStats {
  importedAt: string;
  sourceDir: string;
  filesTotal: number;
  filesHistory: number;
  filesSummary: number;
  filesProcessed: number;
  handsTotal: number;
  tournamentsTotal: number;
  sessionsTotal: number;
  totalInvested: number;
  totalProfitNet: number;
  hero: string;
}

/** Tournoi enrichi avec la clé de fichier pour le chargement lazy */
export interface ImportedTournament extends Tournament {
  fileKey: string;
}

interface RawData {
  hero: string;
  sessions: SessionPoint[];
  tournaments: ImportedTournament[];
  stats?: ImportStats;
}

const data = rawData as RawData;

export const REAL_SESSIONS = data.sessions;
export const REAL_TOURNAMENTS = data.tournaments;
export const IMPORT_STATS = data.stats ?? null;

/** Cache en mémoire des mains déjà chargées */
const handCache = new Map<string, ReplayHand[]>();

/** Glob Vite — tous les fichiers hands/*.json disponibles au build */
const handModules = import.meta.glob<{ default: ReplayHand[] }>("./hands/*.json");

/**
 * Charge les mains d'un tournoi (lazy, avec cache).
 * Retourne [] si le fichier n'existe pas encore.
 */
export async function loadTournamentHands(tournament: ImportedTournament): Promise<ReplayHand[]> {
  const key = tournament.fileKey ?? tournament.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  if (handCache.has(key)) return handCache.get(key)!;

  const modPath = `./hands/${key}.json`;
  const loader = handModules[modPath];
  if (!loader) return [];

  const mod = await loader();
  const hands = (Array.isArray(mod) ? mod : (mod as { default: ReplayHand[] }).default) as ReplayHand[];
  handCache.set(key, hands);
  return hands;
}
