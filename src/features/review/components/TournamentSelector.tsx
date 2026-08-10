import { useState } from "react";
import { type Tournament, getPlaceCategory } from "../tournament.types";

const CATEGORY_CONFIG = {
  win: { icon: "🥇", label: "Victoire", mod: "t-card--win" },
  podium: { icon: "🏆", label: "Podium", mod: "t-card--podium" },
  ft: { icon: "🎯", label: "Table finale", mod: "t-card--ft" },
  itm: { icon: "✅", label: "ITM", mod: "t-card--itm" },
  bust: { icon: "💥", label: "Éliminé", mod: "t-card--bust" },
} as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrize(euros: number): string {
  return euros >= 1000
    ? `${(euros / 1000).toFixed(euros % 1000 === 0 ? 0 : 1)} k€`
    : `${euros} €`;
}

interface TournamentCardProps {
  tournament: Tournament;
  isSelected: boolean;
  onSelect: () => void;
}

function TournamentCard({ tournament, isSelected, onSelect }: TournamentCardProps) {
  const cat = getPlaceCategory(tournament.place, tournament.totalPlayers);
  const cfg = CATEGORY_CONFIG[cat];

  return (
    <button
      className={["t-card", cfg.mod, isSelected ? "t-card--selected" : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Sélectionner ${tournament.name}`}
    >
      <div className="t-card__top">
        <span className="t-card__name">{tournament.name}</span>
        <span className="t-card__icon" aria-hidden="true">
          {cfg.icon}
        </span>
      </div>

      <div className="t-card__meta">
        <span>{formatDate(tournament.dateIso)}</span>
        <span>{tournament.buyInEuros} €</span>
      </div>

      <div className="t-card__bottom">
        <div className="t-card__stat">
          <span className="t-card__stat-value">{tournament.handsCount}</span>
          <span className="t-card__stat-label">mains</span>
        </div>

        <div className="t-card__place-block">
          <span className="t-card__place">
            {tournament.place}
            <span className="t-card__place-sep">/</span>
            {tournament.totalPlayers.toLocaleString("fr-FR")}
          </span>
          <span className="t-card__place-label">{cfg.label}</span>
        </div>

        {tournament.prizeEuros != null && (
          <div className="t-card__stat">
            <span className="t-card__stat-value t-card__stat-value--prize">
              {formatPrize(tournament.prizeEuros)}
            </span>
            <span className="t-card__stat-label">gain</span>
          </div>
        )}
      </div>
    </button>
  );
}

interface TournamentSelectorProps {
  tournaments: Tournament[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Replié par défaut pour laisser la place à la table */
  defaultCollapsed?: boolean;
}

export default function TournamentSelector({
  tournaments,
  selectedId,
  onSelect,
  defaultCollapsed = true,
}: TournamentSelectorProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const selected = tournaments.find((t) => t.id === selectedId);

  return (
    <nav
      className={`t-selector${collapsed ? " t-selector--collapsed" : ""}`}
      aria-label="Sélection du tournoi"
    >
      <div className="t-selector__bar">
        <div className="t-selector__bar-main">
          <p className="t-selector__kicker">Tournoi</p>
          <h2 className="t-selector__title">
            {selected ? selected.name : "Choisis ton tournoi"}
          </h2>
          {selected && collapsed && (
            <p className="t-selector__summary">
              {formatDate(selected.dateIso)} · {selected.buyInEuros}€ · {selected.handsCount}{" "}
              mains
              {selected.prizeEuros != null ? ` · ${formatPrize(selected.prizeEuros)}` : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          className="t-selector__toggle"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? "Changer" : "Réduire"}
        </button>
      </div>

      {!collapsed && (
        <div className="t-selector__scroll">
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              isSelected={t.id === selectedId}
              onSelect={() => {
                onSelect(t.id);
                setCollapsed(true);
              }}
            />
          ))}
        </div>
      )}
    </nav>
  );
}
