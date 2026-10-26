import type { ReactNode } from "react";
import { Badge } from "../../../../ui/Badge";
import { cx } from "../../../../ui/cx";
import { fmtBbSigned, fmtPct } from "../../../../ui/format";
import { CircleCheck, Info, Lightbulb, Sparkles } from "../../../../ui/icons";
import { Term } from "../../../../ui/Term";
import type { CoachTip, SpotInsight, TipQuality } from "../../replay.types";

const QUALITY: Record<TipQuality, { label: string; icon: ReactNode; mod: string }> = {
  good: { label: "Super coup", icon: <Sparkles size={20} aria-hidden />, mod: "verdict--good" },
  ok: { label: "Correct", icon: <CircleCheck size={20} aria-hidden />, mod: "verdict--ok" },
  mistake: { label: "À revoir", icon: <Lightbulb size={20} aria-hidden />, mod: "verdict--mistake" },
};

interface VerdictProps {
  tip: CoachTip;
  /** Données du moteur d'analyse pour ce spot, quand la main a été analysée. */
  spot?: SpotInsight;
}

function EvChip({ tip }: { tip: CoachTip }) {
  if (tip.evDiffBb == null) return null;

  // Conseils du moteur : evDiffBb est l'EV perdue par rapport à la meilleure option.
  if (tip.source) {
    if (tip.evDiffBb < 0.005) return null;
    return (
      <span className="verdict__ev verdict__ev--neg num" title="EV perdue par rapport à la meilleure option">
        {fmtBbSigned(-tip.evDiffBb)}
      </span>
    );
  }
  return (
    <span className={cx("verdict__ev", "num", tip.evDiffBb >= 0 ? "verdict__ev--pos" : "verdict__ev--neg")}>
      {fmtBbSigned(tip.evDiffBb)}
    </span>
  );
}

/** Jauge : ton équité estimée, avec le seuil à atteindre pour qu'un call soit rentable. */
function EquityMeter({ equity, required }: { equity: number; required: number }) {
  const enough = equity >= required;
  return (
    <div className="meter" role="img" aria-label={`Équité estimée ${fmtPct(equity)}, équité requise ${fmtPct(required)}`}>
      <div className="meter__track">
        <div className={cx("meter__fill", enough ? "meter__fill--ok" : "meter__fill--low")} style={{ width: `${Math.min(100, equity)}%` }} />
        <span className="meter__tick" style={{ left: `${Math.min(100, required)}%` }}>
          <span className="meter__tick-label">requis</span>
        </span>
      </div>
    </div>
  );
}

export function Verdict({ tip, spot }: VerdictProps) {
  const cfg = QUALITY[tip.quality];
  const confidence = spot ? spot.confidence.charAt(0).toUpperCase() + spot.confidence.slice(1) : null;

  return (
    <section className={cx("verdict", cfg.mod)} aria-label="Conseil du coach">
      <header className="verdict__head">
        <span className="verdict__icon">{cfg.icon}</span>
        <span className="verdict__label">{cfg.label}</span>
        <EvChip tip={tip} />
        {tip.source === "ia" && (
          <Badge tone="brand" className="verdict__ia" title="Texte reformulé par l'IA locale">
            <Sparkles size={11} aria-hidden /> IA locale
          </Badge>
        )}
      </header>

      <h3 className="verdict__headline">{tip.headline}</h3>
      <p className="verdict__detail">{tip.detail}</p>

      {spot && (
        <>
          <dl className="metrics">
            <div className="metrics__item">
              <dt>
                <Term id="equite">Équité estimée</Term>
              </dt>
              <dd className="num">{fmtPct(spot.equityPct)}</dd>
            </div>
            {spot.potOddsPct != null && (
              <div className="metrics__item">
                <dt>
                  <Term id="equiteRequise">Équité requise</Term>
                </dt>
                <dd className="num">{fmtPct(spot.potOddsPct)}</dd>
              </div>
            )}
            <div className="metrics__item">
              <dt>
                <Term id="confiance">Confiance</Term>
              </dt>
              <dd>{confidence}</dd>
            </div>
          </dl>
          {spot.potOddsPct != null && <EquityMeter equity={spot.equityPct} required={spot.potOddsPct} />}
        </>
      )}

      {tip.source && (
        <p className="verdict__foot">
          <Info size={13} aria-hidden /> Estimation rapide du moteur, <Term id="solveur">pas un solveur</Term>.
        </p>
      )}
    </section>
  );
}
