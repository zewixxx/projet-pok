import BurgerNav from "./components/BurgerNav";
import { LEAKS } from "./features/dashboard/data/dashboardData";
import { getNextLeak } from "./features/dashboard/data/sessionDebrief";
import ImportBanner from "./features/import/components/ImportBanner";
import DashboardPage from "./features/dashboard/DashboardPage";
import HandsPanel from "./features/review/components/HandsPanel";
import LeakReviewFlow from "./features/review/components/LeakReviewFlow";
import PokerTableReview from "./features/review/components/PokerTableReview";
import TournamentSelector from "./features/review/components/TournamentSelector";
import WinamaxAnalyzerPage from "./features/winamax-analyzer/components/WinamaxAnalyzerPage";
import { useAppNavigation } from "./hooks/useAppNavigation";

export default function App() {
  const nav = useAppNavigation();

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="app-nav__brand">
          <span className="app-nav__logo" aria-hidden>
            🎴
          </span>
          <span className="app-nav__name">Projet-pok</span>
        </div>

        <BurgerNav activePage={nav.activePage} onNavigate={nav.goToPage} />

        <div className="app-nav__spacer" />
      </header>

      <ImportBanner />

      <main className={`app-content${nav.activePage === "review" ? " app-content--wide" : ""}`}>
        {nav.activePage === "dashboard" && (
          <DashboardPage onSelectLeak={nav.openLeakReview} />
        )}

        {nav.activePage === "winamax" && <WinamaxAnalyzerPage />}

        {nav.activePage === "review" && (
          <>
            {!nav.inLeakMode && (
              <TournamentSelector
                tournaments={nav.tournaments}
                selectedId={nav.selectedTournamentId}
                onSelect={nav.selectTournament}
              />
            )}
            {nav.loading && !nav.inLeakMode ? (
              <div className="import-loading">Chargement des mains…</div>
            ) : nav.inLeakMode && nav.leakReview ? (
              <LeakReviewFlow
                key={nav.leakReview.leak.id}
                payload={nav.leakReview}
                onExit={nav.exitLeakReview}
                onNextLeak={nav.openNextLeak}
                hasNextLeak={LEAKS.length > 1}
                nextLeakLabel={getNextLeak(nav.leakReview.leak.id)?.description}
              />
            ) : (
              <div className="review-layout">
                <PokerTableReview
                  key={nav.selectedTournamentId}
                  hands={nav.activeHands}
                  focusHandId={nav.focusHandId}
                />
                <HandsPanel
                  hands={nav.reviewHands.length > 0 ? nav.reviewHands : []}
                  activeHandId={nav.focusHandId}
                  onSelectHand={nav.setFocusHandId}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
