import { useEffect, useMemo, useState } from "react";
import type { ReplayHand } from "../replay.types";
import { STREET_LABELS_UPPER } from "../replay.constants";
import { useActionBadges } from "../hooks/useActionBadges";
import { useReplay } from "../hooks/useReplay";
import { detectRangeSpot } from "../data/rangeDetection";
import { AnalysisPanel } from "./replay/AnalysisPanel";
import { ReplayTableScene } from "./replay/ReplayTableScene";
import RangePanel from "./replay/RangePanel";
import { TableControls } from "./replay/TableControls";

type SidebarTab = "analyse" | "ranges";

interface PokerTableReviewProps {
  hands: ReplayHand[];
  initialHandIndex?: number;
  initialActionIndex?: number;
  focusHandId?: string | null;
}

export default function PokerTableReview({
  hands,
  initialHandIndex = 0,
  initialActionIndex = 0,
  focusHandId = null,
}: PokerTableReviewProps) {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("analyse");
  const [snapshot, controls] = useReplay(hands, { initialHandIndex, initialActionIndex });
  const {
    hand,
    handIndex,
    totalHands,
    actionIndex,
    street,
    visibleBoard,
    pot,
    players,
    currentTip,
    currentEvComparison,
    isHeroDecision,
    isFirstAction,
    isLastAction,
    isFirstHand,
    isLastHand,
  } = snapshot;

  useEffect(() => {
    if (!focusHandId) return;
    const idx = hands.findIndex((h) => h.id === focusHandId);
    if (idx >= 0) controls.goToHand(idx);
    // Intentionnel : uniquement quand l’utilisateur choisit une main EV±
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusHandId]);

  useEffect(() => {
    if (isHeroDecision) setSidebarTab("analyse");
  }, [isHeroDecision, handIndex, actionIndex]);

  const rangeContext = useMemo(
    () => detectRangeSpot(hand, actionIndex, players),
    [hand, actionIndex, players],
  );

  const actionBadges = useActionBadges(snapshot.currentAction);
  const hero = players.find((p) => p.isHero);

  return (
    <section className="table-review table-review--split">
      <div className="table-review__workspace">
        <div className="table-review__stage">
          <header className="table-review__header">
            <div className="table-review__title-row">
              <span className="table-review__hand-counter">
                Main {handIndex + 1} / {hands.length}
                <span className="table-review__action-mini">
                  {" "}
                  · coup {actionIndex + 1}/{hand.actions.length}
                </span>
              </span>
              <h2 className="table-review__title">{hand.label}</h2>
            </div>
            <div className="table-review__meta">
              <span className="table-review__blinds">
                Blinds {hand.blindsBb.small}/{hand.blindsBb.big} bb
              </span>
              {hero && <span className="table-review__hero-pos">{hero.position}</span>}
              <span className={`table-review__street-badge table-review__street-badge--${street}`}>
                {STREET_LABELS_UPPER[street]}
              </span>
            </div>
          </header>

          <ReplayTableScene
            street={street}
            visibleBoard={visibleBoard}
            pot={pot}
            players={players}
            actionBadges={actionBadges}
          />

          <TableControls
            handIndex={handIndex}
            totalHands={totalHands}
            actionIndex={actionIndex}
            totalActions={hand.actions.length}
            onPrevAction={controls.prevAction}
            onNextAction={controls.nextAction}
            onPrevHand={controls.prevHand}
            onNextHand={controls.nextHand}
            onGoToHand={controls.goToHand}
            isFirstAction={isFirstAction}
            isLastAction={isLastAction}
            isFirstHand={isFirstHand}
            isLastHand={isLastHand}
          />
        </div>

        <aside className="table-review__sidebar" aria-label="Analyse et ranges">
          <div className="table-review__tabs" role="tablist" aria-label="Panneau latéral">
            {(
              [
                ["analyse", "Analyse"],
                ["ranges", "Ranges"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={sidebarTab === id}
                className={`table-review__tab${sidebarTab === id ? " table-review__tab--active" : ""}`}
                onClick={() => setSidebarTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {sidebarTab === "analyse" && (
            <div className="table-review__sidebar-block" role="tabpanel">
              <AnalysisPanel
                street={street}
                ev={currentEvComparison}
                tip={currentTip}
                isHeroDecision={isHeroDecision}
                simple
              />
            </div>
          )}

          {sidebarTab === "ranges" && (
            <div
              className="table-review__sidebar-block table-review__sidebar-block--ranges"
              role="tabpanel"
            >
              <RangePanel context={rangeContext} compact />
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
