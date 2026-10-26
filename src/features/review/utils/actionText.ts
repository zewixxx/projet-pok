import { fmtBbAuto } from "../../../ui/format";
import type { ActionType, HandAction } from "../replay.types";

const OTHER_VERBS: Record<ActionType, string> = {
  fold: "se couche",
  call: "paie",
  bet: "mise",
  raise: "relance à",
  check: "check",
  allin: "est all-in",
};

const HERO_VERBS: Record<ActionType, string> = {
  fold: "te couches",
  call: "paies",
  bet: "mises",
  raise: "relances à",
  check: "checkes",
  allin: "es all-in",
};

export interface ActionSentence {
  subject: string;
  verb: string;
  amount: string | null;
}

/** Phrase d'une action en français : « Alice relance à 3 bb », « Tu te couches ». */
export function actionSentence(action: HandAction, playerName: string, isHero: boolean): ActionSentence {
  const verbs = isHero ? HERO_VERBS : OTHER_VERBS;
  return {
    subject: isHero ? "Tu" : playerName,
    verb: verbs[action.type],
    amount: action.amountBb != null ? fmtBbAuto(action.amountBb) : null,
  };
}

export function actionSentenceText(action: HandAction, playerName: string, isHero: boolean): string {
  const s = actionSentence(action, playerName, isHero);
  return [s.subject, s.verb, s.amount].filter(Boolean).join(" ");
}
