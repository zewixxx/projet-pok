import { useMemo } from "react";
import { fmtBbAuto } from "../../../ui/format";
import type { ActionType, HandAction } from "../replay.types";
import { ACTION_LABELS } from "../replay.constants";

export interface ActionBadge {
  label: string;
  type: ActionType;
}

/** Badge d'action affiché sur le siège du joueur qui vient d'agir (logique isolée de l'UI). */
export function useActionBadges(currentAction: HandAction): Record<string, ActionBadge> {
  return useMemo(() => {
    const label = ACTION_LABELS[currentAction.type] ?? currentAction.type;
    const amount = currentAction.amountBb != null ? ` ${fmtBbAuto(currentAction.amountBb)}` : "";
    return { [currentAction.playerId]: { label: `${label}${amount}`, type: currentAction.type } };
  }, [currentAction]);
}
