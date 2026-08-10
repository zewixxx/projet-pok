import { useMemo, useState } from "react";
import type { ReviewHand } from "../types";

type EvLens = "both" | "ev-minus" | "ev-plus";

interface HandsPanelProps {
  hands: ReviewHand[];
  onSelectHand?: (handId: string) => void;
  activeHandId?: string | null;
}

const EV_MINUS_THRESHOLD = -0.8;
const EV_PLUS_THRESHOLD = 0.8;
const TOP_N = 8;

function fmtEv(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)} bb`;
}

function HandCard({
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
  const cards = hand.holeCards?.join(" ") ?? "—";
  return (
    <button
      type="button"
      className={[
        "ev-hand",
        `ev-hand--${tone}`,
        active ? "ev-hand--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect?.(hand.handId)}
    >
      <div className="ev-hand__top">
        <span className="ev-hand__cards">{cards}</span>
        <span className={`ev-hand__ev ev-hand__ev--${tone}`}>{fmtEv(hand.evImpact)}</span>
      </div>
      <div className="ev-hand__meta">
        <span>{hand.position}</span>
        <span>{hand.stackBb.toFixed(0)} bb</span>
        <span className="ev-hand__action">{hand.keyAction}</span>
      </div>
      {hand.summary && <p className="ev-hand__summary">{hand.summary}</p>}
    </button>
  );
}

export default function HandsPanel({ hands, onSelectHand, activeHandId = null }: HandsPanelProps) {
  const [lens, setLens] = useState<EvLens>("both");
  const [open, setOpen] = useState(false);

  const { worst, best } = useMemo(() => {
    const withImpact = hands.filter((h) => Number.isFinite(h.evImpact));
    const worstHands = [...withImpact]
      .filter((h) => h.evImpact <= EV_MINUS_THRESHOLD)
      .sort((a, b) => a.evImpact - b.evImpact)
      .slice(0, TOP_N);
    const bestHands = [...withImpact]
      .filter((h) => h.evImpact >= EV_PLUS_THRESHOLD)
      .sort((a, b) => b.evImpact - a.evImpact)
      .slice(0, TOP_N);

    // Fallback si trop peu de données signées : top/bottom par evImpact
    if (worstHands.length === 0 && bestHands.length === 0 && withImpact.length > 0) {
      const sorted = [...withImpact].sort((a, b) => a.evImpact - b.evImpact);
      return {
        worst: sorted.slice(0, Math.min(TOP_N, sorted.length)),
        best: sorted.slice(-Math.min(TOP_N, sorted.length)).reverse(),
      };
    }

    return { worst: worstHands, best: bestHands };
  }, [hands]);

  const showMinus = lens === "both" || lens === "ev-minus";
  const showPlus = lens === "both" || lens === "ev-plus";

  return (
    <section
      className={`ev-panel${open ? "" : " ev-panel--collapsed"}`}
      aria-label="Spots EV critiques"
    >
      <header className="ev-panel__header">
        <button
          type="button"
          className="ev-panel__toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="ev-panel__toggle-text">
            <h2 className="ev-panel__title">Spots à retenir</h2>
            <p className="ev-panel__lead">
              {open
                ? "Les mains vraiment coûteuses (EV−) et les très bons coups (EV+)."
                : `${worst.length} EV− · ${best.length} EV+ — ouvrir pour rejouer`}
            </p>
          </div>
          <span className="ev-panel__chevron" aria-hidden>
            {open ? "Réduire" : "Voir"}
          </span>
        </button>
      </header>

      {open && (
        <>
          <div className="ev-panel__lens" role="tablist" aria-label="Filtre EV">
            {(
              [
                ["both", "Les deux"],
                ["ev-minus", "EV−"],
                ["ev-plus", "EV+"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={lens === id}
                className={`ev-panel__lens-btn${lens === id ? " ev-panel__lens-btn--active" : ""}`}
                onClick={() => setLens(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={`ev-panel__grid${lens !== "both" ? " ev-panel__grid--single" : ""}`}>
            {showMinus && (
              <div className="ev-col ev-col--bad">
                <h3 className="ev-col__title">
                  <span className="ev-col__badge ev-col__badge--bad">EV−</span>
                  Très coûteux
                  <span className="ev-col__count">{worst.length}</span>
                </h3>
                {worst.length === 0 ? (
                  <p className="ev-col__empty">Pas encore de grosse erreur détectée.</p>
                ) : (
                  <div className="ev-col__list">
                    {worst.map((h) => (
                      <HandCard
                        key={h.handId}
                        hand={h}
                        tone="bad"
                        active={h.handId === activeHandId}
                        onSelect={onSelectHand}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {showPlus && (
              <div className="ev-col ev-col--good">
                <h3 className="ev-col__title">
                  <span className="ev-col__badge ev-col__badge--good">EV+</span>
                  Très bons coups
                  <span className="ev-col__count">{best.length}</span>
                </h3>
                {best.length === 0 ? (
                  <p className="ev-col__empty">Pas encore de beau spot EV+ détecté.</p>
                ) : (
                  <div className="ev-col__list">
                    {best.map((h) => (
                      <HandCard
                        key={h.handId}
                        hand={h}
                        tone="good"
                        active={h.handId === activeHandId}
                        onSelect={onSelectHand}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
