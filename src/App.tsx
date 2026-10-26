import { useEffect, useState } from "react";
import DashboardPage from "./features/dashboard/HomePage";
import ImportPage from "./features/winamax-analyzer/components/ImportPage";
import AiSettingsPage from "./features/ai/components/AiSettingsPage";
import ReviewPage from "./features/review/ReviewPage";
import { useAppNavigation } from "./hooks/useAppNavigation";
import { HelpDialog } from "./shell/HelpDialog";
import { Sidebar, type EngineState } from "./shell/Sidebar";
import { isTypingTarget } from "./features/review/shortcuts";

export default function App() {
  const nav = useAppNavigation();
  const [helpOpen, setHelpOpen] = useState(false);

  // « ? » ouvre l'aide, partout dans l'application.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      setHelpOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { remote } = nav;
  const running = remote.status === "running";
  const progress = remote.progress;
  const engine: EngineState = {
    running,
    pct: progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : undefined,
    tournamentName: remote.tournaments?.find((t) => t.id === progress?.tournamentId)?.name,
    phase: progress?.phase === "texte" ? "Rédaction des conseils" : "Calcul des spots",
  };

  return (
    <div className="app">
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>

      <Sidebar
        activePage={nav.activePage}
        onNavigate={nav.goToPage}
        onOpenHelp={() => setHelpOpen(true)}
        engine={engine}
        engineAvailable={remote.available}
      />

      <main className="app__main" id="contenu" tabIndex={-1}>
        {nav.activePage === "home" && (
          <DashboardPage
            data={nav.home}
            onReviewTournament={(id) => nav.openTournament(id)}
            onOpenLeak={nav.openLeak}
            onImport={() => nav.goToPage("import")}
            onDemoReview={nav.openDemoReview}
          />
        )}

        {nav.activePage === "review" && (
          <ReviewPage nav={nav} onImport={() => nav.goToPage("import")} onOpenSettings={() => nav.goToPage("settings")} />
        )}

        {nav.activePage === "import" && (
          <ImportPage onDataChanged={remote.refreshTournaments} onOpenReview={() => nav.goToPage("review")} />
        )}

        {nav.activePage === "settings" && <AiSettingsPage />}
      </main>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
