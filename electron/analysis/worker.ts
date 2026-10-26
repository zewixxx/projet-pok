/**
 * Worker : exécute les calculs lourds hors du thread principal.
 * Compilé en electron-dist/analysis/worker.js et lancé par pool.ts.
 */

import { parentPort } from "worker_threads";
import { ingestDirectory } from "../ingest/dataset";
import { analyzeHand } from "./analyzeHand";
import type { ReplayHand } from "./types";

export type WorkerRequest =
  | { id: number; kind: "analyze"; hands: ReplayHand[]; samples?: number }
  | { id: number; kind: "ingest"; srcDir: string; datasetDir: string };

export type WorkerResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string };

if (parentPort) {
  const port = parentPort;
  port.on("message", (msg: WorkerRequest) => {
    try {
      if (msg.kind === "analyze") {
        const hands = msg.hands.map((h) => analyzeHand(h, { samples: msg.samples }));
        port.postMessage({ id: msg.id, ok: true, result: hands } satisfies WorkerResponse);
      } else if (msg.kind === "ingest") {
        const stats = ingestDirectory(msg.srcDir, msg.datasetDir);
        port.postMessage({ id: msg.id, ok: true, result: stats } satisfies WorkerResponse);
      }
    } catch (err) {
      port.postMessage({
        id: msg.id,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      } satisfies WorkerResponse);
    }
  });
}
