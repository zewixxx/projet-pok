import { useRef, useState } from "react";

interface TableControlsProps {
  handIndex: number;
  totalHands: number;
  actionIndex: number;
  totalActions: number;
  onPrevAction: () => void;
  onNextAction: () => void;
  onPrevHand: () => void;
  onNextHand: () => void;
  onGoToHand: (index: number) => void;
  isFirstAction: boolean;
  isLastAction: boolean;
  isFirstHand: boolean;
  isLastHand: boolean;
}

export function TableControls({
  handIndex,
  totalHands,
  actionIndex,
  totalActions,
  onPrevAction,
  onNextAction,
  onPrevHand,
  onNextHand,
  onGoToHand,
  isFirstAction,
  isLastAction,
  isFirstHand,
  isLastHand,
}: TableControlsProps) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openEditor = () => {
    setInputVal(String(handIndex + 1));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n >= 1 && n <= totalHands) {
      onGoToHand(n - 1);
    }
    setEditing(false);
  };

  const progressPct = totalHands > 1 ? (handIndex / (totalHands - 1)) * 100 : 0;

  return (
    <div className="table-controls" role="group" aria-label="Navigation du replay">
      <div className="table-controls__hands">
        <button
          className="table-controls__icon-btn table-controls__icon-btn--prev"
          onClick={onPrevHand}
          disabled={isFirstHand}
          aria-label="Main précédente"
          title="Main précédente"
        >
          ⏮
        </button>

        {editing ? (
          <input
            ref={inputRef}
            className="table-controls__hand-input"
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
            className="table-controls__hand-counter"
            onClick={openEditor}
            title="Clique pour choisir une main"
            aria-label={`Main ${handIndex + 1} sur ${totalHands}`}
          >
            <span className="table-controls__hand-label">Main</span>
            <span className="table-controls__hand-current">{handIndex + 1}</span>
            <span className="table-controls__hand-sep">/</span>
            <span className="table-controls__hand-total">{totalHands}</span>
          </button>
        )}

        <button
          className="table-controls__icon-btn table-controls__icon-btn--next"
          onClick={onNextHand}
          disabled={isLastHand}
          aria-label="Main suivante"
          title="Main suivante"
        >
          ⏭
        </button>
      </div>

      <div className="table-controls__slider-wrap" aria-label="Position dans le tournoi">
        <input
          className="table-controls__slider"
          type="range"
          min={0}
          max={Math.max(totalHands - 1, 1)}
          value={handIndex}
          onChange={(e) => onGoToHand(Number(e.target.value))}
          aria-label="Aller à la main"
          style={{ "--progress": `${progressPct}%` } as React.CSSProperties}
        />
      </div>

      <div className="table-controls__actions">
        <button
          className="table-controls__btn table-controls__btn--back"
          onClick={onPrevAction}
          disabled={isFirstAction}
          aria-label="Coup précédent"
        >
          ◀ Précédent
        </button>

        <span
          className="table-controls__action-counter"
          aria-label={`Coup ${actionIndex + 1} sur ${totalActions}`}
        >
          Coup {actionIndex + 1} / {totalActions}
        </span>

        <button
          className="table-controls__btn table-controls__btn--primary"
          onClick={onNextAction}
          disabled={isLastAction}
          aria-label="Coup suivant"
        >
          Suivant ▶
        </button>
      </div>
    </div>
  );
}
