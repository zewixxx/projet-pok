import { Badge } from "../../../ui/Badge";
import { Button } from "../../../ui/Button";
import { Card, CardHeader } from "../../../ui/Card";
import { cx } from "../../../ui/cx";
import { fmtDate, fmtEuros, fmtInt } from "../../../ui/format";
import { ChevronRight, CircleCheck, Crown } from "../../../ui/icons";
import type { HomeTournamentRow } from "../useHomeData";

interface RecentTournamentsProps {
  rows: HomeTournamentRow[];
  /** Absent en mode démo : pas de bouton de review par ligne. */
  onOpen?: (tournamentId: string) => void;
  total: number;
}

const MAX_ROWS = 8;

function placeLabel(row: HomeTournamentRow): string {
  if (row.place <= 0) return "—";
  return `${fmtInt(row.place)} / ${fmtInt(row.total)}`;
}

export function RecentTournaments({ rows, onOpen, total }: RecentTournamentsProps) {
  const shown = rows.slice(0, MAX_ROWS);
  return (
    <Card flush aria-labelledby="recent-title">
      <div className="card__pad">
        <CardHeader
          id="recent-title"
          title="Tournois récents"
          sub={total > shown.length ? `${shown.length} derniers sur ${fmtInt(total)}` : `${fmtInt(total)} au total`}
        />
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Tournoi</th>
              <th scope="col" className="table__num">
                Buy-in
              </th>
              <th scope="col" className="table__num">
                Place
              </th>
              <th scope="col" className="table__num">
                Résultat
              </th>
              <th scope="col">Analyse</th>
              {onOpen && <th scope="col" className="sr-only">Action</th>}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => {
              const winner = row.place === 1;
              return (
                <tr key={row.id}>
                  <th scope="row" className="table__name">
                    <span className="table__title truncate">
                      {winner && <Crown size={14} aria-label="Victoire" className="table__crown" />}
                      {row.name}
                    </span>
                    <span className="table__sub">
                      {fmtDate(row.dateIso)} · {fmtInt(row.hands)} mains
                    </span>
                  </th>
                  <td className="table__num num">{fmtEuros(row.buyIn)}</td>
                  <td className="table__num num">{placeLabel(row)}</td>
                  <td className={cx("table__num", "num", row.net == null ? "muted" : row.net >= 0 ? "pos" : "neg")}>
                    {row.net == null ? "—" : fmtEuros(row.net, { sign: true })}
                  </td>
                  <td>
                    {row.analyzed == null ? (
                      <span className="muted">—</span>
                    ) : row.analyzed ? (
                      <Badge tone="pos">
                        <CircleCheck size={12} aria-hidden />
                        {row.mistakes != null ? `${row.mistakes} ${row.mistakes > 1 ? "erreurs" : "erreur"}` : "Analysé"}
                      </Badge>
                    ) : (
                      <Badge>À analyser</Badge>
                    )}
                  </td>
                  {onOpen && (
                    <td className="table__action">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpen(row.id)}
                        aria-label={`${row.analyzed ? "Revoir" : "Analyser"} ${row.name}`}
                        icon={<ChevronRight size={16} aria-hidden />}
                      >
                        {row.analyzed ? "Revoir" : "Analyser"}
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
