import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { cx } from "../../../ui/cx";
import { fmtDate, fmtEuros } from "../../../ui/format";
import { useElementSize } from "../../../ui/useElementSize";
import type { SessionPoint } from "../types";

interface ProgressionChartProps {
  sessions: SessionPoint[];
  /** Hauteur du graphique en pixels. */
  height?: number;
}

const PAD = { top: 18, right: 18, bottom: 30, left: 62 };

type Pt = readonly [number, number];

/** Courbe lissée sans dépassement (interpolation monotone). */
function monotonePath(pts: Pt[]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0]} ${pts[0][1]}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / (dx[i] || 1));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  }
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      t[i] = (3 * a * m[i]) / h;
      t[i + 1] = (3 * b * m[i]) / h;
    }
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = pts[i][0] + dx[i] / 3;
    const y1 = pts[i][1] + (t[i] * dx[i]) / 3;
    const x2 = pts[i + 1][0] - dx[i] / 3;
    const y2 = pts[i + 1][1] - (t[i + 1] * dx[i]) / 3;
    d += ` C${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} ${pts[i + 1][0].toFixed(1)} ${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

/** Graduations « rondes » (1, 2, 5 × 10ⁿ). */
function niceTicks(min: number, max: number, target = 5): number[] {
  const span = max - min || 1;
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

function compactEuros(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) return `${n < 0 ? "\u2212" : ""}${(abs / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}\u00a0k€`;
  return fmtEuros(n, { digits: 0 });
}

export function ProgressionChart({ sessions, height = 290 }: ProgressionChartProps) {
  const [wrapRef, { width }] = useElementSize<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);
  const [showEv, setShowEv] = useState(true);
  const uid = useId();

  const hasEv = useMemo(() => sessions.some((s) => Math.abs(s.cumulEv - s.cumulEuros) > 0.01), [sessions]);
  const W = Math.max(width, 320);
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const geometry = useMemo(() => {
    if (sessions.length === 0) return null;
    const values = [0, ...sessions.map((s) => s.cumulEuros)];
    if (hasEv && showEv) values.push(...sessions.map((s) => s.cumulEv));
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const pad = (rawMax - rawMin || 1) * 0.12;
    const min = rawMin - (rawMin < 0 ? pad : 0);
    const max = rawMax + pad;
    const x = (i: number) => PAD.left + (sessions.length === 1 ? innerW / 2 : (i / (sessions.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min || 1)) * innerH;
    const net: Pt[] = sessions.map((s, i) => [x(i), y(s.cumulEuros)]);
    const ev: Pt[] = sessions.map((s, i) => [x(i), y(s.cumulEv)]);
    const ticks = niceTicks(min, max, Math.max(3, Math.round(innerH / 56)));

    const monthTicks: Array<{ x: number; label: string }> = [];
    let prev = -1;
    sessions.forEach((s, i) => {
      const d = new Date(s.date);
      const key = d.getFullYear() * 12 + d.getMonth();
      if (key !== prev) {
        prev = key;
        monthTicks.push({ x: x(i), label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }).replace(".", "") });
      }
    });
    const maxLabels = Math.max(2, Math.floor(innerW / 78));
    const stride = Math.ceil(monthTicks.length / maxLabels);
    return {
      net,
      ev,
      ticks,
      y,
      x,
      zeroY: y(0),
      baseY: PAD.top + innerH,
      months: monthTicks.filter((_, i) => i % stride === 0),
    };
  }, [sessions, hasEv, showEv, innerW, innerH]);

  if (!geometry) {
    return <div className="chart chart--empty">Pas encore de tournoi sur cette période.</div>;
  }

  const last = sessions[sessions.length - 1];
  const positive = last.cumulEuros >= 0;
  const tone = positive ? "var(--pos)" : "var(--neg)";
  const linePath = monotonePath(geometry.net);
  const areaPath = `${linePath} L${geometry.net[geometry.net.length - 1][0].toFixed(1)} ${geometry.baseY} L${geometry.net[0][0].toFixed(1)} ${geometry.baseY} Z`;

  const move = (clientX: number, rect: DOMRect) => {
    if (sessions.length === 1) return setHovered(0);
    const rel = (clientX - rect.left - PAD.left) / innerW;
    const idx = Math.round(Math.max(0, Math.min(1, rel)) * (sessions.length - 1));
    setHovered(idx);
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setHovered((h) => Math.min((h ?? -1) + 1, sessions.length - 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setHovered((h) => Math.max((h ?? sessions.length) - 1, 0));
    } else if (e.key === "Escape") {
      setHovered(null);
    }
  };

  const hp = hovered != null ? sessions[hovered] : null;
  const hx = hovered != null ? geometry.net[hovered][0] : 0;
  const tooltipLeft = Math.min(Math.max(hx, 120), W - 120);

  return (
    <div className="chart">
      {hasEv && (
        <div className="chart__legend">
          <span className="chart__key">
            <i style={{ background: tone }} /> Résultat réel
          </span>
          <button
            type="button"
            className={cx("chart__key", "chart__key--toggle", !showEv && "is-off")}
            aria-pressed={showEv}
            onClick={() => setShowEv((v) => !v)}
          >
            <i className="chart__key-dash" /> Résultat ajusté (EV)
          </button>
        </div>
      )}

      <div className="chart__wrap" ref={wrapRef} style={{ height }}>
        <svg
          width={W}
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          role="img"
          tabIndex={0}
          aria-label={`Courbe de résultat cumulé sur ${sessions.length} tournois, de ${fmtEuros(0)} à ${fmtEuros(last.cumulEuros)}. Utilise les flèches pour parcourir les tournois.`}
          onMouseMove={(e) => move(e.clientX, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setHovered(null)}
          onKeyDown={onKey}
          onBlur={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tone} stopOpacity="0.28" />
              <stop offset="100%" stopColor={tone} stopOpacity="0" />
            </linearGradient>
          </defs>

          {geometry.ticks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={geometry.y(v)}
                y2={geometry.y(v)}
                className={cx("chart__grid", v === 0 && "chart__grid--zero")}
              />
              <text x={PAD.left - 10} y={geometry.y(v) + 4} textAnchor="end" className="chart__tick">
                {compactEuros(v)}
              </text>
            </g>
          ))}

          {geometry.months.map((m) => (
            <text key={m.x} x={m.x} y={height - 8} textAnchor="middle" className="chart__tick">
              {m.label}
            </text>
          ))}

          <path d={areaPath} fill={`url(#${uid}-area)`} />
          {hasEv && showEv && <path d={monotonePath(geometry.ev)} className="chart__line chart__line--ev" />}
          <path d={linePath} className="chart__line" style={{ stroke: tone }} />

          {sessions.length <= 40 &&
            geometry.net.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r={2.6} className="chart__dot" style={{ fill: tone }} />
            ))}

          {hp && (
            <g>
              <line x1={hx} x2={hx} y1={PAD.top} y2={geometry.baseY} className="chart__guide" />
              <circle cx={hx} cy={geometry.net[hovered!][1]} r={6} className="chart__halo" style={{ fill: tone }} />
              <circle cx={hx} cy={geometry.net[hovered!][1]} r={3.5} className="chart__point" />
            </g>
          )}
        </svg>

        {hp && (
          <div className="chart__tooltip" style={{ left: tooltipLeft }} role="status">
            <span className="chart__tt-date">{fmtDate(hp.date)}</span>
            <strong className="chart__tt-name">{hp.label}</strong>
            <span className={cx("chart__tt-net", "num", hp.netEuros >= 0 ? "pos" : "neg")}>
              {fmtEuros(hp.netEuros, { sign: true })} <small>sur ce tournoi</small>
            </span>
            <span className="chart__tt-row">
              Cumul <b className="num">{fmtEuros(hp.cumulEuros, { sign: true })}</b>
            </span>
            {hp.place > 0 && (
              <span className="chart__tt-row">
                Place <b className="num">{hp.place.toLocaleString("fr-FR")}</b> / {hp.total.toLocaleString("fr-FR")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
