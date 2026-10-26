import type { ReactNode } from "react";
import { Button } from "../../../ui/Button";
import { fmtBb, pluralize } from "../../../ui/format";
import { ArrowRight, Download, Lightbulb, Play, Sparkles, Target } from "../../../ui/icons";
import type { HomeData, HomeLeak } from "../useHomeData";

interface NextStepCardProps {
  data: HomeData;
  onReviewTournament: (tournamentId: string) => void;
  onOpenLeak: (leak: HomeLeak) => void;
  onImport: () => void;
  onDemoReview: () => void;
}

interface Step {
  icon: ReactNode;
  kicker: string;
  title: string;
  text: string;
  cta: string;
  ctaIcon: ReactNode;
  onClick: () => void;
}

function pickStep(props: NextStepCardProps): Step {
  const { data } = props;

  if (data.mode === "demo") {
    return {
      icon: <Sparkles size={22} aria-hidden />,
      kicker: "Mode démonstration",
      title: "Découvre la review avec une main d'exemple",
      text: "Cette page montre des données d'exemple. Dans l'application de bureau, elle utilise tes vraies mains, analysées sur ton PC.",
      cta: "Ouvrir la review",
      ctaIcon: <Play size={16} aria-hidden />,
      onClick: props.onDemoReview,
    };
  }

  const pending = data.analysis ? data.analysis.total - data.analysis.analyzed : 0;
  if (data.nextToAnalyze) {
    const t = data.nextToAnalyze;
    return {
      icon: <Target size={22} aria-hidden />,
      kicker: "Prochaine étape",
      title: `${pending} ${pluralize(pending, "tournoi", "tournois")} à analyser`,
      text: `Commence par le plus récent : « ${t.name} » (${t.hands} mains). L'analyse se fait sur ton PC, puis la review est instantanée.`,
      cta: "Analyser et réviser",
      ctaIcon: <Play size={16} aria-hidden />,
      onClick: () => props.onReviewTournament(t.id),
    };
  }

  const top = data.leaks[0];
  if (top) {
    return {
      icon: <Lightbulb size={22} aria-hidden />,
      kicker: "Ta priorité n°1",
      title: top.description,
      text: `${top.occurrences} ${pluralize(top.occurrences, "occurrence", "occurrences")}, environ ${fmtBb(-top.costBb100)} par 100 mains. Corriger cette fuite est ce qui te rapportera le plus.`,
      cta: "Voir un exemple",
      ctaIcon: <Play size={16} aria-hidden />,
      onClick: () => props.onOpenLeak(top),
    };
  }

  return {
    icon: <Download size={22} aria-hidden />,
    kicker: "Tout est à jour",
    title: "Aucune erreur récurrente repérée",
    text: "Importe de nouvelles mains après tes prochaines sessions pour continuer à progresser.",
    cta: "Importer des mains",
    ctaIcon: <ArrowRight size={16} aria-hidden />,
    onClick: props.onImport,
  };
}

export function NextStepCard(props: NextStepCardProps) {
  const step = pickStep(props);
  return (
    <section className="next-step" aria-labelledby="next-step-title">
      <div className="next-step__icon">{step.icon}</div>
      <div className="next-step__body">
        <p className="next-step__kicker">{step.kicker}</p>
        <h2 className="next-step__title" id="next-step-title">
          {step.title}
        </h2>
        <p className="next-step__text">{step.text}</p>
      </div>
      <Button variant="primary" size="lg" icon={step.ctaIcon} onClick={step.onClick}>
        {step.cta}
      </Button>
    </section>
  );
}
