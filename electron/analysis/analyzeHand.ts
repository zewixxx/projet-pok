/**
 * Analyse d'une main : pour chaque décision du héros, estime l'équité contre la
 * range déduite des adversaires, les cotes du pot, puis l'EV de chaque option.
 *
 * C'est une ESTIMATION, pas un solveur GTO :
 *  - les ranges viennent de repères de joueur (voir ranges.ts) affinés à chaque action ;
 *  - l'adversaire est supposé défendre à la fréquence minimale de défense ;
 *  - l'EV est en jetons (pas d'ICM), pour un seul tour de décision.
 */

import { hashSeed, makeRng, parseCard } from "./cards";
import { type ComboWeight, equityVsRandom, equityVsRanges, makeRangeSet, type RangeSet } from "./equity";
import { evaluate } from "./evaluator";
import { CLASS_EQUITY_VS_RANDOM } from "./classEquity.generated";
import {
  callShovePct,
  CELL_COUNT,
  cellKey,
  cellOf,
  coldCallPct,
  bbDefendPct,
  openPct,
  PCT_FROM_TOP,
  preflopActionWeights,
  shovePct,
  TOTAL_COMBOS,
} from "./ranges";
import type {
  ActionType,
  AnalyzeOptions,
  CoachTip,
  EvComparison,
  EvOption,
  HandAction,
  MistakeKind,
  ReplayHand,
  SpotInsight,
  Street,
} from "./types";

export const ENGINE_NAME = "Moteur Projet-pok v1 (estimation, pas un solveur GTO)";
const DEFAULT_SAMPLES = 1500;
const COMBO_SLOTS = 52 * 52;

/**
 * Part de l'équité réellement récupérée quand il reste des tours de mise.
 * Une main faible, ou jouée hors de position, en récupère moins.
 */
function realization(street: Street, equity: number, heroPct: number, outOfPosition: boolean): number {
  if (street === "preflop") {
    const base = Math.min(0.98, Math.max(0.58, 0.98 - 0.4 * heroPct));
    return outOfPosition ? base * 0.96 : base;
  }
  return Math.max(0.7, Math.min(1, 0.62 + 0.62 * equity));
}

interface PState {
  id: string;
  name: string;
  position: string;
  isHero: boolean;
  isBigBlind: boolean;
  isSmallBlind: boolean;
  startStack: number;
  invested: number;
  streetInv: number;
  folded: boolean;
  allIn: boolean;
  acted: boolean;
  behind: number;
  cellW: Float64Array;
  comboW: Float64Array | null;
  labels: string[];
}

interface Candidate {
  type: ActionType;
  /** Montant affiché : total au tour pour relance et tapis, ajout pour mise et call. */
  amountBb?: number;
  /** Jetons que le héros ajoute maintenant. */
  add: number;
  isPlayed?: boolean;
}

interface HandCtx {
  hand: ReplayHand;
  heroCards: [number, number];
  dead: Uint8Array;
  board: number[];
  rng: () => number;
  samples: number;
  raw: Map<number, Float64Array>;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const comboIndex = (a: number, b: number) => (a < b ? a * 52 + b : b * 52 + a);

/** Virgule décimale française dans les textes affichés à l'utilisateur. */
const frDecimal = (n: number | string): string => String(n).replace(".", ",");

function fmtBb(n: number): string {
  return `${frDecimal(round1(n))} bb`;
}

const ACTION_VERB: Record<ActionType, string> = {
  fold: "te coucher",
  call: "payer",
  check: "checker",
  bet: "miser",
  raise: "relancer",
  allin: "mettre tapis",
};

const ACTION_NAME: Record<ActionType, string> = {
  fold: "Fold",
  call: "Call",
  check: "Check",
  bet: "Mise",
  raise: "Relance",
  allin: "Tapis",
};

const isAggressive = (t: ActionType) => t === "bet" || t === "raise" || t === "allin";

// ─── Préparation ────────────────────────────────────────────────────────────

function computeBehind(hand: ReplayHand): Map<string, number> {
  const sorted = [...hand.players].sort((a, b) => a.seatIndex - b.seatIndex);
  const n = sorted.length;
  const bbIdx = sorted.findIndex((p) => p.position === "BB");
  const order: string[] = [];
  if (bbIdx >= 0) {
    for (let i = 1; i <= n; i += 1) order.push(sorted[(bbIdx + i) % n].id);
  } else {
    for (const p of sorted) order.push(p.id);
  }
  const out = new Map<string, number>();
  order.forEach((id, i) => out.set(id, n - 1 - i));
  return out;
}

function initialStates(hand: ReplayHand): PState[] {
  const behind = computeBehind(hand);
  const headsUp = hand.players.length === 2;
  const ante = hand.anteBb ?? 0;
  return hand.players.map((p) => {
    const isBB = p.position === "BB";
    const isSB = p.position === "SB" || (headsUp && p.position === "BTN");
    const blind = isBB ? hand.blindsBb.big : isSB ? hand.blindsBb.small : 0;
    const invested = Math.min(p.stackBb, ante + blind);
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      isHero: Boolean(p.isHero),
      isBigBlind: isBB,
      isSmallBlind: isSB,
      startStack: p.stackBb,
      invested,
      streetInv: Math.min(p.stackBb - Math.min(p.stackBb, ante), blind),
      folded: false,
      allIn: invested >= p.stackBb - 1e-9,
      acted: false,
      behind: behind.get(p.id) ?? 0,
      cellW: new Float64Array(CELL_COUNT).fill(1),
      comboW: null,
      labels: [],
    };
  });
}

function rawStrength(ctx: HandCtx): Float64Array {
  const key = ctx.board.length;
  const cached = ctx.raw.get(key);
  if (cached) return cached;
  const raw = new Float64Array(COMBO_SLOTS).fill(Number.NaN);
  const boardMask = new Uint8Array(52);
  for (const c of ctx.board) boardMask[c] = 1;
  const seven = new Int8Array(7);
  for (let a = 0; a < 52; a += 1) {
    if (ctx.dead[a]) continue;
    for (let b = a + 1; b < 52; b += 1) {
      if (ctx.dead[b]) continue;
      if (key === 0) {
        raw[a * 52 + b] = CLASS_EQUITY_VS_RANDOM[cellOf(a, b)];
      } else if (key === 5) {
        seven[0] = a;
        seven[1] = b;
        for (let i = 0; i < 5; i += 1) seven[2 + i] = ctx.board[i];
        raw[a * 52 + b] = evaluate(seven, 7);
      } else {
        raw[a * 52 + b] = equityVsRandom([a, b], ctx.board, 40, ctx.rng);
      }
    }
  }
  ctx.raw.set(key, raw);
  return raw;
}

function buildComboWeights(cellW: Float64Array, dead: Uint8Array): Float64Array {
  const w = new Float64Array(COMBO_SLOTS);
  for (let a = 0; a < 52; a += 1) {
    if (dead[a]) continue;
    for (let b = a + 1; b < 52; b += 1) {
      if (dead[b]) continue;
      w[a * 52 + b] = cellW[cellOf(a, b)];
    }
  }
  return w;
}

/** Poids des mains d'un joueur, à jour des cartes mortes (héros + board). */
function liveWeights(v: PState, ctx: HandCtx): Float64Array {
  if (ctx.board.length === 0) return buildComboWeights(v.cellW, ctx.dead);
  if (!v.comboW) v.comboW = buildComboWeights(v.cellW, ctx.dead);
  for (let a = 0; a < 52; a += 1) {
    if (!ctx.dead[a]) continue;
    for (let b = 0; b < 52; b += 1) {
      if (a === b) continue;
      v.comboW[comboIndex(a, b)] = 0;
    }
  }
  return v.comboW;
}

/** Rang de force de chaque main dans la range (1 = la plus forte), à égalité = moyenne. */
function percentiles(w: Float64Array, raw: Float64Array): Float64Array {
  const q = new Float64Array(COMBO_SLOTS);
  const idx: number[] = [];
  let total = 0;
  for (let i = 0; i < COMBO_SLOTS; i += 1) {
    if (w[i] > 0 && Number.isFinite(raw[i])) {
      idx.push(i);
      total += w[i];
    }
  }
  if (total === 0) return q;
  idx.sort((x, y) => raw[x] - raw[y]);
  let cum = 0;
  let i = 0;
  while (i < idx.length) {
    let j = i;
    let groupW = 0;
    while (j < idx.length && raw[idx[j]] === raw[idx[i]]) {
      groupW += w[idx[j]];
      j += 1;
    }
    const mid = (cum + groupW / 2) / total;
    for (let k = i; k < j; k += 1) q[idx[k]] = mid;
    cum += groupW;
    i = j;
  }
  return q;
}

function rangeWidth(w: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < COMBO_SLOTS; i += 1) sum += w[i];
  return sum / TOTAL_COMBOS;
}

/** Garde la part `fraction` la plus forte de la range. */
function truncate(w: Float64Array, q: Float64Array, fraction: number): RangeSet {
  const entries: Array<ComboWeight & { q: number }> = [];
  let total = 0;
  for (let i = 0; i < COMBO_SLOTS; i += 1) {
    if (w[i] > 0 && q[i] > 0) {
      entries.push({ c1: Math.floor(i / 52), c2: i % 52, w: w[i], q: q[i] });
      total += w[i];
    }
  }
  if (fraction >= 0.999) return makeRangeSet(entries);
  entries.sort((a, b) => b.q - a.q);
  const kept: ComboWeight[] = [];
  let acc = 0;
  const target = total * Math.max(0.02, fraction);
  for (const e of entries) {
    kept.push(e);
    acc += e.w;
    if (acc >= target) break;
  }
  return makeRangeSet(kept);
}

// ─── Mise à jour des ranges adverses ────────────────────────────────────────

const sig = (x: number) => 1 / (1 + Math.exp(-x));

function narrowPostflop(
  v: PState,
  ctx: HandCtx,
  action: HandAction,
  potBefore: number,
  facing: number,
): void {
  const w = liveWeights(v, ctx);
  const q = percentiles(w, rawStrength(ctx));
  const betRatio = action.amountBb != null ? action.amountBb / Math.max(potBefore, 0.5) : 0;

  for (let i = 0; i < COMBO_SLOTS; i += 1) {
    if (w[i] <= 0) continue;
    const s = q[i];
    let likelihood = 1;
    if (action.type === "bet") {
      const threshold = 0.5 + 0.12 * Math.min(betRatio, 1.5);
      likelihood = 0.08 + 0.92 * sig((s - threshold) * 9) + (s < 0.25 ? 0.1 : 0);
    } else if (action.type === "raise" || action.type === "allin") {
      likelihood = facing > 0 ? 0.04 + 0.96 * sig((s - 0.82) * 14) : 0.08 + 0.92 * sig((s - 0.62) * 9);
    } else if (action.type === "check") {
      likelihood = 1 - 0.6 * sig((s - 0.8) * 12);
    } else if (action.type === "call") {
      const ratio = facing / Math.max(potBefore - facing, 0.5);
      const foldShare = ratio / (1 + ratio);
      const threshold = Math.min(0.9, foldShare * 1.25);
      likelihood = sig((s - threshold) * 12) * (1 - 0.5 * sig((s - 0.92) * 20));
    }
    w[i] *= Math.max(0.01, likelihood);
  }
}

function narrowPreflop(v: PState, weights: Float64Array): void {
  for (let i = 0; i < CELL_COUNT; i += 1) v.cellW[i] *= weights[i];
}

// ─── Candidats et EV ────────────────────────────────────────────────────────

interface SpotState {
  street: Street;
  pot: number;
  curBet: number;
  raisesBefore: number;
  limpers: number;
}

function buildCandidates(
  hero: PState,
  spot: SpotState,
  toCall: number,
  heroStack: number,
  bb: number,
  canRaise: boolean,
): Candidate[] {
  const out: Candidate[] = [];
  const g = hero.streetInv;
  const P = spot.pot;
  const preflop = spot.street === "preflop";
  const cap = (total: number) => Math.min(total, g + heroStack);
  const pushAggressive = (total: number) => {
    const t = round1(cap(total));
    const add = t - g;
    if (add <= 0 || add <= toCall + 1e-6) return;
    const allIn = add >= heroStack - 1e-6;
    if (out.some((c) => isAggressive(c.type) && Math.abs(c.add - add) <= Math.max(0.1 * add, 0.3))) return;
    out.push({
      type: allIn ? "allin" : toCall > 0 || preflop ? "raise" : "bet",
      amountBb: allIn ? round1(g + heroStack) : toCall > 0 || preflop ? t : round1(add),
      add: allIn ? heroStack : add,
    });
  };

  if (toCall > 1e-9) {
    out.push({ type: "fold", add: 0 });
    out.push({ type: "call", amountBb: round1(Math.min(toCall, heroStack)), add: Math.min(toCall, heroStack) });
  } else {
    out.push({ type: "check", add: 0 });
  }

  if (!canRaise) return out;

  if (preflop) {
    const B = spot.curBet;
    if (spot.raisesBefore === 0) {
      pushAggressive(2.2 * bb + spot.limpers * bb);
      pushAggressive(3 * bb + spot.limpers * bb);
    } else if (spot.raisesBefore === 1) {
      pushAggressive(3.2 * B);
      pushAggressive(B + P + toCall);
    } else {
      pushAggressive(2.2 * B);
      pushAggressive(B + P + toCall);
    }
    if (heroStack + g <= 20 * bb || heroStack <= 1.2 * (P + toCall + B)) pushAggressive(g + heroStack);
  } else if (toCall > 1e-9) {
    const B = spot.curBet;
    pushAggressive(Math.max(2.5 * B, B + 1));
    pushAggressive(B + P + toCall);
    if (heroStack <= 1.3 * (P + toCall)) pushAggressive(g + heroStack);
  } else {
    pushAggressive(P * 0.33);
    pushAggressive(P * 0.66);
    pushAggressive(P);
    if (heroStack <= 1.3 * P) pushAggressive(g + heroStack);
  }
  return out;
}

function playedTotal(action: HandAction, g: number): number {
  if (action.type === "bet") return g + (action.amountBb ?? 0);
  return action.amountBb ?? 0;
}

function markPlayed(cands: Candidate[], action: HandAction, hero: PState, toCall: number, heroStack: number): void {
  const g = hero.streetInv;
  if (action.type === "fold" || action.type === "check") {
    const found = cands.find((c) => c.type === action.type);
    if (found) found.isPlayed = true;
    else cands.push({ type: action.type, add: 0, isPlayed: true });
    return;
  }
  if (action.type === "call") {
    const found = cands.find((c) => c.type === "call");
    if (found) found.isPlayed = true;
    else cands.push({ type: "call", amountBb: action.amountBb, add: Math.min(action.amountBb ?? toCall, heroStack), isPlayed: true });
    return;
  }
  const total = playedTotal(action, g);
  const add = Math.min(Math.max(total - g, 0), heroStack);
  const close = cands.find(
    (c) => isAggressive(c.type) && Math.abs(c.add - add) <= Math.max(0.15 * add, 0.5),
  );
  if (close) {
    close.type = action.type;
    close.amountBb = round1(action.type === "bet" ? add : total);
    close.add = add;
    close.isPlayed = true;
    return;
  }
  cands.push({
    type: action.type,
    amountBb: round1(action.type === "bet" ? add : total),
    add,
    isPlayed: true,
  });
}

interface VillainView {
  state: PState;
  w: Float64Array;
  q: Float64Array;
  width: number;
}

function viewOf(v: PState, ctx: HandCtx): VillainView {
  const w = liveWeights(v, ctx);
  const q = percentiles(w, rawStrength(ctx));
  return { state: v, w, q, width: rangeWidth(w) };
}

function equityAgainst(
  hero: [number, number],
  board: number[],
  sets: RangeSet[],
  ctx: HandCtx,
): number {
  if (sets.length === 0) return 1;
  return equityVsRanges(hero, board, sets, ctx.samples, ctx.rng).equity;
}

/** Part de sa range avec laquelle l'adversaire continue face à une mise. */
function continueFraction(
  view: VillainView,
  spot: SpotState,
  addedByHero: number,
  heroTotal: number,
  heroIsAllIn: boolean,
  villainCall: number,
  heroBehind: number,
): number {
  const potAfter = spot.pot + addedByHero;
  const mdf = potAfter / (potAfter + Math.max(villainCall, 0.01));
  let fraction: number;
  if (spot.street === "preflop") {
    const widthPct = Math.max(view.width * 100, 0.5);
    let absoluteCap: number;
    if (heroIsAllIn) {
      absoluteCap = callShovePct(Math.min(heroTotal, view.state.startStack - view.state.invested + view.state.streetInv), view.state.isBigBlind);
    } else if (spot.raisesBefore === 0) {
      absoluteCap = view.state.isBigBlind
        ? bbDefendPct(heroBehind) * 0.85
        : view.state.isSmallBlind
          ? 14
          : coldCallPct(view.state.behind);
    } else if (spot.raisesBefore === 1) {
      absoluteCap = widthPct * 0.42;
    } else {
      absoluteCap = widthPct * 0.35;
    }
    fraction = Math.min(mdf, Math.min(1, absoluteCap / widthPct));
  } else {
    fraction = mdf * 0.88;
  }
  return Math.max(0.03, Math.min(0.97, fraction));
}

interface SpotEvaluation {
  options: EvOption[];
  played: EvOption;
  best: EvOption;
  equity: number;
  potOddsPct?: number;
  villainViews: VillainView[];
  mainVillain: VillainView | null;
}

function evaluateSpot(
  ctx: HandCtx,
  states: PState[],
  hero: PState,
  spot: SpotState,
  action: HandAction,
  bb: number,
): SpotEvaluation | null {
  const heroStack = hero.startStack - hero.invested;
  if (heroStack <= 1e-9) return null;
  const toCall = Math.max(0, Math.min(spot.curBet - hero.streetInv, heroStack));
  const villains = states.filter((s) => !s.isHero && !s.folded);
  if (villains.length === 0) return null;

  const preflop = spot.street === "preflop";
  const passive = preflop ? villains.filter((v) => v.acted || v.allIn) : villains;
  const passiveSet = passive.length > 0 ? passive : villains;
  const responders = villains.filter((v) => !v.allIn);

  const heroPair = ctx.heroCards;
  const views = new Map<string, VillainView>();
  const viewFor = (v: PState) => {
    let view = views.get(v.id);
    if (!view) {
      view = viewOf(v, ctx);
      views.set(v.id, view);
    }
    return view;
  };

  const canRaise = responders.length > 0;
  const cands = buildCandidates(hero, spot, toCall, heroStack, bb, canRaise);
  markPlayed(cands, action, hero, toCall, heroStack);

  const passiveSets = passiveSet.map((v) => truncate(viewFor(v).w, viewFor(v).q, 1));
  const eqPass = equityAgainst(heroPair, ctx.board, passiveSets, ctx);
  const potOddsPct = toCall > 1e-9 ? (toCall / (spot.pot + toCall)) * 100 : undefined;
  const river = spot.street === "river";
  const heroPct = PCT_FROM_TOP[cellOf(heroPair[0], heroPair[1])];
  const outOfPosition = hero.isBigBlind || hero.isSmallBlind;
  const realize = (eq: number) => realization(spot.street, eq, heroPct, outOfPosition);

  // Ouverture en premier : la range de référence prime sur l'EV en jetons,
  // qui surestime le vol de blindes avec des mains faibles.
  const firstIn = preflop && spot.raisesBefore === 0 && spot.limpers === 0 && hero.behind > 0;
  const heroPctPoints = heroPct * 100;

  const options: EvOption[] = [];
  for (const cand of cands) {
    let ev = 0;
    if (cand.type === "fold") {
      ev = 0;
    } else if (cand.type === "check") {
      ev = (river ? 1 : realize(eqPass)) * eqPass * spot.pot;
    } else if (cand.type === "call") {
      const allInCall = cand.add >= heroStack - 1e-6;
      ev = (river || allInCall ? 1 : realize(eqPass)) * eqPass * (spot.pot + cand.add) - cand.add;
    } else {
      const total = hero.streetInv + cand.add;
      const heroAllIn = cand.add >= heroStack - 1e-6;
      let foldAll = 1;
      let callSum = 0;
      let contSum = 0;
      const contSets: RangeSet[] = [];
      for (const v of responders) {
        const view = viewFor(v);
        const vStack = v.startStack - v.invested;
        const call = Math.max(0.01, Math.min(total - v.streetInv, vStack));
        const frac = continueFraction(view, spot, cand.add, total, heroAllIn, call, hero.behind);
        foldAll *= 1 - frac;
        contSum += frac;
        callSum += call * frac;
        contSets.push(truncate(view.w, view.q, frac));
      }
      for (const v of villains) {
        if (v.allIn) contSets.push(truncate(viewFor(v).w, viewFor(v).q, 1));
      }
      const eqCont = equityAgainst(heroPair, ctx.board, contSets, ctx);
      const called = 1 - foldAll;
      const nExp = called > 1e-6 ? contSum / called : 1;
      const avgCall = contSum > 0 ? callSum / contSum : 0;
      const potFinal = spot.pot + cand.add + nExp * avgCall;
      const r = river || heroAllIn ? 1 : realize(eqCont);
      ev = foldAll * spot.pot + called * (r * eqCont * potFinal - cand.add);

      if (firstIn) {
        const stackEff = heroStack + hero.streetInv;
        const limit =
          cand.type === "allin" && stackEff <= 25 * bb ? shovePct(stackEff / bb, hero.behind) : openPct(hero.behind);
        if (heroPctPoints > limit * 1.3) ev = Math.min(ev, -0.05);
        else if (heroPctPoints < limit * 0.7) ev = Math.max(ev, 0.05);
      }
    }
    options.push({ type: cand.type, amountBb: cand.amountBb, evBb: round2(ev), isPlayed: cand.isPlayed });
  }

  options.sort((a, b) => b.evBb - a.evBb);
  const played = options.find((o) => o.isPlayed) ?? options[0];
  const best = options[0];

  const lastAggressor = [...villains].sort((a, b) => b.streetInv - a.streetInv || Number(b.acted) - Number(a.acted))[0];
  const mainVillain = lastAggressor ? viewFor(lastAggressor) : null;

  return {
    options,
    played,
    best,
    equity: eqPass,
    potOddsPct,
    villainViews: [...views.values()],
    mainVillain,
  };
}

// ─── Textes ─────────────────────────────────────────────────────────────────

function optionLabel(o: EvOption): string {
  const verb = ACTION_VERB[o.type];
  if (o.type === "bet") return `${verb} ${fmtBb(o.amountBb ?? 0)}`;
  if (o.type === "raise") return `${verb} à ${fmtBb(o.amountBb ?? 0)}`;
  return verb;
}

function classifyMistake(played: EvOption, best: EvOption): MistakeKind {
  if (played.type === "fold") return "overfold";
  if (played.type === "call") return best.type === "fold" ? "overcall" : "passive-call";
  if (played.type === "check") return "missed-bet";
  if (isAggressive(played.type) && isAggressive(best.type)) return "sizing";
  return "overaggression";
}

function buildTip(
  kind: MistakeKind | "correct",
  quality: CoachTip["quality"],
  evalResult: SpotEvaluation,
  hero: PState,
  heroCards: string,
  street: Street,
  lossBb: number,
  heroOpenNote: string,
  villainPos: string | undefined,
): CoachTip {
  const { played, best, equity, potOddsPct } = evalResult;
  const eqText = `${Math.round(equity * 100)} %`;
  const vs = villainPos ? ` contre la range estimée de ${villainPos}` : " contre la range estimée";
  const playedText = optionLabel(played);
  const bestText = optionLabel(best);
  const need = potOddsPct != null && !heroOpenNote ? ` Il te fallait ${Math.round(potOddsPct)} % d'équité pour payer.` : "";
  const loss = `+${frDecimal(lossBb.toFixed(2))} bb en jouant ${bestText}.`;

  if (kind === "correct") {
    return {
      quality,
      headline: quality === "good" ? `Bonne décision : ${playedText}` : `Décision correcte : ${playedText}`,
      detail: `Avec ${heroCards} en ${hero.position}, tu as ${eqText} d'équité${vs}.${need}${heroOpenNote}`.trim(),
      evDiffBb: round2(lossBb),
      source: "moteur",
    };
  }

  const headlines: Record<MistakeKind, string> = {
    overfold: `Fold trop serré en ${hero.position}`,
    overcall: `Call trop large en ${hero.position}`,
    "passive-call": `Payer ici est trop passif`,
    "missed-bet": `Tu laisses de l'EV en checkant`,
    overaggression: `Agression qui coûte de l'EV`,
    sizing: `Bonne ligne, sizing perfectible`,
  };
  const details: Record<MistakeKind, string> = {
    overfold: `Avec ${heroCards}, tu as ${eqText} d'équité${vs}.${need} Te coucher perd de l'EV : ${loss}`,
    overcall: `Avec ${heroCards}, tu n'as que ${eqText} d'équité${vs}.${need} Payer coûte de l'EV : ${loss}`,
    "passive-call": `Avec ${heroCards} (${eqText} d'équité${vs}), payer rapporte moins que ${bestText}. ${loss}`,
    "missed-bet": `Avec ${heroCards} (${eqText} d'équité${vs}), checker laisse de la valeur sur la table. ${loss}`,
    overaggression: `Avec ${heroCards} (${eqText} d'équité${vs}), ${playedText} ne passe pas assez souvent : ${loss}`,
    sizing: `Le sizing choisi (${playedText}) rapporte un peu moins que ${bestText} d'après le modèle. ${loss} Estimation indicative.`,
  };
  return {
    quality,
    headline: `${headlines[kind]}${street === "preflop" ? "" : ` au ${street === "flop" ? "flop" : street === "turn" ? "turn" : "river"}`}`,
    detail: `${details[kind]}${heroOpenNote}`.trim(),
    evDiffBb: round2(lossBb),
    source: "moteur",
  };
}

function rangeSummary(view: VillainView | null): Pick<SpotInsight, "villainRange" | "villainRangePct"> {
  if (!view) return {};
  const cellW = new Float64Array(CELL_COUNT);
  const cellN = new Float64Array(CELL_COUNT);
  for (let a = 0; a < 52; a += 1) {
    for (let b = a + 1; b < 52; b += 1) {
      const w = view.w[a * 52 + b];
      const cell = cellOf(a, b);
      cellN[cell] += 1;
      cellW[cell] += w;
    }
  }
  let max = 0;
  const avg = new Float64Array(CELL_COUNT);
  for (let c = 0; c < CELL_COUNT; c += 1) {
    avg[c] = cellN[c] > 0 ? cellW[c] / cellN[c] : 0;
    if (avg[c] > max) max = avg[c];
  }
  const range: Record<string, number> = {};
  if (max > 0) {
    for (let c = 0; c < CELL_COUNT; c += 1) {
      const p = avg[c] / max;
      if (p >= 0.05) range[cellKey(c)] = round2(p);
    }
  }
  return { villainRange: range, villainRangePct: `${(view.width * 100).toFixed(1)}%` };
}

// ─── Analyse d'une main ─────────────────────────────────────────────────────

export function analyzeHand(hand: ReplayHand, options: AnalyzeOptions = {}): ReplayHand {
  const hero = hand.players.find((p) => p.isHero);
  if (!hero?.holeCards) return { ...hand, analyzed: true, coachTips: {}, evComparisons: {}, spots: {} };

  const heroCards: [number, number] = [parseCard(hero.holeCards[0]), parseCard(hero.holeCards[1])];
  const dead = new Uint8Array(52);
  dead[heroCards[0]] = 1;
  dead[heroCards[1]] = 1;

  const ctx: HandCtx = {
    hand,
    heroCards,
    dead,
    board: [],
    rng: makeRng(hashSeed(hand.id)),
    samples: options.samples ?? DEFAULT_SAMPLES,
    raw: new Map(),
  };

  const states = initialStates(hand);
  const bb = hand.blindsBb.big;
  let pot = states.reduce((sum, s) => sum + s.invested, 0);
  let curBet = hand.players.length >= 2 ? hand.blindsBb.big : 0;
  let street: Street = "preflop";
  let raisesBefore = 0;
  let limpers = 0;
  let openerBehind: number | null = null;

  const coachTips: Record<number, CoachTip> = {};
  const evComparisons: Record<number, EvComparison> = {};
  const spots: Record<number, SpotInsight> = {};
  const heroCardsText = `${hero.holeCards[0]} ${hero.holeCards[1]}`;

  const boardByStreet = new Map<Street, string[]>();
  for (const b of hand.boards) boardByStreet.set(b.street, b.cards);

  hand.actions.forEach((action, index) => {
    if (action.street !== street) {
      street = action.street;
      for (const s of states) s.streetInv = 0;
      curBet = 0;
      const fresh = boardByStreet.get(street) ?? [];
      for (const c of fresh) {
        const card = parseCard(c);
        ctx.board.push(card);
        ctx.dead[card] = 1;
      }
    }

    const actor = states.find((s) => s.id === action.playerId);
    if (!actor) return;
    const toCallNow = Math.max(0, curBet - actor.streetInv);
    const spot: SpotState = { street, pot, curBet, raisesBefore, limpers };

    if (actor.isHero) {
      const evalResult = evaluateSpot(ctx, states, actor, spot, action, bb);
      if (evalResult) {
        const { played, best, equity, potOddsPct } = evalResult;
        const rawLoss = Math.max(0, best.evBb - played.evBb);
        // Le modèle choisit mal entre deux tailles de mise : écart pondéré, jamais une « erreur ».
        const sizingOnly = isAggressive(played.type) && isAggressive(best.type);
        const loss = sizingOnly ? rawLoss * 0.4 : rawLoss;
        const threshold = Math.max(0.45, 0.05 * pot);
        let quality: CoachTip["quality"] = loss <= threshold * 0.25 ? "good" : loss <= threshold ? "ok" : "mistake";
        if (sizingOnly && quality === "mistake") quality = "ok";
        const kind: MistakeKind | "correct" =
          quality === "mistake" ? classifyMistake(played, best) : sizingOnly && loss > threshold * 0.25 ? "sizing" : "correct";

        let heroOpenNote = "";
        if (street === "preflop" && raisesBefore === 0 && toCallNow <= bb + 1e-6 && actor.behind > 0) {
          const pct = PCT_FROM_TOP[cellOf(heroCards[0], heroCards[1])] * 100;
          const limit = openPct(actor.behind);
          heroOpenNote =
            pct <= limit
              ? ` Ta main est dans une range d'ouverture standard (environ ${Math.round(limit)} % des mains en ${actor.position}).`
              : ` Ta main est hors d'une range d'ouverture standard (environ ${Math.round(limit)} % des mains en ${actor.position}).`;
        }

        const main = evalResult.mainVillain;
        const villainPos = main?.state.position;
        const multiway = states.filter((s) => !s.isHero && !s.folded).length >= 3;
        const ratio = threshold > 0 ? loss / threshold : 0;
        const confidence: SpotInsight["confidence"] =
          quality === "mistake" ? (ratio > 2.5 && !multiway ? "haute" : ratio > 1.5 ? "moyenne" : "faible") : multiway ? "faible" : "moyenne";

        const tip = buildTip(kind, quality, evalResult, actor, heroCardsText, street, loss, heroOpenNote, villainPos);
        coachTips[index] = tip;
        evComparisons[index] = { options: evalResult.options };
        const summary = rangeSummary(main);
        spots[index] = {
          kind,
          street,
          heroPosition: actor.position,
          equityPct: Math.round(equity * 1000) / 10,
          potOddsPct: potOddsPct != null ? Math.round(potOddsPct * 10) / 10 : undefined,
          potBb: round1(pot),
          toCallBb: round1(toCallNow),
          stackBb: round1(actor.startStack - actor.invested),
          villainId: main?.state.id,
          villainPosition: villainPos,
          villainRange: summary.villainRange,
          villainRangePct: summary.villainRangePct,
          villainRangeLabel: main ? main.state.labels.join(" → ") || "Range initiale" : undefined,
          confidence,
          evLossBb: round2(loss),
        };
      }
    } else if (action.type !== "fold") {
      // Affinage de la range de l'adversaire d'après son action.
      if (street === "preflop") {
        const facingAllIn = states.some((s) => s.allIn && !s.folded && s.streetInv >= curBet - 1e-9 && curBet > bb);
        const weights = preflopActionWeights({
          type: action.type,
          raisesBefore,
          limpersBefore: limpers,
          behind: actor.behind,
          openerBehind,
          isBigBlind: actor.isBigBlind,
          isSmallBlind: actor.isSmallBlind,
          stackBb: actor.startStack - actor.invested + actor.streetInv,
          amountBb: action.amountBb ?? 0,
          facingAllIn,
        });
        narrowPreflop(actor, weights);
      } else {
        narrowPostflop(actor, ctx, action, pot, toCallNow);
      }
      actor.labels.push(describeLabel(action, raisesBefore, street));
    }

    // Mise à jour de l'état de la main.
    actor.acted = true;
    if (action.type === "fold") {
      actor.folded = true;
    } else if (action.type === "call" || action.type === "bet") {
      const add = Math.min(action.amountBb ?? toCallNow, actor.startStack - actor.invested);
      actor.invested += add;
      actor.streetInv += add;
      pot += add;
      curBet = Math.max(curBet, actor.streetInv);
    } else if (action.type === "raise" || action.type === "allin") {
      const total = action.amountBb ?? curBet;
      const add = Math.min(Math.max(total - actor.streetInv, 0), actor.startStack - actor.invested);
      actor.invested += add;
      actor.streetInv += add;
      pot += add;
      curBet = Math.max(curBet, actor.streetInv);
    }
    if (actor.invested >= actor.startStack - 1e-9) actor.allIn = true;

    if (street === "preflop") {
      const raised = action.type === "raise" || (action.type === "allin" && curBet > spot.curBet + 1e-9) || (action.type === "bet");
      if (raised) {
        if (raisesBefore === 0) openerBehind = actor.behind;
        raisesBefore += 1;
      } else if (action.type === "call" && raisesBefore === 0) {
        limpers += 1;
      }
    }
  });

  return { ...hand, analyzed: true, coachTips, evComparisons, spots };
}

function describeLabel(action: HandAction, raisesBefore: number, street: Street): string {
  if (street === "preflop") {
    if (action.type === "raise" || action.type === "bet") {
      return raisesBefore === 0 ? `Ouvre ${fmtBb(action.amountBb ?? 0)}` : raisesBefore === 1 ? `3-bet ${fmtBb(action.amountBb ?? 0)}` : `4-bet+ ${fmtBb(action.amountBb ?? 0)}`;
    }
    if (action.type === "allin") return `Tapis ${fmtBb(action.amountBb ?? 0)}`;
    if (action.type === "call") return raisesBefore === 0 ? "Limp" : raisesBefore === 1 ? "Paie l'ouverture" : "Paie le 3-bet";
    return "Check";
  }
  const name = ACTION_NAME[action.type];
  return action.amountBb != null ? `${name} ${fmtBb(action.amountBb)} (${street})` : `${name} (${street})`;
}
