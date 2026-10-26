import { Button } from "../../../../ui/Button";
import { EmptyState } from "../../../../ui/EmptyState";
import { Play, Target } from "../../../../ui/icons";
import type { CoachTip, EvComparison, SpotInsight, Street } from "../../replay.types";
import { EvComparison as EvComparisonView } from "./EvComparison";
import { Verdict } from "./Verdict";

interface AnalysisPanelProps {
  street: Street;
  ev?: EvComparison;
  tip?: CoachTip;
  spot?: SpotInsight;
  isHeroDecision: boolean;
  /** Absent dans le parcours fuite : pas de bouton de saut. */
  onJumpToDecision?: () => void;
}

/** Verdict du coach, puis comparaison des options : lecture du haut vers le bas. */
export function AnalysisPanel({ street, ev, tip, spot, isHeroDecision, onJumpToDecision }: AnalysisPanelProps) {
  if (!ev && !tip) {
    return (
      <div className="analysis">
        {isHeroDecision ? (
          <EmptyState icon={<Target size={26} />} title="Pas d'analyse pour ce coup">
            Le moteur n'a pas d'estimation pour cette action.
          </EmptyState>
        ) : (
          <EmptyState
            icon={<Target size={26} />}
            title="Ce n'est pas encore ton tour"
            actions={
              onJumpToDecision && (
                <Button variant="primary" icon={<Play size={16} aria-hidden />} onClick={onJumpToDecision}>
                  Aller à ma décision
                </Button>
              )
            }
          >
            L'analyse apparaît sur tes décisions. Avance dans la main pour la voir.
          </EmptyState>
        )}
      </div>
    );
  }

  return (
    <div className="analysis">
      {tip && <Verdict tip={tip} spot={spot} />}
      {ev && <EvComparisonView comparison={ev} street={street} />}
    </div>
  );
}
