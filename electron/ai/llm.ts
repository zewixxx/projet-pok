/**
 * Modèle de langage local (node-llama-cpp). Il ne calcule rien : le moteur fournit
 * les chiffres, le modèle reformule en français naturel.
 */

import type { CoachTip, ReplayHand, SpotInsight, TournamentAnalysis } from "../analysis/types";

/** Sous-ensemble de node-llama-cpp utilisé ici (le paquet est en ESM, ses types ne passent pas en CommonJS). */
interface LlamaModule {
  getLlama: (opts: { gpu: false | "auto" }) => Promise<{
    loadModel: (opts: { modelPath: string }) => Promise<{
      createContext: (opts: { contextSize: number; threads: number }) => Promise<{
        getSequence: () => unknown;
        dispose: () => Promise<void>;
      }>;
      dispose: () => Promise<void>;
    }>;
    dispose: () => Promise<void>;
  }>;
  LlamaChatSession: new (opts: { contextSequence: unknown; systemPrompt: string }) => {
    prompt: (
      text: string,
      opts: { maxTokens: number; temperature: number; signal?: AbortSignal; stopOnAbortSignal?: boolean },
    ) => Promise<string>;
    dispose: () => void;
  };
}

// L'import dynamique d'un paquet ESM depuis du CommonJS : tsc le transformerait en require().
const dynamicImport = new Function("specifier", "return import(specifier)") as (s: string) => Promise<LlamaModule>;

const SYSTEM_PROMPT =
  "Tu es un coach de poker de tournoi. Tu réécris un conseil en français clair, en 2 phrases courtes maximum. " +
  "Tu gardes EXACTEMENT les chiffres fournis et tu n'en ajoutes aucun. Tu n'inventes aucune information. " +
  "Tu tutoies le joueur. Tu réponds uniquement avec le conseil réécrit.";

export class LlmRunner {
  private llama: Awaited<ReturnType<LlamaModule["getLlama"]>> | null = null;
  private model: Awaited<ReturnType<NonNullable<LlmRunner["llama"]>["loadModel"]>> | null = null;
  private context: Awaited<ReturnType<NonNullable<LlmRunner["model"]>["createContext"]>> | null = null;
  private session: InstanceType<LlamaModule["LlamaChatSession"]> | null = null;

  /** Charge le modèle sur le processeur (GPU désactivé : comportement prévisible). */
  async load(modelPath: string, threads: number): Promise<void> {
    const mod = await dynamicImport("node-llama-cpp");
    this.llama = await mod.getLlama({ gpu: false });
    this.model = await this.llama.loadModel({ modelPath });
    this.context = await this.model.createContext({ contextSize: 2048, threads: Math.max(1, threads) });
    this.session = new mod.LlamaChatSession({ contextSequence: this.context.getSequence(), systemPrompt: SYSTEM_PROMPT });
  }

  async rewrite(prompt: string, signal?: AbortSignal): Promise<string> {
    if (!this.session) throw new Error("Modèle non chargé.");
    return this.session.prompt(prompt, { maxTokens: 140, temperature: 0.2, signal, stopOnAbortSignal: true });
  }

  async dispose(): Promise<void> {
    this.session?.dispose();
    await this.context?.dispose();
    await this.model?.dispose();
    await this.llama?.dispose();
    this.session = null;
    this.context = null;
    this.model = null;
    this.llama = null;
  }
}

// ─── Reformulation des conseils ─────────────────────────────────────────────

export interface TextRewriter {
  rewrite: (prompt: string, signal?: AbortSignal) => Promise<string>;
}

const NUMBER_RE = /\d+(?:[.,]\d+)?/g;

function numbersIn(text: string): Set<string> {
  return new Set((text.match(NUMBER_RE) ?? []).map((n) => n.replace(",", ".")));
}

/**
 * Garde-fou : la reformulation est refusée si elle contient un chiffre absent des faits,
 * si elle est trop courte ou trop longue, ou si elle n'est pas en français.
 */
export function isAcceptableRewrite(output: string, facts: string): boolean {
  const text = output.trim();
  if (text.length < 25 || text.length > 520) return false;
  const allowed = numbersIn(facts);
  for (const n of numbersIn(text)) if (!allowed.has(n)) return false;
  return /\b(tu|ta|ton|tes|te|avec|est|une?|le|la|les|de|du|des|pour|pas)\b/i.test(text);
}

function describeSpot(hand: ReplayHand, index: number, tip: CoachTip, spot: SpotInsight): string {
  const hero = hand.players.find((p) => p.isHero);
  const cards = hero?.holeCards ? hero.holeCards.join(" ") : "?";
  const action = hand.actions[index];
  return [
    `Main du héros : ${cards} en ${spot.heroPosition}.`,
    `Rue : ${spot.street}. Pot : ${spot.potBb} bb. À payer : ${spot.toCallBb} bb. Stack : ${spot.stackBb} bb.`,
    `Action jouée : ${action?.type ?? "?"}${action?.amountBb != null ? ` ${action.amountBb} bb` : ""}.`,
    `Équité estimée : ${Math.round(spot.equityPct)} %.`,
    spot.potOddsPct != null ? `Équité requise : ${Math.round(spot.potOddsPct)} %.` : "",
    spot.villainRangePct ? `Range adverse estimée : ${spot.villainRangePct} des mains.` : "",
    `Perte d'EV : ${tip.evDiffBb ?? 0} bb.`,
    `Conseil du moteur : ${tip.headline}. ${tip.detail}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export interface RefineOptions {
  /** Nombre maximal de conseils reformulés (les plus coûteux d'abord). */
  maxTips: number;
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Reformule les conseils des plus grosses erreurs. Modifie `analysis` sur place.
 * Un conseil dont la reformulation est refusée garde le texte du moteur.
 */
export async function refineTips(
  analysis: TournamentAnalysis,
  rewriter: TextRewriter,
  opts: RefineOptions,
): Promise<{ rewritten: number; rejected: number }> {
  const candidates: Array<{ hand: ReplayHand; index: number; loss: number }> = [];
  for (const hand of analysis.hands) {
    for (const [key, spot] of Object.entries(hand.spots ?? {})) {
      const tip = hand.coachTips?.[Number(key)];
      if (tip?.quality === "mistake") candidates.push({ hand, index: Number(key), loss: spot.evLossBb });
    }
  }
  candidates.sort((a, b) => b.loss - a.loss);
  const picked = candidates.slice(0, Math.max(0, opts.maxTips));

  let rewritten = 0;
  let rejected = 0;
  opts.onProgress?.(0, picked.length);
  for (let i = 0; i < picked.length; i += 1) {
    if (opts.signal?.aborted) break;
    const { hand, index } = picked[i];
    const tip = hand.coachTips![index];
    const spot = hand.spots![index];
    const facts = describeSpot(hand, index, tip, spot);
    try {
      const out = await rewriter.rewrite(`Réécris ce conseil.\n${facts}`, opts.signal);
      if (isAcceptableRewrite(out, facts)) {
        tip.detail = out.trim();
        tip.source = "ia";
        rewritten += 1;
      } else {
        rejected += 1;
      }
    } catch {
      if (opts.signal?.aborted) break;
      rejected += 1;
    }
    opts.onProgress?.(i + 1, picked.length);
  }
  return { rewritten, rejected };
}
