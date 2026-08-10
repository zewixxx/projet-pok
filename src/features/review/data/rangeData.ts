/**
 * rangeData.ts
 *
 * Pure data layer: combo-key helpers, type definitions, GTO range constants,
 * and the cell-background CSS helper.
 *
 * SOLID: this module has ONE reason to change — the range data itself.
 * Detection / business logic lives in rangeDetection.ts (SRP).
 */

// ─── Grid helpers ─────────────────────────────────────────────────────────────

export const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'] as const;
export type Rank = typeof RANKS[number];

/** Rank numeric value: A=12, K=11, ..., 2=0 */
export function rankVal(r: string): number {
  return 12 - (RANKS as ReadonlyArray<string>).indexOf(r);
}

/**
 * Returns the canonical combo key for grid position (row, col).
 *   row === col  → pair  (e.g., "AA")
 *   row  <  col  → suited (e.g., "AKs")   ← upper-right triangle
 *   row  >  col  → offsuit (e.g., "AKo")  ← lower-left triangle
 */
export function comboKey(row: number, col: number): string {
  if (row === col) return RANKS[row] + RANKS[row];
  if (row < col)  return RANKS[row] + RANKS[col] + 's';
  return RANKS[col] + RANKS[row] + 'o';
}

/** Derive the combo key from two hole-card notations (e.g., "Ah", "Kd" → "AKo") */
export function heroComboKey(card1: string, card2: string): string | null {
  if (!card1 || !card2 || card1.length < 2 || card2.length < 2) return null;
  const r1 = card1[0], s1 = card1[1];
  const r2 = card2[0], s2 = card2[1];
  if ((RANKS as ReadonlyArray<string>).indexOf(r1) === -1) return null;
  if ((RANKS as ReadonlyArray<string>).indexOf(r2) === -1) return null;
  const isHigh1 = rankVal(r1) >= rankVal(r2);
  const [hr, lr] = isHigh1 ? [r1, r2] : [r2, r1];
  if (r1 === r2) return hr + hr;
  if (s1 === s2) return hr + lr + 's';
  return hr + lr + 'o';
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ActionKey = 'raise' | 'call' | 'fold' | 'bet' | 'check' | 'allin' | 'threebet';

export type ActionWeights = Partial<Record<ActionKey, number>>;

export interface RangeAction {
  key:   ActionKey;
  label: string;
  color: string;
}

export interface RangeSpot {
  id:          string;
  label:       string;
  description: string;
  actor:       'hero' | 'villain';
  actions:     RangeAction[];     // ordered list of playable actions (fold excluded)
  cells:       Record<string, ActionWeights>;
}

// ─── Action palette ───────────────────────────────────────────────────────────

/** Palette type solveur GTO (vert raise / bleu call / rouge fold léger) */
const C_RAISE   = '#5a9e6f';
const C_CALL    = '#3498db';
const C_3BET    = '#e67e22';
const C_ALLIN   = '#9b59b6';
const C_BET     = '#5a9e6f';
const C_CHECK   = '#4a6278';
const C_FOLD    = '#141b24';

// ─── Grid builder ─────────────────────────────────────────────────────────────

interface RangeGroup {
  hands:   string[];
  weights: ActionWeights;
}

function buildGrid(groups: RangeGroup[]): Record<string, ActionWeights> {
  const grid: Record<string, ActionWeights> = {};

  // Initialise every cell to pure fold
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const key = comboKey(r, c);
      if (!grid[key]) grid[key] = { fold: 1 };
    }
  }

  // Apply groups in order — later groups override earlier ones
  for (const { hands, weights } of groups) {
    for (const hand of hands) {
      if (hand in grid) grid[hand] = weights;
    }
  }

  return grid;
}

// ─── Shared weight constants ──────────────────────────────────────────────────

const W_RAISE:        ActionWeights = { raise: 1 };
const W_CALL:         ActionWeights = { call: 1 };
const W_3BET:         ActionWeights = { threebet: 1 };
const W_ALLIN:        ActionWeights = { allin: 1 };
const W_BET:          ActionWeights = { bet: 1 };
const W_CHECK:        ActionWeights = { check: 1 };
const W_RAISE70:      ActionWeights = { raise: 0.70, fold: 0.30 };
const W_RAISE50:      ActionWeights = { raise: 0.50, fold: 0.50 };
const W_CALL50:       ActionWeights = { call: 0.50, fold: 0.50 };
const W_3BET50_CALL:  ActionWeights = { threebet: 0.50, call: 0.50 };
const W_3BET30_CALL:  ActionWeights = { threebet: 0.30, call: 0.70 };
const W_4BET40_CALL:  ActionWeights = { threebet: 0.40, call: 0.60 };
const W_BET60:        ActionWeights = { bet: 0.60, check: 0.40 };
const W_ALLIN60:      ActionWeights = { allin: 0.60, fold: 0.40 };

// ─────────────────────────────────────────────────────────────────────────────
//  SPOT 1 — BTN Open RFI
// ─────────────────────────────────────────────────────────────────────────────

const BTN_OPEN: RangeGroup[] = [
  {
    hands: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'KQs','KJs','KTs','K9s','K8s','K7s',
      'QJs','QTs','Q9s','Q8s',
      'JTs','J9s','J8s',
      'T9s','T8s','T7s',
      '98s','97s','96s',
      '87s','86s',
      '76s','75s',
      '65s','64s','54s',
      'AKo','AQo','AJo','ATo',
      'KQo','KJo',
      'QJo','JTo',
    ],
    weights: W_RAISE,
  },
  {
    hands: [
      '44','33','22',
      'K6s','K5s','K4s','K3s','K2s',
      'Q7s','Q6s','Q5s','Q4s',
      'J7s','J6s',
      'T6s','T5s',
      '95s','85s','74s','63s','53s','43s','32s',
      'A9o','A8o','A7o',
      'KTo','K9o',
      'QTo','Q9o',
    ],
    weights: W_RAISE70,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SPOT 2 — CO Open RFI
// ─────────────────────────────────────────────────────────────────────────────

const CO_OPEN: RangeGroup[] = [
  {
    hands: [
      'AA','KK','QQ','JJ','TT','99','88','77','66',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s',
      'KQs','KJs','KTs','K9s','K8s',
      'QJs','QTs','Q9s',
      'JTs','J9s','J8s',
      'T9s','T8s',
      '98s','97s',
      '87s','86s',
      '76s','75s',
      '65s','54s',
      'AKo','AQo','AJo','ATo',
      'KQo','KJo',
      'QJo',
    ],
    weights: W_RAISE,
  },
  {
    hands: [
      '55','44','33','22',
      'K7s','K6s','K5s','K4s','K3s','K2s',
      'Q8s','Q7s','Q6s',
      'J7s','T7s','T6s',
      '96s','86s','75s','64s','53s','43s',
      'A9o','A8o',
      'KTo','K9o',
      'QTo',
    ],
    weights: W_RAISE50,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SPOT 3 — Hero vs Open (3bet / Call / Fold)
// ─────────────────────────────────────────────────────────────────────────────

const VS_OPEN: RangeGroup[] = [
  // Value 3-bets
  { hands: ['AA','KK','QQ','AKs','AKo'],            weights: W_3BET },
  // Mixed 3-bet / call
  { hands: ['JJ','TT','AQs','AQo'],                 weights: W_3BET50_CALL },
  // Pure call
  {
    hands: [
      '99','88','77',
      'AJs','ATs','A9s','A8s','A7s',
      'KQs','KJs','KTs',
      'QJs','QTs','JTs','T9s','98s','87s','76s','65s',
      'AJo','ATo',
      'KQo','KJo','QJo',
    ],
    weights: W_CALL,
  },
  // Mixed call / fold
  {
    hands: [
      '66','55','44',
      'A6s','K9s','K8s','K7s',
      'Q9s','J9s','T8s','97s','86s','75s','64s','54s',
      'A9o','A8o','K9o',
    ],
    weights: W_CALL50,
  },
  // Bluff 3-bets (suited aces with low kicker — overrides call group)
  { hands: ['A5s','A4s','A3s','A2s'], weights: W_3BET30_CALL },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SPOT 4 — Hero vs 3-bet (4bet / Call / Fold)
// ─────────────────────────────────────────────────────────────────────────────

const VS_3BET: RangeGroup[] = [
  // Pure 4-bet value
  { hands: ['AA','KK','QQ','AKs','AKo'],            weights: W_3BET },
  // Mixed 4-bet / call
  { hands: ['JJ','AQs'],                            weights: W_4BET40_CALL },
  // Pure call (IP)
  {
    hands: [
      'TT','99',
      'AJs','ATs',
      'KQs','KJs',
      'QJs','JTs',
      'AQo',
    ],
    weights: W_CALL,
  },
  // Mixed call / fold
  {
    hands: [
      '88','77',
      'A9s','A8s',
      'KTs','QTs','T9s',
      'AJo','KQo',
    ],
    weights: W_CALL50,
  },
  // Bluff 4-bets
  { hands: ['A5s','A4s'], weights: { threebet: 0.60, fold: 0.40 } },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SPOT 5 — Push range ~15bb
// ─────────────────────────────────────────────────────────────────────────────

const PUSH_15BB: RangeGroup[] = [
  {
    hands: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'KQs','KJs','KTs','K9s','K8s',
      'QJs','QTs','Q9s',
      'JTs','J9s',
      'T9s','T8s',
      '98s','87s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o',
      'KQo','KJo','KTo',
      'QJo',
    ],
    weights: W_ALLIN,
  },
  {
    hands: [
      '33','22',
      'K7s','K6s','K5s',
      'Q8s','Q7s','J8s','T7s','97s','86s',
      'A6o','A5o',
      'K9o',
    ],
    weights: W_ALLIN60,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SPOT 6 — Flop C-bet IP (generic 3-bet pot)
// ─────────────────────────────────────────────────────────────────────────────

const CBET_IP_FLOP: RangeGroup[] = [
  // Always bet: strong value hands
  {
    hands: [
      'AA','KK','QQ','JJ','TT',
      'AKs','AQs','AJs','ATs',
      'KQs','KJs',
      'QJs',
      'JTs',
      'AKo','AQo','AJo','ATo',
      'KQo','KJo',
    ],
    weights: W_BET,
  },
  // Mixed bet / check: medium-strength + draws
  {
    hands: [
      '99','88','77',
      'A9s','A8s','A7s','A6s','A5s',
      'KTs','K9s','K8s',
      'QTs','Q9s',
      'J9s','T9s','98s','87s','76s','65s',
      'A9o','A8o',
    ],
    weights: W_BET60,
  },
  // Check-back: weak hands / no equity
  {
    hands: [
      '66','55','44','33','22',
      'A4s','A3s','A2s',
      'K7s','K6s','K5s','K4s','K3s','K2s',
      'Q8s','Q7s','Q6s','Q5s',
      'J8s','J7s','J6s',
      'T8s','T7s','T6s',
      '97s','96s','85s','75s','74s','63s','54s','43s','32s',
      'A7o','A6o','A5o',
      'KTo','K9o',
      'QJo','QTo','JTo',
    ],
    weights: W_CHECK,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  All spots export
// ─────────────────────────────────────────────────────────────────────────────

export const RANGE_SPOTS: RangeSpot[] = [
  {
    id:          'btn-open',
    label:       'BTN Open',
    description: "Range d'ouverture depuis le bouton (RFI)",
    actor:       'hero',
    actions:     [{ key: 'raise', label: 'Raise', color: C_RAISE }],
    cells:       buildGrid(BTN_OPEN),
  },
  {
    id:          'co-open',
    label:       'CO Open',
    description: "Range d'ouverture depuis le cutoff (RFI)",
    actor:       'hero',
    actions:     [{ key: 'raise', label: 'Raise', color: C_RAISE }],
    cells:       buildGrid(CO_OPEN),
  },
  {
    id:          'vs-open',
    label:       'vs Open',
    description: 'Stratégie optimale face à une 1ère ouverture (3bet / call / fold)',
    actor:       'hero',
    actions:     [
      { key: 'threebet', label: '3bet',  color: C_3BET },
      { key: 'call',     label: 'Call',  color: C_CALL },
    ],
    cells:       buildGrid(VS_OPEN),
  },
  {
    id:          'vs-3bet',
    label:       'vs 3bet',
    description: 'Réponse optimale face à un 3bet après votre ouverture (4bet / call / fold)',
    actor:       'hero',
    actions:     [
      { key: 'threebet', label: '4bet',  color: C_3BET },
      { key: 'call',     label: 'Call',  color: C_CALL },
    ],
    cells:       buildGrid(VS_3BET),
  },
  {
    id:          'push-15bb',
    label:       'Push ~15bb',
    description: 'Stratégie push-or-fold en dessous de 15bb',
    actor:       'hero',
    actions:     [{ key: 'allin', label: 'All-in', color: C_ALLIN }],
    cells:       buildGrid(PUSH_15BB),
  },
  {
    id:          'cbet-ip-flop',
    label:       'C-bet Flop IP',
    description: 'Décision de mise au flop en position (pot 3bet)',
    actor:       'hero',
    actions:     [
      { key: 'bet',   label: 'Bet',   color: C_BET },
      { key: 'check', label: 'Check', color: C_CHECK },
    ],
    cells:       buildGrid(CBET_IP_FLOP),
  },
];

// ─── Cell background helper ───────────────────────────────────────────────────

/**
 * Returns a CSS `background` value for a cell given its action weights.
 * colorMap should be built from the spot's `actions` array for consistency.
 */
export function cellBackground(
  weights:  ActionWeights,
  colorMap: Record<string, string>,
): string {
  const entries = Object.entries(weights).filter(
    ([k, v]) => k !== 'fold' && (v ?? 0) > 0,
  );

  if (entries.length === 0) return colorMap.fold ?? C_FOLD;

  if (entries.length === 1 && (weights.fold ?? 0) === 0) {
    return colorMap[entries[0][0]] ?? C_FOLD;
  }

  // Stratégies mixtes — dégradé horizontal (raise/call/…) + liseré fold à gauche
  const playable = Object.entries(weights).filter(
    ([k, v]) => k !== "fold" && (v ?? 0) > 0.01,
  );
  const foldFrac = weights.fold ?? 0;

  let pos = foldFrac > 0.01 ? foldFrac * 100 : 0;
  const stops: string[] = [];

  if (foldFrac > 0.01) {
    stops.push(`#c0392b 0% ${pos.toFixed(1)}%`);
  }

  for (const [key, fraction] of playable) {
    const color = colorMap[key] ?? C_FOLD;
    const end = pos + (fraction ?? 0) * 100;
    stops.push(`${color} ${pos.toFixed(1)}% ${end.toFixed(1)}%`);
    pos = end;
  }

  return `linear-gradient(to right, ${stops.join(", ")})`;
}
