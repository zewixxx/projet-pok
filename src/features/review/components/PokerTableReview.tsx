import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../../../ui/Badge";
import { fmtBbAuto } from "../../../ui/format";
import { History, Layers, Lightbulb, ListChecks } from "../../../ui/icons";
import { tabIds, Tabs, type TabItem } from "../../../ui/Tabs";
import { detectRangeSpot } from "../data/rangeDetection";
import { useActionBadges } from "../hooks/useActionBadges";
import { useReplay } from "../hooks/useReplay";
import { STREET_LABELS } from "../replay.constants";
import type { ReplayHand } from "../replay.types";
import { isTypingTarget } from "../shortcuts";
import type { ReviewHand } from "../types";
import { handMark, heroActionIndexes, mistakeActionIndexes, nextSpot, worstMistakeIndex } from "../utils/navigation";
import HandsPanel from "./HandsPanel";
import { ActionFeed } from "./replay/ActionFeed";
import { AnalysisPanel } from "./replay/AnalysisPanel";
import { HistoryPanel } from "./replay/HistoryPanel";
import RangePanel from "./replay/RangePanel";
import { ReplayTableScene } from "./replay/ReplayTableScene";
import { TableControls } from "./replay/TableControls";
import { TournamentSummary, type BilanData } from "./TournamentSummary";

type SidebarTab = "analyse" | "history" | "ranges" | "bilan";

const ID_PREFIX = "review";

interface PokerTableReviewProps {
  hands: ReplayHand[];
  /** Mains résumées pour l'onglet « Bilan ». */
  reviewHands: ReviewHand[];
  /** Demande d'ouverture d'une main précise (depuis une fuite, par exemple). */
  focus?: { handId: string; token: number } | null;
  /** Bilan du tournoi (absent en démo). */
  bilan?: BilanData;
}

export default function PokerTableReview({ hands, reviewHands, focus = null, bilan }: PokerTableReviewProps) {
  const [tab, setTab] = useState<SidebarTab>("analyse");
  const [snapshot, controls] = useReplay(hands, { initialHandIndex: 0, initialActionIndex: 0 });
  const {
    hand,
    handIndex,
    totalHands,
    actionIndex,
    currentAction,
    street,
    visibleBoard,
    pot,
    players,
    currentTip,
    currentEvComparison,
    currentSpot,
    isHeroDecision,
    isFirstAction,
    isLastAction,
    isFirstHand,
    isLastHand,
  } = snapshot;

  const handMarks = useMemo(() => hands.map(handMark), [hands]);
  const hasMistakes = useMemo(() => handMarks.includes("mistake"), [handMarks]);
  const rangeContext = useMemo(() => detectRangeSpot(hand, actionIndex, players), [hand, actionIndex, players]);
  const actionBadges = useActionBadges(currentAction);
  const hero = players.find((p) => p.isHero);
  const actor = hand.players.find((p) => p.id === currentAction.playerId);

  const jumpToDecision = useCallback(() => {
    const spot = nextSpot(hands, handIndex, actionIndex, heroActionIndexes);
    if (!spot) return;
    controls.goToSpot(spot.handIndex, spot.actionIndex);
    setTab("analyse");
  }, [hands, handIndex, actionIndex, controls]);

  const jumpToMistake = useCallback(() => {
    const spot = nextSpot(hands, handIndex, actionIndex, mistakeActionIndexes);
    if (!spot) return;
    controls.goToSpot(spot.handIndex, spot.actionIndex);
    setTab("analyse");
  }, [hands, handIndex, actionIndex, controls]);

  // Ouverture d'une main précise : on se place sur sa pire erreur, sinon sur la première décision du héros.
  useEffect(() => {
    if (!focus) return;
    const idx = hands.findIndex((h) => h.id === focus.handId);
    if (idx < 0) return;
    const target = hands[idx];
    const action = worstMistakeIndex(target) ?? heroActionIndexes(target)[0] ?? 0;
    controls.goToSpot(idx, action);
    setTab("analyse");
    // Déclenché uniquement par une nouvelle demande de l'utilisateur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.token]);

  // Raccourcis clavier.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      switch (e.key) {
        case "ArrowRight":
          controls.nextAction();
          break;
        case "ArrowLeft":
          controls.prevAction();
          break;
        case "ArrowDown":
          controls.nextHand();
          break;
        case "ArrowUp":
          controls.prevHand();
          break;
        case "d":
        case "D":
          jumpToDecision();
          break;
        case "e":
        case "E":
          jumpToMistake();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controls, jumpToDecision, jumpToMistake]);

  const selectKeyHand = (handId: string) => {
    const idx = hands.findIndex((h) => h.id === handId);
    if (idx < 0) return;
    const target = hands[idx];
    controls.goToSpot(idx, worstMistakeIndex(target) ?? heroActionIndexes(target)[0] ?? 0);
    setTab("analyse");
  };

  const mistakeCount = reviewHands.filter((h) => h.evImpact <= -0.8).length;
  const tabs: ReadonlyArray<TabItem<SidebarTab>> = [
    { id: "analyse", label: "Analyse", icon: <Lightbulb size={15} aria-hidden /> },
    { id: "history", label: "Historique", icon: <History size={15} aria-hidden /> },
    { id: "ranges", label: "Ranges", icon: <Layers size={15} aria-hidden /> },
    { id: "bilan", label: "Bilan", icon: <ListChecks size={15} aria-hidden />, count: mistakeCount },
  ];
  const ids = tabIds(ID_PREFIX, tab);

  return (
    <div className="review">
      <section className="review__stage" aria-label="Table de poker">
        <header className="stage-head">
          <h2 className="stage-head__title truncate" title={hand.label}>
            {hand.label}
          </h2>
          <div className="stage-head__chips">
            <Badge outline title="Petite et grosse blinde">
              Blinds {fmtBbAuto(hand.blindsBb.small)} / {fmtBbAuto(hand.blindsBb.big)}
            </Badge>
            {hand.anteBb ? <Badge outline>Ante {fmtBbAuto(hand.anteBb)}</Badge> : null}
            {hero && <Badge tone="brand">Toi : {hero.position}</Badge>}
            <Badge tone="info">{STREET_LABELS[street]}</Badge>
          </div>
        </header>

        <ReplayTableScene street={street} visibleBoard={visibleBoard} pot={pot} players={players} actionBadges={actionBadges} />

        <ActionFeed action={currentAction} actor={actor} street={street} actionIndex={actionIndex} totalActions={hand.actions.length} />

        <TableControls
          handIndex={handIndex}
          totalHands={totalHands}
          actionIndex={actionIndex}
          totalActions={hand.actions.length}
          handMarks={handMarks}
          onPrevAction={controls.prevAction}
          onNextAction={controls.nextAction}
          onPrevHand={controls.prevHand}
          onNextHand={controls.nextHand}
          onGoToHand={controls.goToHand}
          onNextDecision={jumpToDecision}
          onNextMistake={jumpToMistake}
          isFirstAction={isFirstAction}
          isLastAction={isLastAction}
          isFirstHand={isFirstHand}
          isLastHand={isLastHand}
          hasMistakes={hasMistakes}
        />
      </section>

      <aside className="review__panel" aria-label="Analyse et ranges">
        <Tabs tabs={tabs} value={tab} onChange={setTab} label="Panneau d'analyse" idPrefix={ID_PREFIX} />
        <div className="review__panel-body" role="tabpanel" id={ids.panel} aria-labelledby={ids.tab} tabIndex={0}>
          {tab === "analyse" && (
            <AnalysisPanel
              street={street}
              ev={currentEvComparison}
              tip={currentTip}
              spot={currentSpot}
              isHeroDecision={isHeroDecision}
              onJumpToDecision={jumpToDecision}
            />
          )}
          {tab === "history" && <HistoryPanel hand={hand} actionIndex={actionIndex} onGoToAction={controls.goToAction} />}
          {tab === "ranges" && <RangePanel context={rangeContext} />}
          {tab === "bilan" && (
            <div className="bilan-tab">
              {bilan && <TournamentSummary {...bilan} />}
              <HandsPanel hands={reviewHands} activeHandId={hand.id} onSelectHand={selectKeyHand} />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
