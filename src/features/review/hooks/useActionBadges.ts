import { useMemo } from "react";
import type { HandAction } from "../replay.types";
import { ACTION_LABELS } from "../replay.constants";

/** Badge d'action affiché sur le siège du joueur actif (SRP : logique isolée de l'UI). */
export function useActionBadges(currentAction: HandAction): Record<string, string> {
  return useMemo(() => {
    const label = ACTION_LABELS[currentAction.type] ?? currentAction.type;
    const amount =
      currentAction.amountBb != null ? ` ${currentAction.amountBb.toFixed(1)}` : "";
    return { [currentAction.playerId]: `${label}${amount}` };
  }, [currentAction]);
}
