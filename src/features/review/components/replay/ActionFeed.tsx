import { cx } from "../../../../ui/cx";
import { STREET_LABELS } from "../../replay.constants";
import type { HandAction, ReplayPlayer, Street } from "../../replay.types";
import { actionSentence } from "../../utils/actionText";

interface ActionFeedProps {
  action: HandAction;
  actor: ReplayPlayer | undefined;
  street: Street;
  actionIndex: number;
  totalActions: number;
}

/** Légende de l'action en cours, lue à voix haute par les lecteurs d'écran. */
export function ActionFeed({ action, actor, street, actionIndex, totalActions }: ActionFeedProps) {
  const sentence = actionSentence(action, actor?.name ?? "?", Boolean(actor?.isHero));
  return (
    <div
      className={cx("caption", `caption--${action.type}`)}
      role="status"
      aria-live="polite"
      key={`${actionIndex}-${action.type}-${action.playerId}`}
    >
      <span className="caption__street">{STREET_LABELS[street]}</span>
      <span className="caption__text">
        <strong>{sentence.subject}</strong> {sentence.verb}
        {sentence.amount && <strong className="num"> {sentence.amount}</strong>}
        {actor && !actor.isHero && <span className="caption__pos"> · {actor.position}</span>}
      </span>
      <span className="caption__count num" aria-label={`Coup ${actionIndex + 1} sur ${totalActions}`}>
        {actionIndex + 1}/{totalActions}
      </span>
    </div>
  );
}
