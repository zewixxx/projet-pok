import { useEffect, useState } from "react";
import { Segmented } from "../../../../ui/Segmented";
import { Term } from "../../../../ui/Term";
import { RANGE_SPOTS } from "../../data/rangeData";
import type { RangeContext } from "../../data/rangeDetection";
import RangeMatrix from "./RangeMatrix";

interface RangePanelProps {
  context: RangeContext;
}

type View = "villain" | "reference";

export default function RangePanel({ context }: RangePanelProps) {
  const { spot, heroCombo, spotIndex, villainData } = context;
  const hasVillain = Boolean(villainData && !villainData.label.includes("foldé"));

  const [view, setView] = useState<View>(hasVillain ? "villain" : "reference");
  const [refIdx, setRefIdx] = useState(spotIndex);

  // Quand la situation change (autre coup), on revient sur la vue la plus utile.
  useEffect(() => {
    setView(hasVillain ? "villain" : "reference");
    setRefIdx(spotIndex);
  }, [hasVillain, spotIndex]);

  const refSpot = RANGE_SPOTS[refIdx] ?? spot;

  return (
    <div className="ranges">
      <Segmented<View>
        label="Type de range"
        value={view}
        onChange={setView}
        options={[
          { value: "villain", label: "Adversaire (estimée)" },
          { value: "reference", label: "Référence" },
        ]}
      />

      {view === "villain" ? (
        hasVillain && villainData ? (
          <>
            <p className="ranges__intro">
              Mains que le moteur juge possibles pour <strong>{villainData.playerLabel}</strong> d'après ses actions. C'est une{" "}
              <Term id="range">range</Term> estimée, pas une certitude.
            </p>
            <RangeMatrix variant="presence" probs={villainData.probs} label={villainData.label} pct={villainData.pct} heroCombo={heroCombo} />
          </>
        ) : (
          <p className="ranges__empty">
            {villainData?.label.includes("foldé")
              ? `${villainData.playerLabel} s'est couché : il n'a plus de range.`
              : "La range adverse apparaît sur tes décisions, une fois que l'adversaire a agi."}
          </p>
        )
      ) : (
        <>
          <label className="field">
            <span className="field__label">Situation de référence</span>
            <select className="input" value={refIdx} onChange={(e) => setRefIdx(Number(e.target.value))}>
              {RANGE_SPOTS.map((s, i) => (
                <option key={s.id} value={i}>
                  {s.label}
                  {i === spotIndex ? " (situation actuelle)" : ""}
                </option>
              ))}
            </select>
          </label>
          <p className="ranges__intro">Ranges d'ouverture et de défense indicatives, à comparer avec ta main.</p>
          <RangeMatrix variant="strategy" spot={refSpot} heroCombo={heroCombo} />
        </>
      )}
    </div>
  );
}
