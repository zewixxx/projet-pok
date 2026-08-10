import { useMemo } from "react";
import type { EvComparison as EvComparisonType, EvOption, Street } from "../../replay.types";
import { ACTION_LABELS, STREET_LABELS } from "../../replay.constants";

function formatOptionLabel(option: EvOption): string {
  const base = ACTION_LABELS[option.type] ?? option.type;
  return option.amountBb != null ? `${base} ${option.amountBb.toFixed(1)} bb` : base;
}

function formatEv(evBb: number): string {
  return `${evBb >= 0 ? "+" : ""}${evBb.toFixed(2)} bb`;
}

interface EvComparisonProps {
  comparison: EvComparisonType;
  street: Street;
}

export function EvComparison({ comparison, street }: EvComparisonProps) {
  const sorted = useMemo(
    () => [...comparison.options].sort((a, b) => b.evBb - a.evBb),
    [comparison.options],
  );

  const playedOption = sorted.find((o) => o.isPlayed);
  const bestOption   = sorted[0];
  const maxAbsEv     = Math.max(...sorted.map((o) => Math.abs(o.evBb)), 0.01);

  const isOptimalPlay = playedOption?.evBb === bestOption?.evBb;

  return (
    <div className="ev-comparison ev-comparison--fill">
      <div className="ev-comparison__header">
        <span className="ev-comparison__title">Comparatif EV</span>
        <span className="ev-comparison__street">{STREET_LABELS[street]}</span>
        {isOptimalPlay ? (
          <span className="ev-comparison__verdict ev-comparison__verdict--optimal">
            🌟 Meilleur choix
          </span>
        ) : (
          <span className="ev-comparison__verdict ev-comparison__verdict--subopt">
            💡 Autre option meilleure
          </span>
        )}
      </div>

      <div className="ev-comparison__rows">
        {sorted.map((option, i) => {
          const isPlayed  = Boolean(option.isPlayed);
          const isBest    = i === 0;
          const delta     = playedOption != null ? option.evBb - playedOption.evBb : 0;
          const barPct    = Math.max(4, (Math.abs(option.evBb) / maxAbsEv) * 100);
          const isPositive = option.evBb >= 0;

          const rowClass = [
            "ev-comparison__row",
            isPlayed ? "ev-comparison__row--played" : "",
            isBest && !isPlayed ? "ev-comparison__row--best" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={i} className={rowClass}>
              {/* Label */}
              <span className="ev-comparison__label">{formatOptionLabel(option)}</span>

              {/* Bar */}
              <div className="ev-comparison__bar-track" aria-hidden="true">
                <div
                  className={[
                    "ev-comparison__bar",
                    isPositive ? "ev-comparison__bar--pos" : "ev-comparison__bar--neg",
                  ].join(" ")}
                  style={{ width: `${barPct}%` }}
                />
              </div>

              {/* EV value */}
              <span
                className={[
                  "ev-comparison__ev",
                  isPositive ? "ev-comparison__ev--pos" : "ev-comparison__ev--neg",
                ].join(" ")}
              >
                {formatEv(option.evBb)}
              </span>

              {/* Tag / delta */}
              {isPlayed && isBest && (
                <span className="ev-comparison__tag ev-comparison__tag--optimal">🌟 Ton choix · Top</span>
              )}
              {isPlayed && !isBest && (
                <span className="ev-comparison__tag ev-comparison__tag--played">👉 Ton choix</span>
              )}
              {!isPlayed && isBest && (
                <span className="ev-comparison__tag ev-comparison__tag--best">⭐ Meilleur</span>
              )}
              {!isPlayed && !isBest && (
                <span className={`ev-comparison__delta ${delta >= 0 ? "ev-comparison__delta--pos" : "ev-comparison__delta--neg"}`}>
                  {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
