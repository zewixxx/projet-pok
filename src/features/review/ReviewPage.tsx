import { LEAKS } from "../dashboard/data/dashboardData";
import { getNextLeak } from "../dashboard/data/leakNavigation";
import TournamentAnalysisGate from "../ai/components/TournamentAnalysisGate";
import type { AppNavigation } from "../../hooks/useAppNavigation";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { EmptyState } from "../../ui/EmptyState";
import { fmtBb } from "../../ui/format";
import { Download, Play } from "../../ui/icons";
import { PageHeader } from "../../ui/PageHeader";
import LeakReviewFlow from "./components/LeakReviewFlow";
import PokerTableReview from "./components/PokerTableReview";
import { TournamentPicker } from "./components/TournamentPicker";

interface ReviewPageProps {
  nav: AppNavigation;
  onImport: () => void;
  onOpenSettings: () => void;
}

function ReviewSkeleton() {
  return (
    <div className="review" aria-busy="true" aria-label="Chargement des mains">
      <div className="skeleton" style={{ minHeight: 420 }} />
      <div className="skeleton" style={{ minHeight: 420 }} />
    </div>
  );
}

export default function ReviewPage({ nav, onImport, onOpenSettings }: ReviewPageProps) {
  const { remote, reviewMode } = nav;

  // Parcours guidé d'une fuite de démonstration.
  if (nav.inLeakMode && nav.leakReview) {
    return (
      <div className="page">
        <LeakReviewFlow
          key={nav.leakReview.leak.id}
          payload={nav.leakReview}
          onExit={nav.exitLeakReview}
          onNextLeak={nav.openNextLeak}
          hasNextLeak={LEAKS.length > 1}
          nextLeakLabel={getNextLeak(nav.leakReview.leak.id)?.description}
        />
      </div>
    );
  }

  if (reviewMode === "loading") {
    return (
      <div className="page page--fill">
        <ReviewSkeleton />
      </div>
    );
  }

  if (reviewMode === "empty") {
    return (
      <div className="page">
        <PageHeader title="Review" subtitle="Rejoue tes mains, vois tes erreurs et leur coût." />
        <Card>
          <EmptyState
            icon={<Play size={26} />}
            title="Aucun tournoi à réviser pour l'instant"
            actions={
              <>
                <Button variant="primary" size="lg" icon={<Download size={18} aria-hidden />} onClick={onImport}>
                  Importer mes mains
                </Button>
                <Button variant="ghost" size="lg" onClick={nav.openDemoReview}>
                  Essayer avec une main d'exemple
                </Button>
              </>
            }
          >
            Importe tes historiques de mains : ils apparaîtront ici, prêts à être analysés.
          </EmptyState>
        </Card>
      </div>
    );
  }

  const selected = nav.selectedTournament;
  const remoteInfo = remote.tournaments?.find((t) => t.id === nav.selectedTournamentId);
  const isDemo = reviewMode === "demo";
  const analyzed = nav.useRemoteData && remote.analyzed;
  const hands = nav.activeHands;

  return (
    <div className="page page--fill">
      <header className="review-head">
        <TournamentPicker tournaments={nav.tournaments} selectedId={nav.selectedTournamentId} onSelect={nav.selectTournament} />
        <div className="review-head__chips">
          {isDemo && (
            <Badge tone="warn" title="Ces mains sont des exemples. Importe les tiennes pour les analyser.">
              Mains d'exemple
            </Badge>
          )}
          {analyzed && remoteInfo?.mistakes != null && (
            <Badge tone={remoteInfo.mistakes > 0 ? "neg" : "pos"}>
              {remoteInfo.mistakes} {remoteInfo.mistakes > 1 ? "erreurs" : "erreur"}
              {remoteInfo.totalLossBb ? ` · ≈ ${fmtBb(remoteInfo.totalLossBb, 0)}` : ""}
            </Badge>
          )}
        </div>
      </header>

      {nav.loading ? (
        <ReviewSkeleton />
      ) : nav.needsAnalysis ? (
        <TournamentAnalysisGate
          tournamentName={selected?.name ?? "Tournoi"}
          handsCount={selected?.handsCount ?? 0}
          status={remote.status}
          progress={remote.progress}
          error={remote.error}
          powerPercent={remote.settings?.powerPercent ?? 50}
          logicalCpus={remote.logicalCpus}
          onStart={remote.startAnalysis}
          onCancel={remote.cancelAnalysis}
          onOpenSettings={onOpenSettings}
        />
      ) : hands.length === 0 ? (
        <Card>
          <EmptyState icon={<Play size={26} />} title="Aucune main dans ce tournoi">
            Ce tournoi ne contient pas de main exploitable. Choisis-en un autre.
          </EmptyState>
        </Card>
      ) : (
        <PokerTableReview
          key={nav.selectedTournamentId}
          hands={hands}
          reviewHands={nav.reviewHands}
          focus={nav.focus}
          bilan={
            analyzed
              ? {
                  handsCount: remote.hands.length,
                  mistakes: remoteInfo?.mistakes,
                  totalLossBb: remoteInfo?.totalLossBb,
                  leaks: remote.leaks,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
