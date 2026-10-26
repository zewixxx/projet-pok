/**
 * Regroupe les erreurs repérées par le moteur en leaks récurrents.
 * Un leak = même type d'erreur, même rue, même zone de table.
 */

import type { Leak, MistakeKind, ReplayHand, Street } from "./types";

type Zone = "early" | "late" | "blinds";

const ZONE_OF: Record<string, Zone> = {
  UTG: "early",
  MP: "early",
  CO: "late",
  BTN: "late",
  SB: "blinds",
  BB: "blinds",
};

const ZONE_LABEL: Record<Zone, string> = {
  early: "en début de table (UTG/MP)",
  late: "en fin de table (CO/BTN)",
  blinds: "dans les blindes",
};

const STREET_LABEL: Record<Street, string> = {
  preflop: "préflop",
  flop: "au flop",
  turn: "au turn",
  river: "à la river",
};

const KIND_TITLE: Record<MistakeKind, string> = {
  overfold: "Folds trop serrés",
  overcall: "Calls trop larges",
  "passive-call": "Calls trop passifs",
  "missed-bet": "Valeur laissée en checkant",
  overaggression: "Agression excessive",
  sizing: "Sizings à revoir",
};

const KIND_ADVICE: Record<MistakeKind, string> = {
  overfold: "Tu te couches avec des mains qui avaient assez d'équité pour continuer. Compare toujours ton équité aux cotes du pot.",
  overcall: "Tu paies avec des mains qui n'ont pas l'équité nécessaire, surtout hors de position.",
  "passive-call": "Payer rapporte moins que relancer dans ces spots : pense à prendre l'initiative.",
  "missed-bet": "Tu checks des mains qui gagnent à miser, pour la valeur ou pour la protection.",
  overaggression: "Tes relances et mises passent trop rarement : l'adversaire continue avec les bonnes mains.",
  sizing: "Le choix de la taille de mise perd de l'EV.",
};

function severityOf(costBb100: number): Leak["severity"] {
  if (costBb100 >= 3) return "critical";
  if (costBb100 >= 1.5) return "major";
  return "minor";
}

export function buildLeaks(hands: ReplayHand[]): Leak[] {
  const groups = new Map<
    string,
    { kind: MistakeKind; street: Street; zone: Zone; loss: number; count: number; samples: string[] }
  >();

  for (const hand of hands) {
    if (!hand.spots || !hand.coachTips) continue;
    for (const [key, spot] of Object.entries(hand.spots)) {
      const tip = hand.coachTips[Number(key)];
      if (!tip || tip.quality !== "mistake" || spot.kind === "correct") continue;
      const zone = ZONE_OF[spot.heroPosition] ?? "early";
      const id = `${spot.kind}-${spot.street}-${zone}`;
      const g = groups.get(id) ?? { kind: spot.kind, street: spot.street, zone, loss: 0, count: 0, samples: [] };
      g.loss += spot.evLossBb;
      g.count += 1;
      if (g.samples.length < 5 && !g.samples.includes(hand.id)) g.samples.push(hand.id);
      groups.set(id, g);
    }
  }

  const total = Math.max(1, hands.length);
  const leaks: Leak[] = [];
  for (const [id, g] of groups) {
    const cost = (g.loss / total) * 100;
    leaks.push({
      id,
      category: g.kind,
      description: `${KIND_TITLE[g.kind]} ${STREET_LABEL[g.street]} ${ZONE_LABEL[g.zone]}`,
      detail: `${KIND_ADVICE[g.kind]} ${g.count} occurrence${g.count > 1 ? "s" : ""}, ${g.loss.toFixed(1).replace(".", ",")} bb perdus d'après le moteur (estimation).`,
      costBb100: Math.round(cost * 100) / 100,
      occurrences: g.count,
      totalLossBb: Math.round(g.loss * 100) / 100,
      severity: severityOf(cost),
      sampleHandIds: g.samples,
    });
  }
  return leaks.sort((a, b) => b.totalLossBb - a.totalLossBb);
}
