import { useEffect, useMemo, useState } from "react";
import type { LeakReviewPayload } from "../../dashboard/data/leakReviews";
import { STREET_LABELS_UPPER } from "../replay.constants";
import { useActionBadges } from "../hooks/useActionBadges";
import { useReplay } from "../hooks/useReplay";
import { detectRangeSpot } from "../data/rangeDetection";
import { ActionFeed } from "./replay/ActionFeed";
import { AnalysisPanel } from "./replay/AnalysisPanel";
import { HeroHandDisplay } from "./replay/HeroHandDisplay";
import { ReplayTableScene } from "./replay/ReplayTableScene";
import RangePanel from "./replay/RangePanel";

type LeakStep = "table" | "analyse" | "ranges";

const STEPS: LeakStep[] = ["table", "analyse", "ranges"];

const STEP_LABELS: Record<LeakStep, string> = {
  table: "1 · La main",
  analyse: "2 · L’analyse",
  ranges: "3 · Les ranges",
};

interface LeakReviewFlowProps {
  payload: LeakReviewPayload;
  onExit: () => void;
  onNextLeak?: () => void;
  hasNextLeak?: boolean;
  nextLeakLabel?: string;
}

export default function LeakReviewFlow({
  payload,
  onExit,
  onNextLeak,
  hasNextLeak = false,
  nextLeakLabel,
}: LeakReviewFlowProps) {
  const [step, setStep] = useState<LeakStep>("table");

  useEffect(() => {
    setStep("table");
  }, [payload.leak.id]);

  const [snapshot, controls] = useReplay(payload.hands, {
    initialHandIndex: 0,
    initialActionIndex: 0,
  });

  const {
    hand,
    actionIndex,
    currentAction,
    street,
    visibleBoard,
    pot,
    players,
    currentTip,
    currentEvComparison,
    isHeroDecision,
    isFirstAction,
    isLastAction,
  } = snapshot;

  const actor = players.find((p) => p.id === currentAction.playerId);
  const actionBadges = useActionBadges(currentAction);
  const rangeContext = useMemo(
    () => detectRangeSpot(hand, actionIndex, players),
    [hand, actionIndex, players],
  );

  const hero = players.find((p) => p.isHero);
  const heroCards = hand.players.find((p) => p.isHero)?.holeCards;
  const atFocusSpot = actionIndex === payload.focusActionIndex;

  const stepIndex = STEPS.indexOf(step);
  const isLast = step === "ranges";

  const goNext = () => {
    if (step === "table") {
      controls.goToAction(payload.focusActionIndex);
    }
    if (!isLast) setStep(STEPS[stepIndex + 1]);
  };

  const goPrev = () => {
    if (stepIndex <= 0) return;
    setStep(STEPS[stepIndex - 1]);
  };

  const severityLabel =
    payload.leak.severity === "critical"
      ? "Critique"
      : payload.leak.severity === "major"
        ? "Majeur"
        : "Mineur";

  return (
    <section className="leak-flow" aria-label="Review fuite étape par étape">
      <header className="leak-flow__header">
        <div className="leak-flow__header-main">
          <p className="leak-flow__kicker">
            Review fuite · {payload.leak.category} · {severityLabel}
          </p>
          <h2 className="leak-flow__title">{payload.explanation.title}</h2>
        </div>
        <button type="button" className="leak-flow__exit" onClick={onExit}>
          ← Retour score
        </button>
      </header>

      <nav className="leak-flow__steps" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            className={[
              "leak-flow__step",
              s === step ? "leak-flow__step--active" : "",
              i < stepIndex ? "leak-flow__step--done" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              if (i > stepIndex) return;
              if (s === "analyse" || s === "ranges") {
                controls.goToAction(payload.focusActionIndex);
              }
              setStep(s);
            }}
          >
            {STEP_LABELS[s]}
          </button>
        ))}
      </nav>

      <div className="leak-flow__stage">
        {step === "table" && (
          <div className="leak-flow__panel">
            <p className="leak-flow__detail">{payload.explanation.detail}</p>
            <p className="leak-flow__fix">
              <strong>À retenir :</strong> {payload.explanation.fix}
            </p>

            <div className="leak-flow__hand-meta">
              <span>{hand.label}</span>
              <span className="leak-flow__pill">
                Blinds {hand.blindsBb.small}/{hand.blindsBb.big}
              </span>
              <span className="leak-flow__pill leak-flow__pill--street">
                {STREET_LABELS_UPPER[street]}
              </span>
              {hero && (
                <span className="leak-flow__pill leak-flow__pill--pos">{hero.position}</span>
              )}
            </div>

            <HeroHandDisplay cards={heroCards} />

            <ReplayTableScene
              street={street}
              visibleBoard={visibleBoard}
              pot={pot}
              players={players}
              actionBadges={actionBadges}
              variant="compact"
            />

            <div className="leak-flow__scrubber" aria-label="Navigation dans le coup">
              <button
                type="button"
                className="leak-flow__scrub-btn"
                onClick={controls.prevAction}
                disabled={isFirstAction}
                aria-label="Action précédente"
              >
                ← Préc.
              </button>

              <div className="leak-flow__scrub-mid">
                <span className="leak-flow__scrub-count">
                  Coup {actionIndex + 1} / {hand.actions.length}
                </span>
                <input
                  type="range"
                  className="leak-flow__scrub-range"
                  min={0}
                  max={Math.max(hand.actions.length - 1, 0)}
                  value={actionIndex}
                  onChange={(e) => controls.goToAction(Number(e.target.value))}
                  aria-label="Position dans le coup"
                />
                {!atFocusSpot && (
                  <button
                    type="button"
                    className="leak-flow__scrub-spot"
                    onClick={() => controls.goToAction(payload.focusActionIndex)}
                  >
                    Aller au spot →
                  </button>
                )}
                {atFocusSpot && (
                  <span className="leak-flow__scrub-spot-label">Spot clé</span>
                )}
              </div>

              <button
                type="button"
                className="leak-flow__scrub-btn"
                onClick={controls.nextAction}
                disabled={isLastAction}
                aria-label="Action suivante"
              >
                Suiv. →
              </button>
            </div>

            <ActionFeed
              action={currentAction}
              actor={actor}
              street={street}
              actionIndex={actionIndex}
              totalActions={hand.actions.length}
            />
          </div>
        )}

        {step === "analyse" && (
          <div className="leak-flow__panel leak-flow__panel--analyse">
            <p className="leak-flow__panel-intro">
              Voici pourquoi ce coup te coûte de l’EV — compare les options.
            </p>
            <AnalysisPanel
              street={street}
              ev={currentEvComparison}
              tip={currentTip}
              isHeroDecision={isHeroDecision}
              simple
            />
          </div>
        )}

        {step === "ranges" && (
          <div className="leak-flow__panel leak-flow__panel--ranges">
            <p className="leak-flow__panel-intro">
              Ranges suggérées pour ce spot — ce que tu (et l’adversaire) pouvez avoir.
            </p>
            <RangePanel context={rangeContext} />
          </div>
        )}
      </div>

      <footer className="leak-flow__footer">
        <button
          type="button"
          className="leak-flow__btn leak-flow__btn--ghost"
          onClick={goPrev}
          disabled={stepIndex === 0}
        >
          ← Retour
        </button>

        <span className="leak-flow__progress">
          Étape {stepIndex + 1} / {STEPS.length}
        </span>

        {!isLast ? (
          <button type="button" className="leak-flow__btn leak-flow__btn--primary" onClick={goNext}>
            Continuer →
          </button>
        ) : (
          <div className="leak-flow__end-actions">
            {hasNextLeak && onNextLeak && (
              <button
                type="button"
                className="leak-flow__btn leak-flow__btn--next"
                onClick={onNextLeak}
                title={nextLeakLabel}
              >
                Prochain leak →
              </button>
            )}
            <button type="button" className="leak-flow__btn leak-flow__btn--primary" onClick={onExit}>
              Terminer ✓
            </button>
          </div>
        )}
      </footer>
    </section>
  );
}
