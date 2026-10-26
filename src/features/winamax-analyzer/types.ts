import type { AiApi } from "../ai/types";
import type { SessionPoint } from "../dashboard/types";

export interface AnalyzerSession extends SessionPoint {}

export interface AnalyzerTournament {
  id: string;
  name: string;
  dateIso: string;
  handsCount: number;
  place: number;
  totalPlayers: number;
  buyInEuros: number;
  prizeEuros?: number;
  fileKey: string;
}

export interface FoundHistorySource {
  room: string;
  account: string | null;
  dir: string;
  fileCount: number;
  kind: "txt" | "dat";
}

export interface AnalyzerDataset {
  hero: string;
  sessions: AnalyzerSession[];
  tournaments: AnalyzerTournament[];
  stats?: {
    importedAt: string;
    handsTotal: number;
    tournamentsTotal: number;
    sessionsTotal: number;
    totalInvested: number;
    totalProfitNet: number;
    hero: string;
    filesHistory?: number;
    filesSummary?: number;
  };
}

export interface LimitBucket {
  label: string;
  minBuyIn: number;
  maxBuyIn: number;
  tournaments: number;
  invested: number;
  profit: number;
  roi: number;
  itmRate: number;
}

export interface AnalyzerReport {
  generatedAt: string;
  hero: string;
  overview: {
    tournaments: number;
    hands: number;
    invested: number;
    profit: number;
    roi: number;
    itmRate: number;
    abi: number;
    avgPlace: number;
    bestFinish: number;
  };
  byLimit: LimitBucket[];
  unavailable: string[];
  highlights: string[];
  leaks: Array<{
    id: string;
    title: string;
    detail: string;
    severity: "critical" | "major" | "minor";
    available: boolean;
  }>;
}

declare global {
  interface Window {
    projetPok?: {
      winamax: {
        getStatus: () => Promise<{
          profile: { pseudo: string; updatedAt: string } | null;
          sync: {
            lastSyncAt: string | null;
            lastSourceUrlHost: string | null;
            lastError: string | null;
            tournamentsSynced: number;
            handsSynced: number;
            status: "idle" | "ready" | "error";
            pendingDatPath: string | null;
            pendingDatAt: string | null;
          };
          hasDataset: boolean;
          dataset: { sizeBytes: number; files: number };
          isElectron: boolean;
        }>;
        connect: (pseudo: string) => Promise<{
          ok: boolean;
          profile?: { pseudo: string; updatedAt: string };
          error?: string;
        }>;
        disconnect: () => Promise<{ ok: boolean }>;
        validateUrl: (
          url: string,
          allowNonWinamax?: boolean,
        ) => Promise<{ ok: boolean; isWinamaxHost?: boolean; error?: string }>;
        syncFromUrl: (
          url: string,
          allowNonWinamax?: boolean,
          password?: string,
        ) => Promise<{
          ok: boolean;
          error?: string;
          needsWinamaxImport?: boolean;
          message?: string;
          stats?: AnalyzerDataset["stats"];
          unavailable?: string[];
          download?: {
            kind?: string;
            txtCount: number;
            host: string;
            bytes: number;
            isWinamaxHost?: boolean;
            datPath?: string | null;
          };
        }>;
        unlockLocalDat: (
          password: string,
          filePath?: string,
        ) => Promise<{
          ok: boolean;
          error?: string;
          needsWinamaxImport?: boolean;
          message?: string;
          stats?: AnalyzerDataset["stats"];
          unavailable?: string[];
          download?: {
            kind?: string;
            txtCount: number;
            host: string;
            bytes: number;
            isWinamaxHost?: boolean;
            datPath?: string | null;
          };
        }>;
        importHistoryDir: () => Promise<{
          ok: boolean;
          error?: string;
          message?: string;
          stats?: AnalyzerDataset["stats"];
          unavailable?: string[];
        }>;
        scanHistories: () => Promise<{
          ok: boolean;
          error?: string;
          found: FoundHistorySource[];
        }>;
        importScanned: () => Promise<{
          ok: boolean;
          error?: string;
          message?: string;
          stats?: AnalyzerDataset["stats"];
          unavailable?: string[];
        }>;
        copyPassword: (password: string) => Promise<{ ok: boolean; error?: string }>;
        revealDat: () => Promise<{ ok: boolean; datPath?: string; error?: string }>;
        ingestAfterImport: () => Promise<{
          ok: boolean;
          error?: string;
          ingest?: { txtCount: number; sourceDirs: string[] };
          stats?: AnalyzerDataset["stats"];
          unavailable?: string[];
        }>;
        getDataset: () => Promise<AnalyzerDataset | null>;
        openExternal: (url: string) => Promise<{ ok: boolean; error?: string }>;
      };
      ai: AiApi;
    };
  }
}

export {};
