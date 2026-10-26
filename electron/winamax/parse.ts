import { existsSync } from "fs";
import path from "path";
import { WorkerPool } from "../analysis/pool";
import type { IngestStats } from "../ingest/dataset";
import { getDatasetDir, updateSyncMeta } from "./store";

export interface ParseResult {
  ok: boolean;
  stats?: IngestStats;
  error?: string;
  unavailable?: string[];
}

/**
 * Le worker compilé se trouve à côté de ce fichier : electron-dist/analysis/worker.js.
 * Dans l'installeur, il est hors de l'archive asar, sinon Node ne peut pas le lancer.
 */
export function workerFilePath(): string {
  const packed = path.join(__dirname, "..", "analysis", "worker.js");
  const unpacked = packed.replace("app.asar", "app.asar.unpacked");
  return unpacked !== packed && existsSync(unpacked) ? unpacked : packed;
}

/**
 * Lit les fichiers d'historique d'un dossier et met à jour le jeu de données local.
 * Le travail se fait dans un worker pour ne pas figer la fenêtre.
 */
export async function parseExportDir(extractDir: string, sourceHost: string): Promise<ParseResult> {
  const pool = new WorkerPool(workerFilePath(), 1);
  try {
    const stats = await pool.run<IngestStats>({
      kind: "ingest",
      srcDir: extractDir,
      datasetDir: getDatasetDir(),
    });

    const unavailable: string[] = [];
    if (stats.filesSummary === 0) {
      unavailable.push("Résumés de tournois absents : place, gains et ROI par tournoi incomplets.");
    }
    if (stats.handsTotal === 0) {
      unavailable.push(
        "Aucune main de tournoi lisible. Seuls les tournois Winamax (anglais) sont lus pour l'instant ; le cash game n'est pas géré.",
      );
    }
    updateSyncMeta({
      status: "ready",
      lastSyncAt: new Date().toISOString(),
      lastSourceUrlHost: sourceHost,
      lastError: null,
      tournamentsSynced: stats.tournamentsTotal,
      handsSynced: stats.handsTotal,
    });
    return { ok: true, stats, unavailable };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    updateSyncMeta({ status: "error", lastError: error });
    return { ok: false, error };
  } finally {
    await pool.close();
  }
}
