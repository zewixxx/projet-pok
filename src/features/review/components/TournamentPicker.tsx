import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Badge, type Tone } from "../../../ui/Badge";
import { cx } from "../../../ui/cx";
import { fmtDate, fmtEuros, fmtInt } from "../../../ui/format";
import { ChevronDown, CircleCheck, Crown, Search, Trophy } from "../../../ui/icons";
import { getPlaceCategory, type PlaceCategory, type Tournament } from "../tournament.types";

const CATEGORY: Record<PlaceCategory, { label: string; tone: Tone }> = {
  win: { label: "Victoire", tone: "warn" },
  podium: { label: "Podium", tone: "warn" },
  ft: { label: "Table finale", tone: "brand" },
  itm: { label: "ITM", tone: "pos" },
  bust: { label: "Éliminé", tone: "neutral" },
};

interface TournamentPickerProps {
  tournaments: Tournament[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function resultOf(t: Tournament): { label: string; tone: Tone } | null {
  if (t.place <= 0) return null;
  return CATEGORY[getPlaceCategory(t.place, t.totalPlayers)];
}

function meta(t: Tournament): string {
  const parts = [fmtDate(t.dateIso), fmtEuros(t.buyInEuros), `${fmtInt(t.handsCount)} mains`];
  return parts.join(" · ");
}

export function TournamentPicker({ tournaments, selectedId, onSelect }: TournamentPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const selected = tournaments.find((t) => t.id === selectedId);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tournaments.filter((t) => t.name.toLowerCase().includes(q)) : tournaments;
  }, [tournaments, query]);

  const result = selected ? resultOf(selected) : null;

  return (
    <div className="picker" ref={rootRef}>
      <button
        type="button"
        className={cx("picker__btn", open && "is-open")}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
      >
        <span className="picker__icon" aria-hidden>
          <Trophy size={18} />
        </span>
        <span className="picker__text">
          <span className="picker__kicker">Tournoi</span>
          <span className="picker__name truncate">{selected ? selected.name : "Choisis un tournoi"}</span>
          {selected && <span className="picker__meta truncate">{meta(selected)}</span>}
        </span>
        {result && <Badge tone={result.tone}>{result.label}</Badge>}
        <ChevronDown size={18} aria-hidden className="picker__chev" />
      </button>

      {open && (
        <div className="picker__panel" id={panelId} role="dialog" aria-label="Choisir un tournoi">
          {tournaments.length > 6 && (
            <label className="picker__search">
              <Search size={16} aria-hidden />
              <input
                autoFocus
                type="search"
                placeholder="Rechercher un tournoi…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Rechercher un tournoi"
              />
            </label>
          )}
          <ul className="picker__list">
            {filtered.length === 0 && <li className="picker__none">Aucun tournoi ne correspond.</li>}
            {filtered.map((t) => {
              const res = resultOf(t);
              const isSelected = t.id === selectedId;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={cx("picker__item", isSelected && "is-selected")}
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() => {
                      onSelect(t.id);
                      setOpen(false);
                    }}
                  >
                    <span className="picker__item-main">
                      <span className="picker__item-name truncate">
                        {t.place === 1 && <Crown size={13} aria-label="Victoire" className="picker__crown" />}
                        {t.name}
                      </span>
                      <span className="picker__item-meta">{meta(t)}</span>
                    </span>
                    <span className="picker__item-side">
                      {t.place > 0 && (
                        <span className="num picker__place">
                          {fmtInt(t.place)}
                          <small> / {fmtInt(t.totalPlayers)}</small>
                        </span>
                      )}
                      <span className="picker__item-badges">
                        {res && <Badge tone={res.tone}>{res.label}</Badge>}
                        {t.analyzed != null &&
                          (t.analyzed ? (
                            <Badge tone="pos">
                              <CircleCheck size={11} aria-hidden /> Analysé
                            </Badge>
                          ) : (
                            <Badge>À analyser</Badge>
                          ))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
