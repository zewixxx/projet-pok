import type { ReplayHand } from "../review/replay.types";

export interface AiSettings {
  /** Part de la machine consacrée à l'analyse, 5 à 100. Plafond approximatif. */
  powerPercent: number;
  /** Lance l'analyse à l'ouverture d'un tournoi pas encore analysé. */
  autoAnalyze: boolean;
  /** Reformule les conseils avec le modèle de langage local (s'il est installé). */
  llmEnabled: boolean;
}

export interface LlmModelInfo {
  id: string;
  label: string;
  sizeMb: number;
}

export interface LlmStatus {
  recommended: LlmModelInfo;
  installed: LlmModelInfo | null;
  downloading: { id: string; receivedBytes: number; totalBytes: number } | null;
  totalMemGb: number;
}

export interface AiHardware {
  logicalCpus: number;
  cpuModel: string;
  totalMemGb: number;
  freeMemGb: number;
}

export interface AnalysisLeak {
  id: string;
  category: string;
  description: string;
  detail: string;
  /** Pertes d'EV par 100 mains, en bb. */
  costBb100: number;
  occurrences: number;
  totalLossBb: number;
  severity: "critical" | "major" | "minor";
  sampleHandIds: string[];
}

export interface AnalyzedTournamentInfo {
  mistakes: number;
  totalLossBb: number;
  analyzedAt: string;
  spots: number;
}

export interface AiTournamentItem {
  id: string;
  name: string;
  dateIso: string;
  startedAt: string;
  handsCount: number;
  place: number;
  totalPlayers: number;
  buyInEuros: number;
  prizeEuros?: number;
  handIds: string[];
  fileKey: string;
  analysis: AnalyzedTournamentInfo | null;
}

export interface AnalysisProgress {
  tournamentId: string;
  phase: "moteur" | "texte";
  done: number;
  total: number;
}

export interface AiApi {
  getSettings: () => Promise<AiSettings>;
  setSettings: (settings: AiSettings) => Promise<AiSettings>;
  getHardware: () => Promise<AiHardware>;
  llmStatus: () => Promise<LlmStatus>;
  llmDownload: (modelId?: string) => Promise<{ ok: boolean; error?: string }>;
  llmCancelDownload: () => Promise<{ ok: boolean }>;
  llmRemove: () => Promise<{ ok: boolean }>;
  onLlmProgress: (cb: (p: { id: string; receivedBytes: number; totalBytes: number }) => void) => () => void;
  onLlmDone: (cb: (p: { id: string }) => void) => () => void;
  onLlmError: (cb: (p: { id: string; error: string; cancelled: boolean }) => void) => () => void;
  listTournaments: () => Promise<AiTournamentItem[]>;
  getTournament: (id: string) => Promise<{ hands: ReplayHand[]; analyzed: boolean; leaks: AnalysisLeak[] }>;
  startAnalysis: (id: string) => Promise<{ ok: boolean; error?: string; alreadyRunning?: boolean }>;
  cancelAnalysis: () => Promise<{ ok: boolean }>;
  currentAnalysis: () => Promise<{ tournamentId: string } | null>;
  allLeaks: () => Promise<{ leaks: AnalysisLeak[]; handsAnalyzed: number }>;
  onProgress: (cb: (p: AnalysisProgress) => void) => () => void;
  onDone: (cb: (p: { tournamentId: string; mistakes: number; leaks: number }) => void) => () => void;
  onError: (cb: (p: { tournamentId: string; error: string; cancelled: boolean }) => void) => () => void;
}

export function getAiApi(): AiApi | null {
  if (typeof window === "undefined") return null;
  return window.projetPok?.ai ?? null;
}
