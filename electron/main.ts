import { app, BrowserWindow, clipboard, dialog, ipcMain, shell, type IpcMainInvokeEvent } from "electron";
import path from "path";
import {
  connectProfile,
  disconnectProfile,
  readDataset,
  readStore,
  datasetExists,
  getDatasetStats,
  updateSyncMeta,
} from "./winamax/store";
import {
  downloadWinamaxExport,
  parseAndValidateUrl,
  unlockLocalWinamaxDat,
} from "./winamax/download";
import { parseExportDir } from "./winamax/parse";
import { ingestFromWinamaxHistory } from "./winamax/historyIngest";

const isDev = !app.isPackaged;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Projet-pok",
    backgroundColor: "#0b1020",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: "deny" };
  });
}

function registerWinamaxIpc(): void {
  ipcMain.handle("winamax:get-status", () => {
    const store = readStore();
    return {
      profile: store.profile
        ? { pseudo: store.profile.pseudo, updatedAt: store.profile.updatedAt }
        : null,
      sync: store.sync,
      hasDataset: datasetExists(),
      dataset: getDatasetStats(),
      isElectron: true,
    };
  });

  ipcMain.handle("winamax:connect", (_e: IpcMainInvokeEvent, pseudo: string) => {
    try {
      const store = connectProfile(String(pseudo ?? ""));
      return {
        ok: true,
        profile: { pseudo: store.profile!.pseudo, updatedAt: store.profile!.updatedAt },
      };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle("winamax:disconnect", () => {
    disconnectProfile();
    return { ok: true };
  });

  ipcMain.handle(
    "winamax:validate-url",
    (_e: IpcMainInvokeEvent, url: string, allowNonWinamax?: boolean) => {
      try {
        const { isWinamaxHost } = parseAndValidateUrl(String(url ?? ""), {
          allowNonWinamax: Boolean(allowNonWinamax),
        });
        return { ok: true, isWinamaxHost };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  );

  ipcMain.handle(
    "winamax:sync-from-url",
    async (
      _e: IpcMainInvokeEvent,
      payload: { url: string; allowNonWinamax?: boolean; password?: string },
    ) => {
      try {
        const dl = await downloadWinamaxExport(payload.url, {
          allowNonWinamax: Boolean(payload.allowNonWinamax),
          password: payload.password,
        });

        if (dl.needsWinamaxImport || dl.kind === "dat") {
          return {
            ok: true,
            needsWinamaxImport: true,
            message: dl.message,
            download: {
              kind: dl.kind,
              txtCount: 0,
              host: dl.host,
              bytes: dl.bytes,
              isWinamaxHost: dl.isWinamaxHost,
              datPath: dl.datPath,
            },
            unavailable: [
              "Le fichier .dat est chiffré par Winamax.",
              "Entre le mot de passe reçu dans l’email, puis importe dans le client Winamax si le déchiffrement automatique échoue.",
            ],
          };
        }

        if (!dl.extractDir) {
          return { ok: false, error: "Téléchargement sans contenu exploitable." };
        }

        const parsed = await parseExportDir(dl.extractDir, dl.host);
        if (!parsed.ok) {
          return {
            ok: false,
            error: parsed.error ?? "Échec du parsing",
            download: { kind: dl.kind, txtCount: dl.txtCount, host: dl.host, bytes: dl.bytes },
          };
        }
        return {
          ok: true,
          needsWinamaxImport: false,
          message: dl.message,
          download: {
            kind: dl.kind,
            txtCount: dl.txtCount,
            host: dl.host,
            bytes: dl.bytes,
            isWinamaxHost: dl.isWinamaxHost,
          },
          stats: parsed.stats,
          unavailable: parsed.unavailable ?? [],
        };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  );

  ipcMain.handle("winamax:reveal-dat", () => {
    const store = readStore();
    const dat = store.sync.pendingDatPath;
    if (!dat) return { ok: false, error: "Aucun .dat en attente." };
    shell.showItemInFolder(dat);
    return { ok: true, datPath: dat };
  });

  ipcMain.handle(
    "winamax:unlock-local-dat",
    async (_e: IpcMainInvokeEvent, payload: { filePath?: string; password?: string }) => {
      try {
        let filePath = String(payload?.filePath ?? "").trim();
        const password = String(payload?.password ?? "").trim();

        if (!filePath) {
          const win = BrowserWindow.getFocusedWindow();
          const dialogOpts = {
            title: "Choisir l’export .dat Winamax",
            filters: [
              { name: "Export Winamax", extensions: ["dat", "zip", "bin"] },
              { name: "Tous les fichiers", extensions: ["*"] },
            ],
            properties: ["openFile" as const],
          };
          const picked = win
            ? await dialog.showOpenDialog(win, dialogOpts)
            : await dialog.showOpenDialog(dialogOpts);
          if (picked.canceled || !picked.filePaths[0]) {
            return { ok: false, error: "Aucun fichier sélectionné." };
          }
          filePath = picked.filePaths[0];
        }

        const dl = await unlockLocalWinamaxDat(filePath, password);
        if (dl.needsWinamaxImport || dl.kind === "dat") {
          return {
            ok: true,
            needsWinamaxImport: true,
            message: dl.message,
            download: {
              kind: dl.kind,
              txtCount: 0,
              host: dl.host,
              bytes: dl.bytes,
              isWinamaxHost: dl.isWinamaxHost,
              datPath: dl.datPath,
            },
            unavailable: [
              "Déchiffrement auto impossible sur ce .dat (format propriétaire Winamax).",
              "Ouvre Winamax → Outils → Import des mains, colle le mot de passe email, puis « Analyser après import ».",
            ],
          };
        }
        if (!dl.extractDir) {
          return { ok: false, error: "Extraction vide." };
        }
        const parsed = await parseExportDir(dl.extractDir, dl.host);
        if (!parsed.ok) {
          return { ok: false, error: parsed.error ?? "Échec du parsing", download: dl };
        }
        return {
          ok: true,
          needsWinamaxImport: false,
          message: dl.message,
          download: {
            kind: dl.kind,
            txtCount: dl.txtCount,
            host: dl.host,
            bytes: dl.bytes,
            isWinamaxHost: dl.isWinamaxHost,
            datPath: dl.datPath,
          },
          stats: parsed.stats,
          unavailable: parsed.unavailable ?? [],
        };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  );

  ipcMain.handle(
    "winamax:import-history-dir",
    async (_e: IpcMainInvokeEvent) => {
      try {
        const win = BrowserWindow.getFocusedWindow();
        const dialogOpts = {
          title: "Choisir un dossier d’historiques .txt Winamax",
          properties: ["openDirectory" as const],
        };
        const picked = win
          ? await dialog.showOpenDialog(win, dialogOpts)
          : await dialog.showOpenDialog(dialogOpts);
        if (picked.canceled || !picked.filePaths[0]) {
          return { ok: false, error: "Aucun dossier sélectionné." };
        }
        const dir = picked.filePaths[0];
        const parsed = await parseExportDir(dir, "local-history");
        if (!parsed.ok) {
          return { ok: false, error: parsed.error ?? "Échec du parsing" };
        }
        updateSyncMeta({ pendingDatPath: null, pendingDatAt: null });
        return {
          ok: true,
          needsWinamaxImport: false,
          message: `Dossier importé : ${dir}`,
          stats: parsed.stats,
          unavailable: parsed.unavailable ?? [],
        };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    },
  );

  ipcMain.handle("winamax:copy-password", (_e: IpcMainInvokeEvent, password: string) => {
    const pwd = String(password ?? "").trim();
    if (!pwd) return { ok: false, error: "Mot de passe vide." };
    clipboard.writeText(pwd);
    return { ok: true };
  });

  ipcMain.handle("winamax:ingest-after-import", async () => {
    try {
      const ingest = ingestFromWinamaxHistory();
      const host = readStore().sync.lastSourceUrlHost ?? "winamax-history";
      const parsed = await parseExportDir(ingest.stagingDir, host);
      if (!parsed.ok) {
        return { ok: false, error: parsed.error ?? "Échec du parsing", ingest };
      }
      updateSyncMeta({ pendingDatPath: null, pendingDatAt: null });
      return {
        ok: true,
        ingest: {
          txtCount: ingest.txtCount,
          sourceDirs: ingest.sourceDirs,
        },
        stats: parsed.stats,
        unavailable: parsed.unavailable ?? [],
      };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle("winamax:get-dataset", () => {
    return readDataset();
  });

  ipcMain.handle("winamax:open-external", (_e: IpcMainInvokeEvent, url: string) => {
    const allowed = ["https://www.winamax.fr", "https://winamax.fr", "https://dl.winamax.fr"];
    const u = String(url ?? "");
    if (!allowed.some((a) => u.startsWith(a))) {
      return { ok: false, error: "URL non autorisée." };
    }
    void shell.openExternal(u);
    return { ok: true };
  });
}

app.whenReady().then(() => {
  registerWinamaxIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
