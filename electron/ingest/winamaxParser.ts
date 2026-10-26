/**
 * Lecture des historiques de mains Winamax (tournois) et des résumés de tournoi.
 *
 * Limites connues :
 *  - seuls les tournois sont lus (pas le cash game) ;
 *  - écrit d'après le format Winamax en anglais ; non validé sur de vrais fichiers
 *    d'autres clients ;
 *  - une main sans cartes du héros (« Dealt to ») est ignorée.
 */

import type { ActionType, HandAction, ReplayHand, ReplayPlayer, Street, StreetBoard } from "../analysis/types";

export interface ParsedTournamentHand {
  tournamentId: string;
  tournamentName: string;
  buyInEuros: number;
  startedAt: string;
  hero: string;
  hand: ReplayHand;
}

export interface ParsedSummary {
  tournamentId: string;
  tournamentName: string;
  hero?: string;
  buyInEuros: number;
  totalPlayers: number;
  place: number;
  prizeEuros: number;
  startedAt?: string;
}

const NUM = "([0-9][0-9\\s.,]*)";

function toNumber(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/,/g, ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function sumMoney(text: string): number {
  const re = /([0-9]+(?:[.,][0-9]+)?)\s*€/g;
  let total = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) total += toNumber(m[1]);
  return total;
}

/** « 2026/04/17 10:12:30 UTC » → ISO. */
function parseDate(text: string): string | undefined {
  const m = text.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return undefined;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

export function splitHands(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const parts = normalized.split(/\n(?=Winamax Poker - )/);
  return parts.map((p) => p.trim()).filter((p) => p.startsWith("Winamax Poker - Tournament"));
}

interface Seat {
  seat: number;
  name: string;
  stack: number;
}

function positionLabels(order: Seat[], sbName: string | null, bbName: string | null, buttonSeat: number): Map<string, string> {
  const labels = new Map<string, string>();
  const n = order.length;
  if (n === 2) {
    const sb = order.find((s) => s.name === sbName) ?? order[0];
    const other = order.find((s) => s !== sb) ?? order[1];
    labels.set(sb.name, "BTN");
    labels.set(other.name, "BB");
    return labels;
  }
  if (sbName) labels.set(sbName, "SB");
  if (bbName) labels.set(bbName, "BB");

  const bbSeat = order.find((s) => s.name === bbName);
  const sorted = [...order].sort((a, b) => a.seat - b.seat);
  const start = bbSeat ? sorted.findIndex((s) => s.seat === bbSeat.seat) + 1 : 0;
  const rotated = sorted.map((_, i) => sorted[(start + i) % sorted.length]);
  const early = rotated.filter((s) => s.name !== sbName && s.name !== bbName);
  if (early.length === 0) return labels;

  const buttonIdx = early.findIndex((s) => s.seat === buttonSeat);
  const btn = buttonIdx >= 0 ? early[buttonIdx] : early[early.length - 1];
  labels.set(btn.name, "BTN");
  const rest = early.filter((s) => s !== btn);
  rest.forEach((s, i) => {
    const fromEnd = rest.length - 1 - i;
    if (fromEnd === 0) labels.set(s.name, "CO");
    else if (i === 0 && rest.length >= 3) labels.set(s.name, "UTG");
    else if (i === 0 && rest.length === 2) labels.set(s.name, "MP");
    else labels.set(s.name, "MP");
  });
  return labels;
}

export function parseHand(raw: string): ParsedTournamentHand | null {
  const lines = raw.split("\n").map((l) => l.trimEnd());
  const header = lines[0] ?? "";
  if (!header.includes("Tournament")) return null;

  const handId = header.match(/HandId:\s*#?([\w-]+)/)?.[1];
  if (!handId) return null;

  const tableLine = lines.find((l) => l.startsWith("Table:")) ?? "";
  const table = tableLine.match(/Table:\s*'(.*)\((\d+)\)#\d+'/);
  if (!table) return null;
  const tournamentName = table[1].trim();
  const tournamentId = table[2];

  const buyInText = header.match(/buyIn:\s*(.*?)\s*level:/)?.[1] ?? "";
  const buyInEuros = Math.round(sumMoney(buyInText) * 100) / 100;
  const level = header.match(/level:\s*(\d+)/)?.[1];
  const startedAt = parseDate(header) ?? new Date(0).toISOString();
  const buttonSeat = Number(tableLine.match(/Seat #(\d+) is the button/)?.[1] ?? 0);

  const seats: Seat[] = [];
  for (const line of lines) {
    const m = line.match(/^Seat (\d+): (.+?) \((\d+(?:[.,]\d+)?)\)/);
    if (m && !line.includes("showed") && !line.includes("won") && !line.includes("folded")) {
      if (!seats.some((s) => s.seat === Number(m[1]))) seats.push({ seat: Number(m[1]), name: m[2], stack: toNumber(m[3]) });
    }
  }
  if (seats.length < 2) return null;

  const dealt = raw.match(/Dealt to (.+?) \[([^\]]+)\]/);
  if (!dealt) return null;
  const hero = dealt[1];
  const holeCards = dealt[2].trim().split(/\s+/);
  if (holeCards.length !== 2) return null;

  const sbLine = raw.match(/^(.+?) posts small blind (\d+(?:[.,]\d+)?)/m);
  const bbLine = raw.match(/^(.+?) posts big blind (\d+(?:[.,]\d+)?)/m);
  if (!bbLine) return null;
  const bbChips = toNumber(bbLine[2]);
  const sbChips = sbLine ? toNumber(sbLine[2]) : bbChips / 2;
  if (bbChips <= 0) return null;
  const anteMatch = raw.match(/posts ante (\d+(?:[.,]\d+)?)/);
  const anteChips = anteMatch ? toNumber(anteMatch[1]) : 0;

  const bb = (v: number) => Math.round((v / bbChips) * 100) / 100;

  const labels = positionLabels(seats, sbLine?.[1] ?? null, bbLine[1], buttonSeat);
  const idOf = (name: string) => `p${seats.find((s) => s.name === name)?.seat ?? name}`;

  const players: ReplayPlayer[] = [...seats]
    .sort((a, b) => a.seat - b.seat)
    .map((s, i) => ({
      id: idOf(s.name),
      name: s.name,
      stackBb: bb(s.stack),
      seatIndex: i,
      position: labels.get(s.name) ?? "MP",
      ...(s.name === hero ? { isHero: true, holeCards: [holeCards[0], holeCards[1]] as [string, string] } : {}),
    }));

  const actions: HandAction[] = [];
  const boards: StreetBoard[] = [];
  let street: Street = "preflop";
  /** Total déjà engagé par chaque joueur sur la rue en cours (en jetons). */
  let inv = new Map<string, number>();
  const resetStreet = () => {
    inv = new Map();
  };

  // Les blindes comptent comme engagées sur la rue préflop.
  if (sbLine) inv.set(sbLine[1], sbChips);
  inv.set(bbLine[1], bbChips);

  const sections = raw.split(/\n(?=\*\*\* )/);
  for (const section of sections) {
    const title = section.match(/^\*\*\* (.+?) \*\*\*/)?.[1];
    if (!title) continue;
    if (title === "PRE-FLOP") street = "preflop";
    else if (title === "FLOP") street = "flop";
    else if (title === "TURN") street = "turn";
    else if (title === "RIVER") street = "river";
    else continue;

    if (street !== "preflop") {
      resetStreet();
      const groups = [...section.split("\n")[0].matchAll(/\[([^\]]+)\]/g)].map((g) => g[1].trim().split(/\s+/));
      const fresh = groups.length >= 2 ? groups[groups.length - 1] : groups[0] ?? [];
      boards.push({ street, cards: fresh });
    }

    for (const line of section.split("\n").slice(1)) {
      const t = line.trim();
      let m: RegExpMatchArray | null;
      if ((m = t.match(/^(.+?) folds$/))) {
        actions.push({ playerId: idOf(m[1]), type: "fold", street });
      } else if ((m = t.match(/^(.+?) checks$/))) {
        actions.push({ playerId: idOf(m[1]), type: "check", street });
      } else if ((m = t.match(/^(.+?) calls (\d+(?:[.,]\d+)?)(.*)$/))) {
        const amount = toNumber(m[2]);
        inv.set(m[1], (inv.get(m[1]) ?? 0) + amount);
        actions.push({ playerId: idOf(m[1]), type: "call", amountBb: bb(amount), street });
      } else if ((m = t.match(/^(.+?) bets (\d+(?:[.,]\d+)?)(.*)$/))) {
        const amount = toNumber(m[2]);
        const total = (inv.get(m[1]) ?? 0) + amount;
        inv.set(m[1], total);
        const allIn = /all-in/.test(m[3]);
        const type: ActionType = allIn ? "allin" : "bet";
        actions.push({ playerId: idOf(m[1]), type, amountBb: bb(allIn ? total : amount), street });
      } else if ((m = t.match(/^(.+?) raises (\d+(?:[.,]\d+)?) to (\d+(?:[.,]\d+)?)(.*)$/))) {
        const total = toNumber(m[3]);
        inv.set(m[1], total);
        const type: ActionType = /all-in/.test(m[4]) ? "allin" : "raise";
        actions.push({ playerId: idOf(m[1]), type, amountBb: bb(total), street });
      }
    }
  }

  if (!actions.some((a) => a.playerId === idOf(hero))) return null;

  const hand: ReplayHand = {
    id: handId,
    label: `Niveau ${level ?? "?"} · blindes ${sbChips}/${bbChips}${anteChips ? ` (ante ${anteChips})` : ""}`,
    blindsBb: { small: bb(sbChips), big: 1 },
    ...(anteChips > 0 ? { anteBb: bb(anteChips) } : {}),
    players,
    actions,
    boards,
  };

  return { tournamentId, tournamentName, buyInEuros, startedAt, hero, hand };
}

export function parseHandHistory(text: string): ParsedTournamentHand[] {
  const out: ParsedTournamentHand[] = [];
  for (const chunk of splitHands(text)) {
    try {
      const parsed = parseHand(chunk);
      if (parsed) out.push(parsed);
    } catch {
      // Une main illisible n'empêche pas de lire les suivantes.
    }
  }
  return out;
}

export function parseSummary(text: string): ParsedSummary | null {
  const normalized = text.replace(/\r\n/g, "\n");
  const head = normalized.match(/Tournament summary\s*:\s*(.+?)\((\d+)\)/);
  if (!head) return null;

  const buyInLine = normalized.match(/Buy-?In\s*:\s*(.+)/i)?.[1] ?? "";
  const players = normalized.match(new RegExp(`Registered players\\s*:\\s*${NUM}`, "i"))?.[1];
  const place = normalized.match(/finished in\s+(\d+)/i)?.[1];
  const won = normalized.match(/You won\s+([0-9]+(?:[.,][0-9]+)?)\s*€/i)?.[1];
  const hero = normalized.match(/^Player\s*:\s*(.+)$/m)?.[1]?.trim();
  const started = parseDate(normalized.match(/Tournament started\s+(.+)/i)?.[1] ?? "");

  return {
    tournamentId: head[2],
    tournamentName: head[1].trim(),
    hero,
    buyInEuros: Math.round(sumMoney(buyInLine) * 100) / 100,
    totalPlayers: players ? Math.round(toNumber(players)) : 0,
    place: place ? Number(place) : 0,
    prizeEuros: won ? toNumber(won) : 0,
    startedAt: started,
  };
}
