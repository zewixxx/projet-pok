import { PokerCard } from "./PokerCard";

interface BoardProps {
  cards: string[];
}

export function Board({ cards }: BoardProps) {
  if (cards.length === 0) {
    return (
      <div className="board board--empty">
        <span className="board__street-tag">Préflop</span>
      </div>
    );
  }

  return (
    <div className="board" key={cards.join("-")}>
      {cards.map((card, i) => (
        <div
          key={`${card}-${i}`}
          className="board__slot"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <PokerCard notation={card} size="large" />
        </div>
      ))}
    </div>
  );
}
