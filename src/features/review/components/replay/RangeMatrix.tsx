import { Fragment, useMemo, useState } from "react";
import {
  cellBackground,
  comboKey,
  type RangeSpot,
} from "../../data/rangeData";
import { ACTION_LABELS } from "../../replay.constants";
import { RangeMatrixCell } from "./range/RangeMatrixCell";
import {
  comboDisplayLabel,
  computeSpotFrequencies,
  isCellInRange,
  presenceTooltipText,
  RANKS,
  strategyCoveragePct,
  strategyTooltipText,
} from "./range/rangeMatrix.utils";
import { StrategySummaryBars } from "./range/StrategySummaryBars";

const FALLBACK_FOLD_COLOR = "#141b24";

function buildColorMap(spot: RangeSpot): Record<string, string> {
  const map: Record<string, string> = { fold: FALLBACK_FOLD_COLOR };
  for (const action of spot.actions) map[action.key] = action.color;
  return map;
}

function strategyBackground(spot: RangeSpot, combo: string): string {
  const weights = spot.cells[combo];
  if (!weights || !isCellInRange(weights)) return FALLBACK_FOLD_COLOR;
  return cellBackground(weights, buildColorMap(spot));
}

function presenceBackground(prob: number): string {
  if (prob < 0.05) return "var(--rm-cell-fold)";
  const alpha = 0.2 + prob * 0.75;
  return `rgba(52, 152, 219, ${alpha.toFixed(2)})`;
}

interface StrategyMatrixProps {
  spot: RangeSpot;
  heroCombo?: string | null;
}

function StrategyMatrix({ spot, heroCombo = null }: StrategyMatrixProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const frequencies = useMemo(() => computeSpotFrequencies(spot), [spot]);
  const coverage = strategyCoveragePct(spot);

  return (
    <div className="rm rm--strategy">
      <div className="rm__header">
        <span className="rm__title">Tes coups</span>
        <span className="rm__meta">{spot.label}</span>
        <span className="rm__coverage">{coverage}% range</span>
      </div>

      <div className="rm__grid">
        <div className="rm__corner" aria-hidden />
        {RANKS.map((r) => (
          <div key={`c-${r}`} className="rm__header-cell rm__header-cell--col">{r}</div>
        ))}
        {RANKS.map((rLabel, row) => (
          <Fragment key={`row-${rLabel}`}>
            <div className="rm__header-cell rm__header-cell--row">{rLabel}</div>
            {RANKS.map((_, col) => {
              const combo = comboKey(row, col);
              const weights = spot.cells[combo];
              const inRange = isCellInRange(weights);
              return (
                <RangeMatrixCell
                  key={combo}
                  combo={combo}
                  label={comboDisplayLabel(row, col)}
                  background={strategyBackground(spot, combo)}
                  inRange={inRange}
                  isHero={heroCombo === combo}
                  title={strategyTooltipText(spot, row, col, ACTION_LABELS)}
                  onHover={setTooltip}
                />
              );
            })}
          </Fragment>
        ))}
      </div>

      {tooltip && <div className="rm__tooltip">{tooltip}</div>}

      <StrategySummaryBars frequencies={frequencies} />

      <div className="rm__legend">
        {spot.actions.map((action) => (
          <span key={action.key} className="rm__legend-item">
            <span className="rm__legend-dot" style={{ background: action.color }} />
            {action.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface PresenceMatrixProps {
  probs: Record<string, number>;
  label: string;
  pct: string;
  heroCombo?: string | null;
}

function PresenceMatrix({ probs, label, pct, heroCombo = null }: PresenceMatrixProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <div className="rm rm--presence">
      <div className="rm__header">
        <span className="rm__title rm__title--villain">Adversaire</span>
        <span className="rm__meta">{label}</span>
        <span className="rm__coverage rm__coverage--villain">{pct}% combos</span>
      </div>

      <div className="rm__grid">
        <div className="rm__corner" aria-hidden />
        {RANKS.map((r) => (
          <div key={`c-${r}`} className="rm__header-cell rm__header-cell--col">{r}</div>
        ))}
        {RANKS.map((rLabel, row) => (
          <Fragment key={`row-${rLabel}`}>
            <div className="rm__header-cell rm__header-cell--row">{rLabel}</div>
            {RANKS.map((_, col) => {
              const combo = comboKey(row, col);
              const prob = probs[combo] ?? 0;
              const inRange = prob >= 0.05;
              return (
                <RangeMatrixCell
                  key={combo}
                  combo={combo}
                  label={comboDisplayLabel(row, col)}
                  background={presenceBackground(prob)}
                  inRange={inRange}
                  isHero={heroCombo === combo}
                  title={presenceTooltipText(row, col, prob)}
                  onHover={setTooltip}
                />
              );
            })}
          </Fragment>
        ))}
      </div>

      {tooltip && <div className="rm__tooltip">{tooltip}</div>}
    </div>
  );
}

interface StrategyMatrixWrapperProps {
  variant: "strategy";
  spot: RangeSpot;
  heroCombo?: string | null;
}

interface PresenceMatrixWrapperProps {
  variant: "presence";
  probs: Record<string, number>;
  label: string;
  pct: string;
  heroCombo?: string | null;
}

export type RangeMatrixProps = StrategyMatrixWrapperProps | PresenceMatrixWrapperProps;

/** Matrice 13×13 — stratégie GTO (hero) ou présence (villain). */
export default function RangeMatrix(props: RangeMatrixProps) {
  if (props.variant === "presence") {
    const { probs, label, pct, heroCombo } = props;
    return <PresenceMatrix probs={probs} label={label} pct={pct} heroCombo={heroCombo} />;
  }
  return <StrategyMatrix spot={props.spot} heroCombo={props.heroCombo} />;
}
