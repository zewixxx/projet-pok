import { Badge } from "../../../ui/Badge";
import { Card, CardHeader } from "../../../ui/Card";
import { cx } from "../../../ui/cx";
import { signed } from "../../../ui/format";
import type { PositionStat } from "../types";

interface PositionStatsProps {
  stats: PositionStat[];
}

const MAX_EV = 10;

/** Statistiques par position. Affiché uniquement avec des données d'exemple. */
export function PositionStats({ stats }: PositionStatsProps) {
  return (
    <Card aria-labelledby="pos-title">
      <CardHeader
        id="pos-title"
        title="Statistiques par position"
        sub="Jeu préflop selon ta place à la table"
        actions={<Badge tone="warn">Exemple</Badge>}
      />
      <table className="table table--compact">
        <thead>
          <tr>
            <th scope="col">Position</th>
            <th scope="col" className="table__num">VPIP</th>
            <th scope="col" className="table__num">PFR</th>
            <th scope="col" className="table__num">3-bet</th>
            <th scope="col">EV / 100 mains</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => {
            const pct = Math.min(Math.abs(s.evPerHand) / MAX_EV, 1) * 100;
            return (
              <tr key={s.position}>
                <th scope="row">
                  <span className="pos-pill">{s.position}</span>
                </th>
                <td className="table__num num">{s.vpip}&nbsp;%</td>
                <td className="table__num num">{s.pfr}&nbsp;%</td>
                <td className="table__num num">{s.threebet}&nbsp;%</td>
                <td>
                  <span className="ev-cell">
                    <span className="ev-cell__track" aria-hidden>
                      <span
                        className={cx("ev-cell__bar", s.evPerHand >= 0 ? "ev-cell__bar--pos" : "ev-cell__bar--neg")}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className={cx("num", s.evPerHand >= 0 ? "pos" : "neg")}>{signed(s.evPerHand, 1)}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
