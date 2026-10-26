import { useMemo } from "react";
import { Badge } from "../../../../ui/Badge";
import { cx } from "../../../../ui/cx";
import { fmtBbAuto, fmtBbSigned } from "../../../../ui/format";
import { Crown, ThumbsUp } from "../../../../ui/icons";
import { Term } from "../../../../ui/Term";
import { ACTION_LABELS, STREET_LABELS } from "../../replay.constants";
import type { EvComparison as EvComparisonType, EvOption, Street } from "../../replay.types";

function optionLabel(option: EvOption): string {
  const base = ACTION_LABELS[option.type] ?? option.type;
  return option.amountBb != null ? `${base} ${fmtBbAuto(option.amountBb)}` : base;
}

interface EvComparisonProps {
  comparison: EvComparisonType;
  street: Street;
}

/** Barres divergentes autour de zéro : à droite ce qui rapporte, à gauche ce qui coûte. */
export function EvComparison({ comparison, street }: EvComparisonProps) {
  const sorted = useMemo(() => [...comparison.options].sort((a, b) => b.evBb - a.evBb), [comparison.options]);

  const played = sorted.find((o) => o.isPlayed);
  const best = sorted[0];
  const isOptimal = !played || played.evBb === best?.evBb;

  const { min, max } = useMemo(() => {
    const values = sorted.map((o) => o.evBb);
    return { min: Math.min(0, ...values), max: Math.max(0, ...values) };
  }, [sorted]);
  const range = max - min || 1;
  const zero = (-min / range) * 100;

  return (
    <section className="ev" aria-label="Comparaison des options">
      <header className="ev__head">
        <h3 className="ev__title">
          Comparaison des options <span className="ev__street">· {STREET_LABELS[street]}</span>
        </h3>
        <p className="ev__sub">
          Gain moyen estimé (<Term id="ev">EV</Term>) de chaque action possible.
        </p>
      </header>

      <ul className="ev__rows">
        {sorted.map((option, i) => {
          const isPlayed = Boolean(option.isPlayed);
          const isBest = i === 0;
          const width = (Math.abs(option.evBb) / range) * 100;
          const left = option.evBb >= 0 ? zero : zero - width;
          return (
            <li key={`${option.type}-${option.amountBb ?? "x"}-${i}`} className={cx("ev__row", isPlayed && "is-played", isBest && "is-best")}>
              <span className="ev__who">
                <span className="ev__label">{optionLabel(option)}</span>
                {(isBest || isPlayed) && (
                  <span className="ev__tags">
                    {isBest && (
                      <Badge tone="pos">
                        <Crown size={11} aria-hidden /> Meilleur
                      </Badge>
                    )}
                    {isPlayed && (
                      <Badge tone={isOptimal ? "pos" : "brand"}>
                        {isOptimal ? <ThumbsUp size={11} aria-hidden /> : null} Ton choix
                      </Badge>
                    )}
                  </span>
                )}
              </span>
              <span className="ev__chart" aria-hidden>
                <span className="ev__zero" style={{ left: `${zero}%` }} />
                <span
                  className={cx("ev__bar", option.evBb >= 0 ? "ev__bar--pos" : "ev__bar--neg")}
                  style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                />
              </span>
              <span className={cx("ev__value", "num", option.evBb >= 0 ? "pos" : "neg")}>{fmtBbSigned(option.evBb)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
