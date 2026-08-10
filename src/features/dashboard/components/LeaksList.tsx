import type { LeakEntry } from "../types";

interface LeaksListProps {
  leaks: LeakEntry[];
  onSelectLeak?: (leak: LeakEntry) => void;
}

const SEVERITY_CONFIG = {
  critical: { label: "Critique", cls: "leak__badge--critical", icon: "🔴" },
  major: { label: "Majeur", cls: "leak__badge--major", icon: "🟠" },
  minor: { label: "Mineur", cls: "leak__badge--minor", icon: "🟡" },
} as const;

const MAX_COST = 5;

export function LeaksList({ leaks, onSelectLeak }: LeaksListProps) {
  return (
    <div className="leaks-list">
      {leaks.map((leak, i) => {
        const cfg = SEVERITY_CONFIG[leak.severity];
        const barPct = Math.min(leak.costBb100 / MAX_COST, 1) * 100;
        const clickable = Boolean(onSelectLeak);

        return (
          <button
            key={leak.id}
            type="button"
            className={`leak${clickable ? " leak--clickable" : ""}`}
            onClick={() => onSelectLeak?.(leak)}
            disabled={!clickable}
            aria-label={`Ouvrir la review de la fuite : ${leak.description}`}
          >
            <div className="leak__rank">#{i + 1}</div>

            <div className="leak__body">
              <div className="leak__top">
                <span className={`leak__badge ${cfg.cls}`}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className="leak__category">{leak.category}</span>
                {clickable && <span className="leak__cta">Voir la main →</span>}
              </div>
              <div className="leak__desc">{leak.description}</div>
              <div className="leak__bar-row">
                <div className="leak__bar-track">
                  <div className="leak__bar" style={{ width: `${barPct}%` }} />
                </div>
                <span className="leak__cost">-{leak.costBb100.toFixed(1)} bb/100</span>
              </div>
            </div>

            <div className="leak__occ">
              <span className="leak__occ-num">{leak.occurrences}</span>
              <span className="leak__occ-label">fois</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
