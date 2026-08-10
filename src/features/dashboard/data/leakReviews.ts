/**
 * Mains d’exemple liées à chaque fuite (leak) du dashboard.
 * Chaque main arrive déjà au coup problématique avec tip + EV.
 */

import type { ReplayHand } from "../../review/replay.types";
import type { LeakEntry } from "../types";

export interface LeakExplanation {
  title: string;
  detail: string;
  fix: string;
}

export interface LeakReviewPayload {
  leak: LeakEntry;
  explanation: LeakExplanation;
  hands: ReplayHand[];
  focusActionIndex: number;
}

/** BB overfold vs c-bet — Hero fold trop souvent */
const HAND_OVERFOLD_BB: ReplayHand = {
  id: "leak-overfold-bb",
  label: "Fuite #1 — Overfold BB vs c-bet",
  blindsBb: { small: 0.5, big: 1 },
  players: [
    { id: "btn", name: "Vilain", stackBb: 40, seatIndex: 0, position: "BTN" },
    { id: "sb", name: "SB", stackBb: 35, seatIndex: 1, position: "SB" },
    { id: "bb", name: "TOI", stackBb: 38, seatIndex: 2, position: "BB", isHero: true, holeCards: ["Jh", "9h"] },
  ],
  actions: [
    { playerId: "btn", type: "raise", amountBb: 2.5, street: "preflop" },
    { playerId: "sb", type: "fold", street: "preflop" },
    { playerId: "bb", type: "call", amountBb: 1.5, street: "preflop" },
    { playerId: "bb", type: "check", street: "flop" },
    { playerId: "btn", type: "bet", amountBb: 2.5, street: "flop" },
    { playerId: "bb", type: "fold", street: "flop" },
  ],
  boards: [{ street: "flop", cards: ["Td", "7c", "2s"] }],
  coachTips: {
    5: {
      quality: "mistake",
      headline: "Tu folds trop souvent ici",
      detail:
        "Avec J9s sur T72 rainbow, tu as un draw + overcards. Fold ~68% alors que l’optimal est ~52%. Continuer (call) gagne de l’EV.",
      evDiffBb: -0.35,
    },
  },
  evComparisons: {
    5: {
      options: [
        { type: "call", amountBb: 2.5, evBb: 0.22 },
        { type: "raise", amountBb: 7.5, evBb: 0.05 },
        { type: "fold", evBb: -0.15, isPlayed: true },
      ],
    },
  },
};

/** Call loose SB vs BTN open */
const HAND_LOOSE_SB: ReplayHand = {
  id: "leak-loose-sb",
  label: "Fuite #2 — Call trop loose SB",
  blindsBb: { small: 0.5, big: 1 },
  players: [
    { id: "btn", name: "Vilain", stackBb: 45, seatIndex: 0, position: "BTN" },
    { id: "sb", name: "TOI", stackBb: 42, seatIndex: 1, position: "SB", isHero: true, holeCards: ["Ks", "8d"] },
    { id: "bb", name: "BB", stackBb: 40, seatIndex: 2, position: "BB" },
  ],
  actions: [
    { playerId: "btn", type: "raise", amountBb: 2.5, street: "preflop" },
    { playerId: "sb", type: "call", amountBb: 2.0, street: "preflop" },
    { playerId: "bb", type: "fold", street: "preflop" },
  ],
  boards: [],
  coachTips: {
    1: {
      quality: "mistake",
      headline: "K8o hors de position = call trop large",
      detail:
        "Face à un open BTN, en SB tu es mal placé. Fold ou 3bet sélectif — call avec K8o te fait perdre ~2.8 bb/100 sur ce spot.",
      evDiffBb: -0.28,
    },
  },
  evComparisons: {
    1: {
      options: [
        { type: "fold", evBb: 0.05 },
        { type: "raise", amountBb: 9, evBb: -0.05 },
        { type: "call", amountBb: 2, evBb: -0.28, isPlayed: true },
      ],
    },
  },
};

/** Underbluff river IP */
const HAND_UNDERBLUFF: ReplayHand = {
  id: "leak-underbluff",
  label: "Fuite #3 — Underbluff river",
  blindsBb: { small: 0.5, big: 1 },
  players: [
    { id: "bb", name: "Vilain", stackBb: 50, seatIndex: 0, position: "BB" },
    { id: "btn", name: "TOI", stackBb: 55, seatIndex: 1, position: "BTN", isHero: true, holeCards: ["Ah", "5c"] },
  ],
  actions: [
    { playerId: "btn", type: "raise", amountBb: 2.5, street: "preflop" },
    { playerId: "bb", type: "call", amountBb: 1.5, street: "preflop" },
    { playerId: "bb", type: "check", street: "flop" },
    { playerId: "btn", type: "bet", amountBb: 3, street: "flop" },
    { playerId: "bb", type: "call", amountBb: 3, street: "flop" },
    { playerId: "bb", type: "check", street: "turn" },
    { playerId: "btn", type: "bet", amountBb: 8, street: "turn" },
    { playerId: "bb", type: "call", amountBb: 8, street: "turn" },
    { playerId: "bb", type: "check", street: "river" },
    { playerId: "btn", type: "check", street: "river" },
  ],
  boards: [
    { street: "flop", cards: ["Kd", "7h", "2c"] },
    { street: "turn", cards: ["9s"] },
    { street: "river", cards: ["3d"] },
  ],
  coachTips: {
    9: {
      quality: "mistake",
      headline: "Tu bluffes trop peu river",
      detail:
        "Avec A-high air après c-bet + barrel, une mise river à ~60% pot bluffe assez souvent. Check ici = underbluff (14% vs 28% optimal).",
      evDiffBb: -0.4,
    },
  },
  evComparisons: {
    9: {
      options: [
        { type: "bet", amountBb: 14, evBb: 0.35 },
        { type: "check", evBb: -0.05, isPlayed: true },
      ],
    },
  },
};

/** Bubble too tight */
const HAND_BUBBLE: ReplayHand = {
  id: "leak-bubble-tight",
  label: "Fuite #4 — Trop tight bulle",
  blindsBb: { small: 0.5, big: 1 },
  players: [
    { id: "utg", name: "Short", stackBb: 8, seatIndex: 0, position: "UTG" },
    { id: "mp", name: "MP", stackBb: 22, seatIndex: 1, position: "MP" },
    { id: "btn", name: "TOI", stackBb: 18, seatIndex: 2, position: "BTN", isHero: true, holeCards: ["As", "Ts"] },
    { id: "sb", name: "SB", stackBb: 25, seatIndex: 3, position: "SB" },
    { id: "bb", name: "BB", stackBb: 30, seatIndex: 4, position: "BB" },
  ],
  actions: [
    { playerId: "utg", type: "fold", street: "preflop" },
    { playerId: "mp", type: "fold", street: "preflop" },
    { playerId: "btn", type: "fold", street: "preflop" },
  ],
  boards: [],
  coachTips: {
    2: {
      quality: "mistake",
      headline: "ATs BTN bulle = open +EV",
      detail:
        "À 18 bb, ATs en BTN est un open standard même bulle. Fold ici laisse ~0.8 bb EV sur la table. Les stacks courts derrière te donnent de la pression.",
      evDiffBb: -0.8,
    },
  },
  evComparisons: {
    2: {
      options: [
        { type: "raise", amountBb: 2.2, evBb: 0.8 },
        { type: "fold", evBb: 0, isPlayed: true },
      ],
    },
  },
};

/** C-bet sizing too small */
const HAND_CBET_SIZE: ReplayHand = {
  id: "leak-cbet-size",
  label: "Fuite #5 — C-bet trop petit",
  blindsBb: { small: 0.5, big: 1 },
  players: [
    { id: "bb", name: "Vilain", stackBb: 48, seatIndex: 0, position: "BB" },
    { id: "btn", name: "TOI", stackBb: 52, seatIndex: 1, position: "BTN", isHero: true, holeCards: ["Qh", "Qd"] },
  ],
  actions: [
    { playerId: "btn", type: "raise", amountBb: 2.5, street: "preflop" },
    { playerId: "bb", type: "call", amountBb: 1.5, street: "preflop" },
    { playerId: "bb", type: "check", street: "flop" },
    { playerId: "btn", type: "bet", amountBb: 1.5, street: "flop" },
  ],
  boards: [{ street: "flop", cards: ["Kd", "8c", "3h"] }],
  coachTips: {
    3: {
      quality: "ok",
      headline: "Sizing trop petit sur board sec",
      detail:
        "Sur K83 rainbow, un c-bet ~55% pot (≈3 bb) protège mieux et construit le pot. À 30% pot tu laisses trop de cotes de call.",
      evDiffBb: -0.18,
    },
  },
  evComparisons: {
    3: {
      options: [
        { type: "bet", amountBb: 3.0, evBb: 0.45 },
        { type: "bet", amountBb: 1.5, evBb: 0.27, isPlayed: true },
        { type: "check", evBb: 0.1 },
      ],
    },
  },
};

const LEAK_REVIEWS: Record<string, Omit<LeakReviewPayload, "leak">> = {
  l1: {
    explanation: {
      title: "Tu folds trop en BB face au c-bet",
      detail:
        "Exemple typique : J9s sur un flop T72. Tu as abandonné alors qu’un call (ou parfois un raise) est plus rentable.",
      fix: "Continue plus souvent avec draws + overcards. Objectif : fold ≈ 52%, pas 68%.",
    },
    hands: [HAND_OVERFOLD_BB],
    focusActionIndex: 5,
  },
  l2: {
    explanation: {
      title: "Tes calls SB vs BTN sont trop larges",
      detail:
        "K8o hors de position face à un open bouton : tu joues un pot difficile avec une main moyenne.",
      fix: "Folde les mains moyennes. Garde call / 3bet pour les meilleures mains de ta range SB.",
    },
    hands: [HAND_LOOSE_SB],
    focusActionIndex: 1,
  },
  l3: {
    explanation: {
      title: "Tu bluffes trop peu river en position",
      detail:
        "Après avoir misé flop et turn avec de l’air, check river = tu abandonnes trop d’EV de bluff.",
      fix: "Ajoute des bluffs river (~28% de la range) sur les boards où vilain a beaucoup de folds.",
    },
    hands: [HAND_UNDERBLUFF],
    focusActionIndex: 9,
  },
  l4: {
    explanation: {
      title: "Trop tight à la bulle",
      detail:
        "ATs en BTN à 18 bb est un open +EV. Folder laisse de l’argent sur la table, même en ICM.",
      fix: "Ouvre un peu plus large BTN/CO quand les stacks courts sont derrière toi.",
    },
    hands: [HAND_BUBBLE],
    focusActionIndex: 2,
  },
  l5: {
    explanation: {
      title: "C-bet trop petit sur boards secs",
      detail:
        "Avec QQ sur K83, un sizing 30% pot donne de trop bonnes cotes. 50–60% pot est plus standard.",
      fix: "Sur boards secs / à hautes cartes, vise ~55% pot pour value et protection.",
    },
    hands: [HAND_CBET_SIZE],
    focusActionIndex: 3,
  },
};

export function buildLeakReview(leak: LeakEntry): LeakReviewPayload | null {
  const pack = LEAK_REVIEWS[leak.id];
  if (!pack) return null;
  return { leak, ...pack };
}
