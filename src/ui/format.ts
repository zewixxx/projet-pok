/** Formatage des nombres à la française (virgule décimale, vrai signe moins). */

const MINUS = "\u2212";

function groups(n: number, digits: number): string {
  return Math.abs(n).toLocaleString("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Nombre avec signe explicite : +1,5 / −0,3. */
export function signed(n: number, digits = 1): string {
  const rounded = Number(n.toFixed(digits));
  if (rounded === 0) return groups(0, digits);
  return `${rounded > 0 ? "+" : MINUS}${groups(rounded, digits)}`;
}

/** Montant en grosses blindes : « 12,5 bb ». */
export function fmtBb(n: number, digits = 1): string {
  return `${n < 0 ? MINUS : ""}${groups(n, digits)}\u00a0bb`;
}

/** Montant en bb sans décimale inutile : « 3 bb », « 2,5 bb ». */
export function fmtBbAuto(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return fmtBb(rounded, Number.isInteger(rounded) ? 0 : 1);
}

/** Écart de bb avec signe : « +0,74 bb ». */
export function fmtBbSigned(n: number, digits = 2): string {
  return `${signed(n, digits)}\u00a0bb`;
}

/** Montant en euros sans décimales superflues. */
export function fmtEuros(n: number, opts: { sign?: boolean; digits?: number } = {}): string {
  const abs = Math.abs(n);
  const digits = opts.digits ?? (Number.isInteger(Number(abs.toFixed(2))) ? 0 : 2);
  const body = `${groups(abs, digits)}\u00a0€`;
  if (opts.sign) {
    if (Number(abs.toFixed(digits)) === 0) return body;
    return `${n > 0 ? "+" : MINUS}${body}`;
  }
  return n < 0 ? `${MINUS}${body}` : body;
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

export function fmtPct(n: number, digits = 0): string {
  return `${groups(n, digits)}\u00a0%`;
}

export function fmtDate(iso: string, style: "short" | "long" = "short"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(
    "fr-FR",
    style === "long"
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : { day: "2-digit", month: "short", year: "numeric" },
  );
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** « 1 min 20 s », « 45 s ». */
export function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}\u00a0s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest === 0 ? `${m}\u00a0min` : `${m}\u00a0min ${rest}\u00a0s`;
}

export function pluralize(n: number, one: string, many: string): string {
  return n > 1 ? many : one;
}
