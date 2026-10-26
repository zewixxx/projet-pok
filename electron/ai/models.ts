/**
 * Choix et téléchargement du modèle de langage local (format GGUF).
 * Rien n'est téléchargé sans une action explicite de l'utilisateur.
 */

import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export interface ModelSpec {
  id: string;
  label: string;
  file: string;
  url: string;
  sizeMb: number;
  /** Mémoire vive totale minimale conseillée. */
  minRamGb: number;
}

export const MODELS: ModelSpec[] = [
  {
    id: "qwen2.5-0.5b",
    label: "Qwen2.5 0,5B (très léger)",
    file: "qwen2.5-0.5b-instruct-q4_k_m.gguf",
    url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf",
    sizeMb: 469,
    minRamGb: 0,
  },
  {
    id: "qwen2.5-1.5b",
    label: "Qwen2.5 1,5B (léger)",
    file: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    sizeMb: 1066,
    minRamGb: 6,
  },
  {
    id: "qwen2.5-3b",
    label: "Qwen2.5 3B (équilibré)",
    file: "qwen2.5-3b-instruct-q4_k_m.gguf",
    url: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf",
    sizeMb: 2007,
    minRamGb: 12,
  },
  {
    id: "qwen2.5-7b",
    label: "Qwen2.5 7B (puissant)",
    file: "Qwen2.5-7B-Instruct-Q4_K_M.gguf",
    url: "https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf",
    sizeMb: 4466,
    minRamGb: 18,
  },
];

/** Plus gros modèle qui tient confortablement dans la mémoire de la machine. */
export function recommendModel(totalMemGb: number): ModelSpec {
  const fit = MODELS.filter((m) => totalMemGb >= m.minRamGb);
  return fit[fit.length - 1] ?? MODELS[0];
}

export function findModel(id: string): ModelSpec | undefined {
  return MODELS.find((m) => m.id === id);
}

export function modelPath(dir: string, spec: ModelSpec): string {
  return path.join(dir, spec.file);
}

export function isModelInstalled(dir: string, spec: ModelSpec): boolean {
  const file = modelPath(dir, spec);
  if (!existsSync(file)) return false;
  try {
    // Un fichier plus petit que 90 % de la taille attendue est un téléchargement incomplet.
    return statSync(file).size >= spec.sizeMb * 1024 * 1024 * 0.9;
  } catch {
    return false;
  }
}

export class DownloadCancelled extends Error {
  constructor() {
    super("Téléchargement annulé.");
  }
}

export async function downloadModel(
  dir: string,
  spec: ModelSpec,
  onProgress: (receivedBytes: number, totalBytes: number) => void,
  signal: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  mkdirSync(dir, { recursive: true });
  const final = modelPath(dir, spec);
  const part = `${final}.part`;
  rmSync(part, { force: true });

  const res = await fetchImpl(spec.url, { signal, redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`Téléchargement impossible (HTTP ${res.status}).`);
  const total = Number(res.headers.get("content-length")) || spec.sizeMb * 1024 * 1024;

  let received = 0;
  let lastEmit = 0;
  const source = Readable.fromWeb(res.body as unknown as import("stream/web").ReadableStream<Uint8Array>);
  source.on("data", (chunk: Buffer) => {
    received += chunk.length;
    const now = Date.now();
    if (now - lastEmit > 250) {
      lastEmit = now;
      onProgress(received, total);
    }
  });

  try {
    await pipeline(source, createWriteStream(part), { signal });
  } catch (err) {
    rmSync(part, { force: true });
    if (signal.aborted) throw new DownloadCancelled();
    throw err;
  }

  if (received < spec.sizeMb * 1024 * 1024 * 0.9) {
    rmSync(part, { force: true });
    throw new Error("Téléchargement incomplet. Réessaie.");
  }
  rmSync(final, { force: true });
  renameSync(part, final);
  onProgress(received, total);
  return final;
}
