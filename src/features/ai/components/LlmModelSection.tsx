import { useCallback, useEffect, useState } from "react";
import { Alert } from "../../../ui/Alert";
import { Badge } from "../../../ui/Badge";
import { Button } from "../../../ui/Button";
import { Card, CardHeader } from "../../../ui/Card";
import { Download, Lock, Sparkles } from "../../../ui/icons";
import { ProgressBar } from "../../../ui/ProgressBar";
import { Switch } from "../../../ui/Switch";
import { getAiApi, type AiSettings, type LlmStatus } from "../types";

interface LlmModelSectionProps {
  settings: AiSettings | null;
  onToggle: (enabled: boolean) => void;
}

function formatSize(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1).replace(".", ",")} Go` : `${mb} Mo`;
}

export default function LlmModelSection({ settings, onToggle }: LlmModelSectionProps) {
  const api = getAiApi();
  const [status, setStatus] = useState<LlmStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (api) void api.llmStatus().then(setStatus);
  }, [api]);

  useEffect(() => {
    if (!api) return;
    refresh();
    const offProgress = api.onLlmProgress((p) =>
      setStatus((s) => (s ? { ...s, downloading: { id: p.id, receivedBytes: p.receivedBytes, totalBytes: p.totalBytes } } : s)),
    );
    const offDone = api.onLlmDone(() => {
      setError(null);
      refresh();
    });
    const offError = api.onLlmError((p) => {
      setError(p.cancelled ? null : p.error);
      refresh();
    });
    return () => {
      offProgress();
      offDone();
      offError();
    };
  }, [api, refresh]);

  if (!api || !status) return null;

  const { recommended, installed, downloading } = status;
  const pct = downloading && downloading.totalBytes > 0 ? Math.round((downloading.receivedBytes / downloading.totalBytes) * 100) : 0;

  return (
    <Card aria-labelledby="llm-title">
      <CardHeader
        id="llm-title"
        title="Modèle de langage local"
        sub="Facultatif : reformule les conseils en phrases plus naturelles"
        actions={
          installed ? (
            <Badge tone="pos">Installé</Badge>
          ) : (
            <Badge>Non installé</Badge>
          )
        }
      />

      <div className="llm">
        <p className="llm__lead">
          Les calculs (équité, ranges, EV, fuites) sont faits par le moteur et fonctionnent <strong>sans ce modèle</strong>. Il ne sert qu'à
          reformuler en français les conseils des plus grosses erreurs.
        </p>
        <p className="llm__privacy">
          <Lock size={14} aria-hidden /> Il tourne sur ton PC : tes mains ne sont jamais envoyées à l'extérieur.
        </p>

        <div className="llm__model">
          <span className="llm__icon">
            <Sparkles size={20} aria-hidden />
          </span>
          <div className="llm__model-text">
            <strong>{installed ? installed.label : recommended.label}</strong>
            <span>
              {installed
                ? "Modèle installé sur ce PC"
                : `Choisi pour ta machine (${status.totalMemGb.toFixed(1).replace(".", ",")} Go de mémoire) · ${formatSize(recommended.sizeMb)}`}
            </span>
          </div>

          {downloading ? (
            <Button variant="secondary" onClick={() => void api.llmCancelDownload()}>
              Annuler
            </Button>
          ) : installed ? (
            <Button
              variant="danger"
              onClick={() => {
                void api.llmRemove().then(refresh);
                onToggle(false);
              }}
            >
              Supprimer
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<Download size={16} aria-hidden />}
              onClick={() => {
                setError(null);
                void api.llmDownload().then((r) => {
                  if (!r.ok) setError(r.error ?? "Téléchargement impossible.");
                  refresh();
                });
              }}
            >
              Télécharger ({formatSize(recommended.sizeMb)})
            </Button>
          )}
        </div>

        {downloading && (
          <div className="llm__progress">
            <ProgressBar value={pct} active label="Téléchargement du modèle" />
            <p className="llm__progress-text num">
              {Math.round(downloading.receivedBytes / 1048576)} / {Math.round(downloading.totalBytes / 1048576)} Mo · {pct} %
            </p>
          </div>
        )}

        {installed && !downloading && (
          <Switch
            checked={settings?.llmEnabled ?? false}
            disabled={!settings}
            onChange={onToggle}
            label="Reformuler les conseils avec le modèle pendant l'analyse"
            description="L'analyse prend quelques minutes de plus selon la taille du tournoi."
          />
        )}

        {!installed && !downloading && <p className="llm__note">Rien n'est téléchargé tant que tu ne cliques pas sur le bouton.</p>}

        {error && <Alert tone="neg">{error}</Alert>}
      </div>
    </Card>
  );
}
