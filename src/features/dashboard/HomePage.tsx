import { useMemo, useState } from "react";
import { Badge } from "../../ui/Badge";
import { Card, CardHeader } from "../../ui/Card";
import { fmtEuros, fmtInt } from "../../ui/format";
import { Coins, Percent, Target, Trophy, Users, Layers } from "../../ui/icons";
import { PageHeader } from "../../ui/PageHeader";
import { Segmented } from "../../ui/Segmented";
import { Sparkline } from "../../ui/Sparkline";
import { Stat } from "../../ui/Stat";
import { Term } from "../../ui/Term";
import { LeaksCard } from "./components/LeaksCard";
import { LimitsCard } from "./components/LimitsCard";
import { NextStepCard } from "./components/NextStepCard";
import { Onboarding } from "./components/Onboarding";
import { PositionStats } from "./components/PositionStats";
import { ProgressionChart } from "./components/ProgressionChart";
import { RecentTournaments } from "./components/RecentTournaments";
import { computePeriodStats, rebaseForPeriod } from "./utils/sessionStats";
import type { HomeData, HomeLeak } from "./useHomeData";

type PeriodId = "1m" | "3m" | "6m" | "1y" | "all";

const PERIODS: ReadonlyArray<{ value: PeriodId; label: string; ariaLabel: string; months: number | null }> = [
  { value: "1m", label: "1M", ariaLabel: "1 mois", months: 1 },
  { value: "3m", label: "3M", ariaLabel: "3 mois", months: 3 },
  { value: "6m", label: "6M", ariaLabel: "6 mois", months: 6 },
  { value: "1y", label: "1A", ariaLabel: "1 an", months: 12 },
  { value: "all", label: "Tout", ariaLabel: "Toute la période", months: null },
];

interface HomePageProps {
  data: HomeData;
  onReviewTournament: (tournamentId: string) => void;
  onOpenLeak: (leak: HomeLeak) => void;
  onImport: () => void;
  onDemoReview: () => void;
}

function HomeSkeleton() {
  return (
    <div className="page" aria-busy="true" aria-label="Chargement de l'accueil">
      <div className="skeleton" style={{ height: 44, width: 280 }} />
      <div className="skeleton" style={{ height: 120 }} />
      <div className="kpis">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton" style={{ height: 104 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 320 }} />
    </div>
  );
}

export default function HomePage({ data, onReviewTournament, onOpenLeak, onImport, onDemoReview }: HomePageProps) {
  const [period, setPeriod] = useState<PeriodId>("all");

  const { filtered, rebased, stats } = useMemo(() => {
    const preset = PERIODS.find((p) => p.value === period)!;
    let list = data.sessions;
    if (preset.months != null && list.length > 0) {
      const to = new Date(list[list.length - 1].date);
      const from = new Date(to);
      from.setMonth(from.getMonth() - preset.months);
      const fromIso = from.toISOString().slice(0, 10);
      list = list.filter((s) => s.date >= fromIso);
    }
    return { filtered: list, rebased: rebaseForPeriod(list), stats: computePeriodStats(list) };
  }, [data.sessions, period]);

  if (data.mode === "loading") return <HomeSkeleton />;
  if (data.mode === "empty") {
    return (
      <div className="page">
        <Onboarding onImport={onImport} onDemo={onDemoReview} />
      </div>
    );
  }

  const isDemo = data.mode === "demo";
  const analysis = data.analysis;
  const subtitle = isDemo
    ? "Aperçu avec des données d'exemple. L'application de bureau affichera ton vrai bilan."
    : analysis
      ? `${fmtInt(analysis.total)} tournois importés · ${fmtInt(analysis.analyzed)} analysés par le moteur${
          analysis.mistakes > 0 ? ` · ${fmtInt(analysis.mistakes)} erreurs repérées` : ""
        }`
      : "Ton bilan et ce qu'il faut travailler en priorité.";

  return (
    <div className="page">
      <PageHeader
        title="Accueil"
        subtitle={subtitle}
        eyebrow={isDemo ? <Badge tone="warn">Données d'exemple</Badge> : undefined}
        actions={
          <Segmented
            label="Période affichée"
            value={period}
            onChange={setPeriod}
            options={PERIODS.map((p) => ({ value: p.value, label: p.label, ariaLabel: p.ariaLabel }))}
          />
        }
      />

      <NextStepCard
        data={data}
        onReviewTournament={onReviewTournament}
        onOpenLeak={onOpenLeak}
        onImport={onImport}
        onDemoReview={onDemoReview}
      />

      {stats ? (
        <section className="kpis" aria-label="Chiffres clés">
          <Stat
            label="Résultat net"
            icon={<Coins size={15} aria-hidden />}
            value={fmtEuros(stats.profit, { sign: true })}
            tone={stats.profit >= 0 ? "pos" : "neg"}
            hint={`${fmtEuros(stats.invested)} investis`}
            trailing={<Sparkline values={rebased.slice(-40).map((s) => s.cumulEuros)} color={stats.profit >= 0 ? "var(--pos)" : "var(--neg)"} width={86} height={30} />}
          />
          <Stat
            label={<Term id="roi">ROI</Term>}
            icon={<Percent size={15} aria-hidden />}
            value={`${stats.roi > 0 ? "+" : stats.roi < 0 ? "\u2212" : ""}${Math.abs(stats.roi)}\u00a0%`}
            tone={stats.roi >= 0 ? "pos" : "neg"}
            hint="Bénéfice / buy-ins"
          />
          <Stat
            label={<Term id="itm">ITM</Term>}
            icon={<Target size={15} aria-hidden />}
            value={`${stats.itmRate}\u00a0%`}
            hint="Tournois payés"
          />
          <Stat
            label={<Term id="abi">Buy-in moyen</Term>}
            icon={<Layers size={15} aria-hidden />}
            value={fmtEuros(stats.avgBuyIn)}
            hint="ABI"
          />
          <Stat
            label="Tournois"
            icon={<Trophy size={15} aria-hidden />}
            value={fmtInt(stats.tournaments)}
            hint={stats.bestFinish > 0 ? `Meilleure place : n°${fmtInt(stats.bestFinish)}` : undefined}
          />
          <Stat label="Mains jouées" icon={<Users size={15} aria-hidden />} value={fmtInt(stats.hands)} hint="Sur la période" />
        </section>
      ) : (
        <Card>
          <p className="muted">Aucun tournoi classé sur cette période.</p>
        </Card>
      )}

      <Card aria-labelledby="chart-title">
        <CardHeader
          id="chart-title"
          title="Résultat cumulé"
          sub="Survole la courbe, ou utilise les flèches du clavier, pour voir chaque tournoi."
        />
        <ProgressionChart sessions={rebased} />
      </Card>

      <div className="grid-2">
        <LeaksCard leaks={data.leaks} nothingAnalyzed={!isDemo && (analysis?.analyzed ?? 0) === 0} onOpenLeak={onOpenLeak} />
        <LimitsCard buckets={data.byLimit} />
      </div>

      {data.positions && <PositionStats stats={data.positions} />}

      <RecentTournaments
        rows={data.recent}
        total={isDemo ? filtered.length : data.recent.length}
        onOpen={isDemo ? undefined : onReviewTournament}
      />
    </div>
  );
}
