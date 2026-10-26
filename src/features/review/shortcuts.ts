/** Raccourcis clavier de la review (utilisés par le replayer et affichés dans l'aide). */
export interface Shortcut {
  keys: string[];
  label: string;
}

export const REVIEW_SHORTCUTS: ReadonlyArray<Shortcut> = [
  { keys: ["→"], label: "Coup suivant" },
  { keys: ["←"], label: "Coup précédent" },
  { keys: ["↓"], label: "Main suivante" },
  { keys: ["↑"], label: "Main précédente" },
  { keys: ["D"], label: "Aller à ma prochaine décision" },
  { keys: ["E"], label: "Aller à la prochaine erreur" },
  { keys: ["?"], label: "Ouvrir l'aide" },
];

/** Vrai si la touche est tapée dans un champ de saisie (on ne l'intercepte alors pas). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    // Les curseurs (range) utilisent déjà les flèches : on laisse faire.
    return type !== "button" && type !== "checkbox" && type !== "radio";
  }
  return false;
}
