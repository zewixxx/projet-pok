/**
 * Positions stadium (table moins « ovale », plus racetrack).
 * Index 0 = Hero. Jetons via --bet-x / --bet-y vers le centre.
 */
import type { CSSProperties } from "react";

type SeatPos = CSSProperties & {
  ["--bet-x"]?: string;
  ["--bet-y"]?: string;
};

const POSITIONS: Record<number, ReadonlyArray<SeatPos>> = {
  2: [
    { left: "50%", top: "88%", "--bet-x": "0px", "--bet-y": "-34px" },
    { left: "50%", top: "12%", "--bet-x": "0px", "--bet-y": "34px" },
  ],
  3: [
    { left: "50%", top: "88%", "--bet-x": "0px", "--bet-y": "-34px" },
    { left: "8%", top: "48%", "--bet-x": "36px", "--bet-y": "0px" },
    { left: "92%", top: "48%", "--bet-x": "-36px", "--bet-y": "0px" },
  ],
  4: [
    { left: "50%", top: "88%", "--bet-x": "0px", "--bet-y": "-34px" },
    { left: "7%", top: "50%", "--bet-x": "34px", "--bet-y": "0px" },
    { left: "50%", top: "12%", "--bet-x": "0px", "--bet-y": "34px" },
    { left: "93%", top: "50%", "--bet-x": "-34px", "--bet-y": "0px" },
  ],
  5: [
    { left: "50%", top: "88%", "--bet-x": "0px", "--bet-y": "-34px" },
    { left: "10%", top: "70%", "--bet-x": "30px", "--bet-y": "-16px" },
    { left: "12%", top: "22%", "--bet-x": "28px", "--bet-y": "20px" },
    { left: "88%", top: "22%", "--bet-x": "-28px", "--bet-y": "20px" },
    { left: "90%", top: "70%", "--bet-x": "-30px", "--bet-y": "-16px" },
  ],
  6: [
    { left: "50%", top: "89%", "--bet-x": "0px", "--bet-y": "-36px" },
    { left: "11%", top: "72%", "--bet-x": "32px", "--bet-y": "-14px" },
    { left: "7%", top: "38%", "--bet-x": "34px", "--bet-y": "4px" },
    { left: "28%", top: "12%", "--bet-x": "12px", "--bet-y": "32px" },
    { left: "72%", top: "12%", "--bet-x": "-12px", "--bet-y": "32px" },
    { left: "89%", top: "72%", "--bet-x": "-32px", "--bet-y": "-14px" },
  ],
};

export function getVisualSeatPosition(
  visualSeatIndex: number,
  numPlayers = 6,
): CSSProperties {
  const n = Math.min(6, Math.max(2, numPlayers));
  const map = POSITIONS[n] ?? POSITIONS[6];
  return map[visualSeatIndex] ?? { left: "50%", top: "50%" };
}

export function computeVisualSeatIndex(
  seatIndex: number,
  heroSeatIndex: number,
  numPlayers: number,
): number {
  return (seatIndex - heroSeatIndex + numPlayers) % numPlayers;
}
