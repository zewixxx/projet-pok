/**
 * Positions des sièges sur la table (en % de la scène, ratio 16/9).
 * Index 0 = héros (toujours en bas). Les mises sont placées à mi-chemin entre le siège
 * et le centre : --bet-x / --bet-y sont exprimés en « u » (1 u = 1 % de la largeur de la scène).
 */
import type { CSSProperties } from "react";

type Point = readonly [left: number, top: number];

const POSITIONS: Record<number, ReadonlyArray<Point>> = {
  2: [
    [50, 86],
    [50, 14],
  ],
  3: [
    [50, 86],
    [11, 40],
    [89, 40],
  ],
  4: [
    [50, 86],
    [10, 50],
    [50, 14],
    [90, 50],
  ],
  5: [
    [50, 86],
    [14, 68],
    [20, 20],
    [80, 20],
    [86, 68],
  ],
  6: [
    [50, 86],
    [13, 68],
    [10, 30],
    [34, 13],
    [66, 13],
    [90, 68],
  ],
};

/** Hauteur de la scène exprimée en u (ratio 16/9). */
const SCENE_HEIGHT_U = 100 * (9 / 16);

export interface SeatVisual extends CSSProperties {
  ["--bet-x"]?: string;
  ["--bet-y"]?: string;
}

/** Point de la mise : on avance du siège vers le centre de la table. */
function betOffset([left, top]: Point, isHero: boolean): { x: number; y: number } {
  // Le héros a ses cartes au-dessus de lui : sa mise se place sur le côté, sans les masquer.
  if (isHero) return { x: 11, y: -6.5 };
  const k = 0.34;
  const dx = (50 - left) * k;
  const dyPct = (48 - top) * k;
  return { x: dx, y: (dyPct / 100) * SCENE_HEIGHT_U };
}

export function getSeatPoint(visualSeatIndex: number, numPlayers = 6): Point {
  const n = Math.min(6, Math.max(2, numPlayers));
  const map = POSITIONS[n] ?? POSITIONS[6];
  return map[visualSeatIndex] ?? [50, 50];
}

export function getVisualSeatPosition(visualSeatIndex: number, numPlayers = 6): SeatVisual {
  const point = getSeatPoint(visualSeatIndex, numPlayers);
  const { x, y } = betOffset(point, visualSeatIndex === 0);
  return {
    left: `${point[0]}%`,
    top: `${point[1]}%`,
    "--bet-x": x.toFixed(2),
    "--bet-y": y.toFixed(2),
  };
}

export function computeVisualSeatIndex(seatIndex: number, heroSeatIndex: number, numPlayers: number): number {
  return (seatIndex - heroSeatIndex + numPlayers) % numPlayers;
}
