import { useMemo } from "react";
import { cx } from "../../../../ui/cx";
import { STREET_LABELS } from "../../replay.constants";
import type { ReplayHand, Street } from "../../replay.types";
import { actionSentence } from "../../utils/actionText";
import { PokerCard } from "./PokerCard";

const STREETS: Street[] = ["preflop", "flop", "turn", "river"];

interface HistoryPanelProps {
  hand: ReplayHand;
  actionIndex: number;
  onGoToAction: (index: number) => void;
}

/** Déroulé complet de la main, rue par rue. Un clic rejoue depuis ce coup. */
export function HistoryPanel({ hand, actionIndex, onGoToAction }: HistoryPanelProps) {
  const groups = useMemo(() => {
    const byId = new Map(hand.players.map((p) => [p.id, p]));
    return STREETS.map((street) => ({
      street,
      board: hand.boards.find((b) => b.street === street)?.cards ?? [],
      items: hand.actions
        .map((action, index) => ({ action, index, player: byId.get(action.playerId) }))
        .filter((x) => x.action.street === street),
    })).filter((g) => g.items.length > 0);
  }, [hand]);

  const hero = hand.players.find((p) => p.isHero);

  return (
    <div className="history">
      {hero?.holeCards && (
        <div className="history__hero">
          <span>Tes cartes</span>
          <span className="history__cards">
            <PokerCard notation={hero.holeCards[0]} size="mini" />
            <PokerCard notation={hero.holeCards[1]} size="mini" />
          </span>
          <span className="history__pos">{hero.position}</span>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.street} className="history__street" aria-label={STREET_LABELS[g.street]}>
          <header className="history__street-head">
            <h4>{STREET_LABELS[g.street]}</h4>
            {g.board.length > 0 && (
              <span className="history__cards">
                {g.board.map((c) => (
                  <PokerCard key={c} notation={c} size="mini" />
                ))}
              </span>
            )}
          </header>
          <ol className="history__list">
            {g.items.map(({ action, index, player }) => {
              const sentence = actionSentence(action, player?.name ?? "?", Boolean(player?.isHero));
              const quality = hand.coachTips?.[index]?.quality;
              return (
                <li key={index}>
                  <button
                    type="button"
                    className={cx("history__row", index === actionIndex && "is-current", player?.isHero && "is-hero")}
                    aria-current={index === actionIndex ? "step" : undefined}
                    onClick={() => onGoToAction(index)}
                  >
                    <span className="history__who">{player?.position ?? "?"}</span>
                    <span className="history__what">
                      <strong>{sentence.subject}</strong> {sentence.verb}
                      {sentence.amount && <b className="num"> {sentence.amount}</b>}
                    </span>
                    {quality === "mistake" && <span className="history__flag history__flag--mistake" title="Erreur repérée" aria-label="Erreur repérée" />}
                    {quality === "good" && <span className="history__flag history__flag--good" title="Beau coup" aria-label="Beau coup" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
