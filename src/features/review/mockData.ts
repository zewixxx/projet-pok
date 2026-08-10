import type { ReviewHand } from "./types";

const positions = ["UTG", "MP", "CO", "BTN", "SB", "BB"] as const;
const phases = ["early", "middle", "bubble", "itm", "ft"] as const;
const tags = ["bubble-spot", "3bet-oop", "big-pot", "river-bluff-catch"] as const;
const actions = ["all-in", "3bet", "squeeze", "overbet", "none"] as const;
const cards = ["Ah", "Kd", "Qc", "Js", "Th", "9d", "8c", "7s", "6h", "5d"] as const;

/** Génère un impact EV signé : ~35% EV+, ~45% EV−, reste neutre */
function signedEv(i: number): number {
  const r = (i * 17 + 11) % 100;
  if (r < 35) return Number((0.4 + (r % 20) * 0.18).toFixed(2)); // EV+
  if (r < 80) return Number((-(0.5 + (r % 25) * 0.22)).toFixed(2)); // EV−
  return Number((((r % 7) - 3) * 0.05).toFixed(2)); // quasi neutre
}

export const mockHands: ReviewHand[] = Array.from({ length: 220 }, (_, i) => {
  const day = ((i % 28) + 1).toString().padStart(2, "0");
  const evImpact = signedEv(i);
  return {
    handId: `H-${1000 + i}`,
    tournamentId: `T-${1 + (i % 7)}`,
    dateIso: `2026-05-${day}T12:00:00.000Z`,
    position: positions[i % positions.length],
    stackBb: 8 + (i % 55),
    phase: phases[i % phases.length],
    tag: tags[i % tags.length],
    keyAction: actions[i % actions.length],
    evLoss: Math.max(0, -evImpact),
    evImpact,
    holeCards: [cards[i % cards.length], cards[(i + 3) % cards.length]],
    summary:
      evImpact <= -1
        ? "Grosse erreur vs range adverse"
        : evImpact >= 1
          ? "Ligne très +EV, bien joué"
          : "Spot standard",
  };
});
