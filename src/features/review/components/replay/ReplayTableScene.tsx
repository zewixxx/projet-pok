import type { ReplayPlayerState, Street } from "../../replay.types";
import { Board } from "./Board";
import { PlayerSeat } from "./PlayerSeat";
import { PotDisplay } from "./PotDisplay";

interface ReplayTableSceneProps {
  street: Street;
  visibleBoard: string[];
  pot: number;
  players: ReplayPlayerState[];
  actionBadges: Record<string, string>;
  /** Compact = leak flow ; stage = review standard */
  variant?: "stage" | "compact";
}

/** Felt + board + pot + sièges — partagé entre review standard et leak flow. */
export function ReplayTableScene({
  street,
  visibleBoard,
  pot,
  players,
  actionBadges,
  variant = "stage",
}: ReplayTableSceneProps) {
  return (
    <div
      className={`table-scene table-scene--${variant}`}
      data-street={street}
    >
      <div className="table-scene__glow" aria-hidden />
      <div className="table-felt">
        <div className="table-felt__rail" aria-hidden />
        <div className="table-felt__inner">
          <Board cards={visibleBoard} />
          <PotDisplay pot={pot} />
        </div>
      </div>

      {players.map((player) => (
        <PlayerSeat
          key={player.id}
          player={player}
          seatCount={players.length}
          actionBadge={actionBadges[player.id]}
        />
      ))}
    </div>
  );
}
