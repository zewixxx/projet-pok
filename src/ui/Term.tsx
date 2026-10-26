import { useId, type ReactNode } from "react";
import { GLOSSARY, type GlossaryKey } from "./glossary";

interface TermProps {
  id: GlossaryKey;
  children: ReactNode;
}

/** Mot de vocabulaire avec explication au survol ou au focus clavier. */
export function Term({ id, children }: TermProps) {
  const bubbleId = useId();
  return (
    <span className="term" tabIndex={0} aria-describedby={bubbleId}>
      {children}
      <span className="term__bubble" role="tooltip" id={bubbleId}>
        {GLOSSARY[id]}
      </span>
    </span>
  );
}
