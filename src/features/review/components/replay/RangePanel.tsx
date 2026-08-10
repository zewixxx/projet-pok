import { useEffect, useState } from "react";
import { RANGE_SPOTS } from "../../data/rangeData";
import type { RangeContext } from "../../data/rangeDetection";
import RangeMatrix from "./RangeMatrix";

interface RangePanelProps {
  context: RangeContext;
  /** Mode sidebar : une seule matrice, moins de chrome */
  compact?: boolean;
}

export default function RangePanel({ context, compact = false }: RangePanelProps) {
  const { spot, heroCombo, spotIndex, villainData } = context;

  const [heroIdx, setHeroIdx] = useState(spotIndex);
  useEffect(() => {
    setHeroIdx(spotIndex);
  }, [spotIndex]);
  const heroSpot = RANGE_SPOTS[heroIdx] ?? RANGE_SPOTS[0];

  return (
    <div className={`rp${compact ? " rp--compact" : ""}`}>
      <div className="rp__tabs">
        {!compact && <span className="rp__tabs-label">Situation :</span>}
        {RANGE_SPOTS.map((s, i) => (
          <button
            key={s.id}
            className={[
              "rp__tab",
              i === heroIdx ? "rp__tab--active" : "",
              i === spotIndex ? "rp__tab--detected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setHeroIdx(i)}
            title={s.description}
          >
            {s.label}
            {i === spotIndex && i !== heroIdx && <span className="rp__tab-dot" />}
          </button>
        ))}
      </div>

      <div className={`rp__dual${compact ? " rp__dual--compact" : ""}`}>
        <RangeMatrix variant="strategy" spot={heroSpot} heroCombo={heroCombo} />

        {!compact &&
          (villainData && !villainData.label.includes("foldé") ? (
            <RangeMatrix
              variant="presence"
              probs={villainData.probs}
              label={villainData.label}
              pct={villainData.pct}
              heroCombo={heroCombo}
            />
          ) : (
            <div className="rp__empty">
              <span className="rp__empty-text">
                {villainData?.label.includes("foldé")
                  ? `${villainData.playerLabel} a fold`
                  : "En attendant l’adversaire…"}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
