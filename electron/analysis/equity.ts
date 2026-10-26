/**
 * Équité par simulation (Monte Carlo).
 * Le héros affronte une ou plusieurs ranges pondérées. Les résultats sont
 * reproductibles : on passe un générateur aléatoire à graine.
 */

import { evaluate } from "./evaluator";

export interface RangeSet {
  c1: Int8Array;
  c2: Int8Array;
  /** Poids cumulés, pour tirer une main au hasard selon son poids. */
  cum: Float64Array;
  total: number;
  size: number;
}

export interface ComboWeight {
  c1: number;
  c2: number;
  w: number;
}

export function makeRangeSet(entries: ComboWeight[]): RangeSet {
  const live = entries.filter((e) => e.w > 0);
  const c1 = new Int8Array(live.length);
  const c2 = new Int8Array(live.length);
  const cum = new Float64Array(live.length);
  let total = 0;
  for (let i = 0; i < live.length; i += 1) {
    c1[i] = live[i].c1;
    c2[i] = live[i].c2;
    total += live[i].w;
    cum[i] = total;
  }
  return { c1, c2, cum, total, size: live.length };
}

function pickIndex(set: RangeSet, rng: () => number): number {
  const target = rng() * set.total;
  let lo = 0;
  let hi = set.size - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (set.cum[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const used = new Uint8Array(52);
const deck = new Int8Array(52);
const seven = new Int8Array(7);
const oppSeven = new Int8Array(7);

function drawBoard(known: number[], rng: () => number): number {
  let deckSize = 0;
  for (let c = 0; c < 52; c += 1) if (!used[c]) deck[deckSize++] = c;
  const need = 5 - known.length;
  for (let i = 0; i < need; i += 1) {
    const j = i + Math.floor(rng() * (deckSize - i));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
    seven[2 + known.length + i] = deck[i];
    oppSeven[2 + known.length + i] = deck[i];
  }
  return need;
}

export interface EquityResult {
  equity: number;
  samples: number;
}

/** Équité du héros contre des mains tirées dans chaque range. */
export function equityVsRanges(
  hero: [number, number],
  board: number[],
  opponents: RangeSet[],
  samples: number,
  rng: () => number,
): EquityResult {
  let share = 0;
  let valid = 0;
  const oppCards1 = new Int8Array(opponents.length);
  const oppCards2 = new Int8Array(opponents.length);

  for (let s = 0; s < samples; s += 1) {
    used.fill(0);
    used[hero[0]] = 1;
    used[hero[1]] = 1;
    for (const b of board) used[b] = 1;

    let ok = true;
    for (let o = 0; o < opponents.length; o += 1) {
      const set = opponents[o];
      if (set.size === 0) {
        ok = false;
        break;
      }
      let placed = false;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const idx = pickIndex(set, rng);
        const a = set.c1[idx];
        const b = set.c2[idx];
        if (used[a] || used[b]) continue;
        used[a] = 1;
        used[b] = 1;
        oppCards1[o] = a;
        oppCards2[o] = b;
        placed = true;
        break;
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    seven[0] = hero[0];
    seven[1] = hero[1];
    for (let i = 0; i < board.length; i += 1) {
      seven[2 + i] = board[i];
      oppSeven[2 + i] = board[i];
    }
    drawBoard(board, rng);
    const heroScore = evaluate(seven, 7);

    let beaten = false;
    let tiedWith = 0;
    for (let o = 0; o < opponents.length; o += 1) {
      oppSeven[0] = oppCards1[o];
      oppSeven[1] = oppCards2[o];
      const score = evaluate(oppSeven, 7);
      if (score > heroScore) {
        beaten = true;
        break;
      }
      if (score === heroScore) tiedWith += 1;
    }
    valid += 1;
    if (!beaten) share += tiedWith === 0 ? 1 : 1 / (tiedWith + 1);
  }

  if (valid === 0) return { equity: 0.5, samples: 0 };
  return { equity: share / valid, samples: valid };
}

/** Équité d'une main contre une main au hasard (sert à classer les mains). */
export function equityVsRandom(
  hand: [number, number],
  board: number[],
  samples: number,
  rng: () => number,
): number {
  let share = 0;
  for (let s = 0; s < samples; s += 1) {
    used.fill(0);
    used[hand[0]] = 1;
    used[hand[1]] = 1;
    for (const b of board) used[b] = 1;

    let deckSize = 0;
    for (let c = 0; c < 52; c += 1) if (!used[c]) deck[deckSize++] = c;
    const need = 2 + (5 - board.length);
    for (let i = 0; i < need; i += 1) {
      const j = i + Math.floor(rng() * (deckSize - i));
      const tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    seven[0] = hand[0];
    seven[1] = hand[1];
    oppSeven[0] = deck[0];
    oppSeven[1] = deck[1];
    for (let i = 0; i < board.length; i += 1) {
      seven[2 + i] = board[i];
      oppSeven[2 + i] = board[i];
    }
    for (let i = 0; i < 5 - board.length; i += 1) {
      seven[2 + board.length + i] = deck[2 + i];
      oppSeven[2 + board.length + i] = deck[2 + i];
    }
    const mine = evaluate(seven, 7);
    const theirs = evaluate(oppSeven, 7);
    if (mine > theirs) share += 1;
    else if (mine === theirs) share += 0.5;
  }
  return share / samples;
}
