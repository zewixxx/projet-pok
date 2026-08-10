import type { ReplayPlayerState } from "../../replay.types";
import { getVisualSeatPosition } from "../../utils/seatLayout";
import { ChipStack } from "./ChipStack";
import { PokerCard } from "./PokerCard";

interface PlayerSeatProps {
  player: ReplayPlayerState;
  seatCount?: number;
  actionBadge?: string;
}

/**
 * Siège style Winamax :
 * jetons SVG 3D toujours entre le joueur et le centre,
 * badge d’action animé, pod compact.
 */
export function PlayerSeat({ player, seatCount = 6, actionBadge }: PlayerSeatProps) {
  const position = getVisualSeatPosition(player.visualSeatIndex, seatCount);
  const showCards = Boolean(player.holeCards) && (player.isHero || !player.hasFolded);
  const displayName = player.isHero ? "TOI" : player.name;
  const showBet = player.streetBetBb > 0 && !player.hasFolded;

  const classNames = [
    "wx-seat",
    `wx-seat--v${player.visualSeatIndex}`,
    player.isHero ? "wx-seat--hero" : "",
    player.hasFolded ? "wx-seat--folded" : "",
    player.isActor ? "wx-seat--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} style={position}>
      {showBet && (
        <div
          className="wx-seat__bet"
          key={`bet-${player.id}-${player.streetBetBb.toFixed(1)}`}
        >
          <ChipStack amountBb={player.streetBetBb} variant="bet" />
        </div>
      )}

      {actionBadge && (
        <div className="wx-seat__action" key={actionBadge}>
          {actionBadge}
        </div>
      )}

      <div className="wx-seat__row">
        {showCards && player.holeCards && (
          <div className="wx-seat__cards">
            <PokerCard notation={player.holeCards[0]} size={player.isHero ? "normal" : "mini"} />
            <PokerCard notation={player.holeCards[1]} size={player.isHero ? "normal" : "mini"} />
          </div>
        )}

        <div className="wx-seat__pod">
          <div className="wx-seat__top">
            <span className="wx-seat__name" title={player.name}>
              {displayName}
            </span>
            <span className="wx-seat__pos">{player.position}</span>
          </div>
          <div className="wx-seat__stack">{player.stackBb.toFixed(1)} bb</div>
        </div>
      </div>
    </div>
  );
}
