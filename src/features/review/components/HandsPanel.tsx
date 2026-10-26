import { useMemo, useState } from "react";
import { cx } from "../../../ui/cx";
import { fmtBb, fmtBbSigned } from "../../../ui/format";
import { Segmented } from "../../../ui/Segmented";
import type { ReviewHand } from "../types";
import { PokerCard } from "./replay/PokerCard";

type Lens = "all" | "mistakes" | "good";

interface HandsPanelProps {
  hands: ReviewHand[];
  onSelectHand?: (handId: string) => void;
  activeHandId?: string | null;
}

const MISTAKE_THRESHOLD = -0.8;
const GOOD_THRESHOLD = 0.8;
const TOP_N = 8;

function HandRow({
  hand,
  tone,
  active,
  onSelect,
}: {
  hand: ReviewHand;
  tone: "bad" | "good";
  active: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <li>
      <button type="button" className={cx("hand-row", `hand-row--${tone}`, active && "is-active")} onClick={() => onSelect?.(hand.handId)}>
        <span className="hand-row__cards" aria-hidden={!hand.holeCards}>
          {hand.holeCards ? (
            <>
              <PokerCard notation={hand.holeCards[0]} size="mini" />
              <PokerCard notation={hand.holeCards[1]} size="mini" />
            </>
          ) : (
            "—"
          )}
        </span>
        <span className="hand-row__body">
          <span className="hand-row__meta">
            <b>{hand.position}</b> · {fmtBb(hand.stackBb, 0)}
          </span>
          {hand.summary && <span className="hand-row__summary">{hand.summary}</span>}
        </span>
        <span className={cx("hand-row__ev", "num", tone === "bad" ? "neg" : "pos")}>{fmtBbSigned(hand.evImpact)}</span>
      </button>
    </li>
  );
}

/** Les mains qui comptent le plus : grosses erreurs et beaux coups. Un clic rejoue la main. */
export default function HandsPanel({ hands, onSelectHand, activeHandId = null }: HandsPanelProps) {
  const [lens, setLens] = useState<Lens>("all");

  const { worst, best } = useMemo(() => {
    const withImpact = hands.filter((h) => Number.isFinite(h.evImpact));
    const worstHands = withImpact
      .filter((h) => h.evImpact <= MISTAKE_THRESHOLD)
      .sort((a, b) => a.evImpact - b.evImpact)
      .slice(0, TOP_N);
    const bestHands = withImpact
      .filter((h) => h.evImpact >= GOOD_THRESHOLD)
      .sort((a, b) => b.evImpact - a.evImpact)
      .slice(0, TOP_N);

    // Peu de données signées : on prend simplement les extrêmes.
    if (worstHands.length === 0 && bestHands.length === 0 && withImpact.length > 0) {
      const sorted = [...withImpact].sort((a, b) => a.evImpact - b.evImpact);
      const n = Math.min(TOP_N, sorted.length);
      return { worst: sorted.slice(0, n), best: sorted.slice(-n).reverse() };
    }
    return { worst: worstHands, best: bestHands };
  }, [hands]);

  const showMistakes = lens !== "good";
  const showGood = lens !== "mistakes";

  return (
    <section className="key-hands" aria-label="Mains clés">
      <Segmented<Lens>
        label="Filtre des mains"
        value={lens}
        onChange={setLens}
        options={[
          { value: "all", label: "Tout" },
          { value: "mistakes", label: "Erreurs" },
          { value: "good", label: "Beaux coups" },
        ]}
      />

      {showMistakes && (
        <div className="key-hands__group">
          <h3 className="key-hands__title">
            <span className="key-hands__dot key-hands__dot--bad" aria-hidden /> Erreurs les plus coûteuses
            <span className="key-hands__count">{worst.length}</span>
          </h3>
          {worst.length === 0 ? (
            <p className="key-hands__empty">Pas de grosse erreur détectée pour l'instant.</p>
          ) : (
            <ul className="key-hands__list">
              {worst.map((h) => (
                <HandRow key={h.handId} hand={h} tone="bad" active={h.handId === activeHandId} onSelect={onSelectHand} />
              ))}
            </ul>
          )}
        </div>
      )}

      {showGood && (
        <div className="key-hands__group">
          <h3 className="key-hands__title">
            <span className="key-hands__dot key-hands__dot--good" aria-hidden /> Meilleurs coups
            <span className="key-hands__count">{best.length}</span>
          </h3>
          {best.length === 0 ? (
            <p className="key-hands__empty">Pas encore de beau coup repéré.</p>
          ) : (
            <ul className="key-hands__list">
              {best.map((h) => (
                <HandRow key={h.handId} hand={h} tone="good" active={h.handId === activeHandId} onSelect={onSelectHand} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
