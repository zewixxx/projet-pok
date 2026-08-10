import { PokerCard } from "./PokerCard";

interface HeroHandDisplayProps {
  cards: [string, string] | string[] | undefined;
  label?: string;
}

/** Affiche clairement la main de départ du hero (toujours visible). */
export function HeroHandDisplay({ cards, label = "Ta main de départ" }: HeroHandDisplayProps) {
  if (!cards || cards.length < 2) {
    return (
      <div className="hero-hand hero-hand--empty" role="status">
        <span className="hero-hand__label">{label}</span>
        <span className="hero-hand__missing">Cartes inconnues</span>
      </div>
    );
  }

  return (
    <div className="hero-hand" role="group" aria-label={label}>
      <span className="hero-hand__label">{label}</span>
      <div className="hero-hand__cards">
        <PokerCard notation={cards[0]} size="large" />
        <PokerCard notation={cards[1]} size="large" />
      </div>
    </div>
  );
}
