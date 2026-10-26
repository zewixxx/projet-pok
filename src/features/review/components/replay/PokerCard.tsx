import { cx } from "../../../../ui/cx";

const SUITS: Record<string, { symbol: string; red: boolean; name: string }> = {
  h: { symbol: "♥", red: true, name: "cœur" },
  d: { symbol: "♦", red: true, name: "carreau" },
  s: { symbol: "♠", red: false, name: "pique" },
  c: { symbol: "♣", red: false, name: "trèfle" },
};

const RANK_NAMES: Record<string, string> = {
  A: "As",
  K: "Roi",
  Q: "Dame",
  J: "Valet",
  T: "10",
};

export type CardSize = "large" | "normal" | "mini";

interface PokerCardProps {
  /** Ex. « Ah », « Td », « 7s ». */
  notation: string;
  size?: CardSize;
  className?: string;
}

/** Libellé lisible d'une carte, pour les lecteurs d'écran : « Roi de pique ». */
export function describeCard(notation: string): string {
  const rank = notation.slice(0, -1).toUpperCase();
  const suit = SUITS[notation.slice(-1).toLowerCase()];
  const name = RANK_NAMES[rank] ?? rank;
  return suit ? `${name} de ${suit.name}` : notation;
}

export function PokerCard({ notation, size = "normal", className }: PokerCardProps) {
  const rank = notation.slice(0, -1).toUpperCase();
  const suit = SUITS[notation.slice(-1).toLowerCase()];
  const display = rank === "T" ? "10" : rank;

  return (
    <span
      className={cx("pcard", `pcard--${size}`, suit?.red ? "pcard--red" : "pcard--black", className)}
      role="img"
      aria-label={describeCard(notation)}
    >
      <span className="pcard__rank" aria-hidden>
        {display}
      </span>
      <span className="pcard__suit" aria-hidden>
        {suit?.symbol ?? ""}
      </span>
    </span>
  );
}
