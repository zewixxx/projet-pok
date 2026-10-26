import { useState, type CSSProperties, type ReactNode } from "react";
import { Alert } from "../../../ui/Alert";
import { Badge } from "../../../ui/Badge";
import { Button } from "../../../ui/Button";
import { Card, CardHeader } from "../../../ui/Card";
import { cx } from "../../../ui/cx";
import { EmptyState } from "../../../ui/EmptyState";
import { fmtDateTime, fmtInt, pluralize } from "../../../ui/format";
import { ChevronDown, Download, ExternalLink, FolderOpen, Lock, Play, RefreshCw, ScanSearch } from "../../../ui/icons";
import { PageHeader } from "../../../ui/PageHeader";
import { useWinamaxAnalyzer } from "../hooks/useWinamaxAnalyzer";
import type { FoundHistorySource } from "../types";

interface ImportPageProps {
  /** Appelé quand de nouvelles données sont importées. */
  onDataChanged: () => void;
  onOpenReview: () => void;
}

function hueOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

function SourceRow({ source }: { source: FoundHistorySource }) {
  const encrypted = source.kind === "dat";
  return (
    <li className="source">
      <span className="source__logo" style={{ "--hue": hueOf(source.room) } as CSSProperties} aria-hidden>
        {source.room.slice(0, 1).toUpperCase()}
      </span>
      <span className="source__main">
        <span className="source__name">
          {source.room}
          {source.account && <span className="source__account"> · {source.account}</span>}
        </span>
        <span className="source__path truncate" title={source.dir}>
          {source.dir}
        </span>
        {encrypted && (
          <span className="source__hint">
            <Lock size={12} aria-hidden /> Fichier chiffré : il faut le mot de passe reçu par email (options avancées).
          </span>
        )}
      </span>
      <span className="source__side">
        <strong className="num">{fmtInt(source.fileCount)}</strong>
        <span>{pluralize(source.fileCount, "fichier", "fichiers")}</span>
        <Badge tone={encrypted ? "warn" : "pos"}>{encrypted ? "Chiffré" : "Prêt"}</Badge>
      </span>
    </li>
  );
}

function SourcesSkeleton() {
  return (
    <ul className="sources" aria-busy="true" aria-label="Recherche en cours">
      {[0, 1].map((i) => (
        <li key={i} className="source">
          <span className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <span className="source__main" style={{ gap: 8 }}>
            <span className="skeleton" style={{ width: "40%", height: 14 }} />
            <span className="skeleton" style={{ width: "75%", height: 12 }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function AdvancedSection({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="advanced">
      <button type="button" className="advanced__toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>
          <strong>Options avancées</strong>
          <span className="advanced__sub">Export par email Winamax (fichier .dat chiffré)</span>
        </span>
        <ChevronDown size={18} aria-hidden className={cx("advanced__chev", open && "is-open")} />
      </button>
      {open && <div className="advanced__body">{children}</div>}
    </section>
  );
}

export default function ImportPage({ onDataChanged, onOpenReview }: ImportPageProps) {
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
    foundHistories,
    scanState,
    scanError,
    connect,
    disconnect,
    sync,
    unlockLocalDat,
    importHistoryDir,
    scanHistories,
    importScanned,
    copyPassword,
    revealDat,
    ingestAfterImport,
    openWinamaxHelp,
  } = useWinamaxAnalyzer({ onDatasetChanged: onDataChanged });

  if (loading) {
    return (
      <div className="page" aria-busy="true">
        <div className="skeleton" style={{ height: 44, width: 320 }} />
        <div className="skeleton" style={{ height: 260 }} />
      </div>
    );
  }

  if (!isElectron) {
    return (
      <div className="page">
        <PageHeader title="Importer mes mains" subtitle="On cherche automatiquement tes historiques de mains sur ce PC. Rien ne quitte ton ordinateur." />
        <Card>
          <EmptyState icon={<Download size={26} />} title="L'import se fait dans l'application de bureau">
            La recherche automatique de tes historiques a besoin d'accéder à ton ordinateur, ce qui n'est pas possible dans un navigateur. Lance
            l'application de bureau pour importer tes mains.
          </EmptyState>
        </Card>
      </div>
    );
  }

  const importable = (foundHistories ?? []).filter((s) => s.kind === "txt" && s.fileCount > 0);
  const importableFiles = importable.reduce((sum, s) => sum + s.fileCount, 0);
  const scanning = scanState === "syncing";
  const importing = syncState === "syncing";
  const stats = dataset?.stats;
  const hasData = Boolean(dataset && (dataset.tournaments?.length ?? 0) > 0);

  return (
    <div className="page">
      <PageHeader
        title="Importer mes mains"
        subtitle="On cherche automatiquement tes historiques de mains sur ce PC (Winamax, PokerStars, Unibet…). Rien ne quitte ton ordinateur."
        actions={
          <Button variant="secondary" icon={<RefreshCw size={16} aria-hidden />} loading={scanning} disabled={!isElectron || importing} onClick={() => void scanHistories()}>
            Chercher à nouveau
          </Button>
        }
      />

      <Card aria-labelledby="found-title">
        <CardHeader
          id="found-title"
          title="Historiques trouvés sur ton PC"
          sub="Les dossiers habituels sont vérifiés : Documents, AppData, Bureau et Téléchargements. Le disque entier n'est pas parcouru."
        />

        {scanning && !foundHistories ? (
          <SourcesSkeleton />
        ) : foundHistories && foundHistories.length > 0 ? (
          <ul className="sources">
            {foundHistories.map((s) => (
              <SourceRow key={`${s.kind}-${s.dir}`} source={s} />
            ))}
          </ul>
        ) : scanState === "done" || scanState === "error" ? (
          <div className="none-found">
            <ScanSearch size={22} aria-hidden />
            <div>
              <strong>Aucun historique trouvé automatiquement</strong>
              <p>
                Ouvre ton client de poker au moins une fois pour qu'il enregistre tes mains, puis relance la recherche. Tu peux aussi
                choisir toi-même le dossier, ou passer par l'export email Winamax (options avancées).
              </p>
            </div>
          </div>
        ) : null}

        {scanError && <Alert tone="neg">{scanError}</Alert>}

        <div className="import-actions">
          <Button
            variant="primary"
            size="lg"
            icon={<Download size={18} aria-hidden />}
            loading={importing}
            disabled={!isElectron || importing || importable.length === 0}
            onClick={() => void importScanned()}
          >
            {importable.length > 0 ? `Importer ${fmtInt(importableFiles)} ${pluralize(importableFiles, "fichier", "fichiers")}` : "Importer"}
          </Button>
          <Button variant="secondary" size="lg" icon={<FolderOpen size={18} aria-hidden />} disabled={!isElectron || importing} onClick={() => void importHistoryDir()}>
            Choisir un dossier…
          </Button>
        </div>
      </Card>

      {syncInfo && syncState !== "error" && (
        <Alert
          tone="pos"
          action={
            hasData ? (
              <Button variant="primary" size="sm" icon={<Play size={14} aria-hidden />} onClick={onOpenReview}>
                Voir mes tournois
              </Button>
            ) : undefined
          }
        >
          <strong>Import terminé.</strong> {syncInfo}
        </Alert>
      )}
      {error && <Alert tone="neg">{error}</Alert>}
      {unavailable.length > 0 && (
        <Alert tone="info">
          <strong>Informations partielles</strong>
          <ul className="alert-list">
            {unavailable.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </Alert>
      )}

      {hasData && (
        <Card aria-labelledby="current-title">
          <CardHeader id="current-title" title="Données actuellement importées" sub={lastSyncAt ? `Dernier import : ${fmtDateTime(lastSyncAt)}` : undefined} />
          <dl className="import-stats">
            <div>
              <dt>Tournois</dt>
              <dd className="num">{fmtInt(dataset?.tournaments.length ?? stats?.tournamentsTotal ?? 0)}</dd>
            </div>
            <div>
              <dt>Mains</dt>
              <dd className="num">{fmtInt(dataset?.tournaments.reduce((sum, t) => sum + t.handsCount, 0) ?? stats?.handsTotal ?? 0)}</dd>
            </div>
            <div>
              <dt>Joueur</dt>
              <dd>{dataset?.hero || stats?.hero || "—"}</dd>
            </div>
          </dl>
          <div className="import-actions">
            <Button variant="primary" icon={<Play size={16} aria-hidden />} onClick={onOpenReview}>
              Aller à la review
            </Button>
          </div>
        </Card>
      )}

      <AdvancedSection>
        {!connectedPseudo ? (
          <div className="adv-step">
            <h3 className="adv-step__title">
              <span className="adv-step__num">1</span> Indique ton pseudo Winamax
            </h3>
            <p className="adv-step__text">
              Seulement le <strong>pseudo</strong> (jamais le mot de passe du compte). Le mot de passe de l'email d'export ne sert qu'à
              déchiffrer le fichier.
            </p>
            <div className="adv-row">
              <input
                className="input"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Pseudo Winamax"
                autoComplete="username"
                aria-label="Pseudo Winamax"
              />
              <Button variant="primary" disabled={!pseudo.trim() || !isElectron} onClick={() => void connect()}>
                Valider
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="adv-profile">
              <span>
                Joueur : <strong>{connectedPseudo}</strong>
              </span>
              <Button variant="ghost" size="sm" onClick={() => void disconnect()}>
                Changer de joueur
              </Button>
            </div>

            <div className="adv-step">
              <h3 className="adv-step__title">
                <span className="adv-step__num">1</span> Demande l'export chez Winamax
              </h3>
              <ol className="adv-list">
                <li>
                  Compte Winamax → <strong>Historique de mains</strong>.
                </li>
                <li>Choisis les dates et le type (Tournoi / SNG / Cash).</li>
                <li>
                  Winamax t'envoie un email avec un lien <code>dl.winamax.fr/…/*.dat</code> et un mot de passe.
                </li>
              </ol>
              <Button variant="secondary" size="sm" icon={<ExternalLink size={14} aria-hidden />} onClick={() => void openWinamaxHelp()}>
                Ouvrir mon compte Winamax
              </Button>
            </div>

            <div className="adv-step">
              <h3 className="adv-step__title">
                <span className="adv-step__num">2</span> Télécharge et déchiffre le fichier
              </h3>
              {lastSyncAt && <p className="adv-step__text">Dernière synchronisation : {fmtDateTime(lastSyncAt)}</p>}
              <div className="adv-fields">
                <label className="field">
                  <span className="field__label">Lien reçu par email</span>
                  <input
                    className="input"
                    value={exportUrl}
                    onChange={(e) => setExportUrl(e.target.value)}
                    placeholder="https://dl.winamax.fr/hh/…/….dat"
                    disabled={!isElectron || importing}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Mot de passe de l'email d'export</span>
                  <input
                    className="input"
                    type="password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    placeholder="Ce n'est pas le mot de passe de ton compte"
                    autoComplete="off"
                    disabled={!isElectron || importing}
                  />
                </label>
                <label className="check">
                  <input type="checkbox" checked={allowNonWinamax} onChange={(e) => setAllowNonWinamax(e.target.checked)} />
                  Autoriser un lien hors winamax.fr (rare)
                </label>
              </div>
              <div className="adv-row adv-row--wrap">
                <Button
                  variant="primary"
                  loading={importing}
                  disabled={!isElectron || !exportUrl.trim() || !exportPassword.trim() || importing}
                  onClick={() => void sync()}
                >
                  Télécharger et déchiffrer
                </Button>
                <Button variant="secondary" disabled={!isElectron || !exportPassword.trim() || importing} onClick={() => void unlockLocalDat()}>
                  Choisir un .dat déjà téléchargé…
                </Button>
              </div>
            </div>

            {pendingDat && (
              <div className="adv-step">
                <h3 className="adv-step__title">
                  <span className="adv-step__num">3</span> Terminer avec le client Winamax
                </h3>
                <Alert tone="warn">Le déchiffrement automatique n'a pas fonctionné (format propriétaire). Passe par le client Winamax, puis reviens ici.</Alert>
                <ol className="adv-list">
                  <li>
                    Ouvre Winamax → <strong>Outils</strong> → <strong>Import des mains</strong>.
                  </li>
                  <li>Sélectionne le fichier .dat (le bouton ci-dessous l'affiche dans l'Explorateur).</li>
                  <li>
                    Colle le <strong>mot de passe de l'email</strong>, puis lance l'import.
                  </li>
                  <li>Reviens ici et clique sur « J'ai importé dans Winamax ».</li>
                </ol>
                <div className="adv-row adv-row--wrap">
                  <Button variant="secondary" disabled={!isElectron || !exportPassword.trim()} onClick={() => void copyPassword()}>
                    Copier le mot de passe
                  </Button>
                  <Button variant="secondary" disabled={!isElectron} onClick={() => void revealDat()}>
                    Afficher le fichier .dat
                  </Button>
                  <Button variant="primary" loading={importing} disabled={!isElectron || importing} onClick={() => void ingestAfterImport()}>
                    J'ai importé dans Winamax
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </AdvancedSection>
    </div>
  );
}
