import { useEffect, useState } from "react";
import { cx } from "../ui/cx";
import { setPreferences, usePreferences, type ThemePreference } from "../ui/preferences";
import {
  CircleHelp,
  Cpu,
  Download,
  House,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  SlidersHorizontal,
  Sun,
  type LucideIcon,
} from "../ui/icons";
import { ProgressBar } from "../ui/ProgressBar";
import { Logo } from "./Logo";
import { NAV_ITEMS, type AppPage } from "./navigation";

const NAV_ICONS: Record<AppPage, LucideIcon> = {
  home: House,
  review: Play,
  import: Download,
  settings: SlidersHorizontal,
};

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string; icon: LucideIcon }> = [
  { value: "auto", label: "Thème automatique (système)", icon: Monitor },
  { value: "light", label: "Thème clair", icon: Sun },
  { value: "dark", label: "Thème sombre", icon: Moon },
];

export interface EngineState {
  running: boolean;
  /** 0 à 100, absent quand le total n'est pas encore connu. */
  pct?: number;
  tournamentName?: string;
  phase?: string;
}

interface SidebarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  onOpenHelp: () => void;
  engine: EngineState;
  /** Vrai dans l'application de bureau : le moteur tourne localement. */
  engineAvailable: boolean;
}

function useNarrowScreen(maxWidth: number): boolean {
  const supported = typeof window.matchMedia === "function";
  const [narrow, setNarrow] = useState(() => supported && window.matchMedia(`(max-width: ${maxWidth}px)`).matches);
  useEffect(() => {
    if (!supported) return;
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    setNarrow(mq.matches);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [maxWidth]);
  return narrow;
}

function EngineStatus({ engine, available, compact, onOpen }: { engine: EngineState; available: boolean; compact: boolean; onOpen: () => void }) {
  if (!available) {
    return (
      <div className={cx("engine", compact && "engine--compact")} title="Mode démonstration : l'analyse locale est disponible dans l'application de bureau.">
        <span className="engine__dot engine__dot--idle" aria-hidden />
        {!compact && (
          <div className="engine__text">
            <strong>Mode démo</strong>
            <span>Application de bureau requise pour analyser</span>
          </div>
        )}
      </div>
    );
  }

  if (engine.running) {
    const label = engine.pct != null ? `Analyse en cours : ${engine.pct} %` : "Analyse en cours";
    return (
      <button type="button" className={cx("engine", "engine--running", compact && "engine--compact")} onClick={onOpen} title={label} aria-label={`${label}. Ouvrir la review.`}>
        <Cpu size={18} aria-hidden className="engine__icon" />
        {!compact && (
          <div className="engine__text">
            <strong>Analyse en cours{engine.pct != null ? ` · ${engine.pct} %` : ""}</strong>
            <span className="truncate">{engine.tournamentName ?? engine.phase ?? "Moteur local"}</span>
            <ProgressBar value={engine.pct} active label="Progression de l'analyse" className="engine__bar" />
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={cx("engine", compact && "engine--compact")} title="Le moteur d'analyse tourne sur ton PC. Aucune main n'est envoyée en ligne.">
      <span className="engine__dot" aria-hidden />
      {!compact && (
        <div className="engine__text">
          <strong>Moteur prêt</strong>
          <span>100 % local, rien n'est envoyé</span>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ activePage, onNavigate, onOpenHelp, engine, engineAvailable }: SidebarProps) {
  const prefs = usePreferences();
  // Repliée d'office sur les écrans de portable (≤ 1399 px) pour laisser la place à la table.
  const narrow = useNarrowScreen(1399);
  const [manual, setManual] = useState<boolean | null>(null);
  const collapsed = manual ?? narrow;

  return (
    <aside className={cx("sidebar", collapsed && "sidebar--collapsed")} aria-label="Barre latérale">
      <div className="sidebar__brand">
        <Logo size={36} />
        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="sidebar__name">Projet-pok</span>
            <span className="sidebar__tag">Ton coach poker local</span>
          </div>
        )}
      </div>

      <nav className="sidebar__nav" aria-label="Navigation principale">
        <ul>
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.id];
            const active = item.id === activePage;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={cx("nav-item", active && "nav-item--active")}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? `${item.label} — ${item.hint}` : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon size={20} aria-hidden className="nav-item__icon" />
                  {!collapsed && (
                    <span className="nav-item__text">
                      <span className="nav-item__label">{item.label}</span>
                      <span className="nav-item__hint">{item.hint}</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar__spacer" />

      <EngineStatus engine={engine} available={engineAvailable} compact={collapsed} onOpen={() => onNavigate("review")} />

      <div className="sidebar__footer">
        {!collapsed && (
          <div className="theme-switch" role="radiogroup" aria-label="Thème d'affichage">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={prefs.theme === value}
                aria-label={label}
                title={label}
                className="theme-switch__btn"
                onClick={() => setPreferences({ theme: value })}
              >
                <Icon size={16} aria-hidden />
              </button>
            ))}
          </div>
        )}
        <button type="button" className="icon-btn" onClick={onOpenHelp} aria-label="Aide, raccourcis et vocabulaire" title="Aide et raccourcis (?)">
          <CircleHelp size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setManual(!collapsed)}
          aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
          title={collapsed ? "Déplier" : "Replier"}
        >
          {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
        </button>
      </div>
    </aside>
  );
}
