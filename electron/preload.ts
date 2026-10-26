import { contextBridge, ipcRenderer } from "electron";

export interface WinamaxPublicProfile {
  pseudo: string;
  updatedAt: string;
}

export interface WinamaxSyncMeta {
  lastSyncAt: string | null;
  lastSourceUrlHost: string | null;
  lastError: string | null;
  tournamentsSynced: number;
  handsSynced: number;
  status: "idle" | "ready" | "error";
  pendingDatPath: string | null;
  pendingDatAt: string | null;
}

export interface WinamaxStatus {
  profile: WinamaxPublicProfile | null;
  sync: WinamaxSyncMeta;
  hasDataset: boolean;
  dataset: { sizeBytes: number; files: number };
  isElectron: boolean;
}

const api = {
  winamax: {
    getStatus: (): Promise<WinamaxStatus> => ipcRenderer.invoke("winamax:get-status"),
    connect: (pseudo: string) => ipcRenderer.invoke("winamax:connect", pseudo),
    disconnect: () => ipcRenderer.invoke("winamax:disconnect"),
    validateUrl: (url: string, allowNonWinamax?: boolean) =>
      ipcRenderer.invoke("winamax:validate-url", url, allowNonWinamax),
    syncFromUrl: (url: string, allowNonWinamax?: boolean, password?: string) =>
      ipcRenderer.invoke("winamax:sync-from-url", { url, allowNonWinamax, password }),
    unlockLocalDat: (password: string, filePath?: string) =>
      ipcRenderer.invoke("winamax:unlock-local-dat", { password, filePath }),
    importHistoryDir: () => ipcRenderer.invoke("winamax:import-history-dir"),
    scanHistories: () => ipcRenderer.invoke("winamax:scan-histories"),
    importScanned: () => ipcRenderer.invoke("winamax:import-scanned"),
    copyPassword: (password: string) => ipcRenderer.invoke("winamax:copy-password", password),
    revealDat: () => ipcRenderer.invoke("winamax:reveal-dat"),
    ingestAfterImport: () => ipcRenderer.invoke("winamax:ingest-after-import"),
    getDataset: () => ipcRenderer.invoke("winamax:get-dataset"),
    openExternal: (url: string) => ipcRenderer.invoke("winamax:open-external", url),
  },
  ai: {
    getSettings: () => ipcRenderer.invoke("ai:get-settings"),
    setSettings: (settings: { powerPercent: number; autoAnalyze: boolean; llmEnabled: boolean }) =>
      ipcRenderer.invoke("ai:set-settings", settings),
    llmStatus: () => ipcRenderer.invoke("llm:status"),
    llmDownload: (modelId?: string) => ipcRenderer.invoke("llm:download", modelId),
    llmCancelDownload: () => ipcRenderer.invoke("llm:cancel-download"),
    llmRemove: () => ipcRenderer.invoke("llm:remove"),
    onLlmProgress: (cb: (p: unknown) => void) => subscribe("llm:download-progress", cb),
    onLlmDone: (cb: (p: unknown) => void) => subscribe("llm:download-done", cb),
    onLlmError: (cb: (p: unknown) => void) => subscribe("llm:download-error", cb),
    getHardware: () => ipcRenderer.invoke("ai:get-hardware"),
    listTournaments: () => ipcRenderer.invoke("data:list-tournaments"),
    getTournament: (id: string) => ipcRenderer.invoke("data:get-tournament", id),
    startAnalysis: (id: string) => ipcRenderer.invoke("analysis:start", id),
    cancelAnalysis: () => ipcRenderer.invoke("analysis:cancel"),
    currentAnalysis: () => ipcRenderer.invoke("analysis:current"),
    allLeaks: () => ipcRenderer.invoke("analysis:all-leaks"),
    onProgress: (cb: (p: unknown) => void) => subscribe("analysis:progress", cb),
    onDone: (cb: (p: unknown) => void) => subscribe("analysis:done", cb),
    onError: (cb: (p: unknown) => void) => subscribe("analysis:error", cb),
  },
};

function subscribe(channel: string, cb: (payload: unknown) => void): () => void {
  const listener = (_event: unknown, payload: unknown) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

contextBridge.exposeInMainWorld("projetPok", api);

export type ProjetPokApi = typeof api;
