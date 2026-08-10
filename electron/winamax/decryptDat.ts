/**
 * Tentatives de déchiffrement d’un export email Winamax (.dat).
 * Format officiel = propriétaire (client Winamax). On tente ZIP/ZipCrypto,
 * AES-ZIP via 7-Zip, et OpenSSL Salted__ — sans jamais persister le MDP.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { createDecipheriv, createHash } from "crypto";
import { gunzipSync, inflateSync } from "zlib";

const execFileAsync = promisify(execFile);

export interface UnlockResult {
  ok: boolean;
  txtCount: number;
  method: string | null;
  magicHex: string;
  message: string;
}

function readMagic(filePath: string, n = 16): Buffer {
  const buf = Buffer.alloc(n);
  const fd = readFileSync(filePath);
  return fd.subarray(0, Math.min(n, fd.length));
}

function walkTxt(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) out.push(...walkTxt(p));
    else if (name.name.toLowerCase().endsWith(".txt")) out.push(p);
  }
  return out;
}

export function countTxt(dir: string): number {
  return walkTxt(dir).length;
}

function looksLikeHandHistory(buf: Buffer): boolean {
  const head = buf.toString("utf8", 0, Math.min(buf.length, 800));
  return /Winamax\s+Poker|Hand\s+#|Dealt\s+to|\*\*\*\s*FLOP/i.test(head);
}

function opensslEvpBytesToKey(
  password: string,
  salt: Buffer,
  keyLen: number,
  ivLen: number,
  digest: "md5" | "sha256" | "sha1",
): { key: Buffer; iv: Buffer } {
  let keyiv = Buffer.alloc(0);
  let prev = Buffer.alloc(0);
  while (keyiv.length < keyLen + ivLen) {
    const h = createHash(digest);
    h.update(prev);
    h.update(Buffer.from(password, "utf8"));
    h.update(salt);
    prev = h.digest();
    keyiv = Buffer.concat([keyiv, prev]);
  }
  return {
    key: keyiv.subarray(0, keyLen),
    iv: keyiv.subarray(keyLen, keyLen + ivLen),
  };
}

function tryWritePlainTxt(destDir: string, data: Buffer, base = "export"): boolean {
  if (!looksLikeHandHistory(data)) return false;
  mkdirSync(destDir, { recursive: true });
  // Un gros blob peut contenir plusieurs HH séparées — on écrit tel quel, le parser découpe.
  writeFileSync(path.join(destDir, `${base}.txt`), data);
  return true;
}

async function tryAdmZip(datPath: string, password: string, destDir: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AdmZip = require("adm-zip") as typeof import("adm-zip");
    const zip = new AdmZip(datPath);
    zip.extractAllTo(destDir, true, false, password);
    if (countTxt(destDir) > 0) return true;
    // Parfois le zip contient des .txt sans extension ou un seul fichier
    const entries = zip.getEntries();
    for (const e of entries) {
      if (e.isDirectory) continue;
      const data = e.getData();
      if (looksLikeHandHistory(data)) {
        const name = e.entryName.replace(/[\\/]/g, "_");
        writeFileSync(path.join(destDir, name.endsWith(".txt") ? name : `${name}.txt`), data);
      }
    }
    return countTxt(destDir) > 0;
  } catch {
    return false;
  }
}

async function try7z(datPath: string, password: string, destDir: string): Promise<boolean> {
  const bins = process.platform === "win32" ? ["7z", "7za", "7z.exe"] : ["7z", "7za"];
  for (const bin of bins) {
    try {
      await execFileAsync(bin, ["x", `-p${password}`, `-o${destDir}`, datPath, "-y"], {
        windowsHide: true,
        timeout: 120_000,
      });
      if (countTxt(destDir) > 0) return true;
      // Chercher du texte Winamax dans les fichiers extraits (sans .txt)
      for (const name of readdirSync(destDir, { withFileTypes: true })) {
        if (!name.isFile()) continue;
        const p = path.join(destDir, name.name);
        try {
          const data = readFileSync(p);
          if (looksLikeHandHistory(data) && !name.name.toLowerCase().endsWith(".txt")) {
            writeFileSync(`${p}.txt`, data);
          }
        } catch {
          /* */
        }
      }
      if (countTxt(destDir) > 0) return true;
    } catch {
      /* next bin */
    }
  }
  return false;
}

function tryOpenSslSalted(datPath: string, password: string, destDir: string): boolean {
  const buf = readFileSync(datPath);
  if (buf.toString("ascii", 0, 8) !== "Salted__") return false;
  const salt = buf.subarray(8, 16);
  const enc = buf.subarray(16);
  for (const digest of ["md5", "sha256", "sha1"] as const) {
    for (const [algo, keyLen, ivLen] of [
      ["aes-256-cbc", 32, 16],
      ["aes-128-cbc", 16, 16],
      ["aes-256-cfb", 32, 16],
    ] as const) {
      try {
        const { key, iv } = opensslEvpBytesToKey(password, salt, keyLen, ivLen, digest);
        const d = createDecipheriv(algo, key, iv);
        const out = Buffer.concat([d.update(enc), d.final()]);
        if (tryWritePlainTxt(destDir, out, `openssl_${algo}_${digest}`)) return true;
        // Peut-être gzip après decrypt
        try {
          const gz = gunzipSync(out);
          if (tryWritePlainTxt(destDir, gz, `openssl_gz_${algo}`)) return true;
        } catch {
          /* */
        }
        try {
          const inf = inflateSync(out);
          if (tryWritePlainTxt(destDir, inf, `openssl_inf_${algo}`)) return true;
        } catch {
          /* */
        }
      } catch {
        /* bad pad / wrong key */
      }
    }
  }
  return false;
}

function tryRawAesSha256(datPath: string, password: string, destDir: string): boolean {
  const buf = readFileSync(datPath);
  const key = createHash("sha256").update(password).digest();
  for (const skip of [0, 8, 16, 32]) {
    const slice = buf.subarray(skip);
    if (slice.length < 32 || slice.length % 16 !== 0) continue;
    for (const iv of [Buffer.alloc(16, 0), createHash("md5").update(password).digest()]) {
      try {
        const d = createDecipheriv("aes-256-cbc", key, iv);
        const out = Buffer.concat([d.update(slice), d.final()]);
        if (tryWritePlainTxt(destDir, out, `aes_skip${skip}`)) return true;
        try {
          const gz = gunzipSync(out);
          if (tryWritePlainTxt(destDir, gz, `aes_gz_skip${skip}`)) return true;
        } catch {
          /* */
        }
      } catch {
        /* */
      }
    }
  }
  return false;
}

function tryCompressionSkips(datPath: string, destDir: string): boolean {
  const buf = readFileSync(datPath);
  for (const skip of [0, 4, 8, 12, 16, 32]) {
    for (const [label, fn] of [
      ["gunzip", gunzipSync],
      ["inflate", inflateSync],
    ] as const) {
      try {
        const out = fn(buf.subarray(skip));
        if (tryWritePlainTxt(destDir, out, `${label}_skip${skip}`)) return true;
      } catch {
        /* */
      }
    }
  }
  return false;
}

function clearDir(dir: string): void {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

/**
 * Tente de produire des .txt Winamax dans destDir.
 * Ne persiste jamais le mot de passe.
 */
export async function unlockWinamaxDat(
  datPath: string,
  password: string,
  destDir: string,
): Promise<UnlockResult> {
  const pwd = password.trim();
  if (!existsSync(datPath)) {
    return {
      ok: false,
      txtCount: 0,
      method: null,
      magicHex: "",
      message: "Fichier .dat introuvable.",
    };
  }
  if (!pwd) {
    return {
      ok: false,
      txtCount: 0,
      method: null,
      magicHex: readMagic(datPath).toString("hex"),
      message: "Mot de passe email requis.",
    };
  }

  clearDir(destDir);
  const magic = readMagic(datPath);
  const magicHex = magic.toString("hex");
  const isZip = magic[0] === 0x50 && magic[1] === 0x4b;
  const isGzip = magic[0] === 0x1f && magic[1] === 0x8b;
  const isSalted = magic.toString("ascii", 0, 8) === "Salted__";

  const attempts: Array<[string, () => Promise<boolean> | boolean]> = [
    ["adm-zip", () => tryAdmZip(datPath, pwd, destDir)],
    ["7z", () => try7z(datPath, pwd, destDir)],
    ["openssl-salted", () => tryOpenSslSalted(datPath, pwd, destDir)],
    ["aes-sha256", () => tryRawAesSha256(datPath, pwd, destDir)],
    ["compression", () => tryCompressionSkips(datPath, destDir)],
  ];

  // Copie .zip temporaire pour outils qui exigent l’extension
  const zipAlias = path.join(path.dirname(destDir), "export-try.zip");
  try {
    copyFileSync(datPath, zipAlias);
    attempts.splice(1, 0, ["adm-zip-as-zip", () => tryAdmZip(zipAlias, pwd, destDir)]);
    attempts.splice(2, 0, ["7z-as-zip", () => try7z(zipAlias, pwd, destDir)]);
  } catch {
    /* */
  }

  for (const [method, fn] of attempts) {
    clearDir(destDir);
    try {
      const ok = await fn();
      if (ok) {
        const txtCount = countTxt(destDir);
        return {
          ok: true,
          txtCount,
          method,
          magicHex,
          message: `Déchiffré via ${method} (${txtCount} fichiers .txt).`,
        };
      }
    } catch {
      /* next */
    }
  }

  const hint = isZip
    ? "ZIP détecté mais mot de passe refusé (ou chiffrement AES non supporté sans 7-Zip)."
    : isGzip
      ? "GZIP détecté mais contenu illisible sans clé."
      : isSalted
        ? "En-tête OpenSSL Salted__ détecté — clé incorrecte ou cipher inconnu."
        : "Format propriétaire Winamax (pas un ZIP standard).";

  return {
    ok: false,
    txtCount: 0,
    method: null,
    magicHex,
    message: `${hint} Magic=${magicHex}. Importe le .dat dans le client Winamax (Outils → Import des mains) avec ce mot de passe.`,
  };
}
