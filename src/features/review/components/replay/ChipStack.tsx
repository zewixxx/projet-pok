import type { CSSProperties } from "react";
import { cx } from "../../../../ui/cx";
import { fmtBb } from "../../../../ui/format";

type ChipTone = "cream" | "red" | "blue" | "black" | "gold";

interface ChipStackProps {
  amountBb: number;
  /** « pot » : or, plus compact. */
  variant?: "bet" | "pot";
  /** Affiche le montant à côté de la pile. */
  showAmount?: boolean;
  className?: string;
}

function toneForAmount(amountBb: number): ChipTone {
  if (amountBb >= 50) return "black";
  if (amountBb >= 20) return "gold";
  if (amountBb >= 8) return "blue";
  if (amountBb >= 3) return "red";
  return "cream";
}

function stackCount(amountBb: number, variant: "bet" | "pot"): number {
  const max = variant === "pot" ? 5 : 4;
  if (amountBb < 2) return 1;
  if (amountBb < 5) return 2;
  if (amountBb < 12) return 3;
  if (amountBb < 30) return 4;
  return max;
}

/** Pile de jetons dessinée en CSS : net à toutes les tailles. */
export function ChipStack({ amountBb, variant = "bet", showAmount = true, className }: ChipStackProps) {
  const tone = variant === "pot" ? "gold" : toneForAmount(amountBb);
  const n = stackCount(amountBb, variant);

  return (
    <span className={cx("chips", `chips--${variant}`, `chips--${tone}`, className)} title={fmtBb(amountBb)}>
      <span className="chips__pile" aria-hidden style={{ "--n": n } as CSSProperties}>
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="chips__chip" style={{ "--i": i } as CSSProperties} />
        ))}
      </span>
      {showAmount && <span className="chips__amount num">{fmtBb(amountBb)}</span>}
    </span>
  );
}
