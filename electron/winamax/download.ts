import {
  createWriteStream,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  closeSync,
  renameSync,
  readdirSync,
  statSync,
  copyFileSync,
} from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { getDownloadsDir, hashUrl, updateSyncMeta } from "./store";
import { countTxt, unlockWinamaxDat } from "./decryptDat";

const execFileAsync = promisify(execFile);
const WINAMAX_HOST_RE = /(^|\.)winamax\.fr$/i;

export type DownloadKind = "txt" | "zip" | "dat" | "unknown";

export interface DownloadResult {
  kind: DownloadKind;
  extractDir: string | null;
  datPath: string | null;
  host: string;
  isWinamaxHost: boolean;
  txtCount: number;
  bytes: number;
  message?: string;
  /** true = .dat reçu, déchiffrement Winamax encore requis */
  needsWinamaxImport?: boolean;
}

export function parseAndValidateUrl(
  raw: string,
  opts?: { allowNonWinamax?: boolean },
): { url: URL; isWinamaxHost: boolean } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("URL invalide. Colle le lien reçu dans l’email Winamax.");
  }
  if (url.protocol !== "https:") {
    throw new Error("Seules les URLs HTTPS sont acceptées.");
  }
  const host = url.hostname.toLowerCase();
  const isWinamaxHost = WINAMAX_HOST_RE.test(host);
  if (!isWinamaxHost && !opts?.allowNonWinamax) {
    throw new Error(
      `Hôte non-Winamax détecté (${host}). Coche « autoriser CDN » si besoin.`,
    );
  }
  return { url, isWinamaxHost };
}

/** Liens email Winamax = archive .dat chiffrée (pas du .txt). */
export function isEncryptedDatUrl(url: URL): boolean {
  const pathLower = url.pathname.toLowerCase();
  const host = url.hostname.toLowerCase();
  if (pathLower.endsWith(".dat")) return true;
  if (host === "dl.winamax.fr" || host.endsWith(".dl.winamax.fr")) return true;
  if (host.endsWith("winamax.fr") && /\/hh\//i.test(pathLower)) return true;
  return false;
}

async function downloadToFile(url: URL, dest: string): Promise<number> {
  const res = await fetch(url.toString(), {
    redirect: "follow",
    headers: {
      "User-Agent": "Projet-pok-WinamaxAnalyzer/0.1",
      Accept: "*/*",
    },
  });
  if (!res.ok) {
    throw new Error(`Téléchargement refusé (HTTP ${res.status}). Le lien a peut-être expiré.`);
  }
  if (!res.body) {
    throw new Error("Réponse vide — le lien a peut-être expiré.");
  }
  const fileStream = createWriteStream(dest);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeReadable = Readable.fromWeb(res.body as any);
  await pipeline(nodeReadable, fileStream);
  return statSync(dest).size;
}

function readMagic(filePath: string): Buffer {
  const buf = Buffer.alloc(8);
  const fd = openSync(filePath, "r");
  readSync(fd, buf, 0, 8, 0);
  closeSync(fd);
  return buf;
}

function sniffKind(filePath: string, sourceUrl: URL): DownloadKind {
  if (isEncryptedDatUrl(sourceUrl)) return "dat";

  const buf = readMagic(filePath);
  if (buf[0] === 0x50 && buf[1] === 0x4b) return "zip";
  const asText = buf.toString("utf8");
  if (asText.startsWith("Winamax") || asText.startsWith("\uFEFFWinamax") || asText.includes("Poker")) {
    return "txt";
  }
  return "unknown";
}

async function extractZip(archivePath: string, destDir: string): Promise<void> {
  if (process.platform === "win32") {
    await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${archivePath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`,
    ]);
    return;
  }
  await execFileAsync("unzip", ["-o", archivePath, "-d", destDir]);
}

/** Tente d’ouvrir le .dat avec le mot de passe email (plusieurs stratégies). */
async function tryUnlockDatWithPassword(
  datPath: string,
  password: string,
  destDir: string,
): Promise<boolean> {
  const result = await unlockWinamaxDat(datPath, password, destDir);
  return result.ok && result.txtCount > 0;
}

function flattenTxtFiles(root: string): void {
  const collected: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, name.name);
      if (name.isDirectory()) walk(p);
      else if (name.name.toLowerCase().endsWith(".txt")) collected.push(p);
    }
  };
  walk(root);
  for (const file of collected) {
    const base = path.basename(file);
    const dest = path.join(root, base);
    if (path.resolve(file) === path.resolve(dest)) continue;
    let unique = dest;
    let i = 1;
    while (existsSync(unique)) {
      const parsed = path.parse(base);
      unique = path.join(root, `${parsed.name}_${i}${parsed.ext}`);
      i += 1;
    }
    renameSync(file, unique);
  }
}

function markPendingDat(datPath: string, host: string): void {
  updateSyncMeta({
    status: "idle",
    lastError: null,
    lastSourceUrlHost: host,
    pendingDatPath: datPath,
    pendingDatAt: new Date().toISOString(),
  });
}

/** Import d’un .dat déjà téléchargé (chemin local + MDP email). */
export async function unlockLocalWinamaxDat(
  datPath: string,
  password: string,
): Promise<DownloadResult> {
  const pwd = password.trim();
  if (!datPath || !existsSync(datPath)) {
    throw new Error("Fichier .dat introuvable.");
  }
  if (!pwd) {
    throw new Error("Mot de passe de l’email requis.");
  }

  const id = hashUrl(`local://${path.resolve(datPath)}`);
  const batchDir = path.join(getDownloadsDir(), id);
  const extractDir = path.join(batchDir, "extracted");
  mkdirSync(batchDir, { recursive: true });

  const storedDat = path.join(batchDir, "export.dat");
  try {
    copyFileSync(datPath, storedDat);
  } catch {
    /* already there */
  }

  const unlocked = await unlockWinamaxDat(storedDat, pwd, extractDir);
  if (unlocked.ok) {
    flattenTxtFiles(extractDir);
    const txtCount = countTxt(extractDir);
    updateSyncMeta({
      pendingDatPath: null,
      pendingDatAt: null,
      lastSourceUrlHost: "local-dat",
    });
    return {
      kind: "zip",
      extractDir,
      datPath: storedDat,
      host: "local-dat",
      isWinamaxHost: true,
      txtCount,
      bytes: statSync(storedDat).size,
      needsWinamaxImport: false,
      message: unlocked.message,
    };
  }

  markPendingDat(storedDat, "local-dat");
  return {
    kind: "dat",
    extractDir: null,
    datPath: storedDat,
    host: "local-dat",
    isWinamaxHost: true,
    txtCount: 0,
    bytes: statSync(storedDat).size,
    needsWinamaxImport: true,
    message: unlocked.message,
  };
}

export async function downloadWinamaxExport(
  rawUrl: string,
  opts?: { allowNonWinamax?: boolean; password?: string },
): Promise<DownloadResult> {
  const { url, isWinamaxHost } = parseAndValidateUrl(rawUrl, opts);
  const password = (opts?.password ?? "").trim();
  const id = hashUrl(url.toString());
  const batchDir = path.join(getDownloadsDir(), id);
  const extractDir = path.join(batchDir, "extracted");
  mkdirSync(extractDir, { recursive: true });

  const rawPath = path.join(batchDir, "download.bin");
  const bytes = await downloadToFile(url, rawPath);

  // Priorité absolue : URL .dat / dl.winamax.fr → jamais traiter comme .txt brut
  const forcedDat = isEncryptedDatUrl(url);
  const kind = forcedDat ? "dat" : sniffKind(rawPath, url);

  if (kind === "dat") {
    const datPath = path.join(batchDir, "export.dat");
    try {
      renameSync(rawPath, datPath);
    } catch {
      copyFileSync(rawPath, datPath);
    }

    if (password) {
      const unlock = await unlockWinamaxDat(datPath, password, extractDir);
      if (unlock.ok) {
        flattenTxtFiles(extractDir);
        const txtCount = countTxt(extractDir);
        updateSyncMeta({
          pendingDatPath: null,
          pendingDatAt: null,
          lastSourceUrlHost: url.hostname,
        });
        return {
          kind: "zip",
          extractDir,
          datPath,
          host: url.hostname,
          isWinamaxHost,
          txtCount,
          bytes,
          needsWinamaxImport: false,
          message: unlock.message,
        };
      }
      markPendingDat(datPath, url.hostname);
      return {
        kind: "dat",
        extractDir: null,
        datPath,
        host: url.hostname,
        isWinamaxHost,
        txtCount: 0,
        bytes,
        needsWinamaxImport: true,
        message: unlock.message,
      };
    }

    markPendingDat(datPath, url.hostname);
    return {
      kind: "dat",
      extractDir: null,
      datPath,
      host: url.hostname,
      isWinamaxHost,
      txtCount: 0,
      bytes,
      needsWinamaxImport: true,
      message:
        "Fichier .dat chiffré téléchargé. Saisis le mot de passe de l’email Winamax, ou importe le .dat dans le client Winamax puis analyse.",
    };
  }

  if (kind === "zip" || kind === "unknown") {
    const zipPath = path.join(batchDir, "export.zip");
    try {
      if (rawPath !== zipPath) renameSync(rawPath, zipPath);
    } catch {
      copyFileSync(rawPath, zipPath);
    }
    try {
      if (password) {
        const ok = await tryUnlockDatWithPassword(zipPath, password, extractDir);
        if (!ok) await extractZip(zipPath, extractDir);
      } else {
        await extractZip(zipPath, extractDir);
      }
    } catch (err) {
      // Si ça ressemble à un export Winamax raté, basculer en flux .dat
      const datPath = path.join(batchDir, "export.dat");
      try {
        copyFileSync(zipPath, datPath);
      } catch {
        /* ignore */
      }
      markPendingDat(datPath, url.hostname);
      return {
        kind: "dat",
        extractDir: null,
        datPath,
        host: url.hostname,
        isWinamaxHost,
        txtCount: 0,
        bytes,
        needsWinamaxImport: true,
        message:
          "Archive non lisible directement. Utilise le mot de passe email dans Winamax (Outils → Import des mains).",
      };
    }
  } else {
    renameSync(rawPath, path.join(extractDir, "export.txt"));
  }

  flattenTxtFiles(extractDir);
  const txtCount = countTxt(extractDir);
  if (txtCount === 0) {
    const datPath = path.join(batchDir, "export.dat");
    markPendingDat(existsSync(datPath) ? datPath : rawPath, url.hostname);
    throw new Error(
      "Aucune hand history (.txt) lisible. Les exports email sont des .dat chiffrés : entre le mot de passe de l’email, ou importe le fichier dans le client Winamax.",
    );
  }

  updateSyncMeta({
    pendingDatPath: null,
    pendingDatAt: null,
    lastSourceUrlHost: url.hostname,
  });

  return {
    kind: kind === "zip" ? "zip" : "txt",
    extractDir,
    datPath: null,
    host: url.hostname,
    isWinamaxHost,
    txtCount,
    bytes,
    needsWinamaxImport: false,
  };
}
