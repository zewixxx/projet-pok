interface RangeMatrixCellProps {
  combo: string;
  label: string;
  background: string;
  inRange: boolean;
  isHero: boolean;
  title: string;
  onHover: (text: string | null) => void;
}

export function RangeMatrixCell({
  combo,
  label,
  background,
  inRange,
  isHero,
  title,
  onHover,
}: RangeMatrixCellProps) {
  const className = [
    "rm__cell",
    inRange ? "rm__cell--active" : "rm__cell--inactive",
    isHero ? "rm__cell--hero" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      data-combo={combo}
      style={{ background }}
      title={title}
      onMouseEnter={() => onHover(title)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="rm__cell-label">{label}</span>
    </div>
  );
}
