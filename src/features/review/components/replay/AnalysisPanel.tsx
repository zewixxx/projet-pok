import type { CoachTip, EvComparison, Street } from "../../replay.types";
import { CoachTip as CoachTipView } from "./CoachTip";
import { EvComparison as EvComparisonView } from "./EvComparison";
import { ResizablePanel } from "./ResizablePanel";

interface AnalysisPanelProps {
  street: Street;
  ev?: EvComparison;
  tip?: CoachTip;
  isHeroDecision: boolean;
  /** Sans poignées de resize — pour le parcours fuite étape par étape */
  simple?: boolean;
}

function EmptyState({ isHeroDecision }: { isHeroDecision: boolean }) {
  return (
    <div className="table-review__analysis-empty">
      <p className="table-review__analysis-empty-title">
        {isHeroDecision ? "Pas d’analyse pour ce coup" : "Pas encore ton tour"}
      </p>
      <p className="table-review__analysis-empty-text">
        {isHeroDecision
          ? "Aucune donnée EV sur cette action."
          : "Avance jusqu’à ton action pour voir le comparatif EV."}
      </p>
    </div>
  );
}

export function AnalysisPanel({
  street,
  ev,
  tip,
  isHeroDecision,
  simple = false,
}: AnalysisPanelProps) {
  if (!ev && !tip) {
    return (
      <div className="table-review__analysis">
        <EmptyState isHeroDecision={isHeroDecision} />
      </div>
    );
  }

  if (simple) {
    return (
      <div className="table-review__analysis table-review__analysis--simple">
        {ev && <EvComparisonView comparison={ev} street={street} />}
        {tip && <CoachTipView tip={tip} />}
      </div>
    );
  }

  return (
    <div className="table-review__analysis">
      {ev && (
        <ResizablePanel
          id="ev-comparison"
          defaultHeight={0}
          minHeight={180}
          maxHeight={520}
          autoSize
          className="resize-panel--ev"
        >
          <EvComparisonView comparison={ev} street={street} />
        </ResizablePanel>
      )}
      {tip && (
        <ResizablePanel
          id="coach-tip"
          defaultHeight={0}
          minHeight={120}
          maxHeight={400}
          autoSize
          className="resize-panel--coach"
        >
          <CoachTipView tip={tip} />
        </ResizablePanel>
      )}
    </div>
  );
}
