import type { PositionStat } from "../types";

interface PositionStatsProps {
  stats: PositionStat[];
}

const MAX_EV = 10; // bb/100 scale

function EvBar({ value }: { value: number }) {
  const pct = Math.min(Math.abs(value) / MAX_EV, 1) * 100;
  const isPos = value >= 0;
  return (
    <div className="pos-stat__ev-wrap">
      <div className="pos-stat__ev-track">
        <div
          className={`pos-stat__ev-bar ${isPos ? "pos-stat__ev-bar--pos" : "pos-stat__ev-bar--neg"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`pos-stat__ev-val ${isPos ? "pos-stat__ev-val--pos" : "pos-stat__ev-val--neg"}`}>
        {value >= 0 ? "+" : ""}{value.toFixed(1)}
      </span>
    </div>
  );
}

export function PositionStats({ stats }: PositionStatsProps) {
  return (
    <div className="pos-stats">
      <div className="pos-stats__header">
        <span>Position</span>
        <span>VPIP</span>
        <span>PFR</span>
        <span>3bet%</span>
        <span>EV/100</span>
        <span>Mains</span>
      </div>
      {stats.map((s) => (
        <div key={s.position} className="pos-stats__row">
          <span className="pos-stats__pos-badge">{s.position}</span>
          <span className="pos-stats__pct">{s.vpip}%</span>
          <span className="pos-stats__pct">{s.pfr}%</span>
          <span className="pos-stats__pct">{s.threebet}%</span>
          <EvBar value={s.evPerHand} />
          <span className="pos-stats__hands">{s.handsPlayed}</span>
        </div>
      ))}
    </div>
  );
}
