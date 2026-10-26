/**
 * Évaluateur de mains de poker (5 à 7 cartes).
 * Retourne un entier : plus il est grand, plus la main est forte.
 * Catégorie dans les bits 20+, puis les cartes qui départagent, 4 bits chacune.
 */

const rankCount = new Int8Array(13);
const suitCount = new Int8Array(4);
const suitMask = new Int32Array(4);

function straightHigh(mask: number): number {
  for (let top = 12; top >= 4; top -= 1) {
    if (((mask >> (top - 4)) & 31) === 31) return top;
  }
  // Roue : A-2-3-4-5
  if ((mask & 0x100f) === 0x100f) return 3;
  return -1;
}

function highestOther(excluded1: number, excluded2: number, skip: number): number {
  let found = 0;
  for (let rank = 12; rank >= 0; rank -= 1) {
    if (rank === excluded1 || rank === excluded2) continue;
    if (rankCount[rank] === 0) continue;
    if (skip === 0) {
      found = rank;
      break;
    }
    skip -= 1;
  }
  return found;
}

export function evaluate(cards: ArrayLike<number>, count: number): number {
  rankCount.fill(0);
  suitCount.fill(0);
  suitMask.fill(0);
  let mask = 0;
  for (let i = 0; i < count; i += 1) {
    const card = cards[i];
    const rank = card >> 2;
    const suit = card & 3;
    rankCount[rank] += 1;
    suitCount[suit] += 1;
    suitMask[suit] |= 1 << rank;
    mask |= 1 << rank;
  }

  let flushSuit = -1;
  for (let s = 0; s < 4; s += 1) if (suitCount[s] >= 5) flushSuit = s;

  if (flushSuit >= 0) {
    const sf = straightHigh(suitMask[flushSuit]);
    if (sf >= 0) return (8 << 20) | sf;
  }

  let quad = -1;
  let trips = -1;
  let trips2 = -1;
  let pair1 = -1;
  let pair2 = -1;
  for (let rank = 12; rank >= 0; rank -= 1) {
    const n = rankCount[rank];
    if (n === 4) quad = rank;
    else if (n === 3) {
      if (trips < 0) trips = rank;
      else trips2 = rank;
    } else if (n === 2) {
      if (pair1 < 0) pair1 = rank;
      else if (pair2 < 0) pair2 = rank;
    }
  }

  if (quad >= 0) return (7 << 20) | (quad << 4) | highestOther(quad, -1, 0);

  if (trips >= 0 && (trips2 >= 0 || pair1 >= 0)) {
    const pairPart = Math.max(trips2, pair1);
    return (6 << 20) | (trips << 4) | pairPart;
  }

  if (flushSuit >= 0) {
    let score = 5 << 20;
    let shift = 16;
    for (let rank = 12; rank >= 0 && shift >= 0; rank -= 1) {
      if (suitMask[flushSuit] & (1 << rank)) {
        score |= rank << shift;
        shift -= 4;
      }
    }
    return score;
  }

  const st = straightHigh(mask);
  if (st >= 0) return (4 << 20) | st;

  if (trips >= 0) {
    return (3 << 20) | (trips << 8) | (highestOther(trips, -1, 0) << 4) | highestOther(trips, -1, 1);
  }

  if (pair1 >= 0 && pair2 >= 0) {
    return (2 << 20) | (pair1 << 8) | (pair2 << 4) | highestOther(pair1, pair2, 0);
  }

  if (pair1 >= 0) {
    return (
      (1 << 20) |
      (pair1 << 12) |
      (highestOther(pair1, -1, 0) << 8) |
      (highestOther(pair1, -1, 1) << 4) |
      highestOther(pair1, -1, 2)
    );
  }

  let score = 0;
  let shift = 16;
  for (let rank = 12; rank >= 0 && shift >= 0; rank -= 1) {
    if (rankCount[rank] > 0) {
      score |= rank << shift;
      shift -= 4;
    }
  }
  return score;
}

export const HAND_CATEGORY_NAMES = [
  "Carte haute",
  "Paire",
  "Double paire",
  "Brelan",
  "Quinte",
  "Couleur",
  "Full",
  "Carré",
  "Quinte flush",
] as const;

export function categoryOf(score: number): number {
  return score >> 20;
}
