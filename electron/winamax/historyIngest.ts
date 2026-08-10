import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "fs";
import path from "path";
import { app } from "electron";
import { getDownloadsDir, readStore } from "./store";

export interface HistoryIngestResult {
  stagingDir: string;
  txtCount: number;
  sourceDirs: string[];
  sinceIso: string;
}

function candidateHistoryRoots(pseudo: string): string[] {
  const home = app.getPath("home");
  const documents = app.getPath("documents");
  const roaming = process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
  const clean = pseudo.trim();
  const variants = [clean, clean.toLowerCase(), clean.toUpperCase()];

  const roots: string[] = [];
  for (const p of variants) {
    roots.push(path.join(documents, "Winamax Poker", "Accounts", p, "History"));
    roots.push(path.join(roaming, "winamax", "documents", "accounts", p, "history"));
  }

  // Clients AIR / beta : wam.*/Local Store/documents/accounts/*/history
  try {
    for (const name of readdirSync(roaming, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const lower = name.name.toLowerCase();
      if (!lower.startsWith("wam") && lower !== "winamax") continue;
      const base = path.join(roaming, name.name);
      const localStore = path.join(base, "Local Store", "documents", "accounts");
      const accounts = path.join(base, "documents", "accounts");
      for (const accountsRoot of [localStore, accounts]) {
        if (!existsSync(accountsRoot)) continue;
        for (const acc of readdirSync(accountsRoot, { withFileTypes: true })) {
          if (!acc.isDirectory()) continue;
          if (clean && acc.name.toLowerCase() !== clean.toLowerCase()) continue;
          roots.push(path.join(accountsRoot, acc.name, "history"));
          roots.push(path.join(accountsRoot, acc.name, "History"));
        }
      }
    }
  } catch {
    /* ignore */
  }

  return [...new Set(roots)];
}

function listRecentTxt(dir: string, sinceMs: number): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...listRecentTxt(p, sinceMs));
      continue;
    }
    if (!ent.name.toLowerCase().endsWith(".txt")) continue;
    try {
      const st = statSync(p);
      if (st.mtimeMs >= sinceMs) out.push(p);
    } catch {
      /* skip */
    }
  }
  return out;
}

/**
 * Après import du .dat dans le client Winamax, les .txt apparaissent dans History.
 * On les collecte automatiquement (sans file picker) vers un staging app.
 */
export function ingestFromWinamaxHistory(opts?: {
  sinceIso?: string | null;
  lookbackHours?: number;
}): HistoryIngestResult {
  const store = readStore();
  const pseudo = store.profile?.pseudo ?? "";
  const sinceIso =
    opts?.sinceIso ??
    store.sync.pendingDatAt ??
    new Date(Date.now() - (opts?.lookbackHours ?? 48) * 3600_000).toISOString();
  const sinceMs = new Date(sinceIso).getTime() - 5 * 60_000; // marge 5 min

  const sourceDirs = candidateHistoryRoots(pseudo).filter((d) => existsSync(d));
  if (sourceDirs.length === 0) {
    throw new Error(
      pseudo
        ? `Aucun dossier History Winamax trouvé pour « ${pseudo} ». Vérifie le pseudo et que l’import .dat dans Winamax a bien réussi.`
        : "Connecte d’abord ton pseudo Winamax.",
    );
  }

  const files = new Map<string, string>();
  for (const dir of sourceDirs) {
    for (const file of listRecentTxt(dir, sinceMs)) {
      files.set(path.basename(file), file);
    }
  }

  if (files.size === 0) {
    throw new Error(
      "Aucun nouveau .txt trouvé après l’import. Dans Winamax : Outils → Import des mains → sélectionne le .dat + mot de passe de l’email, puis réessaie.",
    );
  }

  const stagingDir = path.join(getDownloadsDir(), `history-ingest-${Date.now()}`);
  if (existsSync(stagingDir)) rmSync(stagingDir, { recursive: true });
  mkdirSync(stagingDir, { recursive: true });

  for (const [name, src] of files) {
    copyFileSync(src, path.join(stagingDir, name));
  }

  return {
    stagingDir,
    txtCount: files.size,
    sourceDirs,
    sinceIso,
  };
}
