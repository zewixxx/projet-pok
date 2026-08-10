import { useCallback, useMemo, useState } from "react";
import type { CoachTip, EvComparison, HandAction, ReplayHand, ReplayPlayerState, Street } from "../replay.types";
import { computeVisualSeatIndex } from "../utils/seatLayout";
import { computeReplayState, effectiveStackBb } from "../utils/replayEngine";
import { resolveHeroAnalysis } from "../utils/generateHeroAnalysis";

const STREET_ORDER: Street[] = ["preflop", "flop", "turn", "river"];

export interface ReplaySnapshot {
  hand: ReplayHand;
  handIndex: number;
  totalHands: number;
  actionIndex: number;
  currentAction: HandAction;
  street: Street;
  visibleBoard: string[];
  pot: number;
  players: ReplayPlayerState[];
  currentTip: CoachTip | undefined;
  currentEvComparison: EvComparison | undefined;
  isHeroDecision: boolean;
  isFirstAction: boolean;
  isLastAction: boolean;
  isFirstHand: boolean;
  isLastHand: boolean;
}

export interface ReplayControls {
  nextAction: () => void;
  prevAction: () => void;
  goToAction: (index: number) => void;
  nextHand: () => void;
  prevHand: () => void;
  goToHand: (index: number) => void;
  reset: () => void;
}

export function useReplay(
  hands: ReplayHand[],
  options?: { initialHandIndex?: number; initialActionIndex?: number },
): [ReplaySnapshot, ReplayControls] {
  const [handIndex, setHandIndex] = useState(() =>
    Math.max(0, Math.min(options?.initialHandIndex ?? 0, Math.max(hands.length - 1, 0))),
  );
  const [actionIndex, setActionIndex] = useState(() => {
    const hand = hands[Math.max(0, Math.min(options?.initialHandIndex ?? 0, Math.max(hands.length - 1, 0)))];
    const max = Math.max((hand?.actions.length ?? 1) - 1, 0);
    return Math.max(0, Math.min(options?.initialActionIndex ?? 0, max));
  });

  const hand = hands[handIndex];
  const currentAction = hand?.actions[actionIndex];
  const street = currentAction?.street ?? "preflop";

  const visibleBoard = useMemo(() => {
    if (!hand) return [];
    const currentStreetIdx = STREET_ORDER.indexOf(street);
    return hand.boards
      .filter((b) => STREET_ORDER.indexOf(b.street) <= currentStreetIdx)
      .flatMap((b) => b.cards);
  }, [hand, street]);

  const computed = useMemo(
    () => hand ? computeReplayState(hand, actionIndex) : null,
    [hand, actionIndex],
  );

  const pot = computed?.pot ?? 0;

  const players = useMemo<ReplayPlayerState[]>(() => {
    if (!hand || !computed || !currentAction) return [];

    const heroSeatIndex = hand.players.find((p) => p.isHero)?.seatIndex ?? 0;
    const numPlayers = hand.players.length;

    return hand.players.map((p) => ({
      ...p,
      stackBb: effectiveStackBb(p.stackBb, computed.totalInvested, p.id),
      hasFolded: computed.foldedIds.has(p.id),
      isActor: p.id === currentAction.playerId,
      streetBetBb: computed.streetBets[p.id] ?? 0,
      visualSeatIndex: computeVisualSeatIndex(p.seatIndex, heroSeatIndex, numPlayers),
    }));
  }, [hand, computed, currentAction]);

  const heroId = hand?.players.find(p => p.isHero)?.id;
  const isHeroDecision = Boolean(currentAction && heroId && currentAction.playerId === heroId);

  const { tip: currentTip, ev: currentEvComparison } = useMemo(
    () => hand ? resolveHeroAnalysis(hand, actionIndex) : {},
    [hand, actionIndex],
  );

  const nextAction = useCallback(
    () => setActionIndex((i) => Math.min(i + 1, (hand?.actions.length ?? 1) - 1)),
    [hand?.actions.length],
  );

  const prevAction = useCallback(
    () => setActionIndex((i) => Math.max(i - 1, 0)),
    [],
  );

  const goToAction = useCallback(
    (index: number) => {
      const max = Math.max((hand?.actions.length ?? 1) - 1, 0);
      setActionIndex(Math.max(0, Math.min(index, max)));
    },
    [hand?.actions.length],
  );

  const jumpToHand = useCallback((index: number) => {
    setHandIndex(Math.max(0, Math.min(index, hands.length - 1)));
    setActionIndex(0);
  }, [hands.length]);

  const nextHand = useCallback(
    () => jumpToHand(handIndex + 1),
    [jumpToHand, handIndex],
  );

  const prevHand = useCallback(
    () => jumpToHand(handIndex - 1),
    [jumpToHand, handIndex],
  );

  const goToHand = useCallback(
    (index: number) => jumpToHand(index),
    [jumpToHand],
  );

  const reset = useCallback(() => jumpToHand(0), [jumpToHand]);

  if (!hand || !currentAction) {
    return [
      {
        hand: hands[0],
        handIndex: 0,
        totalHands: hands.length,
        actionIndex: 0,
        currentAction: hands[0]?.actions[0],
        street: "preflop",
        visibleBoard: [],
        pot: 0,
        players: [],
        currentTip: undefined,
        currentEvComparison: undefined,
        isHeroDecision: false,
        isFirstAction: true,
        isLastAction: true,
        isFirstHand: true,
        isLastHand: hands.length <= 1,
      },
      { nextAction, prevAction, goToAction, nextHand, prevHand, goToHand, reset },
    ];
  }

  return [
    {
      hand,
      handIndex,
      totalHands: hands.length,
      actionIndex,
      currentAction,
      street,
      visibleBoard,
      pot,
      players,
      currentTip,
      currentEvComparison,
      isHeroDecision,
      isFirstAction: actionIndex === 0,
      isLastAction: actionIndex === hand.actions.length - 1,
      isFirstHand: handIndex === 0,
      isLastHand: handIndex === hands.length - 1,
    },
    { nextAction, prevAction, goToAction, nextHand, prevHand, goToHand, reset },
  ];
}
