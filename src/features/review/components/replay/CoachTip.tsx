import type { CoachTip as CoachTipType, TipQuality } from "../../replay.types";

const QUALITY_CONFIG: Record<
  TipQuality,
  { icon: string; label: string; modifier: string }
> = {
  good: { icon: "🌟", label: "Super coup !", modifier: "coach-tip--good" },
  ok: { icon: "👍", label: "Correct", modifier: "coach-tip--ok" },
  mistake: { icon: "💡", label: "À revoir", modifier: "coach-tip--mistake" },
};

interface CoachTipProps {
  tip: CoachTipType;
}

export function CoachTip({ tip }: CoachTipProps) {
  const cfg = QUALITY_CONFIG[tip.quality];

  return (
    <div className={`coach-tip coach-tip--fill ${cfg.modifier}`} role="note" aria-label="Conseil IA">
      <div className="coach-tip__header">
        <span className="coach-tip__icon" aria-hidden="true">
          {cfg.icon}
        </span>
        <span className="coach-tip__quality">{cfg.label}</span>
        {tip.evDiffBb != null && (
          <span
            className={`coach-tip__ev ${tip.evDiffBb >= 0 ? "coach-tip__ev--pos" : "coach-tip__ev--neg"}`}
          >
            {tip.evDiffBb >= 0 ? "+" : ""}
            {tip.evDiffBb.toFixed(2)} EV
          </span>
        )}
        <span className="coach-tip__label">Coach</span>
      </div>
      <p className="coach-tip__headline">{tip.headline}</p>
      <p className="coach-tip__detail">{tip.detail}</p>
    </div>
  );
}
