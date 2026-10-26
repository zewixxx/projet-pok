import type { CSSProperties } from "react";
import { cx } from "../../../../ui/cx";
import { useElementSize } from "../../../../ui/useElementSize";
import type { ReplayPlayerState, Street } from "../../replay.types";
import type { ActionBadge } from "../../hooks/useActionBadges";
import { STREET_LABELS_UPPER } from "../../replay.constants";
import { Board } from "./Board";
import { PlayerSeat } from "./PlayerSeat";
import { PotDisplay } from "./PotDisplay";

const RATIO = 16 / 9;

interface ReplayTableSceneProps {
  street: Street;
  visibleBoard: string[];
  pot: number;
  players: ReplayPlayerState[];
  actionBadges: Record<string, ActionBadge>;
  /** « compact » : hauteur fixe, pour le parcours fuite. */
  variant?: "stage" | "compact";
}

/**
 * Feutre + board + pot + sièges.
 * La scène occupe tout l'espace disponible en gardant un ratio 16/9, et définit l'unité --u
 * (1 % de sa largeur) : tout le dessin se redimensionne proportionnellement.
 */
export function ReplayTableScene({ street, visibleBoard, pot, players, actionBadges, variant = "stage" }: ReplayTableSceneProps) {
  const [wrapRef, { width, height }] = useElementSize<HTMLDivElement>();
  const ready = width > 0 && height > 0;
  const sceneW = ready ? Math.min(width, height * RATIO) : 0;
  const sceneH = sceneW / RATIO;

  return (
    <div className={cx("table-wrap", `table-wrap--${variant}`)} ref={wrapRef}>
      <div
        className="table-scene"
        data-street={street}
        style={{ width: sceneW, height: sceneH, visibility: ready ? "visible" : "hidden", "--u": `${sceneW / 100}px` } as CSSProperties}
      >
        <div className="table-felt" aria-hidden>
          <div className="table-felt__rail" />
          <div className="table-felt__cloth" />
        </div>

        <div className="table-center">
          <span className="table-center__street">{STREET_LABELS_UPPER[street]}</span>
          <PotDisplay pot={pot} />
          <Board cards={visibleBoard} />
        </div>

        {players.map((player) => (
          <PlayerSeat key={player.id} player={player} seatCount={players.length} actionBadge={actionBadges[player.id]} />
        ))}
      </div>
    </div>
  );
}
