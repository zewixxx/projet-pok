/** Cartes codées 0..51 : carte = rang * 4 + couleur (rang 0 = 2 … 12 = As). */

export const RANK_CHARS = "23456789TJQKA";
export const SUIT_CHARS = "cdhs";

export function parseCard(text: string): number {
  const trimmed = text.trim();
  const rankChar = trimmed.startsWith("10") ? "T" : trimmed[0];
  const suitChar = trimmed[trimmed.length - 1];
  const rank = RANK_CHARS.indexOf(rankChar.toUpperCase());
  const suit = SUIT_CHARS.indexOf(suitChar.toLowerCase());
  if (rank < 0 || suit < 0) throw new Error(`Carte invalide : « ${text} »`);
  return rank * 4 + suit;
}

export function cardToString(card: number): string {
  return RANK_CHARS[card >> 2] + SUIT_CHARS[card & 3];
}

export const rankOf = (card: number): number => card >> 2;
export const suitOf = (card: number): number => card & 3;

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Graine stable à partir d'un texte (FNV-1a). */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
