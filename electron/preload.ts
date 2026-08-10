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
    copyPassword: (password: string) => ipcRenderer.invoke("winamax:copy-password", password),
    revealDat: () => ipcRenderer.invoke("winamax:reveal-dat"),
    ingestAfterImport: () => ipcRenderer.invoke("winamax:ingest-after-import"),
    getDataset: () => ipcRenderer.invoke("winamax:get-dataset"),
    openExternal: (url: string) => ipcRenderer.invoke("winamax:open-external", url),
  },
};

contextBridge.exposeInMainWorld("projetPok", api);

export type ProjetPokApi = typeof api;
