import { createHash, randomBytes, scryptSync } from "crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "fs";
import path from "path";
import { app } from "electron";

export interface WinamaxProfile {
  /** Pseudo Winamax affiché — jamais un mot de passe */
  pseudo: string;
  /** Hash du jeton local app (pas le MDP Winamax) */
  localTokenHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncMeta {
  lastSyncAt: string | null;
  lastSourceUrlHost: string | null;
  lastError: string | null;
  tournamentsSynced: number;
  handsSynced: number;
  status: "idle" | "ready" | "error";
  /** Chemin du dernier .dat téléchargé (chiffré Winamax) — jamais un mot de passe */
  pendingDatPath: string | null;
  pendingDatAt: string | null;
}

export interface AnalyzerStore {
  profile: WinamaxProfile | null;
  sync: SyncMeta;
}

const DEFAULT_SYNC: SyncMeta = {
  lastSyncAt: null,
  lastSourceUrlHost: null,
  lastError: null,
  tournamentsSynced: 0,
  handsSynced: 0,
  status: "idle",
  pendingDatPath: null,
  pendingDatAt: null,
};

export function getAnalyzerRoot(): string {
  const root = path.join(app.getPath("userData"), "winamax-analyzer");
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  return root;
}

export function getDownloadsDir(): string {
  const dir = path.join(getAnalyzerRoot(), "downloads");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDatasetDir(): string {
  const dir = path.join(getAnalyzerRoot(), "dataset");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function storePath(): string {
  return path.join(getAnalyzerRoot(), "store.json");
}

export function readStore(): AnalyzerStore {
  const p = storePath();
  if (!existsSync(p)) {
    return { profile: null, sync: { ...DEFAULT_SYNC } };
  }
  try {
    return JSON.parse(readFileSync(p, "utf8")) as AnalyzerStore;
  } catch {
    return { profile: null, sync: { ...DEFAULT_SYNC } };
  }
}

export function writeStore(store: AnalyzerStore): void {
  writeFileSync(storePath(), JSON.stringify(store, null, 2), "utf8");
}

/** Crée un compte local app (pseudo seulement — aucun MDP Winamax). */
export function connectProfile(pseudo: string): AnalyzerStore {
  const clean = pseudo.trim();
  if (!clean || clean.length < 2) {
    throw new Error("Pseudo Winamax invalide (min. 2 caractères).");
  }
  const salt = randomBytes(16).toString("hex");
  const localToken = randomBytes(32).toString("hex");
  const localTokenHash = scryptSync(localToken, salt, 32).toString("hex");
  const now = new Date().toISOString();
  const store = readStore();
  store.profile = {
    pseudo: clean,
    localTokenHash,
    salt,
    createdAt: store.profile?.createdAt ?? now,
    updatedAt: now,
  };
  writeStore(store);
  return store;
}

export function disconnectProfile(): AnalyzerStore {
  const store = readStore();
  store.profile = null;
  store.sync = { ...DEFAULT_SYNC };
  writeStore(store);
  return store;
}

export function updateSyncMeta(partial: Partial<SyncMeta>): AnalyzerStore {
  const store = readStore();
  store.sync = { ...store.sync, ...partial };
  writeStore(store);
  return store;
}

export function datasetExists(): boolean {
  return existsSync(path.join(getDatasetDir(), "realData.json"));
}

export function readDataset(): unknown | null {
  const file = path.join(getDatasetDir(), "realData.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

export function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

export function getDatasetStats(): { sizeBytes: number; files: number } {
  const dir = getDatasetDir();
  if (!existsSync(dir)) return { sizeBytes: 0, files: 0 };
  let sizeBytes = 0;
  let files = 0;
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = path.join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else {
        files++;
        sizeBytes += st.size;
      }
    }
  };
  walk(dir);
  return { sizeBytes, files };
}
