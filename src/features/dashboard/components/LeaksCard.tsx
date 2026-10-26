import { Badge, type Tone } from "../../../ui/Badge";
import { Card, CardHeader } from "../../../ui/Card";
import { EmptyState } from "../../../ui/EmptyState";
import { fmtBb } from "../../../ui/format";
import { ChevronRight, Lightbulb, Play } from "../../../ui/icons";
import { Term } from "../../../ui/Term";
import type { HomeLeak } from "../useHomeData";

interface LeaksCardProps {
  leaks: HomeLeak[];
  /** Vrai quand aucun tournoi n'est encore analysé (message d'attente adapté). */
  nothingAnalyzed?: boolean;
  onOpenLeak: (leak: HomeLeak) => void;
}

const SEVERITY: Record<HomeLeak["severity"], { label: string; tone: Tone }> = {
  critical: { label: "Critique", tone: "neg" },
  major: { label: "Important", tone: "warn" },
  minor: { label: "Mineur", tone: "info" },
};

const MAX_ROWS = 6;

/** Catégories techniques du moteur → mots du quotidien. */
const CATEGORY_LABEL: Record<string, string> = {
  overfold: "Folds",
  overcall: "Calls",
  "passive-call": "Calls passifs",
  "missed-bet": "Valeur",
  overaggression: "Agression",
  sizing: "Sizing",
};

export function LeaksCard({ leaks, nothingAnalyzed, onOpenLeak }: LeaksCardProps) {
  const shown = leaks.slice(0, MAX_ROWS);
  const maxCost = Math.max(1, ...shown.map((l) => l.costBb100));

  return (
    <Card aria-labelledby="leaks-title">
      <CardHeader
        id="leaks-title"
        title="À travailler en priorité"
        sub={
          <>
            Tes <Term id="fuite">fuites</Term> les plus coûteuses, classées par perte d'<Term id="ev">EV</Term>
          </>
        }
      />

      {shown.length === 0 ? (
        <EmptyState icon={<Lightbulb size={26} />} title={nothingAnalyzed ? "Pas encore d'analyse" : "Aucune fuite repérée"}>
          {nothingAnalyzed
            ? "Analyse un tournoi dans la review : tes fuites les plus coûteuses apparaîtront ici."
            : "Le moteur n'a pas repéré d'erreur récurrente sur les tournois analysés."}
        </EmptyState>
      ) : (
        <ol className="leaks">
          {shown.map((leak, i) => {
            const sev = SEVERITY[leak.severity];
            return (
              <li key={leak.id}>
                <button
                  type="button"
                  className="leak"
                  onClick={() => onOpenLeak(leak)}
                  aria-label={`Voir un exemple de la fuite : ${leak.description}`}
                >
                  <span className="leak__rank num" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="leak__main">
                    <span className="leak__head">
                      <Badge tone={sev.tone}>{sev.label}</Badge>
                      <span className="leak__cat">{CATEGORY_LABEL[leak.category] ?? leak.category}</span>
                    </span>
                    <span className="leak__title">{leak.description}</span>
                    <span className="leak__meter" aria-hidden>
                      <span className="leak__meter-fill" style={{ width: `${Math.max(6, (leak.costBb100 / maxCost) * 100)}%` }} />
                    </span>
                  </span>
                  <span className="leak__nums">
                    <strong className="num neg">{fmtBb(-leak.costBb100)}</strong>
                    <span>/ 100 mains</span>
                    <span className="leak__occ">{leak.occurrences} fois</span>
                  </span>
                  <ChevronRight size={18} aria-hidden className="leak__chev" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {shown.length > 0 && (
        <p className="card__foot">
          <Play size={13} aria-hidden /> Clique une fuite pour voir une main d'exemple dans la review.
        </p>
      )}
    </Card>
  );
}
