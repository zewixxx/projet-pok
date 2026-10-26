import { useEffect, useMemo, useState } from "react";
import { Badge, type Tone } from "../../../ui/Badge";
import { Button } from "../../../ui/Button";
import { Card } from "../../../ui/Card";
import { cx } from "../../../ui/cx";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "../../../ui/icons";
import { detectRangeSpot } from "../data/rangeDetection";
import type { LeakReviewPayload } from "../../dashboard/data/leakReviews";
import { useActionBadges } from "../hooks/useActionBadges";
import { useReplay } from "../hooks/useReplay";
import { ActionFeed } from "./replay/ActionFeed";
import { AnalysisPanel } from "./replay/AnalysisPanel";
import { PokerCard } from "./replay/PokerCard";
import RangePanel from "./replay/RangePanel";
import { ReplayTableScene } from "./replay/ReplayTableScene";

type LeakStep = "table" | "analyse" | "ranges";

const STEPS: ReadonlyArray<{ id: LeakStep; label: string }> = [
  { id: "table", label: "La main" },
  { id: "analyse", label: "L'analyse" },
  { id: "ranges", label: "Les ranges" },
];

const SEVERITY: Record<LeakReviewPayload["leak"]["severity"], { label: string; tone: Tone }> = {
  critical: { label: "Critique", tone: "neg" },
  major: { label: "Important", tone: "warn" },
  minor: { label: "Mineur", tone: "info" },
};

interface LeakReviewFlowProps {
  payload: LeakReviewPayload;
  onExit: () => void;
  onNextLeak?: () => void;
  hasNextLeak?: boolean;
  nextLeakLabel?: string;
}

/** Parcours guidé d'une fuite (exemple de démonstration) : la main, l'analyse, les ranges. */
export default function LeakReviewFlow({ payload, onExit, onNextLeak, hasNextLeak = false, nextLeakLabel }: LeakReviewFlowProps) {
  const [step, setStep] = useState<LeakStep>("table");

  useEffect(() => {
    setStep("table");
  }, [payload.leak.id]);

  const [snapshot, controls] = useReplay(payload.hands, { initialHandIndex: 0, initialActionIndex: 0 });
  const { hand, actionIndex, currentAction, street, visibleBoard, pot, players, currentTip, currentEvComparison, isHeroDecision, isFirstAction, isLastAction } = snapshot;

  const actor = players.find((p) => p.id === currentAction.playerId);
  const actionBadges = useActionBadges(currentAction);
  const rangeContext = useMemo(() => detectRangeSpot(hand, actionIndex, players), [hand, actionIndex, players]);
  const heroCards = hand.players.find((p) => p.isHero)?.holeCards;
  const atFocusSpot = actionIndex === payload.focusActionIndex;

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const isLast = stepIndex === STEPS.length - 1;
  const severity = SEVERITY[payload.leak.severity];

  const goNext = () => {
    if (step === "table") controls.goToAction(payload.focusActionIndex);
    if (!isLast) setStep(STEPS[stepIndex + 1].id);
  };

  return (
    <section className="leak-flow" aria-label="Parcours d'une fuite">
      <header className="leak-flow__head">
        <div>
          <p className="leak-flow__kicker">
            <Badge tone={severity.tone}>{severity.label}</Badge>
            <span>Fuite · {payload.leak.category}</span>
            <Badge tone="warn">Exemple de démonstration</Badge>
          </p>
          <h1 className="leak-flow__title">{payload.explanation.title}</h1>
        </div>
        <Button variant="ghost" icon={<ChevronLeft size={16} aria-hidden />} onClick={onExit}>
          Retour à l'accueil
        </Button>
      </header>

      <ol className="stepper" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <li key={s.id} className="stepper__item">
            <button
              type="button"
              className={cx("stepper__btn", s.id === step && "is-active", i < stepIndex && "is-done")}
              aria-current={s.id === step ? "step" : undefined}
              disabled={i > stepIndex}
              onClick={() => {
                if (s.id !== "table") controls.goToAction(payload.focusActionIndex);
                setStep(s.id);
              }}
            >
              <span className="stepper__num" aria-hidden>
                {i < stepIndex ? <Check size={14} /> : i + 1}
              </span>
              {s.label}
            </button>
          </li>
        ))}
      </ol>

      <Card className="leak-flow__stage">
        {step === "table" && (
          <div className="leak-flow__table">
            <div className="callout">
              <div>
                <p className="callout__text">{payload.explanation.detail}</p>
                <p className="callout__fix">
                  <strong>À retenir :</strong> {payload.explanation.fix}
                </p>
              </div>
              {heroCards && (
                <div className="callout__cards" aria-label="Ta main de départ">
                  <PokerCard notation={heroCards[0]} size="normal" />
                  <PokerCard notation={heroCards[1]} size="normal" />
                </div>
              )}
            </div>

            <ReplayTableScene street={street} visibleBoard={visibleBoard} pot={pot} players={players} actionBadges={actionBadges} variant="compact" />

            <ActionFeed action={currentAction} actor={actor} street={street} actionIndex={actionIndex} totalActions={hand.actions.length} />

            <div className="leak-flow__scrub">
              <Button variant="secondary" size="sm" onClick={controls.prevAction} disabled={isFirstAction} icon={<ChevronLeft size={16} aria-hidden />} aria-label="Coup précédent">
                Précédent
              </Button>
              <input
                type="range"
                className="slider"
                min={0}
                max={Math.max(hand.actions.length - 1, 0)}
                value={actionIndex}
                style={{ "--p": `${hand.actions.length > 1 ? (actionIndex / (hand.actions.length - 1)) * 100 : 0}%` } as React.CSSProperties}
                onChange={(e) => controls.goToAction(Number(e.target.value))}
                aria-label="Position dans la main"
              />
              <Button variant="secondary" size="sm" onClick={controls.nextAction} disabled={isLastAction} aria-label="Coup suivant">
                Suivant <ChevronRight size={16} aria-hidden />
              </Button>
              {atFocusSpot ? (
                <Badge tone="brand">Le coup clé</Badge>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => controls.goToAction(payload.focusActionIndex)}>
                  Aller au coup clé
                </Button>
              )}
            </div>
          </div>
        )}

        {step === "analyse" && (
          <div className="leak-flow__panel">
            <p className="leak-flow__intro">Voici pourquoi ce coup te coûte de l'EV. Compare les options :</p>
            <AnalysisPanel street={street} ev={currentEvComparison} tip={currentTip} isHeroDecision={isHeroDecision} />
          </div>
        )}

        {step === "ranges" && (
          <div className="leak-flow__panel">
            <p className="leak-flow__intro">Les mains que tu (et ton adversaire) pouvez avoir dans cette situation :</p>
            <RangePanel context={rangeContext} />
          </div>
        )}
      </Card>

      <footer className="leak-flow__foot">
        <Button variant="ghost" onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)].id)} disabled={stepIndex === 0}>
          Retour
        </Button>
        <span className="leak-flow__progress num">
          Étape {stepIndex + 1} / {STEPS.length}
        </span>
        {!isLast ? (
          <Button variant="primary" onClick={goNext} icon={<ArrowRight size={16} aria-hidden />}>
            Continuer
          </Button>
        ) : (
          <div className="leak-flow__end">
            {hasNextLeak && onNextLeak && (
              <Button variant="secondary" onClick={onNextLeak} title={nextLeakLabel}>
                Fuite suivante
              </Button>
            )}
            <Button variant="primary" onClick={onExit} icon={<Check size={16} aria-hidden />}>
              Terminer
            </Button>
          </div>
        )}
      </footer>
    </section>
  );
}
