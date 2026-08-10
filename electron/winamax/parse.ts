import { spawn } from "child_process";
import path from "path";
import { app } from "electron";
import { getDatasetDir, updateSyncMeta } from "./store";

export interface ParseResult {
  ok: boolean;
  stats?: {
    importedAt: string;
    handsTotal: number;
    tournamentsTotal: number;
    sessionsTotal: number;
    totalInvested: number;
    totalProfitNet: number;
    hero: string;
    filesHistory: number;
    filesSummary: number;
  };
  error?: string;
  unavailable?: string[];
}

function scriptPath(): string {
  if (!app.isPackaged) {
    return path.join(app.getAppPath(), "scripts", "import-history.mjs");
  }
  return path.join(process.resourcesPath, "scripts", "import-history.mjs");
}

function runParser(cmd: string, args: string[], env?: NodeJS.ProcessEnv): Promise<ParseResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: app.getAppPath(),
      env: { ...process.env, ...env },
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d: Buffer) => {
      stdout += String(d);
    });
    child.stderr?.on("data", (d: Buffer) => {
      stderr += String(d);
    });
    child.on("error", (err: Error) => resolve({ ok: false, error: err.message }));
    child.on("close", (code: number | null) => {
      if (code !== 0) {
        resolve({ ok: false, error: stderr.trim() || `Parser exit ${code}` });
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as { stats: ParseResult["stats"] };
        resolve({ ok: true, stats: parsed.stats });
      } catch {
        resolve({ ok: false, error: "Réponse parser invalide." });
      }
    });
  });
}

export async function parseExportDir(extractDir: string, sourceHost: string): Promise<ParseResult> {
  const outDir = getDatasetDir();
  const script = scriptPath();
  const args = [script, extractDir, "--out", outDir, "--quiet"];

  // Préférer Electron-as-Node (toujours dispo dans l’app packagée)
  let result = await runParser(process.execPath, args, { ELECTRON_RUN_AS_NODE: "1" });
  if (!result.ok) {
    result = await runParser("node", args);
  }

  const unavailable: string[] = [];
  if (result.ok && result.stats) {
    if ((result.stats.filesSummary ?? 0) === 0) {
      unavailable.push("Résumés de tournois absents : ROI/ITM/profit par tournoi incomplets.");
    }
    if ((result.stats.handsTotal ?? 0) === 0) {
      unavailable.push("Aucune main : détection de leaks action-by-action indisponible.");
    }
    if ((result.stats.sessionsTotal ?? 0) === 0) {
      unavailable.push("Aucune session tournoi : statistiques globales indisponibles.");
    }
    updateSyncMeta({
      status: "ready",
      lastSyncAt: new Date().toISOString(),
      lastSourceUrlHost: sourceHost,
      lastError: null,
      tournamentsSynced: result.stats.tournamentsTotal,
      handsSynced: result.stats.handsTotal,
    });
    return { ...result, unavailable };
  }

  updateSyncMeta({
    status: "error",
    lastError: result.error ?? "Erreur inconnue",
  });
  return result;
}
