import { Button } from "../../../ui/Button";
import { Download, Lock, Play, ScanSearch } from "../../../ui/icons";
import { Logo } from "../../../shell/Logo";

interface OnboardingProps {
  onImport: () => void;
  onDemo: () => void;
}

const STEPS = [
  {
    icon: Download,
    title: "Importe tes mains",
    text: "On cherche tout seul tes historiques Winamax, PokerStars, Unibet… Un seul clic, rien à configurer.",
  },
  {
    icon: ScanSearch,
    title: "Le moteur analyse",
    text: "Équité, ranges adverses et EV de chaque décision sont calculés sur ton PC, avec une barre de progression.",
  },
  {
    icon: Play,
    title: "Révise et progresse",
    text: "Rejoue tes mains, vois tes erreurs expliquées en français et corrige tes fuites les plus coûteuses.",
  },
] as const;

/** Premier lancement : aucune main importée. */
export function Onboarding({ onImport, onDemo }: OnboardingProps) {
  return (
    <section className="onboarding" aria-labelledby="onboarding-title">
      <div className="onboarding__hero">
        <div className="onboarding__logo">
          <Logo size={64} />
        </div>
        <h1 className="onboarding__title" id="onboarding-title">
          Bienvenue dans Projet-pok
        </h1>
        <p className="onboarding__lead">
          Ton coach poker personnel : il analyse tes tournois sur ton ordinateur et t'explique, main par main, où tu perds de
          l'argent.
        </p>
        <div className="onboarding__cta">
          <Button variant="primary" size="lg" icon={<Download size={18} aria-hidden />} onClick={onImport}>
            Chercher mes mains
          </Button>
          <Button variant="ghost" size="lg" onClick={onDemo}>
            Voir une démo
          </Button>
        </div>
        <p className="onboarding__privacy">
          <Lock size={14} aria-hidden /> 100 % local : tes mains ne quittent jamais ton PC.
        </p>
      </div>

      <ol className="onboarding__steps">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="onboarding__step">
            <span className="onboarding__num" aria-hidden>
              {i + 1}
            </span>
            <span className="onboarding__icon" aria-hidden>
              <Icon size={22} />
            </span>
            <h2 className="onboarding__step-title">{title}</h2>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
