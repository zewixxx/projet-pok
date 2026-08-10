import type { HandAction, ReplayPlayer, Street } from "../../replay.types";
import { ACTION_LABELS, STREET_LABELS } from "../../replay.constants";

interface ActionFeedProps {
  action: HandAction;
  actor: ReplayPlayer | undefined;
  street: Street;
  actionIndex: number;
  totalActions: number;
}

const ACTION_COLOR: Record<string, string> = {
  fold: "action-feed--fold",
  check: "action-feed--check",
  call: "action-feed--call",
  bet: "action-feed--bet",
  raise: "action-feed--raise",
  allin: "action-feed--allin",
};

export function ActionFeed({ action, actor, street, actionIndex, totalActions }: ActionFeedProps) {
  const label = ACTION_LABELS[action.type] ?? action.type;
  const amount = action.amountBb != null ? ` ${action.amountBb.toFixed(1)} bb` : "";
  const colorMod = ACTION_COLOR[action.type] ?? "";

  return (
    <div
      className={`action-feed ${colorMod}`}
      role="status"
      aria-live="polite"
      key={`${actionIndex}-${action.type}-${action.playerId}`}
    >
      <span className="action-feed__street">{STREET_LABELS[street]}</span>
      <span className="action-feed__sep" aria-hidden="true">
        →
      </span>
      <span className="action-feed__text">
        <strong>{actor?.isHero ? "TOI" : (actor?.name ?? "?")}</strong>
        {" "}
        {label}
        {amount}
      </span>
      <span
        className="action-feed__counter"
        aria-label={`Action ${actionIndex + 1} sur ${totalActions}`}
      >
        {actionIndex + 1}/{totalActions}
      </span>
    </div>
  );
}
