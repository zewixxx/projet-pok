import type { CSSProperties } from "react";
import { cx } from "../../../../ui/cx";
import { fmtBb } from "../../../../ui/format";
import type { ReplayPlayerState } from "../../replay.types";
import type { ActionBadge } from "../../hooks/useActionBadges";
import { getSeatPoint, getVisualSeatPosition } from "../../utils/seatLayout";
import { ChipStack } from "./ChipStack";
import { PokerCard } from "./PokerCard";

interface PlayerSeatProps {
  player: ReplayPlayerState;
  seatCount?: number;
  actionBadge?: ActionBadge;
}

/** Teinte stable à partir du pseudo : chaque joueur garde la même couleur d'avatar. */
function hueOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function initialsOf(name: string): string {
  const clean = name.replace(/[^\p{L}\p{N}]/gu, "");
  return (clean.slice(0, 2) || "?").toUpperCase();
}

/** Siège : avatar, pseudo, stack en bb, cartes, mise devant soi et badge de la dernière action. */
export function PlayerSeat({ player, seatCount = 6, actionBadge }: PlayerSeatProps) {
  const style = getVisualSeatPosition(player.visualSeatIndex, seatCount);
  const point = getSeatPoint(player.visualSeatIndex, seatCount);
  const cardsBelow = point[1] < 30;
  const showCards = Boolean(player.holeCards) && (player.isHero || !player.hasFolded);
  const showBet = player.streetBetBb > 0 && !player.hasFolded;
  const displayName = player.isHero ? "Toi" : player.name;
  const isDealer = player.position === "BTN";

  const label = [
    displayName,
    `position ${player.position}`,
    fmtBb(player.stackBb),
    player.hasFolded ? "couché" : player.isActor ? "joue en ce moment" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={cx(
        "seat",
        player.isHero && "seat--hero",
        player.hasFolded && "seat--folded",
        player.isActor && "seat--active",
      )}
      style={style}
      role="group"
      aria-label={label}
    >
      {showBet && (
        <div className="seat__bet" key={`bet-${player.id}-${player.streetBetBb.toFixed(1)}`}>
          <ChipStack amountBb={player.streetBetBb} variant="bet" />
        </div>
      )}

      {actionBadge && (
        <span
          className={cx("seat__action", `seat__action--${actionBadge.type}`, !cardsBelow && "seat__action--below")}
          key={actionBadge.label}
        >
          {actionBadge.label}
        </span>
      )}

      {showCards && player.holeCards && (
        <div className={cx("seat__cards", cardsBelow && "seat__cards--below")}>
          <PokerCard notation={player.holeCards[0]} size={player.isHero ? "normal" : "mini"} />
          <PokerCard notation={player.holeCards[1]} size={player.isHero ? "normal" : "mini"} />
        </div>
      )}

      <div className="seat__pod">
        <span className="seat__avatar" style={{ "--hue": hueOf(player.name) } as CSSProperties} aria-hidden>
          {player.isHero ? "TOI" : initialsOf(player.name)}
        </span>
        <span className="seat__info">
          <span className="seat__line">
            <span className="seat__name truncate" title={player.name}>
              {displayName}
            </span>
            <span className="seat__pos">{player.position}</span>
          </span>
          <span className="seat__stack num">{fmtBb(player.stackBb)}</span>
        </span>
      </div>

      {isDealer && (
        <span className="seat__dealer" role="img" aria-label="Bouton du dealer">
          D
        </span>
      )}
    </div>
  );
}
