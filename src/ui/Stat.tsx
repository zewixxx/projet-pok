import type { ReactNode } from "react";
import { cx } from "./cx";

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "pos" | "neg";
  icon?: ReactNode;
  /** Élément décoratif à droite (mini graphique). */
  trailing?: ReactNode;
}

/** Carte de chiffre clé. */
export function Stat({ label, value, hint, tone = "neutral", icon, trailing }: StatProps) {
  return (
    <div className="stat">
      <div className="stat__top">
        <span className="stat__label">
          {icon && <span className="stat__icon">{icon}</span>}
          {label}
        </span>
        {trailing && <span className="stat__trailing">{trailing}</span>}
      </div>
      <div className={cx("stat__value", "num", tone === "pos" && "pos", tone === "neg" && "neg")}>{value}</div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  );
}
