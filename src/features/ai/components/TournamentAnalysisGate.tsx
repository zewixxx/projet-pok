import { useEffect, useRef } from "react";
import { Button } from "../../../ui/Button";
import { fmtDuration, fmtInt, pluralize } from "../../../ui/format";
import { Alert } from "../../../ui/Alert";
import { Cpu, Play, SlidersHorizontal } from "../../../ui/icons";
import { ProgressBar } from "../../../ui/ProgressBar";
import { estimateSeconds, threadsForPower } from "../power";
import type { AnalysisProgress } from "../types";
import type { AnalysisStatus } from "../useRemoteReview";

interface TournamentAnalysisGateProps {
  tournamentName: string;
  handsCount: number;
  status: AnalysisStatus;
  progress: AnalysisProgress | null;
  error: string | null;
  powerPercent: number;
  logicalCpus?: number;
  onStart: () => void;
  onCancel: () => void;
  onOpenSettings: () => void;
}

const PHASE_LABEL: Record<AnalysisProgress["phase"], string> = {
  moteur: "Calcul des équités, des ranges adverses et de l'EV de chaque décision",
  texte: "Rédaction des conseils par l'IA locale",
};

const WHAT_IT_DOES = [
  "Ton équité contre la range estimée de chaque adversaire",
  "Les cotes du pot et l'EV de chaque option possible",
  "Un conseil rédigé pour chacune de tes décisions",
  "Tes fuites : les erreurs qui reviennent le plus souvent",
] as const;

/** Affiché à la place de la review tant que le tournoi n'est pas analysé. */
export default function TournamentAnalysisGate({
  tournamentName,
  handsCount,
  status,
  progress,
  error,
  powerPercent,
  logicalCpus = 8,
  onStart,
  onCancel,
  onOpenSettings,
}: TournamentAnalysisGateProps) {
  const running = status === "running";
  const total = progress?.total ?? 0;
  const done = progress?.done ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const threads = threadsForPower(powerPercent, logicalCpus);

  // Temps restant estimé à partir du rythme réel de l'analyse en cours.
  const startedAt = useRef<number | null>(null);
  useEffect(() => {
    if (!running) startedAt.current = null;
    else if (startedAt.current == null) startedAt.current = Date.now();
  }, [running]);
  const elapsed = startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0;
  const remaining = running && done > 5 && total > done ? (elapsed / done) * (total - done) : null;

  return (
    <section className="gate" aria-live="polite" aria-labelledby="gate-title">
      <div className="gate__icon" aria-hidden>
        <Cpu size={30} className={running ? "gate__spin" : undefined} />
      </div>

      <h2 className="gate__title" id="gate-title">
        {running ? "Analyse en cours…" : "Ce tournoi n'est pas encore analysé"}
      </h2>
      <p className="gate__sub">« {tournamentName} »</p>

      {running ? (
        <div className="gate__run">
          <div className="gate__pct num">{total > 0 ? `${pct} %` : "…"}</div>
          <ProgressBar value={total > 0 ? pct : undefined} active label="Progression de l'analyse" className="gate__bar" />
          <p className="gate__meta num">
            {total > 0 ? `${fmtInt(done)} / ${fmtInt(total)} mains` : "Démarrage…"}
            {remaining != null && ` · environ ${fmtDuration(remaining)} restantes`}
          </p>
          <p className="gate__phase">{PHASE_LABEL[progress?.phase ?? "moteur"]}.</p>
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      ) : (
        <div className="gate__idle">
          <ul className="gate__list">
            {WHAT_IT_DOES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="gate__meta">
            Durée estimée : environ <strong>{fmtDuration(estimateSeconds(handsCount, threads))}</strong> pour {fmtInt(handsCount)} mains, avec{" "}
            {powerPercent}&nbsp;% de puissance ({threads} {pluralize(threads, "cœur", "cœurs")}). Ensuite, la review est instantanée.
          </p>
          {error && <Alert tone="neg">{error}</Alert>}
          <div className="gate__actions">
            <Button variant="primary" size="lg" icon={<Play size={18} aria-hidden />} onClick={onStart}>
              Analyser ce tournoi
            </Button>
            <Button variant="ghost" icon={<SlidersHorizontal size={16} aria-hidden />} onClick={onOpenSettings}>
              Régler la puissance
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
