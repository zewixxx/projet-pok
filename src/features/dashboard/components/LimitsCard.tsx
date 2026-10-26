import { Card, CardHeader } from "../../../ui/Card";
import { cx } from "../../../ui/cx";
import { fmtEuros, fmtInt } from "../../../ui/format";
import { Term } from "../../../ui/Term";
import type { LimitBucket } from "../../winamax-analyzer/types";

interface LimitsCardProps {
  buckets: LimitBucket[];
}

export function LimitsCard({ buckets }: LimitsCardProps) {
  return (
    <Card aria-labelledby="limits-title">
      <CardHeader id="limits-title" title="Résultats par niveau de buy-in" sub="Là où tu gagnes, et là où tu perds" />
      {buckets.length === 0 ? (
        <p className="muted">Pas encore assez de tournois classés pour comparer les niveaux.</p>
      ) : (
        <table className="table table--compact">
          <thead>
            <tr>
              <th scope="col">Niveau</th>
              <th scope="col" className="table__num">
                Tournois
              </th>
              <th scope="col" className="table__num">
                Résultat
              </th>
              <th scope="col" className="table__num">
                <Term id="roi">ROI</Term>
              </th>
              <th scope="col" className="table__num">
                <Term id="itm">ITM</Term>
              </th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => (
              <tr key={b.label}>
                <th scope="row" className="table__strong">
                  {b.label}
                </th>
                <td className="table__num num">{fmtInt(b.tournaments)}</td>
                <td className={cx("table__num", "num", b.profit >= 0 ? "pos" : "neg")}>{fmtEuros(b.profit, { sign: true })}</td>
                <td className={cx("table__num", "num", b.roi >= 0 ? "pos" : "neg")}>
                  {b.roi > 0 ? "+" : b.roi < 0 ? "\u2212" : ""}
                  {Math.abs(b.roi)}&nbsp;%
                </td>
                <td className="table__num num">{b.itmRate}&nbsp;%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
