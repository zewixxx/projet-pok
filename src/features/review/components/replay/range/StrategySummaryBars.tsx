import { fmtPct } from "../../../../../ui/format";
import type { ActionFrequency } from "./rangeMatrix.utils";

interface StrategySummaryBarsProps {
  frequencies: ActionFrequency[];
}

export function StrategySummaryBars({ frequencies }: StrategySummaryBarsProps) {
  if (frequencies.length === 0) return null;

  return (
    <ul className="rm__summary" aria-label="Répartition des actions sur la range">
      {frequencies.map((freq) => (
        <li key={freq.key} className="rm__summary-row">
          <span className="rm__summary-label">
            <i style={{ background: freq.color }} aria-hidden />
            {freq.label}
          </span>
          <span className="rm__summary-track" aria-hidden>
            <span className="rm__summary-bar" style={{ width: `${Math.min(100, freq.pct)}%`, background: freq.color }} />
          </span>
          <span className="rm__summary-pct num">{fmtPct(freq.pct, 0)}</span>
        </li>
      ))}
    </ul>
  );
}
