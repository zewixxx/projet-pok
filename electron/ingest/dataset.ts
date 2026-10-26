/**
 * Ingestion : dossier de fichiers d'historique → jeu de données local
 * (realData.json + hands/{tournoi}.json). Indépendant d'Electron pour être testable.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import type { ReplayHand } from "../analysis/types";
import { parseHandHistory, parseSummary, type ParsedSummary, type ParsedTournamentHand } from "./winamaxParser";

export interface DatasetTournament {
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
}

export interface DatasetSession {
  date: string;
  label: string;
  buyIn: number;
  netEuros: number;
  evEuros: number;
  sdEuros: number;
  place: number;
  total: number;
  hands: number;
  cumulEuros: number;
  cumulEv: number;
  cumulSd: number;
}

export interface DatasetFile {
  hero: string;
  sessions: DatasetSession[];
  tournaments: DatasetTournament[];
}

export interface IngestStats {
  importedAt: string;
  handsTotal: number;
  tournamentsTotal: number;
  sessionsTotal: number;
  totalInvested: number;
  totalProfitNet: number;
  hero: string;
  filesHistory: number;
  filesSummary: number;
}

const MAX_FILE_BYTES = 40 * 1024 * 1024;

export const fileKeyOf = (tournamentId: string) => tournamentId.replace(/[^a-zA-Z0-9_-]/g, "_");

function listTextFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, depth: number) => {
    if (depth > 8) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name.toLowerCase().endsWith(".txt")) out.push(p);
    }
  };
  walk(root, 0);
  return out;
}

export function buildSessions(tournaments: DatasetTournament[]): DatasetSession[] {
  const played = tournaments
    .filter((t) => t.place > 0 && t.buyInEuros >= 0)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  let cumul = 0;
  return played.map((t) => {
    const net = Math.round(((t.prizeEuros ?? 0) - t.buyInEuros) * 100) / 100;
    cumul = Math.round((cumul + net) * 100) / 100;
    return {
      date: t.dateIso,
      label: t.name,
      buyIn: t.buyInEuros,
      netEuros: net,
      // Pas d'ajustement all-in : EV et showdown sont égaux au résultat réel.
      evEuros: net,
      sdEuros: net,
      place: t.place,
      total: t.totalPlayers,
      hands: t.handsCount,
      cumulEuros: cumul,
      cumulEv: cumul,
      cumulSd: cumul,
    };
  });
}

export function readDatasetFile(datasetDir: string): DatasetFile | null {
  const file = path.join(datasetDir, "realData.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")) as DatasetFile;
  } catch {
    return null;
  }
}

export function readTournamentHands(datasetDir: string, tournamentId: string): ReplayHand[] {
  const file = path.join(datasetDir, "hands", `${fileKeyOf(tournamentId)}.json`);
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, "utf8")) as ReplayHand[];
  } catch {
    return [];
  }
}

export function ingestDirectory(srcDir: string, datasetDir: string): IngestStats {
  const handsByTournament = new Map<string, ParsedTournamentHand[]>();
  const summaries = new Map<string, ParsedSummary>();
  let filesHistory = 0;
  let filesSummary = 0;

  for (const file of listTextFiles(srcDir)) {
    let text: string;
    try {
      if (statSync(file).size > MAX_FILE_BYTES) continue;
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (text.includes("Tournament summary")) {
      const s = parseSummary(text);
      if (s) {
        summaries.set(s.tournamentId, s);
        filesSummary += 1;
      }
      continue;
    }
    const parsed = parseHandHistory(text);
    if (parsed.length > 0) filesHistory += 1;
    for (const p of parsed) {
      const list = handsByTournament.get(p.tournamentId) ?? [];
      list.push(p);
      handsByTournament.set(p.tournamentId, list);
    }
  }

  const existing = readDatasetFile(datasetDir);
  const merged = new Map<string, DatasetTournament>((existing?.tournaments ?? []).map((t) => [t.id, t]));
  let hero = existing?.hero ?? "";

  mkdirSync(path.join(datasetDir, "hands"), { recursive: true });

  for (const [id, list] of handsByTournament) {
    const unique = new Map<string, ParsedTournamentHand>();
    for (const h of list) unique.set(h.hand.id, h);
    const sorted = [...unique.values()].sort(
      (a, b) => a.startedAt.localeCompare(b.startedAt) || a.hand.id.localeCompare(b.hand.id),
    );
    const first = sorted[0];
    if (!hero) hero = first.hero;
    const summary = summaries.get(id);
    const key = fileKeyOf(id);

    writeFileSync(path.join(datasetDir, "hands", `${key}.json`), JSON.stringify(sorted.map((h) => h.hand)), "utf8");

    const startedAt = summary?.startedAt ?? first.startedAt;
    merged.set(id, {
      id,
      name: first.tournamentName,
      dateIso: startedAt.slice(0, 10),
      startedAt,
      handsCount: sorted.length,
      place: summary?.place ?? 0,
      totalPlayers: summary?.totalPlayers ?? 0,
      buyInEuros: summary?.buyInEuros ?? first.buyInEuros,
      prizeEuros: summary ? summary.prizeEuros : undefined,
      handIds: sorted.map((h) => h.hand.id),
      fileKey: key,
    });
  }

  // Un résumé reçu pour un tournoi déjà connu met à jour son résultat.
  for (const [id, s] of summaries) {
    const t = merged.get(id);
    if (!t || handsByTournament.has(id)) continue;
    merged.set(id, { ...t, place: s.place, totalPlayers: s.totalPlayers, prizeEuros: s.prizeEuros, buyInEuros: s.buyInEuros });
  }

  const tournaments = [...merged.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const sessions = buildSessions(tournaments);
  const data: DatasetFile = { hero, sessions, tournaments };
  writeFileSync(path.join(datasetDir, "realData.json"), JSON.stringify(data), "utf8");

  const totalInvested = sessions.reduce((s, x) => s + x.buyIn, 0);
  const totalProfitNet = sessions.reduce((s, x) => s + x.netEuros, 0);
  return {
    importedAt: new Date().toISOString(),
    handsTotal: tournaments.reduce((s, t) => s + t.handsCount, 0),
    tournamentsTotal: tournaments.length,
    sessionsTotal: sessions.length,
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalProfitNet: Math.round(totalProfitNet * 100) / 100,
    hero,
    filesHistory,
    filesSummary,
  };
}
