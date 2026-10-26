import { PokerCard } from "./PokerCard";

interface BoardProps {
  cards: string[];
}

const SLOTS = 5;

/** Les 5 emplacements du board sont toujours visibles : pas de saut de mise en page entre les rues. */
export function Board({ cards }: BoardProps) {
  return (
    <div className="board" role="group" aria-label={cards.length ? `Board : ${cards.length} cartes` : "Board : aucune carte"}>
      {Array.from({ length: SLOTS }, (_, i) => {
        const card = cards[i];
        return (
          <div key={i} className="board__slot">
            {card ? (
              <span className="board__deal" key={card} style={{ animationDelay: `${Math.max(0, i - 2) * 70}ms` }}>
                <PokerCard notation={card} size="large" />
              </span>
            ) : (
              <span className="board__empty" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
