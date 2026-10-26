import { REVIEW_SHORTCUTS } from "../features/review/shortcuts";
import { Dialog } from "../ui/Dialog";
import { GLOSSARY } from "../ui/glossary";
import { Download, Lock, Play, ScanSearch } from "../ui/icons";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  { icon: Download, title: "Importer", text: "L'application cherche toute seule tes historiques de mains sur ton PC." },
  { icon: ScanSearch, title: "Analyser", text: "Le moteur calcule l'équité, les ranges et l'EV de chaque décision." },
  { icon: Play, title: "Réviser", text: "Rejoue tes mains, vois tes erreurs et corrige tes fuites." },
] as const;

function splitTerm(text: string): { term: string; definition: string } {
  const idx = text.indexOf(" : ");
  if (idx === -1) return { term: "", definition: text };
  return { term: text.slice(0, idx), definition: text.slice(idx + 3) };
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Aide">
      <div className="help">
        <section className="help__section" aria-labelledby="help-how">
          <h3 id="help-how" className="help__title">
            Comment ça marche
          </h3>
          <ol className="help__steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="help__step">
                <span className="help__step-num" aria-hidden>
                  {i + 1}
                </span>
                <Icon size={18} aria-hidden />
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="help__section" aria-labelledby="help-keys">
          <h3 id="help-keys" className="help__title">
            Raccourcis clavier (Review)
          </h3>
          <ul className="help__keys">
            {REVIEW_SHORTCUTS.map((s) => (
              <li key={s.label}>
                <span className="help__keycaps">
                  {s.keys.map((k) => (
                    <kbd key={k} className="kbd">
                      {k}
                    </kbd>
                  ))}
                </span>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="help__section" aria-labelledby="help-words">
          <h3 id="help-words" className="help__title">
            Vocabulaire
          </h3>
          <dl className="help__glossary">
            {Object.values(GLOSSARY).map((text) => {
              const { term, definition } = splitTerm(text);
              return (
                <div key={text} className="help__entry">
                  <dt>{term}</dt>
                  <dd>{definition}</dd>
                </div>
              );
            })}
          </dl>
        </section>

        <section className="help__section help__privacy" aria-labelledby="help-privacy">
          <h3 id="help-privacy" className="help__title">
            <Lock size={16} aria-hidden /> Confidentialité et limites
          </h3>
          <p>
            Tes mains restent sur ton PC : l'analyse est entièrement locale et rien n'est envoyé en ligne. Le moteur
            donne des <strong>estimations rapides</strong> pour t'aider à progresser. Ce n'est pas un solveur : les
            chiffres sont indicatifs.
          </p>
        </section>
      </div>
    </Dialog>
  );
}
