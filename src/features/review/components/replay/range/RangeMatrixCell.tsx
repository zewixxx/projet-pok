import { cx } from "../../../../../ui/cx";

interface RangeMatrixCellProps {
  combo: string;
  label: string;
  background: string;
  inRange: boolean;
  isHero: boolean;
  title: string;
  /** Couleur du texte, quand le fond est clair ou très variable. */
  labelColor?: string;
  onHover: (text: string | null) => void;
}

export function RangeMatrixCell({ combo, label, background, inRange, isHero, title, labelColor, onHover }: RangeMatrixCellProps) {
  return (
    <div
      className={cx("rm__cell", inRange ? "rm__cell--active" : "rm__cell--inactive", isHero && "rm__cell--hero")}
      data-combo={combo}
      style={{ background }}
      title={title}
      aria-label={isHero ? `${title} (ta main)` : title}
      onMouseEnter={() => onHover(title)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="rm__cell-label" style={labelColor ? { color: labelColor, textShadow: "none" } : undefined}>
        {label}
      </span>
    </div>
  );
}
