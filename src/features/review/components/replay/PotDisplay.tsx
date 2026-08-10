import { ChipStack } from "./ChipStack";

interface PotDisplayProps {
  pot: number;
}

export function PotDisplay({ pot }: PotDisplayProps) {
  return (
    <div className="pot-display pot-display--pro" key={pot.toFixed(1)}>
      <ChipStack amountBb={Math.max(pot, 0.1)} variant="pot" />
      <div className="pot-display__meta">
        <span className="pot-display__label">Pot</span>
        <span className="pot-display__amount">{pot.toFixed(1)} bb</span>
      </div>
    </div>
  );
}
