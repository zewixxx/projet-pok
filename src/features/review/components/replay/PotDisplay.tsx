import { fmtBb } from "../../../../ui/format";
import { ChipStack } from "./ChipStack";

interface PotDisplayProps {
  pot: number;
}

export function PotDisplay({ pot }: PotDisplayProps) {
  return (
    <div className="pot" key={pot.toFixed(1)} role="status" aria-label={`Pot : ${fmtBb(pot)}`}>
      <ChipStack amountBb={Math.max(pot, 0.1)} variant="pot" showAmount={false} />
      <span className="pot__label">Pot</span>
      <span className="pot__amount num">{fmtBb(pot)}</span>
    </div>
  );
}
