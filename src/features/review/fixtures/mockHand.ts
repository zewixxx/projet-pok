/**
 * Mains de démonstration (coachTips + EV) — fallback si import vide.
 * Les vraies mains sont dans src/features/import/hands/*.json
 */

import type { ReplayHand } from "../replay.types";

export const MOCK_HANDS: ReplayHand[] = [
  {
    id:    "hand-001",
    label: "#1 — 3bet pot, Hero BTN vs MP",
    blindsBb: { small: 0.5, big: 1 },
    players: [
      { id: "utg", name: "Villain_UTG", stackBb: 45.0, seatIndex: 0, position: "UTG" },
      { id: "mp",  name: "Villain_MP",  stackBb: 38.5, seatIndex: 1, position: "MP"  },
      { id: "co",  name: "Villain_CO",  stackBb: 62.0, seatIndex: 2, position: "CO"  },
      { id: "btn", name: "Hero",        stackBb: 52.0, seatIndex: 3, position: "BTN", isHero: true, holeCards: ["Ah", "Kd"] },
      { id: "sb",  name: "Villain_SB",  stackBb: 28.0, seatIndex: 4, position: "SB"  },
      { id: "bb",  name: "Villain_BB",  stackBb: 55.0, seatIndex: 5, position: "BB"  },
    ],
    actions: [
      { playerId: "utg", type: "fold",                  street: "preflop" },
      { playerId: "mp",  type: "raise", amountBb: 2.5,  street: "preflop" },
      { playerId: "co",  type: "fold",                  street: "preflop" },
      { playerId: "btn", type: "raise", amountBb: 7.0,  street: "preflop" },
      { playerId: "sb",  type: "fold",                  street: "preflop" },
      { playerId: "bb",  type: "fold",                  street: "preflop" },
      { playerId: "mp",  type: "call",  amountBb: 4.5,  street: "preflop" },
      { playerId: "mp",  type: "check",                 street: "flop"    },
      { playerId: "btn", type: "bet",   amountBb: 6.0,  street: "flop"    },
      { playerId: "mp",  type: "call",  amountBb: 6.0,  street: "flop"    },
      { playerId: "mp",  type: "check",                 street: "turn"    },
      { playerId: "btn", type: "bet",   amountBb: 15.0, street: "turn"    },
      { playerId: "mp",  type: "fold",                  street: "turn"    },
    ],
    boards: [
      { street: "flop",  cards: ["Qs", "9h", "4d"] },
      { street: "turn",  cards: ["Tc"] },
      { street: "river", cards: ["2s"] },
    ],
    evComparisons: {
      3: { options: [
        { type: "raise", amountBb: 7.0,  evBb:  0.85, isPlayed: true },
        { type: "raise", amountBb: 9.0,  evBb:  0.72 },
        { type: "call",                  evBb:  0.28 },
        { type: "fold",                  evBb: -0.15 },
      ]},
    },
    coachTips: {
      3: { quality: "good", headline: "Excellent 3bet BTN vs open MP", evDiffBb: 0.85, detail: "AKo en tête de ta range de 3bet BTN." },
    },
  },
];
