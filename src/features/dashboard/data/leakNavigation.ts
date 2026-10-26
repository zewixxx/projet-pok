import { LEAKS } from "./dashboardData";
import type { LeakEntry } from "../types";

/** Fuite de démonstration suivante (en boucle), pour enchaîner les exemples. */
export function getNextLeak(currentId: string): LeakEntry | null {
  const idx = LEAKS.findIndex((l) => l.id === currentId);
  if (idx < 0) return null;
  return LEAKS[(idx + 1) % LEAKS.length] ?? null;
}
