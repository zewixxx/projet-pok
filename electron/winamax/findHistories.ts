import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  type Dirent,
} from "fs";
import path from "path";

export type HistoryRoom =
  | "Winamax"
  | "PokerStars"
  | "PMU"
  | "Unibet"
  | "Betclic"
  | "PartyPoker"
  | "GGPoker"
  | "Autre";

export interface ScanRoots {
  documents: string;
  roaming: string;
  local: string;
  downloads: string;
  desktop: string;
}

export interface FoundHistorySource {
  room: HistoryRoom;
  account: string | null;
  dir: string;
  fileCount: number;
  kind: "txt" | "dat";
  /** Fichiers précis, quand le dossier contient aussi autre chose. */
  files?: string[];
}

const CLIENTS: { room: HistoryRoom; test: (name: string) => boolean }[] = [
  { room: "Winamax", test: (n) => /winamax/i.test(n) || /^wam([.\-_]|$)/i.test(n) },
  { room: "PokerStars", test: (n) => /poker[\s._-]?stars/i.test(n) },
  { room: "PMU", test: (n) => /^pmu([\s._-]|$)/i.test(n) || /pmu[\s._-]?poker/i.test(n) },
  { room: "Unibet", test: (n) => /unibet/i.test(n) },
  { room: "Betclic", test: (n) => /betclic/i.test(n) },
  { room: "PartyPoker", test: (n) => /partypoker|partygaming/i.test(n) },
  { room: "GGPoker", test: (n) => /ggpoker|ggnetwork|natural8/i.test(n) },
];

const HISTORY_NAME = /^(history|handhistory|hand[-_ ]history|histories)$/i;
const MAX_WALK = 2500;
const MAX_FILES = 20000;
const MAX_DEPTH = 6;

export function sniffRoom(header: string): HistoryRoom | null {
  const h = header.slice(0, 500);
  if (/winamax/i.test(h)) return "Winamax";
  if (/pokerstars/i.test(h)) return "PokerStars";
  if (/\bpmu\b/i.test(h)) return "PMU";
  if (/unibet/i.test(h)) return "Unibet";
  if (/betclic/i.test(h)) return "Betclic";
  if (/partypoker|party poker/i.test(h)) return "PartyPoker";
  if (/ggpoker|gg poker|natural8/i.test(h)) return "GGPoker";
  return null;
}

function readHeader(file: string): string {
  try {
    return readFileSync(file).subarray(0, 500).toString("utf8");
  } catch {
    return "";
  }
}

function listDir(dir: string): Dirent[] {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function roomFromName(name: string): HistoryRoom | null {
  for (const client of CLIENTS) {
    if (client.test(name)) return client.room;
  }
  return null;
}

interface Budget {
  walked: number;
  counted: number;
}

function isTxt(name: string): boolean {
  return name.toLowerCase().endsWith(".txt");
}

function countTxt(
  dir: string,
  depth: number,
  budget: Budget,
): { count: number; sample: string | null } {
  if (depth > 8 || budget.counted >= MAX_FILES) return { count: 0, sample: null };
  let count = 0;
  let sample: string | null = null;
  for (const ent of listDir(dir)) {
    if (budget.counted >= MAX_FILES) break;
    if (ent.isSymbolicLink()) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      const sub = countTxt(full, depth + 1, budget);
      count += sub.count;
      if (!sample && sub.sample) sample = sub.sample;
      continue;
    }
    if (!ent.isFile() || !isTxt(ent.name)) continue;
    budget.counted += 1;
    count += 1;
    if (!sample) sample = full;
  }
  return { count, sample };
}

function looksLikeDateFolder(name: string): boolean {
  return /^\d{4}([.\-_]\d{2}){0,2}$/.test(name);
}

function pushSource(
  found: FoundHistorySource[],
  dir: string,
  roomHint: HistoryRoom,
  budget: Budget,
  account: string | null,
): void {
  const { count, sample } = countTxt(dir, 0, budget);
  if (count === 0) return;
  const sniffed = sample ? sniffRoom(readHeader(sample)) : null;
  found.push({
    room: sniffed ?? roomHint,
    account,
    dir,
    fileCount: count,
    kind: "txt",
  });
}

function emitHistory(
  found: FoundHistorySource[],
  dir: string,
  roomHint: HistoryRoom,
  budget: Budget,
): void {
  const entries = listDir(dir);
  const directTxt = entries.some((ent) => ent.isFile() && isTxt(ent.name));
  const subdirs = entries.filter((ent) => ent.isDirectory() && !ent.isSymbolicLink());
  const accountDirs = subdirs.filter((ent) => !looksLikeDateFolder(ent.name) && !HISTORY_NAME.test(ent.name));
  if (!directTxt && accountDirs.length > 0 && accountDirs.length <= 40) {
    let emitted = 0;
    for (const sub of accountDirs) {
      const before = found.length;
      pushSource(found, path.join(dir, sub.name), roomHint, budget, sub.name);
      if (found.length > before) emitted += 1;
    }
    if (emitted > 0) return;
  }
  const parent = path.basename(path.dirname(dir));
  const account = HISTORY_NAME.test(path.basename(dir)) && !/^(accounts|documents|local store)$/i.test(parent)
    ? parent
    : null;
  pushSource(found, dir, roomHint, budget, account);
}

function walkClient(
  dir: string,
  roomHint: HistoryRoom,
  depth: number,
  budget: Budget,
  found: FoundHistorySource[],
): void {
  if (budget.walked >= MAX_WALK || depth > MAX_DEPTH) return;
  budget.walked += 1;
  const entries = listDir(dir);
  const base = path.basename(dir);
  const firstTxt = entries.find((ent) => ent.isFile() && isTxt(ent.name));
  const sniffed = firstTxt ? sniffRoom(readHeader(path.join(dir, firstTxt.name))) : null;
  if (depth > 0 && (HISTORY_NAME.test(base) || sniffed)) {
    emitHistory(found, dir, sniffed ?? roomHint, budget);
    return;
  }
  for (const ent of entries) {
    if (!ent.isDirectory() || ent.isSymbolicLink()) continue;
    if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
    walkClient(path.join(dir, ent.name), roomHint, depth + 1, budget, found);
  }
}

function scanDownloads(downloads: string, found: FoundHistorySource[], budget: Budget): void {
  if (!existsSync(downloads)) return;
  const looseTxt: string[] = [];
  for (const ent of listDir(downloads)) {
    if (ent.isSymbolicLink()) continue;
    const full = path.join(downloads, ent.name);
    if (ent.isDirectory()) {
      const sample = listDir(full).find((child) => child.isFile() && isTxt(child.name));
      if (!sample) continue;
      const room = sniffRoom(readHeader(path.join(full, sample.name)));
      if (room) pushSource(found, full, room, budget, null);
      continue;
    }
    if (!ent.isFile()) continue;
    const lower = ent.name.toLowerCase();
    if (lower.endsWith(".txt")) {
      if (sniffRoom(readHeader(full))) looseTxt.push(full);
      continue;
    }
    if ((lower.endsWith(".dat") || lower.endsWith(".zip")) && /winamax|poker|history|hand/i.test(ent.name)) {
      found.push({
        room: /winamax/i.test(ent.name) ? "Winamax" : "Autre",
        account: null,
        dir: full,
        fileCount: 1,
        kind: "dat",
      });
    }
  }
  if (looseTxt.length > 0) {
    const room = sniffRoom(readHeader(looseTxt[0])) ?? "Autre";
    found.push({
      room,
      account: null,
      dir: downloads,
      fileCount: looseTxt.length,
      kind: "txt",
      files: looseTxt,
    });
  }
}

/** Cherche les historiques dans les dossiers habituels des clients, pas dans tout le disque. */
export function scanPokerHistories(roots: ScanRoots): FoundHistorySource[] {
  const found: FoundHistorySource[] = [];
  const budget: Budget = { walked: 0, counted: 0 };
  for (const top of [roots.documents, roots.roaming, roots.local, roots.desktop]) {
    if (!top || !existsSync(top)) continue;
    for (const ent of listDir(top)) {
      if (!ent.isDirectory() || ent.isSymbolicLink()) continue;
      const room = roomFromName(ent.name);
      if (!room) continue;
      walkClient(path.join(top, ent.name), room, 0, budget, found);
    }
  }
  scanDownloads(roots.downloads, found, budget);

  const seen = new Set<string>();
  return found.filter((source) => {
    const key = path.normalize(source.dir).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function stageHistoryFiles(sources: FoundHistorySource[], stagingDir: string): number {
  mkdirSync(stagingDir, { recursive: true });
  const used = new Set<string>();
  let copied = 0;

  const copyOne = (file: string, room: string) => {
    if (copied >= MAX_FILES) return;
    const base = path.basename(file);
    let name = `${room}-${base}`;
    let i = 2;
    while (used.has(name.toLowerCase())) {
      name = `${room}-${i}-${base}`;
      i += 1;
    }
    used.add(name.toLowerCase());
    copyFileSync(file, path.join(stagingDir, name));
    copied += 1;
  };

  const copyTree = (dir: string, room: string) => {
    for (const ent of listDir(dir)) {
      if (copied >= MAX_FILES || ent.isSymbolicLink()) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        copyTree(full, room);
        continue;
      }
      if (ent.isFile() && isTxt(ent.name)) copyOne(full, room);
    }
  };

  for (const source of sources) {
    if (source.kind !== "txt") continue;
    if (source.files?.length) {
      for (const file of source.files) copyOne(file, source.room);
      continue;
    }
    copyTree(source.dir, source.room);
  }
  return copied;
}
