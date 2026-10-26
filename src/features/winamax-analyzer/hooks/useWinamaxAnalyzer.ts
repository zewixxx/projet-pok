import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyzerDataset, FoundHistorySource } from "../types";
import { buildAnalysisReport } from "../utils/report";

type SyncState = "idle" | "syncing" | "done" | "error";

interface UseWinamaxAnalyzerOptions {
  /** Appelé quand les données importées changent (nouvel import, déchiffrement…). */
  onDatasetChanged?: () => void;
}

export function useWinamaxAnalyzer(options: UseWinamaxAnalyzerOptions = {}) {
  const api = typeof window !== "undefined" ? window.projetPok?.winamax : undefined;
  const isElectron = Boolean(api);
  const onChangedRef = useRef(options.onDatasetChanged);
  onChangedRef.current = options.onDatasetChanged;
  const firstDataset = useRef(true);

  const [loading, setLoading] = useState(true);
  const [pseudo, setPseudo] = useState("");
  const [connectedPseudo, setConnectedPseudo] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState("");
  /** Mot de passe de l’email d’export — jamais persisté */
  const [exportPassword, setExportPassword] = useState("");
  const [allowNonWinamax, setAllowNonWinamax] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [dataset, setDataset] = useState<AnalyzerDataset | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<string | null>(null);
  const [pendingDat, setPendingDat] = useState(false);
  const [pendingDatPath, setPendingDatPath] = useState<string | null>(null);
  const [foundHistories, setFoundHistories] = useState<FoundHistorySource[] | null>(null);
  const [scanState, setScanState] = useState<SyncState>("idle");
  const [scanError, setScanError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!api) {
      // Navigateur : la page d'import explique elle-même qu'il faut l'application de bureau.
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const status = await api.getStatus();
      setConnectedPseudo(status.profile?.pseudo ?? null);
      setPseudo(status.profile?.pseudo ?? "");
      setLastSyncAt(status.sync.lastSyncAt);
      setPendingDat(Boolean(status.sync.pendingDatPath));
      setPendingDatPath(status.sync.pendingDatPath);
      if (status.sync.lastError) setError(status.sync.lastError);
      if (status.hasDataset) {
        const data = await api.getDataset();
        setDataset(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Prévient l'application quand le jeu de données change (hors premier rendu).
  useEffect(() => {
    if (firstDataset.current) {
      firstDataset.current = false;
      return;
    }
    onChangedRef.current?.();
  }, [dataset]);

  const scanHistories = useCallback(async () => {
    if (!api?.scanHistories) return;
    setScanState("syncing");
    setScanError(null);
    try {
      const res = await api.scanHistories();
      if (!res.ok) throw new Error(res.error ?? "Recherche impossible.");
      setFoundHistories(res.found ?? []);
      setScanState("done");
    } catch (err) {
      setScanState("error");
      setScanError(err instanceof Error ? err.message : String(err));
    }
  }, [api]);

  useEffect(() => {
    if (!api?.scanHistories) return;
    void scanHistories();
  }, [api, scanHistories]);

  const connect = async () => {
    if (!api) return;
    setError(null);
    try {
      const res = await api.connect(pseudo);
      if (!res.ok) throw new Error(res.error ?? "Connexion locale impossible.");
      setConnectedPseudo(res.profile?.pseudo ?? pseudo);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const disconnect = async () => {
    if (!api) return;
    await api.disconnect();
    setConnectedPseudo(null);
    setDataset(null);
    setLastSyncAt(null);
    setPendingDat(false);
    setPendingDatPath(null);
    setExportPassword("");
  };

  const openWinamaxHelp = async () => {
    if (!api) {
      window.open("https://www.winamax.fr/account/history.php", "_blank");
      return;
    }
    await api.openExternal("https://www.winamax.fr/account/history.php");
  };

  const applySyncSuccess = async (
    res: {
      needsWinamaxImport?: boolean;
      message?: string;
      unavailable?: string[];
      download?: { datPath?: string | null; txtCount?: number; host?: string };
    },
  ) => {
    setUnavailable(res.unavailable ?? []);
    if (res.needsWinamaxImport) {
      setPendingDat(true);
      setPendingDatPath(res.download?.datPath ?? null);
      setSyncInfo(res.message ?? "Fichier .dat — déchiffrement requis.");
      setSyncState("done");
      return;
    }
    setPendingDat(false);
    setPendingDatPath(null);
    setSyncInfo(res.message ?? "Sync terminée");
    const data = await api!.getDataset();
    setDataset(data);
    setLastSyncAt(new Date().toISOString());
    setSyncState("done");
    setExportPassword("");
  };

  const sync = async () => {
    if (!api) return;
    setSyncState("syncing");
    setError(null);
    setSyncInfo(null);
    setUnavailable([]);
    try {
      const check = await api.validateUrl(exportUrl, allowNonWinamax);
      if (!check.ok) {
        setSyncState("error");
        setError(check.error ?? "URL invalide");
        return;
      }
      const res = await api.syncFromUrl(exportUrl, allowNonWinamax, exportPassword);
      if (!res.ok) {
        setSyncState("error");
        setError(res.error ?? "Sync échouée");
        return;
      }
      await applySyncSuccess(res);
    } catch (err) {
      setSyncState("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const unlockLocalDat = async (filePath?: string) => {
    if (!api) return;
    if (!exportPassword.trim()) {
      setError("Saisis d’abord le mot de passe de l’email.");
      return;
    }
    setSyncState("syncing");
    setError(null);
    setSyncInfo(null);
    setUnavailable([]);
    try {
      const res = await api.unlockLocalDat(exportPassword, filePath);
      if (!res.ok) {
        setSyncState("error");
        setError(res.error ?? "Import local échoué");
        return;
      }
      await applySyncSuccess(res);
    } catch (err) {
      setSyncState("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const importScanned = async () => {
    if (!api?.importScanned) return;
    setSyncState("syncing");
    setError(null);
    setSyncInfo(null);
    try {
      const res = await api.importScanned();
      if (!res.ok) {
        setSyncState("error");
        setError(res.error ?? "Import automatique échoué");
        return;
      }
      setUnavailable(res.unavailable ?? []);
      setPendingDat(false);
      setSyncInfo(res.message ?? "Historiques importés");
      const data = await api.getDataset();
      setDataset(data);
      setLastSyncAt(new Date().toISOString());
      setSyncState("done");
    } catch (err) {
      setSyncState("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const importHistoryDir = async () => {
    if (!api) return;
    setSyncState("syncing");
    setError(null);
    setSyncInfo(null);
    try {
      const res = await api.importHistoryDir();
      if (!res.ok) {
        setSyncState("error");
        setError(res.error ?? "Import dossier échoué");
        return;
      }
      setUnavailable(res.unavailable ?? []);
      setPendingDat(false);
      setSyncInfo(res.message ?? "Dossier importé");
      const data = await api.getDataset();
      setDataset(data);
      setLastSyncAt(new Date().toISOString());
      setSyncState("done");
    } catch (err) {
      setSyncState("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const copyPassword = async () => {
    if (!api || !exportPassword.trim()) return;
    const res = await api.copyPassword(exportPassword);
    if (res.ok) setSyncInfo("Mot de passe copié — colle-le dans Winamax.");
    else setError(res.error ?? "Copie impossible");
  };

  const revealDat = async () => {
    if (!api) return;
    const res = await api.revealDat();
    if (!res.ok) setError(res.error ?? "Impossible d’ouvrir le dossier du .dat");
  };

  const ingestAfterImport = async () => {
    if (!api) return;
    setSyncState("syncing");
    setError(null);
    try {
      const res = await api.ingestAfterImport();
      if (!res.ok) {
        setSyncState("error");
        setError(res.error ?? "Ingestion échouée");
        return;
      }
      setUnavailable(res.unavailable ?? []);
      setSyncInfo(
        res.ingest
          ? `${res.ingest.txtCount} fichiers .txt récupérés après import Winamax`
          : "Analyse terminée",
      );
      setPendingDat(false);
      setPendingDatPath(null);
      const data = await api.getDataset();
      setDataset(data);
      setLastSyncAt(new Date().toISOString());
      setSyncState("done");
      setExportPassword("");
    } catch (err) {
      setSyncState("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const report = buildAnalysisReport(dataset, unavailable);

  return {
    isElectron,
    loading,
    pseudo,
    setPseudo,
    connectedPseudo,
    exportUrl,
    setExportUrl,
    exportPassword,
    setExportPassword,
    allowNonWinamax,
    setAllowNonWinamax,
    syncState,
    error,
    unavailable,
    dataset,
    lastSyncAt,
    syncInfo,
    pendingDat,
    pendingDatPath,
    foundHistories,
    scanState,
    scanError,
    report,
    connect,
    disconnect,
    sync,
    unlockLocalDat,
    importHistoryDir,
    scanHistories,
    importScanned,
    copyPassword,
    revealDat,
    ingestAfterImport,
    openWinamaxHelp,
    refresh,
  };
}
