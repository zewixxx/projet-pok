/**
 * rangeDetection.ts
 *
 * Business logic for determining which GTO range applies at any given action
 * in a hand replay, and for computing villain's current probable range via a
 * sequential Bayesian update over their observed actions.
 *
 * SOLID principles:
 *  S – Single Responsibility: only detection & narrowing logic lives here.
 *  O – Open/Closed: ACTION_MATCHERS lookup table lets new action-spot
 *      mappings be added without touching the narrowing algorithm.
 *  D – Dependency Inversion: depends only on the stable rangeData
 *      abstractions (RangeSpot, ActionKey, RANGE_SPOTS), not concretions.
 */

import type { ReplayHand, ReplayPlayerState } from '../replay.types';
import { RANGE_SPOTS, comboKey, heroComboKey } from './rangeData';
import type { ActionKey, RangeSpot } from './rangeData';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface VillainRangeData {
  playerId:    string;
  playerLabel: string;
  /** Human-readable sequence of observed villain actions */
  label:       string;
  /** Estimated % of the 169-combo grid still in range, e.g. "18.3%" */
  pct:         string;
  /** combo key → probability 0–1 (normalised) */
  probs:       Record<string, number>;
}

export interface RangeContext {
  spot:        RangeSpot;
  heroCombo:   string | null;
  spotIndex:   number;
  villainData: VillainRangeData | null;
}

// ─── OCP: action-to-spot lookup table ─────────────────────────────────────────
//
// Adding support for a new street/action-type combination requires only
// appending a new row here — the narrowing algorithm is never modified.

interface ActionMatcher {
  street:    'preflop' | 'flop' | 'turn' | 'river';
  type:      ActionKey;
  /** Optional context guard; omit to always match */
  condition?: (ctx: ActionMatchContext) => boolean;
  spotId:    string;
  actionKey: ActionKey;
  /** Description fragment for the action label string */
  describe:  (amountBb?: number) => string;
}

interface ActionMatchContext {
  pfRaisesOthers: number;
  villainRaises:  number;
}

const ACTION_MATCHERS: readonly ActionMatcher[] = [
  // ── Preflop ────────────────────────────────────────────────────────────────
  {
    street: 'preflop', type: 'raise',
    spotId: 'btn-open', actionKey: 'raise',
    describe: (bb) => `Raise ${bb ?? ''}bb`,
  },
  {
    street: 'preflop', type: 'allin',
    spotId: 'push-15bb', actionKey: 'allin',
    describe: (bb) => `Push ${bb ?? ''}bb`,
  },
  {
    street: 'preflop', type: 'call',
    condition: (ctx) => ctx.pfRaisesOthers === 1 && ctx.villainRaises === 0,
    spotId: 'vs-open', actionKey: 'call',
    describe: () => "Appelle l'open",
  },
  {
    street: 'preflop', type: 'call',
    condition: (ctx) => ctx.pfRaisesOthers + ctx.villainRaises >= 2,
    spotId: 'vs-3bet', actionKey: 'call',
    describe: () => 'Appelle le 3bet',
  },
  // ── Flop ───────────────────────────────────────────────────────────────────
  {
    street: 'flop', type: 'check',
    spotId: 'cbet-ip-flop', actionKey: 'check',
    describe: () => 'Check flop',
  },
  {
    street: 'flop', type: 'bet',
    spotId: 'cbet-ip-flop', actionKey: 'bet',
    describe: (bb) => `Bet ${bb ?? ''}bb flop`,
  },
] as const;

/** Finds the first matching row in ACTION_MATCHERS for a villain action. */
function resolveActionMapping(
  street:   string,
  type:     string,
  ctx:      ActionMatchContext,
): ActionMatcher | undefined {
  return ACTION_MATCHERS.find(
    (m) =>
      m.street === street &&
      m.type   === type   &&
      (!m.condition || m.condition(ctx)),
  );
}

// ─── Villain range computation ────────────────────────────────────────────────

/**
 * Range déduite par le moteur d'analyse. Elle n'existe qu'aux décisions du héros :
 * pour une autre action, on prend la prochaine décision du héros (qui inclut cette
 * action), sinon la dernière.
 */
export function villainRangeFromEngine(hand: ReplayHand, actionIndex: number): VillainRangeData | null {
  if (!hand.analyzed || !hand.spots) return null;
  const indexes = Object.keys(hand.spots).map(Number).sort((a, b) => a - b);
  const pick = indexes.find((i) => i >= actionIndex) ?? indexes[indexes.length - 1];
  const spot = pick != null ? hand.spots[pick] : undefined;
  if (!spot?.villainRange || !spot.villainId) return null;
  return {
    playerId: spot.villainId,
    playerLabel: spot.villainPosition ?? "Adversaire",
    label: spot.villainRangeLabel ?? "Range estimée",
    pct: spot.villainRangePct ?? "",
    probs: spot.villainRange,
  };
}

/**
 * Computes villain's current range as a probability map by sequentially
 * multiplying the frequency of each action they took against the matching
 * pre-defined strategy grid.
 *
 * Bayesian update: P(combo | actions) ∝ ∏ freq(action_i | combo)
 *
 * The result is normalised so max = 1.0 for display purposes.
 */
export function computeVillainRangeData(
  hand:       ReplayHand,
  upToIndex:  number,
  heroId:     string,
): VillainRangeData | null {
  // Main analysée par le moteur : on affiche ses ranges déduites plutôt que la grille de référence.
  const fromEngine = villainRangeFromEngine(hand, upToIndex);
  if (fromEngine) return fromEngine;

  // Find the main villain: prefer raisers over passive callers, exclude hero & vB (3rd villain)
  const meaningful = hand.actions
    .slice(0, upToIndex + 1)
    .filter((a) => a.playerId !== heroId && a.type !== 'fold' && a.playerId !== 'vB');

  if (meaningful.length === 0) return null;

  const villainId = (
    meaningful.find((a) => a.type === 'raise' || a.type === 'allin') ?? meaningful[0]
  ).playerId;

  const villainPlayer = hand.players.find((p) => p.id === villainId);
  const playerLabel   = villainPlayer?.position ?? villainPlayer?.name ?? 'Villain';

  // Initialise all 169 combos at full probability (Bayesian prior = uniform)
  const probs: Record<string, number> = {};
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const k = comboKey(r, c);
      if (!probs[k]) probs[k] = 1.0;
    }
  }

  let villainRaises  = 0;
  let pfRaisesOthers = 0;
  let hasFolded      = false;
  const actionLabels: string[] = [];

  for (let i = 0; i <= upToIndex; i++) {
    const action = hand.actions[i];

    if (action.playerId !== villainId) {
      if (action.street === 'preflop' && action.type === 'raise') pfRaisesOthers++;
      continue;
    }

    if (action.type === 'fold') {
      hasFolded = true;
      Object.keys(probs).forEach((k) => { probs[k] = 0; });
      actionLabels.push('Fold');
      break;
    }

    const ctx: ActionMatchContext = { pfRaisesOthers, villainRaises };
    const match = resolveActionMapping(action.street, action.type, ctx);

    if (match) {
      const spot = RANGE_SPOTS.find((s) => s.id === match.spotId);
      if (spot) {
        for (const [combo, weights] of Object.entries(spot.cells)) {
          const freq = (weights as Record<string, number>)[match.actionKey] ?? 0;
          probs[combo] = (probs[combo] ?? 1) * freq;
        }
      }
      actionLabels.push(match.describe(action.amountBb));
    }

    if (action.street === 'preflop' && action.type === 'raise') villainRaises++;
  }

  // Normalise so max = 1.0
  const maxP = Math.max(...Object.values(probs), 0.0001);
  if (!hasFolded) {
    for (const k of Object.keys(probs)) probs[k] /= maxP;
  }

  const inRange = Object.values(probs).filter((p) => p > 0.1).length;
  const pct     = ((inRange / 169) * 100).toFixed(1);
  const label   = hasFolded
    ? 'Villain a foldé'
    : actionLabels.length > 0
      ? actionLabels.join(' → ')
      : 'Range initiale';

  return { playerId: villainId, playerLabel, label, pct, probs };
}

// ─── Hero spot detection ──────────────────────────────────────────────────────

/** Maps hero's current action to the most relevant GTO reference spot. */
function resolveHeroSpotId(
  action:    ReplayHand['actions'][number],
  hero:      ReplayPlayerState | undefined,
  pfRaises:  number,
): string {
  if (action.street !== 'preflop') return 'cbet-ip-flop';

  if (action.type === 'allin') return 'push-15bb';

  if (pfRaises === 0) {
    const pos = hero?.position ?? 'BTN';
    return ['CO', 'BTN', 'SB'].includes(pos) ? 'btn-open' : 'co-open';
  }

  return pfRaises === 1 ? 'vs-open' : 'vs-3bet';
}

/**
 * Determines which GTO range spot applies to the current action, and
 * simultaneously computes the villain's estimated range.
 */
export function detectRangeSpot(
  hand:        ReplayHand,
  actionIndex: number,
  players:     ReplayPlayerState[],
): RangeContext {
  const hero      = players.find((p) => p.isHero);
  const heroCards = hero?.holeCards;
  const heroCombo = heroCards ? heroComboKey(heroCards[0], heroCards[1]) : null;
  const heroId    = hero?.id ?? 'hero';

  const action      = hand.actions[actionIndex];
  const isHeroAct   = action.playerId === heroId;
  const prevActions = hand.actions.slice(0, actionIndex);
  const pfRaises    = prevActions.filter(
    (a) => a.street === 'preflop' && (a.type === 'raise' || a.type === 'allin'),
  ).length;

  const spotId = isHeroAct
    ? resolveHeroSpotId(action, hero, pfRaises)
    : (action.type === 'raise' || action.type === 'allin') ? 'btn-open' : 'vs-open';

  const spotIndex  = RANGE_SPOTS.findIndex((s) => s.id === spotId);
  const spot       = RANGE_SPOTS[Math.max(spotIndex, 0)];
  const villainData = computeVillainRangeData(hand, actionIndex, heroId);

  return { spot, heroCombo, spotIndex: Math.max(spotIndex, 0), villainData };
}
