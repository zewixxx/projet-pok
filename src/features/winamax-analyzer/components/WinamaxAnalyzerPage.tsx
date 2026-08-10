import { useWinamaxAnalyzer } from "../hooks/useWinamaxAnalyzer";
import type { AnalyzerReport } from "../types";

function fmtEuro(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}€`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Jamais";
  try {
    return new Date(iso).toLocaleString("fr-FR");
  } catch {
    return iso;
  }
}

function OverviewCards({ report }: { report: AnalyzerReport }) {
  const o = report.overview;
  const cards = [
    { label: "Profit", value: fmtEuro(o.profit), tone: o.profit >= 0 ? "pos" : "neg" },
    { label: "ROI", value: `${o.roi}%`, tone: o.roi >= 0 ? "pos" : "neg" },
    { label: "ITM", value: `${o.itmRate}%`, tone: "neutral" },
    { label: "ABI", value: `${o.abi}€`, tone: "neutral" },
    { label: "Tournois", value: String(o.tournaments), tone: "neutral" },
    { label: "Mains", value: String(o.hands), tone: "neutral" },
  ];
  return (
    <div className="wa-cards">
      {cards.map((c) => (
        <div key={c.label} className={`wa-card wa-card--${c.tone}`}>
          <span className="wa-card__label">{c.label}</span>
          <strong className="wa-card__value">{c.value}</strong>
        </div>
      ))}
    </div>
  );
}

function ProfitChart({ sessions }: { sessions: { date: string; cumulEuros: number; label: string }[] }) {
  if (sessions.length < 2) {
    return <p className="wa-muted">Pas assez de points pour le graphique.</p>;
  }
  const vals = sessions.map((s) => s.cumulEuros);
  const min = Math.min(0, ...vals);
  const max = Math.max(0, ...vals);
  const span = max - min || 1;
  const w = 640;
  const h = 180;
  const pad = 12;
  const points = sessions
    .map((s, i) => {
      const x = pad + (i / (sessions.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (s.cumulEuros - min) / span) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const zeroY = pad + (1 - (0 - min) / span) * (h - pad * 2);

  return (
    <svg className="wa-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Évolution du profit">
      <line x1={pad} y1={zeroY} x2={w - pad} y2={zeroY} className="wa-chart__zero" />
      <polyline points={points} className="wa-chart__line" fill="none" />
    </svg>
  );
}

export default function WinamaxAnalyzerPage() {
  const {
    isElectron,
    loading,
    pseudo,
    setPseudo,
    connectedPseudo,
    exportUrl,
    setExportUrl,
    exportPassword,
    setExportPassword,
    allowNonWinamax,
    setAllowNonWinamax,
    syncState,
    error,
    unavailable,
    dataset,
    lastSyncAt,
    syncInfo,
    pendingDat,
    report,
    connect,
    disconnect,
    sync,
    unlockLocalDat,
    importHistoryDir,
    copyPassword,
    revealDat,
    ingestAfterImport,
    openWinamaxHelp,
  } = useWinamaxAnalyzer();

  if (loading) {
    return (
      <section className="wa">
        <p className="wa-muted">Chargement du module Winamax Analyzer…</p>
      </section>
    );
  }

  return (
    <section className="wa" aria-label="Winamax Analyzer">
      <header className="wa-header">
        <div>
          <p className="wa-kicker">Module · Sync officielle assistée</p>
          <h2 className="wa-title">Winamax Analyzer</h2>
          <p className="wa-lead">
            Export email Winamax = <strong>.dat chiffré</strong>. L’app tente le déchiffrement avec
            le mot de passe de l’email ; si le format est propriétaire, le client Winamax reste le
            chemin officiel, puis l’analyse se fait automatiquement.
          </p>
        </div>
        {connectedPseudo && (
          <div className="wa-profile">
            <span className="wa-profile__pseudo">{connectedPseudo}</span>
            <button type="button" className="wa-btn wa-btn--ghost" onClick={() => void disconnect()}>
              Déconnecter
            </button>
          </div>
        )}
      </header>

      {!isElectron && (
        <div className="wa-banner wa-banner--warn" role="status">
          Lance l’app avec <code>npm run electron:dev</code> pour synchroniser depuis Winamax.
        </div>
      )}

      {!connectedPseudo ? (
        <div className="wa-panel">
          <h3 className="wa-panel__title">1 · Connexion joueur</h3>
          <p className="wa-panel__text">
            Indique ton <strong>pseudo</strong> Winamax (pas le mot de passe du compte). Le mot de
            passe de l’email d’export sert uniquement dans le client Winamax.
          </p>
          <div className="wa-row">
            <input
              className="wa-input"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Pseudo Winamax"
              autoComplete="username"
            />
            <button
              type="button"
              className="wa-btn wa-btn--primary"
              onClick={() => void connect()}
              disabled={!pseudo.trim() || !isElectron}
            >
              Connexion
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="wa-panel">
            <h3 className="wa-panel__title">2 · Demander l’export chez Winamax</h3>
            <ol className="wa-steps">
              <li>
                Compte Winamax → <strong>Historique de mains</strong> (ou lobby → demande d’export).
              </li>
              <li>Choisis les dates et le type (Tournoi / SNG / Cash).</li>
              <li>Winamax envoie un email avec un lien <code>dl.winamax.fr/.../*.dat</code> + un mot de passe.</li>
              <li>Colle le lien ci-dessous — l’app télécharge le .dat automatiquement.</li>
            </ol>
            <button type="button" className="wa-btn wa-btn--ghost" onClick={() => void openWinamaxHelp()}>
              Ouvrir l’espace compte Winamax
            </button>
          </div>

          <div className="wa-panel">
            <h3 className="wa-panel__title">3 · Télécharger le .dat + mot de passe</h3>
            <p className="wa-panel__text">
              Dernière sync analysée : <strong>{fmtDate(lastSyncAt)}</strong>
              <br />
              Le lien email donne un <strong>.dat chiffré</strong>. Le mot de passe est dans le{" "}
              <strong>même email</strong> (ce n’est pas le mot de passe de ton compte Winamax).
            </p>
            <div className="wa-row wa-row--stack">
              <input
                className="wa-input wa-input--wide"
                value={exportUrl}
                onChange={(e) => setExportUrl(e.target.value)}
                placeholder="https://dl.winamax.fr/hh/…/….dat"
                disabled={!isElectron || syncState === "syncing"}
              />
              <input
                className="wa-input wa-input--wide"
                type="password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                placeholder="Mot de passe de l’email d’export"
                autoComplete="off"
                disabled={!isElectron || syncState === "syncing"}
              />
              <label className="wa-check">
                <input
                  type="checkbox"
                  checked={allowNonWinamax}
                  onChange={(e) => setAllowNonWinamax(e.target.checked)}
                />
                Autoriser un hôte hors winamax.fr (rare)
              </label>
              <button
                type="button"
                className="wa-btn wa-btn--primary"
                onClick={() => void sync()}
                disabled={
                  !isElectron ||
                  !exportUrl.trim() ||
                  !exportPassword.trim() ||
                  syncState === "syncing"
                }
              >
                {syncState === "syncing" ? "Téléchargement…" : "Télécharger & déchiffrer"}
              </button>
              <button
                type="button"
                className="wa-btn wa-btn--ghost"
                onClick={() => void unlockLocalDat()}
                disabled={!isElectron || !exportPassword.trim() || syncState === "syncing"}
              >
                Choisir un .dat local…
              </button>
              <button
                type="button"
                className="wa-btn wa-btn--ghost"
                onClick={() => void importHistoryDir()}
                disabled={!isElectron || syncState === "syncing"}
              >
                Importer un dossier .txt…
              </button>
            </div>
            {syncInfo && <p className="wa-ok">{syncInfo}</p>}
            {error && (
              <p className="wa-error" role="alert">
                {error}
              </p>
            )}
          </div>

          {pendingDat && (
            <div className="wa-panel wa-panel--dat">
              <h3 className="wa-panel__title">4 · Déchiffrer via le client Winamax</h3>
              <div className="wa-banner wa-banner--warn" role="status">
                Le déchiffrement auto a échoué (format propriétaire). Utilise le client Winamax avec
                le mot de passe email, puis reviens ici.
              </div>
              <ol className="wa-steps">
                <li>
                  Ouvre Winamax → <strong>Outils</strong> → <strong>Import des mains</strong>.
                </li>
                <li>Sélectionne le .dat (bouton ci-dessous pour l’afficher dans l’Explorateur).</li>
                <li>
                  Colle le <strong>mot de passe de l’email</strong> → Import.
                </li>
                <li>Reviens ici → « J’ai importé dans Winamax — analyser ».</li>
              </ol>
              <div className="wa-row">
                <button
                  type="button"
                  className="wa-btn wa-btn--ghost"
                  onClick={() => void copyPassword()}
                  disabled={!isElectron || !exportPassword.trim()}
                >
                  Copier le mot de passe
                </button>
                <button
                  type="button"
                  className="wa-btn wa-btn--ghost"
                  onClick={() => void revealDat()}
                  disabled={!isElectron}
                >
                  Afficher le .dat
                </button>
                <button
                  type="button"
                  className="wa-btn wa-btn--primary"
                  onClick={() => void ingestAfterImport()}
                  disabled={!isElectron || syncState === "syncing"}
                >
                  {syncState === "syncing"
                    ? "Analyse…"
                    : "J’ai importé dans Winamax — analyser"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {(unavailable.length > 0 || report.unavailable.length > 0) && (
        <div className="wa-banner wa-banner--info" role="status">
          <strong>Données non accessibles / partielles</strong>
          <ul>
            {[...new Set([...unavailable, ...report.unavailable])].map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      )}

      {dataset && (
        <>
          <div className="wa-panel">
            <h3 className="wa-panel__title">Tableau de bord · {report.hero}</h3>
            <OverviewCards report={report} />
            <h4 className="wa-subtitle">Évolution du profit</h4>
            <ProfitChart sessions={dataset.sessions} />
          </div>

          <div className="wa-panel">
            <h3 className="wa-panel__title">Résultats par limite</h3>
            {report.byLimit.length === 0 ? (
              <p className="wa-muted">Aucune limite calculable.</p>
            ) : (
              <table className="wa-table">
                <thead>
                  <tr>
                    <th>Limite</th>
                    <th>N</th>
                    <th>Investi</th>
                    <th>Profit</th>
                    <th>ROI</th>
                    <th>ITM</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byLimit.map((b) => (
                    <tr key={b.label}>
                      <td>{b.label}</td>
                      <td>{b.tournaments}</td>
                      <td>{b.invested.toFixed(0)}€</td>
                      <td className={b.profit >= 0 ? "wa-pos" : "wa-neg"}>{fmtEuro(b.profit)}</td>
                      <td>{b.roi}%</td>
                      <td>{b.itmRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="wa-panel">
            <h3 className="wa-panel__title">Rapport d’analyse</h3>
            <ul className="wa-list">
              {report.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <p className="wa-muted">
              Généré le {fmtDate(report.generatedAt)} · Place moy. {report.overview.avgPlace || "—"} ·
              Meilleur finish {report.overview.bestFinish || "—"}
            </p>
          </div>

          <div className="wa-panel">
            <h3 className="wa-panel__title">Leaks détectés</h3>
            <div className="wa-leaks">
              {report.leaks.map((l) => (
                <article
                  key={l.id}
                  className={`wa-leak wa-leak--${l.severity}${l.available ? "" : " wa-leak--na"}`}
                >
                  <header>
                    <strong>{l.title}</strong>
                    {!l.available && <span className="wa-pill">Non disponible</span>}
                  </header>
                  <p>{l.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
