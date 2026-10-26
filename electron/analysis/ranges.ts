/**
 * Les 169 mains de départ, leur classement, et le modèle de ranges préflop.
 *
 * Le classement vient de l'équité de chaque main contre une main au hasard
 * (table générée une fois). Les pourcentages d'ouverture, de 3-bet, de défense
 * et de push sont des repères de joueur de MTT, pas une solution GTO.
 */

import { RANK_CHARS } from "./cards";
import { CLASS_EQUITY_VS_RANDOM } from "./classEquity.generated";

export const CELL_COUNT = 169;
export const TOTAL_COMBOS = 1326;

/** Case de la grille 13×13 d'une main : paires et assorties en haut, dépareillées en bas. */
export function cellOf(card1: number, card2: number): number {
  const r1 = card1 >> 2;
  const r2 = card2 >> 2;
  const hi = Math.max(r1, r2);
  const lo = Math.min(r1, r2);
  if (hi === lo) return hi * 13 + lo;
  const suited = (card1 & 3) === (card2 & 3);
  return suited ? hi * 13 + lo : lo * 13 + hi;
}

export function cellKind(cell: number): "pair" | "suited" | "offsuit" {
  const row = Math.floor(cell / 13);
  const col = cell % 13;
  if (row === col) return "pair";
  return row > col ? "suited" : "offsuit";
}

/** Nom d'une main : « AA », « AKs », « 72o ». */
export function cellKey(cell: number): string {
  const row = Math.floor(cell / 13);
  const col = cell % 13;
  if (row === col) return RANK_CHARS[row] + RANK_CHARS[row];
  if (row > col) return RANK_CHARS[row] + RANK_CHARS[col] + "s";
  return RANK_CHARS[col] + RANK_CHARS[row] + "o";
}

export function cellCombos(cell: number): number {
  const kind = cellKind(cell);
  return kind === "pair" ? 6 : kind === "suited" ? 4 : 12;
}

/** Toutes les mains précises (paires de cartes) d'une case. */
export function comboCardsOf(cell: number): Array<[number, number]> {
  const row = Math.floor(cell / 13);
  const col = cell % 13;
  const out: Array<[number, number]> = [];
  if (row === col) {
    for (let a = 0; a < 4; a += 1) for (let b = a + 1; b < 4; b += 1) out.push([row * 4 + a, row * 4 + b]);
    return out;
  }
  const hi = Math.max(row, col);
  const lo = Math.min(row, col);
  const suited = row > col;
  for (let a = 0; a < 4; a += 1) {
    for (let b = 0; b < 4; b += 1) {
      if (suited ? a === b : a !== b) out.push([hi * 4 + a, lo * 4 + b]);
    }
  }
  return out;
}

const ORDER: number[] = Array.from({ length: CELL_COUNT }, (_, i) => i).sort(
  (a, b) => CLASS_EQUITY_VS_RANDOM[b] - CLASS_EQUITY_VS_RANDOM[a] || a - b,
);

/** Part des mains strictement meilleures + moitié de la main elle-même (0 = meilleure). */
export const PCT_FROM_TOP: Float64Array = (() => {
  const out = new Float64Array(CELL_COUNT);
  let before = 0;
  for (const cell of ORDER) {
    const own = cellCombos(cell);
    out[cell] = (before + own / 2) / TOTAL_COMBOS;
    before += own;
  }
  return out;
})();

export const RANKED_CELLS: readonly number[] = ORDER;

const OUTSIDE = 0.03;

/** Poids 1 pour les mains entre les pourcentages `from` et `to` (en %), peu de poids ailleurs. */
export function bandWeights(fromPct: number, toPct: number, base: Float64Array | null = null): Float64Array {
  const out = new Float64Array(CELL_COUNT);
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    const pct = PCT_FROM_TOP[cell] * 100;
    const inside = pct >= fromPct && pct < toPct;
    out[cell] = inside ? 1 : OUTSIDE;
  }
  if (base) for (let i = 0; i < CELL_COUNT; i += 1) out[i] *= base[i];
  return out;
}

function interpolate(points: Array<[number, number]>, x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i += 1) {
    if (x <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

/** Part des mains ouvertes en premier, selon le nombre de joueurs encore à parler derrière. */
export function openPct(behind: number): number {
  return interpolate(
    [
      [1, 45], // SB face à la seule BB
      [2, 45], // bouton
      [3, 27], // CO
      [4, 21], // HJ
      [5, 18],
      [6, 15],
      [7, 13],
      [8, 12],
    ],
    behind,
  );
}

/** Part des mains poussées en tapis, selon le stack effectif (en bb). */
export function shovePct(stackBb: number, behind: number): number {
  const base = interpolate(
    [
      [2, 90],
      [3, 70],
      [5, 55],
      [8, 38],
      [10, 30],
      [12, 24],
      [15, 17],
      [20, 10],
      [30, 6],
      [50, 4],
    ],
    stackBb,
  );
  const factor = behind <= 1 ? 1.4 : behind === 2 ? 1.3 : behind === 3 ? 1.1 : behind >= 6 ? 0.7 : 0.85;
  return Math.min(100, base * factor);
}

/** Part des mains avec lesquelles on paie un tapis, selon le stack. */
export function callShovePct(stackBb: number, isBigBlind: boolean): number {
  const base = interpolate(
    [
      [3, 55],
      [8, 33],
      [10, 28],
      [15, 17],
      [25, 10],
      [40, 6],
    ],
    stackBb,
  );
  return Math.min(100, isBigBlind ? base * 1.3 : base);
}

export function threeBetPct(behind: number): number {
  if (behind <= 0) return 9; // BB
  if (behind === 1) return 8; // SB
  if (behind === 2) return 7; // bouton
  if (behind === 3) return 6.5;
  return 5.5;
}

export function bbDefendPct(openerBehind: number): number {
  if (openerBehind <= 1) return 55;
  if (openerBehind === 2) return 45;
  if (openerBehind === 3) return 36;
  if (openerBehind === 4) return 30;
  return 25;
}

export function coldCallPct(behind: number): number {
  if (behind === 2) return 12;
  if (behind === 3) return 9;
  return 6;
}

export interface PreflopActionContext {
  type: "raise" | "call" | "check" | "allin" | "bet";
  /** Nombre de relances déjà faites avant cette action. */
  raisesBefore: number;
  /** Joueurs qui avaient limpé avant. */
  limpersBefore: number;
  /** Joueurs encore à parler après ce joueur (BB = 0). */
  behind: number;
  /** Position de l'ouvreur (nombre de joueurs derrière lui), si une relance a eu lieu. */
  openerBehind: number | null;
  isBigBlind: boolean;
  isSmallBlind: boolean;
  /** Stack avant l'action, en bb. */
  stackBb: number;
  /** Montant total au tour (relance) en bb. */
  amountBb: number;
  /** Cette action répond à un tapis. */
  facingAllIn: boolean;
}

/**
 * Probabilité que chaque main de départ soit jouée de cette façon.
 * On la multiplie à la range de l'adversaire à chaque action.
 */
export function preflopActionWeights(ctx: PreflopActionContext): Float64Array {
  const { type } = ctx;
  const aggressive = type === "raise" || type === "allin" || type === "bet";
  const shove = type === "allin" || (aggressive && ctx.amountBb >= ctx.stackBb * 0.9);

  if (aggressive) {
    if (ctx.raisesBefore === 0) {
      if (shove) return bandWeights(0, shovePct(ctx.stackBb, ctx.behind));
      if (ctx.limpersBefore > 0) return bandWeights(0, Math.max(8, openPct(ctx.behind) * 0.7));
      return bandWeights(0, openPct(ctx.behind));
    }
    if (ctx.raisesBefore === 1) {
      if (shove) {
        const wide = ctx.stackBb <= 15 ? shovePct(ctx.stackBb, ctx.behind) * 0.7 : 3.5;
        return bandWeights(0, Math.max(3, Math.min(20, wide)));
      }
      return bandWeights(0, threeBetPct(ctx.behind));
    }
    if (shove) return bandWeights(0, ctx.stackBb <= 25 ? 8 : 3);
    return bandWeights(0, ctx.raisesBefore === 2 ? 3.2 : 1.8);
  }

  if (type === "call") {
    if (ctx.facingAllIn) return bandWeights(0, callShovePct(ctx.stackBb, ctx.isBigBlind));
    if (ctx.raisesBefore === 0) {
      const trap = bandWeights(0, 12);
      const limp = bandWeights(12, 62);
      return Float64Array.from(limp, (v, i) => Math.max(v, trap[i] > OUTSIDE ? 0.35 : 0));
    }
    if (ctx.raisesBefore === 1) {
      let hi: number;
      if (ctx.isBigBlind) hi = bbDefendPct(ctx.openerBehind ?? 3);
      else if (ctx.isSmallBlind) hi = 9;
      else hi = coldCallPct(ctx.behind);
      const lo = threeBetPct(ctx.behind) * 0.6;
      const weights = bandWeights(lo, hi);
      for (let cell = 0; cell < CELL_COUNT; cell += 1) {
        if (PCT_FROM_TOP[cell] * 100 < lo) weights[cell] = 0.25;
      }
      return weights;
    }
    if (ctx.raisesBefore === 2) {
      const weights = bandWeights(2, 13);
      for (let cell = 0; cell < CELL_COUNT; cell += 1) {
        if (PCT_FROM_TOP[cell] * 100 < 2) weights[cell] = 0.3;
      }
      return weights;
    }
    return bandWeights(1, 4.5);
  }

  // check : option de la grosse blinde, sans relance
  return bandWeights(6, 100);
}
