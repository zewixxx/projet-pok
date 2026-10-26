/** Petit pool de worker_threads : une tâche à la fois par worker. */

import { Worker } from "worker_threads";
import type { WorkerRequest, WorkerResponse } from "./worker";

type Distributive<T> = T extends unknown ? Omit<T, "id"> : never;
export type PoolTask = Distributive<WorkerRequest>;

interface Pending {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Array<{ task: PoolTask; pending: Pending }> = [];
  private current = new Map<Worker, { id: number; pending: Pending }>();
  private nextId = 1;
  private closed = false;

  constructor(
    private readonly workerFile: string,
    size: number,
  ) {
    for (let i = 0; i < Math.max(1, size); i += 1) this.spawn();
  }

  get size(): number {
    return this.workers.length;
  }

  private spawn(): void {
    const worker = new Worker(this.workerFile);
    worker.on("message", (msg: WorkerResponse) => {
      const job = this.current.get(worker);
      if (!job || job.id !== msg.id) return;
      this.current.delete(worker);
      if (msg.ok) job.pending.resolve(msg.result);
      else job.pending.reject(new Error(msg.error));
      this.release(worker);
    });
    worker.on("error", (err) => {
      const job = this.current.get(worker);
      if (job) {
        this.current.delete(worker);
        job.pending.reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
    worker.on("exit", () => {
      this.workers = this.workers.filter((w) => w !== worker);
      this.idle = this.idle.filter((w) => w !== worker);
      const job = this.current.get(worker);
      if (job) {
        this.current.delete(worker);
        job.pending.reject(new Error("Le calcul a été interrompu."));
      }
      if (!this.closed && this.workers.length === 0 && this.queue.length > 0) {
        for (const q of this.queue.splice(0)) q.pending.reject(new Error("Aucun worker disponible."));
      }
    });
    this.workers.push(worker);
    this.idle.push(worker);
  }

  private release(worker: Worker): void {
    if (this.closed) return;
    const next = this.queue.shift();
    if (next) this.dispatch(worker, next.task, next.pending);
    else this.idle.push(worker);
  }

  private dispatch(worker: Worker, task: PoolTask, pending: Pending): void {
    const id = this.nextId++;
    this.current.set(worker, { id, pending });
    worker.postMessage({ ...task, id } as WorkerRequest);
  }

  run<T>(task: PoolTask): Promise<T> {
    if (this.closed) return Promise.reject(new Error("Pool fermé."));
    return new Promise<T>((resolve, reject) => {
      const pending: Pending = { resolve: resolve as (v: unknown) => void, reject };
      const worker = this.idle.shift();
      if (worker) this.dispatch(worker, task, pending);
      else this.queue.push({ task, pending });
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const q of this.queue.splice(0)) q.pending.reject(new Error("Analyse annulée."));
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
    this.idle = [];
  }
}
