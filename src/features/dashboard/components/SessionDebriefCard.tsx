import type { SessionDebrief, SessionFocusItem } from "../data/sessionDebrief";

interface SessionDebriefCardProps {
  debrief: SessionDebrief;
  onSelectFocus: (item: SessionFocusItem) => void;
}

export function SessionDebriefCard({ debrief, onSelectFocus }: SessionDebriefCardProps) {
  const { session, dateLabel, resultLabel, isWin, highlights, focusItems } = debrief;
  const net = session.netEuros;

  return (
    <section className="session-debrief" aria-label="Bilan de la dernière session">
      <header className="session-debrief__header">
        <div>
          <p className="session-debrief__kicker">Dernière session</p>
          <h2 className="session-debrief__title">{session.label}</h2>
          <p className="session-debrief__date">{dateLabel}</p>
        </div>
        <div className={`session-debrief__result ${isWin ? "session-debrief__result--win" : "session-debrief__result--loss"}`}>
          <span className="session-debrief__result-label">{resultLabel}</span>
          <span className="session-debrief__result-net">
            {net >= 0 ? "+" : ""}
            {net.toLocaleString("fr-FR")} €
          </span>
        </div>
      </header>

      <ul className="session-debrief__highlights">
        {highlights.map((h) => (
          <li key={h} className="session-debrief__chip">
            {h}
          </li>
        ))}
      </ul>

      <div className="session-debrief__focus">
        <h3 className="session-debrief__focus-title">À travailler (clique pour un exemple)</h3>
        <div className="session-debrief__focus-list">
          {focusItems.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className="session-focus"
              onClick={() => onSelectFocus(item)}
            >
              <span className="session-focus__rank">{i + 1}</span>
              <span className="session-focus__body">
                <span className="session-focus__name">{item.title}</span>
                <span className="session-focus__summary">{item.summary}</span>
                <span className="session-focus__impact">{item.impact}</span>
              </span>
              <span className="session-focus__cta">Voir l’exemple →</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
