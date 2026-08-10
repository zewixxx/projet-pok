import type { ActionWeights, RangeAction, RangeSpot } from "../../../data/rangeData";
import { comboKey, RANKS } from "../../../data/rangeData";

/** Libellé affiché dans une cellule (AA, AKs, AKo). */
export function comboDisplayLabel(row: number, col: number): string {
  return comboKey(row, col);
}

export function isCellInRange(weights: ActionWeights | undefined): boolean {
  if (!weights) return false;
  const fold = weights.fold ?? 0;
  return fold < 0.95;
}

export interface ActionFrequency {
  key: string;
  label: string;
  color: string;
  pct: number;
}

/** Fréquences globales du spot (barres récap en bas de matrice). */
export function computeSpotFrequencies(spot: RangeSpot): ActionFrequency[] {
  const totals: Record<string, number> = {};

  for (const weights of Object.values(spot.cells)) {
    for (const [key, frac] of Object.entries(weights)) {
      if (key === "fold" || (frac ?? 0) < 0.01) continue;
      totals[key] = (totals[key] ?? 0) + frac;
    }
  }

  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  if (sum <= 0) return [];

  return spot.actions
    .map((action: RangeAction) => ({
      key: action.key,
      label: action.label,
      color: action.color,
      pct: ((totals[action.key] ?? 0) / sum) * 100,
    }))
    .filter((f) => f.pct >= 0.5)
    .sort((a, b) => b.pct - a.pct);
}

export function strategyTooltipText(
  spot: RangeSpot,
  row: number,
  col: number,
  actionLabels: Record<string, string>,
): string {
  const label = comboDisplayLabel(row, col);
  const weights = spot.cells[comboKey(row, col)];
  if (!weights || !isCellInRange(weights)) return `${label} : Fold 100%`;

  const parts = Object.entries(weights)
    .filter(([, v]) => (v ?? 0) > 0.01)
    .map(([k, v]) => `${actionLabels[k] ?? k} ${((v ?? 0) * 100).toFixed(0)}%`);

  return `${label} : ${parts.join(" · ")}`;
}

export function presenceTooltipText(row: number, col: number, prob: number): string {
  const label = comboDisplayLabel(row, col);
  return `${label} : ${(prob * 100).toFixed(0)}% dans la range`;
}

export function strategyCoveragePct(spot: RangeSpot): string {
  const inRange = Object.values(spot.cells).filter((w) => isCellInRange(w)).length;
  return ((inRange / 169) * 100).toFixed(1);
}

export { RANKS };
