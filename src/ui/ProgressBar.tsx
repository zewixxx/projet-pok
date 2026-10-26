import { cx } from "./cx";

interface ProgressBarProps {
  /** 0 à 100. Absent = progression indéterminée. */
  value?: number;
  label: string;
  /** Animation de défilement pendant un traitement en cours. */
  active?: boolean;
  className?: string;
}

export function ProgressBar({ value, label, active, className }: ProgressBarProps) {
  const indeterminate = value == null;
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cx("progress", active && "progress--active", indeterminate && "progress--indeterminate", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : pct}
    >
      <div className="progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
