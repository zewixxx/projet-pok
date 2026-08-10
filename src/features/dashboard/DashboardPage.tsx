import { useMemo, useState } from "react";
import { DASHBOARD_STATS, LEAKS, POSITION_STATS, SESSIONS } from "./data/dashboardData";
import type { LeakEntry, SessionPoint } from "./types";
import { LeaksList } from "./components/LeaksList";
import { PositionStats } from "./components/PositionStats";
import { ProgressionChart } from "./components/ProgressionChart";
import { SessionDebriefCard } from "./components/SessionDebriefCard";
import { StatCard } from "./components/StatCard";
import { getLastSessionDebrief, getLeakById } from "./data/sessionDebrief";
import {
  computePeriodStats,
  fmtEuros,
  rebaseForPeriod,
} from "./utils/sessionStats";

// ─── Constantes ──────────────────────────────────────────────────────────────

const ALL_MIN = SESSIONS[0]?.date ?? "2025-01-01";
const ALL_MAX = SESSIONS[SESSIONS.length - 1]?.date ?? "2026-12-31";

interface PeriodPreset {
  label: string;
  months: number | null;
}

const PRESETS: PeriodPreset[] = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1A", months: 12 },
  { label: "Tout", months: null },
];

// ─── Sous-composants ─────────────────────────────────────────────────────────

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="dash-section-title">
      <h2 className="dash-section-title__h2">{title}</h2>
      {sub && <p className="dash-section-title__sub">{sub}</p>}
    </div>
  );
}

interface DateFilterProps {
  dateFrom:      string;
  dateTo:        string;
  onFromChange:  (v: string) => void;
  onToChange:    (v: string) => void;
  onPreset:      (months: number | null) => void;
  activePreset:  number | null | undefined;
}

function DateFilter({ dateFrom, dateTo, onFromChange, onToChange, onPreset, activePreset }: DateFilterProps) {
  return (
    <div className="chart-date-filter">
      <span className="chart-date-filter__label">Période&nbsp;:</span>
      <div className="chart-date-filter__presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`chart-date-filter__preset ${activePreset === p.months ? "chart-date-filter__preset--active" : ""}`}
            onClick={() => onPreset(p.months)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="chart-date-filter__inputs">
        <input
          type="date"
          className="chart-date-filter__input"
          value={dateFrom}
          min={ALL_MIN}
          max={dateTo}
          onChange={(e) => onFromChange(e.target.value)}
        />
        <span className="chart-date-filter__arrow">→</span>
        <input
          type="date"
          className="chart-date-filter__input"
          value={dateTo}
          min={dateFrom}
          max={ALL_MAX}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
    </div>
  );
}

interface RecentTournamentsProps {
  sessions: SessionPoint[];
}

function RecentTournaments({ sessions }: RecentTournamentsProps) {
  const last6 = [...sessions].reverse().slice(0, 6);
  return (
    <div className="recent-tourns">
      {last6.map((s, i) => {
        const isWin  = s.netEuros > 0;
        const isTop3 = s.place <= 3;
        return (
          <div key={i} className={`recent-tourn ${isWin ? "recent-tourn--win" : "recent-tourn--loss"}`}>
            <div className="recent-tourn__date">
              {new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </div>
            <div className="recent-tourn__name">{s.label}</div>
            <div className="recent-tourn__place">
              {isTop3 && <span className="recent-tourn__crown">🏆</span>}
              #{s.place}/{s.total.toLocaleString("fr-FR")}
            </div>
            <div className={`recent-tourn__net ${isWin ? "recent-tourn__net--pos" : "recent-tourn__net--neg"}`}>
              {s.netEuros >= 0 ? "+" : ""}{s.netEuros.toLocaleString("fr-FR")}€
            </div>
            <div className="recent-tourn__hands">{s.hands} mains</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

interface DashboardPageProps {
  onSelectLeak?: (leak: LeakEntry) => void;
}

export default function DashboardPage({ onSelectLeak }: DashboardPageProps) {
  const [dateFrom,     setDateFrom]     = useState(ALL_MIN);
  const [dateTo,       setDateTo]       = useState(ALL_MAX);
  const [activePreset, setActivePreset] = useState<number | null | undefined>(null);

  // Sessions filtrées par la plage de dates sélectionnée
  const filtered = useMemo(
    () => SESSIONS.filter((s) => s.date >= dateFrom && s.date <= dateTo),
    [dateFrom, dateTo],
  );

  // Cumuls rebasés à 0 pour la période (pour le graphe)
  const rebased = useMemo(() => rebaseForPeriod(filtered), [filtered]);

  // Stats pour la période
  const pStats = useMemo(() => computePeriodStats(filtered), [filtered]);
  const lastDebrief = useMemo(() => getLastSessionDebrief(), []);

  const applyPreset = (months: number | null) => {
    setActivePreset(months);
    if (months === null) {
      setDateFrom(ALL_MIN);
      setDateTo(ALL_MAX);
    } else {
      const to   = new Date(ALL_MAX);
      const from = new Date(to);
      from.setMonth(from.getMonth() - months);
      setDateFrom(from.toISOString().slice(0, 10));
      setDateTo(ALL_MAX);
    }
  };

  // Réinitialise le preset actif si l'utilisateur change manuellement les dates
  const handleFromChange = (v: string) => {
    setDateFrom(v);
    setActivePreset(undefined);
  };
  const handleToChange = (v: string) => {
    setDateTo(v);
    setActivePreset(undefined);
  };

  if (!pStats) {
    return (
      <div className="dashboard">
        <div className="dash-hero">
          <div className="dash-hero__greeting">Aucune session dans cette période.</div>
        </div>
      </div>
    );
  }

  const isFullRange  = dateFrom === ALL_MIN && dateTo === ALL_MAX;
  const periodLabel  = isFullRange
    ? "Toute la carrière"
    : `${new Date(dateFrom).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })} → ${new Date(dateTo).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}`;

  const streakType = DASHBOARD_STATS.currentStreak.type;
  const streakCount = DASHBOARD_STATS.currentStreak.count;
  const streakLabel = streakType === "win"
    ? `${streakCount} victoires ITM de suite`
    : `${streakCount} sorties consécutives`;

  const openFocus = (leakId: string) => {
    const leak = getLeakById(leakId);
    if (leak) onSelectLeak?.(leak);
  };

  return (
    <div className="dashboard">

      {/* ── Hero banner ────────────────────────────────────────────────── */}
      <div className="dash-hero">
        <div className="dash-hero__left">
          <div className="dash-hero__greeting">Bienvenue 🃏</div>
          <div className="dash-hero__bankroll">
            {pStats.profit >= 0 ? "+" : ""}{fmtEuros(pStats.profit)}
            <span className="dash-hero__bankroll-sub">profit {isFullRange ? "total" : "sur la période"}</span>
          </div>
          <div className="dash-hero__period-label">{periodLabel}</div>
          <div className="dash-hero__streak">
            <span className={`dash-hero__streak-badge ${streakType === "win" ? "dash-hero__streak-badge--win" : "dash-hero__streak-badge--loss"}`}>
              {streakType === "win" ? "🔥" : "❄️"} {streakLabel}
            </span>
          </div>
        </div>
        <div className="dash-hero__right">
          <div className="dash-hero__roi-ring">
            <div className="dash-hero__roi-value">{pStats.roi.toLocaleString("fr-FR")}%</div>
            <div className="dash-hero__roi-label">ROI</div>
          </div>
        </div>
      </div>

      {lastDebrief && (
        <SessionDebriefCard
          debrief={lastDebrief}
          onSelectFocus={(item) => openFocus(item.leakId)}
        />
      )}

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="dash-kpis">
        <StatCard
          label="Profit"
          value={`${pStats.profit >= 0 ? "+" : ""}${fmtEuros(pStats.profit)}`}
          sub={`Investi : ${fmtEuros(pStats.invested)}`}
          trend={pStats.profit >= 0 ? "up" : "down"}
          accent
          icon="💰"
        />
        <StatCard
          label="ITM"
          value={`${pStats.itmRate}%`}
          sub="In The Money"
          trend={pStats.itmRate >= 20 ? "up" : "down"}
          icon="🎯"
        />
        <StatCard
          label="Winrate"
          value={`+${DASHBOARD_STATS.winRate} bb/100`}
          sub={`${pStats.hands.toLocaleString("fr-FR")} mains`}
          trend="up"
          icon="📈"
        />
        <StatCard
          label="Tournois"
          value={String(pStats.tournaments)}
          sub={`Meilleur : #${pStats.bestFinish}`}
          icon="🏟️"
        />
        <StatCard
          label="Niveau moyen"
          value={`${fmtEuros(pStats.avgBuyIn)} buy-in`}
          sub={`Place moy. top ${pStats.avgPlace}%`}
          icon="📊"
        />
      </div>

      {/* ── Courbe de progression ──────────────────────────────────────── */}
      <div className="dash-card">
        <SectionTitle
          title="Courbe de progression"
          sub="Profit cumulé session par session — survolez les points pour le détail"
        />
        <DateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
          onPreset={applyPreset}
          activePreset={activePreset}
        />
        <ProgressionChart sessions={rebased} />
      </div>

      {/* ── Section 2 colonnes ─────────────────────────────────────────── */}
      <div className="dash-grid-2">
        <div className="dash-card">
          <SectionTitle
            title="Stats par position"
            sub="VPIP · PFR · 3bet% · EV/100 mains"
          />
          <PositionStats stats={POSITION_STATS} />
        </div>
        <div className="dash-card">
          <SectionTitle
            title="Top fuites (leaks)"
            sub="Clique une fuite → on ouvre une main d’exemple avec l’explication"
          />
          <LeaksList leaks={LEAKS} onSelectLeak={onSelectLeak} />
        </div>
      </div>

      {/* ── Sessions récentes ──────────────────────────────────────────── */}
      <div className="dash-card">
        <SectionTitle
          title="Sessions récentes"
          sub={`6 dernières sessions de la période (${pStats.tournaments} total)`}
        />
        <RecentTournaments sessions={filtered} />
      </div>

    </div>
  );
}
