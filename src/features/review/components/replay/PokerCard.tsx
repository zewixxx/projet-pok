const SUIT_SYMBOL: Record<string, string> = { h: "♥", d: "♦", s: "♠", c: "♣" };
const RED_SUITS = new Set(["h", "d"]);

interface PokerCardProps {
  notation: string;
  size?: "large" | "normal" | "mini";
}

export function PokerCard({ notation, size = "normal" }: PokerCardProps) {
  const rank = notation.slice(0, notation.length - 1);
  const suit = notation.slice(-1).toLowerCase();
  const isRed = RED_SUITS.has(suit);

  return (
    <div
      className={[
        "poker-card",
        `poker-card--${size}`,
        isRed ? "poker-card--red" : "poker-card--black",
      ].join(" ")}
    >
      <span className="poker-card__corner poker-card__corner--tl">
        <span className="poker-card__rank">{rank}</span>
        <span className="poker-card__suit-sm">{SUIT_SYMBOL[suit] ?? suit}</span>
      </span>
      <span className="poker-card__suit">{SUIT_SYMBOL[suit] ?? suit}</span>
    </div>
  );
}
