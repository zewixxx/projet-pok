import { useEffect, useRef, useState } from "react";
import { Alert } from "../../../ui/Alert";
import { Card, CardHeader } from "../../../ui/Card";
import { fmtDuration, fmtInt, pluralize } from "../../../ui/format";
import { Cpu, HardDrive, Monitor, Moon, Sun, Type } from "../../../ui/icons";
import { PageHeader } from "../../../ui/PageHeader";
import { setPreferences, usePreferences, type TextSize, type ThemePreference } from "../../../ui/preferences";
import { Segmented } from "../../../ui/Segmented";
import { Switch } from "../../../ui/Switch";
import { estimateSeconds, threadsForPower, usableCores } from "../power";
import { getAiApi, type AiHardware, type AiSettings } from "../types";
import LlmModelSection from "./LlmModelSection";

const PRESETS = [20, 40, 60, 80, 100] as const;
const EXAMPLE_HANDS = 300;

function impactOf(power: number): { label: string; tone: "ok" | "mid" | "high" } {
  if (power <= 40) return { label: "Ton PC reste fluide pendant l'analyse.", tone: "ok" };
  if (power <= 80) return { label: "Un léger ralentissement est possible pendant l'analyse.", tone: "mid" };
  return { label: "Ton PC peut ralentir : l'analyse utilise presque toute sa puissance.", tone: "high" };
}

export default function AiSettingsPage() {
  const api = getAiApi();
  const prefs = usePreferences();
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [hardware, setHardware] = useState<AiHardware | null>(null);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const savedTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!api) return;
    void api.getSettings().then(setSettings);
    void api.getHardware().then(setHardware);
  }, [api]);

  useEffect(
    () => () => {
      window.clearTimeout(saveTimer.current);
      window.clearTimeout(savedTimer.current);
    },
    [],
  );

  const update = (patch: Partial<AiSettings>) => {
    if (!settings || !api) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void api.setSettings(next).then((clean) => {
        setSettings(clean);
        setSaved(true);
        window.clearTimeout(savedTimer.current);
        savedTimer.current = window.setTimeout(() => setSaved(false), 1800);
      });
    }, 250);
  };

  const cpus = hardware?.logicalCpus ?? 8;
  const power = settings?.powerPercent ?? 50;
  const threads = threadsForPower(power, cpus);
  const cores = usableCores(cpus);
  const impact = impactOf(power);
  const memUsedPct = hardware && hardware.totalMemGb > 0 ? Math.round(((hardware.totalMemGb - hardware.freeMemGb) / hardware.totalMemGb) * 100) : 0;

  return (
    <div className="page">
      <PageHeader title="IA & réglages" subtitle="Choisis la puissance de l'analyse, le modèle de langage et l'apparence de l'application." />

      {!api && (
        <Alert tone="info">
          Le réglage de la puissance et l'analyse des tournois sont disponibles dans l'application de bureau, pas dans le navigateur. Tu peux quand
          même régler l'apparence ci-dessous.
        </Alert>
      )}

      {api && (
        <Card aria-labelledby="power-title" className="settings-power">
          <CardHeader
            id="power-title"
            title="Puissance dédiée à l'analyse"
            sub="Plus elle est haute, plus un tournoi est analysé vite, mais plus le reste de ton PC peut ralentir pendant ce temps."
            actions={saved ? <span className="saved">Enregistré</span> : undefined}
          />

          <div className="power">
            <div className="power__readout">
              <output className="power__value num" htmlFor="power-slider">
                {power}
                <small>%</small>
              </output>
              <span className="power__detail">
                {threads} {pluralize(threads, "cœur", "cœurs")} de calcul sur {cores} utiles
              </span>
            </div>

            <div className="power__control">
              <input
                id="power-slider"
                type="range"
                className="slider"
                min={5}
                max={100}
                step={5}
                value={power}
                style={{ "--p": `${((power - 5) / 95) * 100}%` } as React.CSSProperties}
                disabled={!settings}
                onChange={(e) => update({ powerPercent: Number(e.target.value) })}
                aria-label="Puissance dédiée à l'analyse, en pourcentage"
              />
              <div className="power__ticks" aria-hidden>
                <span>Discret</span>
                <span>Équilibré</span>
                <span>Maximum</span>
              </div>
            </div>

            <Segmented
              label="Réglages rapides"
              value={power}
              onChange={(p) => update({ powerPercent: p })}
              disabled={!settings}
              options={PRESETS.map((p) => ({ value: p as number, label: `${p} %` }))}
            />
          </div>

          <ul className="power__facts">
            <li>
              <strong>≈ {fmtDuration(estimateSeconds(EXAMPLE_HANDS, threads))}</strong>
              <span>pour analyser un tournoi de {fmtInt(EXAMPLE_HANDS)} mains</span>
            </li>
            <li className={`power__impact power__impact--${impact.tone}`}>
              <strong>Impact sur ton PC</strong>
              <span>{impact.label}</span>
            </li>
          </ul>

          <p className="settings__note">
            Ce pourcentage est un plafond approximatif : il règle le nombre de cœurs utilisés, pas une mesure exacte de la charge du processeur.
          </p>

          <div className="settings__divider" />

          <Switch
            checked={settings?.autoAnalyze ?? true}
            disabled={!settings}
            onChange={(autoAnalyze) => update({ autoAnalyze })}
            label="Analyser automatiquement quand j'ouvre un tournoi"
            description="Sinon, tu lances l'analyse toi-même depuis la review."
          />
        </Card>
      )}

      <div className="grid-2 grid-2--even">
        {api && (
          <Card aria-labelledby="machine-title">
            <CardHeader id="machine-title" title="Ton ordinateur" sub="Ce que le moteur peut utiliser" />
            {hardware ? (
              <ul className="machine">
                <li>
                  <span className="machine__icon">
                    <Cpu size={18} aria-hidden />
                  </span>
                  <span className="machine__text">
                    <strong>{hardware.cpuModel}</strong>
                    <span>
                      {hardware.logicalCpus} threads logiques (≈ {cores} cœurs utiles)
                    </span>
                  </span>
                </li>
                <li>
                  <span className="machine__icon">
                    <HardDrive size={18} aria-hidden />
                  </span>
                  <span className="machine__text">
                    <strong>{hardware.totalMemGb.toLocaleString("fr-FR")} Go de mémoire</strong>
                    <span>{hardware.freeMemGb.toLocaleString("fr-FR")} Go libres en ce moment</span>
                    <span className="machine__bar" role="img" aria-label={`Mémoire utilisée à ${memUsedPct} %`}>
                      <span style={{ width: `${memUsedPct}%` }} />
                    </span>
                  </span>
                </li>
              </ul>
            ) : (
              <p className="muted">Lecture de la machine…</p>
            )}
          </Card>
        )}

        <Card aria-labelledby="look-title">
          <CardHeader id="look-title" title="Apparence" sub="Pour que l'application soit confortable à lire" />
          <div className="look">
            <div className="look__row">
              <span className="look__label">Thème</span>
              <Segmented<ThemePreference>
                label="Thème d'affichage"
                value={prefs.theme}
                onChange={(theme) => setPreferences({ theme })}
                options={[
                  { value: "auto", label: <><Monitor size={15} aria-hidden /> Auto</>, ariaLabel: "Automatique (suit le système)" },
                  { value: "light", label: <><Sun size={15} aria-hidden /> Clair</>, ariaLabel: "Clair" },
                  { value: "dark", label: <><Moon size={15} aria-hidden /> Sombre</>, ariaLabel: "Sombre" },
                ]}
              />
            </div>
            <div className="look__row">
              <span className="look__label">Taille du texte</span>
              <Segmented<TextSize>
                label="Taille du texte"
                value={prefs.textSize}
                onChange={(textSize) => setPreferences({ textSize })}
                options={[
                  { value: "normal", label: <><Type size={14} aria-hidden /> Normal</>, ariaLabel: "Texte normal" },
                  { value: "large", label: <><Type size={18} aria-hidden /> Grand</>, ariaLabel: "Texte grand" },
                ]}
              />
            </div>
          </div>
        </Card>
      </div>

      {api && <LlmModelSection settings={settings} onToggle={(llmEnabled) => update({ llmEnabled })} />}
    </div>
  );
}
