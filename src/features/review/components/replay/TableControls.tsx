import { useRef, useState, type CSSProperties } from "react";
import { Button } from "../../../../ui/Button";
import { cx } from "../../../../ui/cx";
import { ChevronLeft, ChevronRight, CircleAlert, SkipBack, SkipForward, Target } from "../../../../ui/icons";

export type HandMark = "mistake" | "good" | "ok" | "none";

interface TableControlsProps {
  handIndex: number;
  totalHands: number;
  actionIndex: number;
  totalActions: number;
  /** Une valeur par main : colore la frise (erreur, beau coup…). */
  handMarks: HandMark[];
  onPrevAction: () => void;
  onNextAction: () => void;
  onPrevHand: () => void;
  onNextHand: () => void;
  onGoToHand: (index: number) => void;
  onNextDecision: () => void;
  onNextMistake: () => void;
  isFirstAction: boolean;
  isLastAction: boolean;
  isFirstHand: boolean;
  isLastHand: boolean;
  hasMistakes: boolean;
}

const MARK_LABEL: Record<HandMark, string> = {
  mistake: "erreur",
  good: "beau coup",
  ok: "correct",
  none: "non analysée",
};

export function TableControls({
  handIndex,
  totalHands,
  actionIndex,
  totalActions,
  handMarks,
  onPrevAction,
  onNextAction,
  onPrevHand,
  onNextHand,
  onGoToHand,
  onNextDecision,
  onNextMistake,
  isFirstAction,
  isLastAction,
  isFirstHand,
  isLastHand,
  hasMistakes,
}: TableControlsProps) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openEditor = () => {
    setInputVal(String(handIndex + 1));
    setEditing(true);
    window.setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const n = parseInt(inputVal, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= totalHands) onGoToHand(n - 1);
    setEditing(false);
  };

  const currentMark = handMarks[handIndex] ?? "none";
  const progress = totalHands > 1 ? (handIndex / (totalHands - 1)) * 100 : 0;

  return (
    <div className="controls" role="group" aria-label="Navigation du replay">
      <div className="controls__top">
        <div className="controls__hand">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onPrevHand}
            disabled={isFirstHand}
            aria-label="Main précédente"
            title="Main précédente (↑)"
            icon={<SkipBack size={16} aria-hidden />}
          />
          {editing ? (
            <input
              ref={inputRef}
              className="input controls__hand-input num"
              type="number"
              min={1}
              max={totalHands}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              aria-label="Numéro de main"
            />
          ) : (
            <button
              type="button"
              className="controls__hand-btn"
              onClick={openEditor}
              title="Clique pour aller à un numéro de main"
              aria-label={`Main ${handIndex + 1} sur ${totalHands}`}
            >
              <span className="controls__hand-label">Main</span>
              <span className="controls__hand-cur num">{handIndex + 1}</span>
              <span className="controls__hand-total num">/ {totalHands}</span>
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onNextHand}
            disabled={isLastHand}
            aria-label="Main suivante"
            title="Main suivante (↓)"
            icon={<SkipForward size={16} aria-hidden />}
          />
        </div>

        <div className="timeline" style={{ "--progress": `${progress}%` } as CSSProperties}>
          <div className="timeline__marks" aria-hidden>
            {handMarks.map((mark, i) => (
              <i key={i} className={cx("timeline__mark", `timeline__mark--${mark}`, i === handIndex && "is-current")} />
            ))}
          </div>
          <input
            className="timeline__input"
            type="range"
            min={0}
            max={Math.max(totalHands - 1, 1)}
            value={handIndex}
            onChange={(e) => onGoToHand(Number(e.target.value))}
            aria-label="Aller à la main"
            aria-valuetext={`Main ${handIndex + 1} sur ${totalHands} (${MARK_LABEL[currentMark]})`}
          />
        </div>

        <ul className="controls__legend" aria-label="Légende de la frise">
          <li>
            <i className="timeline__mark timeline__mark--mistake" /> Erreur
          </li>
          <li>
            <i className="timeline__mark timeline__mark--good" /> Beau coup
          </li>
        </ul>
      </div>

      <div className="controls__bottom">
        <div className="controls__stepper">
          <Button
            variant="secondary"
            onClick={onPrevAction}
            disabled={isFirstAction}
            aria-label="Coup précédent"
            title="Coup précédent (←)"
            icon={<ChevronLeft size={18} aria-hidden />}
          >
            Précédent
          </Button>
          <div className="controls__steps" aria-label={`Coup ${actionIndex + 1} sur ${totalActions}`} role="img">
            {Array.from({ length: totalActions }, (_, i) => (
              <i key={i} className={cx("controls__step", i < actionIndex && "is-done", i === actionIndex && "is-current")} />
            ))}
          </div>
          <Button
            variant="primary"
            onClick={onNextAction}
            disabled={isLastAction}
            aria-label="Coup suivant"
            title="Coup suivant (→)"
          >
            Suivant
            <ChevronRight size={18} aria-hidden />
          </Button>
        </div>

        <div className="controls__jumps">
          <Button variant="ghost" size="sm" onClick={onNextDecision} icon={<Target size={15} aria-hidden />} title="Ma prochaine décision (D)">
            Ma décision <kbd className="kbd">D</kbd>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextMistake}
            disabled={!hasMistakes}
            icon={<CircleAlert size={15} aria-hidden />}
            title="Prochaine erreur (E)"
          >
            Prochaine erreur <kbd className="kbd">E</kbd>
          </Button>
        </div>
      </div>
    </div>
  );
}
