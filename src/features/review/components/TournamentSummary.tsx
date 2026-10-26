import { Badge, type Tone } from "../../../ui/Badge";
import { fmtBb, fmtInt } from "../../../ui/format";
import { Term } from "../../../ui/Term";
import type { AnalysisLeak } from "../../ai/types";

export interface BilanData {
  handsCount: number;
  mistakes?: number;
  totalLossBb?: number;
  leaks: AnalysisLeak[];
}

const SEVERITY: Record<AnalysisLeak["severity"], { label: string; tone: Tone }> = {
  critical: { label: "Critique", tone: "neg" },
  major: { label: "Important", tone: "warn" },
  minor: { label: "Mineur", tone: "info" },
};

/** Bilan chiffré d'un tournoi analysé, avec ses principales fuites. */
export function TournamentSummary({ handsCount, mistakes, totalLossBb, leaks }: BilanData) {
  const top = leaks.slice(0, 3);
  return (
    <section className="bilan" aria-label="Bilan du tournoi">
      <dl className="bilan__stats">
        <div>
          <dt>Erreurs repérées</dt>
          <dd className="num">{fmtInt(mistakes ?? 0)}</dd>
        </div>
        <div>
          <dt>
            Perte estimée (<Term id="ev">EV</Term>)
          </dt>
          <dd className="num neg">{totalLossBb != null ? `≈ ${fmtBb(totalLossBb, 0)}` : "—"}</dd>
        </div>
        <div>
          <dt>Mains analysées</dt>
          <dd className="num">{fmtInt(handsCount)}</dd>
        </div>
      </dl>

      {top.length > 0 && (
        <div className="bilan__leaks">
          <h3 className="bilan__title">
            Tes principales <Term id="fuite">fuites</Term> dans ce tournoi
          </h3>
          <ul>
            {top.map((leak) => {
              const sev = SEVERITY[leak.severity];
              return (
                <li key={leak.id} className="bilan__leak">
                  <Badge tone={sev.tone}>{sev.label}</Badge>
                  <span className="bilan__leak-text">{leak.description}</span>
                  <span className="bilan__leak-meta num">
                    {leak.occurrences}× · {fmtBb(-leak.totalLossBb, 1)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
