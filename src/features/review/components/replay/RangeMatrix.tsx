import { Fragment, useMemo, useState } from "react";
import { fmtPct } from "../../../../ui/format";
import { cellBackground, comboKey, type RangeSpot } from "../../data/rangeData";
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

const FOLD_COLOR = "var(--rm-fold)";

function buildColorMap(spot: RangeSpot): Record<string, string> {
  const map: Record<string, string> = { fold: FOLD_COLOR };
  for (const action of spot.actions) map[action.key] = action.color;
  return map;
}

function strategyBackground(spot: RangeSpot, combo: string): string {
  const weights = spot.cells[combo];
  if (!weights || !isCellInRange(weights)) return FOLD_COLOR;
  return cellBackground(weights, buildColorMap(spot));
}

function presenceBackground(prob: number): string {
  if (prob < 0.05) return FOLD_COLOR;
  const strength = Math.round((0.22 + prob * 0.78) * 100);
  return `color-mix(in srgb, var(--rm-presence) ${strength}%, var(--rm-fold))`;
}

function MatrixGrid({
  backgroundFor,
  tooltipFor,
  inRangeFor,
  labelColorFor,
  heroCombo,
  onHover,
}: {
  backgroundFor: (combo: string) => string;
  tooltipFor: (row: number, col: number) => string;
  inRangeFor: (combo: string) => boolean;
  labelColorFor?: (combo: string) => string | undefined;
  heroCombo: string | null;
  onHover: (text: string | null) => void;
}) {
  return (
    <div className="rm__grid" role="group" aria-label="Matrice des 169 mains de départ">
      <div className="rm__corner" aria-hidden />
      {RANKS.map((r) => (
        <div key={`c-${r}`} className="rm__head rm__head--col" aria-hidden>
          {r}
        </div>
      ))}
      {RANKS.map((rLabel, row) => (
        <Fragment key={`row-${rLabel}`}>
          <div className="rm__head rm__head--row" aria-hidden>
            {rLabel}
          </div>
          {RANKS.map((_, col) => {
            const combo = comboKey(row, col);
            return (
              <RangeMatrixCell
                key={combo}
                combo={combo}
                label={comboDisplayLabel(row, col)}
                background={backgroundFor(combo)}
                inRange={inRangeFor(combo)}
                isHero={heroCombo === combo}
                title={tooltipFor(row, col)}
                labelColor={labelColorFor?.(combo)}
                onHover={onHover}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

interface StrategyMatrixProps {
  spot: RangeSpot;
  heroCombo?: string | null;
}

function StrategyMatrix({ spot, heroCombo = null }: StrategyMatrixProps) {
  const [hover, setHover] = useState<string | null>(null);
  const frequencies = useMemo(() => computeSpotFrequencies(spot), [spot]);

  return (
    <div className="rm">
      <div className="rm__meta">
        <span className="rm__title">{spot.label}</span>
        <span className="rm__coverage num">{strategyCoveragePct(spot)}&nbsp;% des mains jouées</span>
      </div>
      <MatrixGrid
        backgroundFor={(combo) => strategyBackground(spot, combo)}
        tooltipFor={(row, col) => strategyTooltipText(spot, row, col, ACTION_LABELS)}
        inRangeFor={(combo) => isCellInRange(spot.cells[combo])}
        heroCombo={heroCombo}
        onHover={setHover}
      />
      <p className="rm__hover" aria-live="polite">
        {hover ?? "Survole une case pour voir le détail. Ta main est entourée."}
      </p>
      <div className="rm__legend">
        {spot.actions.map((action) => (
          <span key={action.key} className="rm__legend-item">
            <i style={{ background: action.color }} aria-hidden />
            {action.label}
          </span>
        ))}
      </div>
      <StrategySummaryBars frequencies={frequencies} />
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
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="rm">
      <div className="rm__meta">
        <span className="rm__title">{label}</span>
        <span className="rm__coverage num">{fmtPct(Number.parseFloat(pct) || 0, 0)} des mains</span>
      </div>
      <MatrixGrid
        backgroundFor={(combo) => presenceBackground(probs[combo] ?? 0)}
        tooltipFor={(row, col) => presenceTooltipText(row, col, probs[comboKey(row, col)] ?? 0)}
        inRangeFor={(combo) => (probs[combo] ?? 0) >= 0.05}
        labelColorFor={(combo) => {
          const p = probs[combo] ?? 0;
          return p >= 0.05 && p < 0.55 ? "var(--text)" : undefined;
        }}
        heroCombo={heroCombo}
        onHover={setHover}
      />
      <p className="rm__hover" aria-live="polite">
        {hover ?? "Plus une case est colorée, plus la main est probable. Ta main est entourée."}
      </p>
      <div className="rm__scale" aria-hidden>
        <span>Peu probable</span>
        <i />
        <span>Très probable</span>
      </div>
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

/** Matrice 13×13 : range de référence (actions) ou range estimée de l'adversaire (probabilités). */
export default function RangeMatrix(props: RangeMatrixProps) {
  if (props.variant === "presence") {
    const { probs, label, pct, heroCombo } = props;
    return <PresenceMatrix probs={probs} label={label} pct={pct} heroCombo={heroCombo} />;
  }
  return <StrategyMatrix spot={props.spot} heroCombo={props.heroCombo} />;
}
