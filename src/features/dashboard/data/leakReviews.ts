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
  label: "Exemple 1 — tu te couches trop en grosse blinde",
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
      headline: "Tu te couches trop souvent ici",
      detail:
        "Valet-neuf de cœur sur 10-7-2 : tu as un tirage et deux cartes plus hautes que le tableau. Suivre rapporte plus que de te coucher.",
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
  label: "Exemple 2 — tu suis trop large en petite blinde",
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
      headline: "Roi-huit est trop faible pour suivre ici",
      detail:
        "En petite blinde, face à une relance du bouton, tu parles en premier après le flop. Couche cette main, ou relance seulement avec mieux.",
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
  label: "Exemple 3 — tu bluffes trop peu à la river",
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
      headline: "Tu bluffes trop peu à la river",
      detail:
        "Tu as misé au flop et au turn sans rien. À la river, une mise d'environ la moitié du pot fait souvent coucher l'adversaire. Checker abandonne ce coup.",
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
  label: "Exemple 4 — tu te couches trop à la bulle",
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
      headline: "As-dix au bouton se relance, même à la bulle",
      detail:
        "Avec 18 grosses blindes au bouton, as-dix assorti est une relance rentable. Te coucher laisse de l'argent, surtout si les petits tapis sont derrière toi.",
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
  label: "Exemple 5 — ta mise de continuation est trop petite",
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
      headline: "Ta mise est trop petite",
      detail:
        "Sur roi-8-3, une mise d'environ la moitié du pot protège mieux ta main. Une toute petite mise donne de trop bonnes cotes à l'adversaire.",
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
      title: "Tu te couches trop en grosse blinde",
      detail:
        "Exemple : valet-neuf de cœur sur un flop 10-7-2. Tu abandonnes alors que suivre, ou parfois relancer, rapporte plus.",
      fix: "Continue plus souvent avec un tirage ou deux cartes plus hautes que le tableau.",
    },
    hands: [HAND_OVERFOLD_BB],
    focusActionIndex: 5,
  },
  l2: {
    explanation: {
      title: "Tu suis trop large en petite blinde",
      detail:
        "Roi-huit dépareillé, hors position, face à une relance du bouton : le coup est difficile avec une main moyenne.",
      fix: "Couche les mains moyennes. Garde suivre ou relancer pour tes meilleures mains.",
    },
    hands: [HAND_LOOSE_SB],
    focusActionIndex: 1,
  },
  l3: {
    explanation: {
      title: "Tu bluffes trop peu à la river",
      detail:
        "Après avoir misé au flop et au turn sans rien, checker la river abandonne des coups que l'adversaire aurait souvent couchés.",
      fix: "Ajoute quelques bluffs à la river quand l'adversaire se couche souvent.",
    },
    hands: [HAND_UNDERBLUFF],
    focusActionIndex: 9,
  },
  l4: {
    explanation: {
      title: "Tu te couches trop à la bulle",
      detail:
        "As-dix assorti au bouton, avec 18 grosses blindes, est une relance rentable. Se coucher laisse de l'argent sur la table.",
      fix: "Ouvre un peu plus large au bouton et au cutoff quand les petits tapis sont derrière toi.",
    },
    hands: [HAND_BUBBLE],
    focusActionIndex: 2,
  },
  l5: {
    explanation: {
      title: "Ta mise de continuation est trop petite",
      detail:
        "Avec deux dames sur roi-8-3, une petite mise donne de trop bonnes cotes à l'adversaire. Une mise d'environ la moitié du pot est plus juste.",
      fix: "Sur un tableau sec ou avec une carte haute, mise plutôt autour de la moitié du pot.",
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
