import type { ActionFrequency } from "./rangeMatrix.utils";

interface StrategySummaryBarsProps {
  frequencies: ActionFrequency[];
}

export function StrategySummaryBars({ frequencies }: StrategySummaryBarsProps) {
  if (frequencies.length === 0) return null;

  return (
    <div className="rm__summary" role="img" aria-label="Répartition des actions sur la range">
      {frequencies.map((freq) => (
        <div key={freq.key} className="rm__summary-row">
          <div
            className="rm__summary-bar"
            style={{ width: `${Math.min(100, freq.pct)}%`, background: freq.color }}
          >
            <span className="rm__summary-pct">{freq.pct.toFixed(1)}%</span>
          </div>
          <span className="rm__summary-label">{freq.label}</span>
        </div>
      ))}
    </div>
  );
}
