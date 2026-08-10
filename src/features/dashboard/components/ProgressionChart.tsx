import { useMemo, useState } from "react";
import type { SessionPoint } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProgressionChartProps {
  sessions: SessionPoint[];
}

type SerieKey = "net" | "ev" | "sd" | "nonSd";

interface SerieConfig {
  key:      SerieKey;
  label:    string;
  color:    string;
  getValue: (s: SessionPoint) => number;
}

// ── Séries ────────────────────────────────────────────────────────────────────

const SERIES: SerieConfig[] = [
  { key: "net",   label: "Net",    color: "#c0c8d8", getValue: (s) => s.cumulEuros },
  { key: "ev",    label: "EV",     color: "#f5a023", getValue: (s) => s.cumulEv    },
  { key: "sd",    label: "SD",     color: "#e05252", getValue: (s) => s.cumulSd    },
  { key: "nonSd", label: "Non-SD", color: "#29c4e0", getValue: (s) => s.cumulEuros - s.cumulSd },
];

// ── Dimensions SVG ────────────────────────────────────────────────────────────

const W   = 820;
const H   = 310;
const PAD = { top: 36, right: 30, bottom: 52, left: 82 };
const PW  = W - PAD.left - PAD.right;
const PH  = H - PAD.top  - PAD.bottom;

// ── Utilitaires ───────────────────────────────────────────────────────────────

function fmtY(n: number): string {
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toFixed(0)}k€`;
  if (Math.abs(n) >= 1_000)  return `${(n / 1000).toFixed(1)}k€`;
  return `${n >= 0 ? "+" : ""}${n}€`;
}

function fmtSessionNet(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toLocaleString("fr-FR")}€`;
}

function autoStep(range: number): number {
  if (range <=    200) return    50;
  if (range <=    500) return   100;
  if (range <=   2000) return   500;
  if (range <=   5000) return  1000;
  if (range <=  20000) return  5000;
  if (range <= 100000) return 10000;
  return 20000;
}

function buildPath(
  sessions:  SessionPoint[],
  getValue:  (s: SessionPoint) => number,
  yMin:      number,
  yMax:      number,
): string {
  return sessions
    .map((s, i) => {
      const x = PAD.left + (i / Math.max(sessions.length - 1, 1)) * PW;
      const y = PAD.top  + PH - ((getValue(s) - yMin) / (yMax - yMin)) * PH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ProgressionChart({ sessions }: ProgressionChartProps) {
  const [visible, setVisible] = useState<Record<SerieKey, boolean>>({
    net: true, ev: true, sd: true, nonSd: true,
  });
  const [hovered, setHovered] = useState<number | null>(null);

  const toggle = (key: SerieKey) =>
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Échelle Y + grille + big-win markers ──────────────────────────────────

  const { yMin, yMax, gridLines, bigWins } = useMemo(() => {
    const vals: number[] = [];
    SERIES.forEach((s) => {
      if (visible[s.key]) sessions.forEach((pt) => vals.push(s.getValue(pt)));
    });
    if (!vals.length) return { yMin: 0, yMax: 1, gridLines: [], bigWins: [] };

    const rawMin = Math.min(...vals);
    const rawMax = Math.max(...vals);
    const range  = rawMax - rawMin || 1;
    const pad    = range * 0.10;
    const yMinV  = rawMin - pad;
    const yMaxV  = rawMax + pad;

    const step  = autoStep(yMaxV - yMinV);
    const start = Math.ceil(yMinV / step) * step;
    const lines: number[] = [];
    for (let v = start; v <= yMaxV + step * 0.5; v += step) lines.push(v);

    // Marqueurs big wins (seuil = 60 % du plus gros net ou 2 000 €)
    const maxNet    = Math.max(0, ...sessions.map((s) => s.netEuros));
    const threshold = Math.max(2_000, maxNet * 0.55);
    const bw = sessions
      .map((s, i) => {
        const x  = PAD.left + (i / Math.max(sessions.length - 1, 1)) * PW;
        const cy = PAD.top  + PH - ((s.cumulEuros - yMinV) / (yMaxV - yMinV)) * PH;
        return { x, cy, net: s.netEuros, name: s.label };
      })
      .filter((_, i) => sessions[i].netEuros >= threshold);

    return { yMin: yMinV, yMax: yMaxV, gridLines: lines, bigWins: bw };
  }, [sessions, visible]);

  // ── Ticks axe X basés sur les mois ────────────────────────────────────────

  const monthTicks = useMemo(() => {
    const ticks: { x: number; label: string; isJan: boolean }[] = [];
    let prevMonth = -1;
    sessions.forEach((s, i) => {
      const d = new Date(s.date);
      const m = d.getMonth() + d.getFullYear() * 12;
      if (m !== prevMonth) {
        prevMonth = m;
        const x = PAD.left + (i / Math.max(sessions.length - 1, 1)) * PW;
        ticks.push({
          x,
          label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
          isJan: d.getMonth() === 0,
        });
      }
    });
    if (ticks.length <= 14) return ticks;
    const step = Math.ceil(ticks.length / 13);
    return ticks.filter((_, i) => i % step === 0);
  }, [sessions]);

  // ── Ligne zéro ────────────────────────────────────────────────────────────

  const zeroY    = PAD.top + PH - ((0 - yMin) / (yMax - yMin)) * PH;
  const showZero = zeroY >= PAD.top && zeroY <= PAD.top + PH;

  // ── Hover ─────────────────────────────────────────────────────────────────

  const hPt = hovered !== null ? sessions[hovered] : null;
  const hX  = hovered !== null
    ? PAD.left + (hovered / Math.max(sessions.length - 1, 1)) * PW
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="prog-chart">

      {/* Légende */}
      <div className="prog-chart__legend">
        {SERIES.map((s) => (
          <button
            key={s.key}
            className={`prog-chart__leg-btn ${visible[s.key] ? "prog-chart__leg-btn--on" : "prog-chart__leg-btn--off"}`}
            onClick={() => toggle(s.key)}
            style={{ "--serie-color": s.color } as React.CSSProperties}
          >
            <span className="prog-chart__leg-swatch" />
            <span className="prog-chart__leg-label">{s.label}</span>
          </button>
        ))}
        <span className="prog-chart__count">{sessions.length} sessions</span>
      </div>

      {/* SVG */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="prog-chart__svg"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {SERIES.map((s) => (
            <filter key={s.key} id={`glow-${s.key}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* Fond zone graphe */}
        <rect
          x={PAD.left} y={PAD.top} width={PW} height={PH}
          fill="#060d1a" fillOpacity="0.6" rx="2"
        />

        {/* Grille horizontale + labels Y */}
        {gridLines.map((v) => {
          const gy = PAD.top + PH - ((v - yMin) / (yMax - yMin)) * PH;
          if (gy < PAD.top - 2 || gy > PAD.top + PH + 2) return null;
          const isZeroLine = v === 0;
          return (
            <g key={v}>
              <line
                x1={PAD.left} y1={gy} x2={W - PAD.right} y2={gy}
                stroke={isZeroLine ? "#2a4a8a" : "#1a2840"}
                strokeWidth={isZeroLine ? "1.5" : "1"}
                strokeDasharray={isZeroLine ? "8 3" : "4 4"}
              />
              <text
                x={PAD.left - 8} y={gy + 4}
                textAnchor="end" fontSize="10"
                fill={isZeroLine ? "#6a9ae0" : "#5a7090"}
                fontWeight={isZeroLine ? "600" : "400"}
              >
                {fmtY(v)}
              </text>
            </g>
          );
        })}

        {/* Ligne zéro proéminente si non incluse dans gridLines */}
        {showZero && !gridLines.includes(0) && (
          <line
            x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY}
            stroke="#2a4a8a" strokeWidth="1.5" strokeDasharray="8 3"
          />
        )}

        {/* Ticks axe X — mois */}
        {monthTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x} y1={PAD.top} x2={t.x} y2={PAD.top + PH}
              stroke={t.isJan ? "#2a3a5a" : "#141e30"}
              strokeWidth={t.isJan ? "1.5" : "1"}
            />
            <text
              x={t.x} y={H - 8}
              textAnchor="middle" fontSize="10"
              fill={t.isJan ? "#9ab0d8" : "#6a80a8"}
              fontWeight={t.isJan ? "600" : "400"}
            >
              {t.label}
            </text>
            {/* petit tick vertical */}
            <line
              x1={t.x} y1={PAD.top + PH} x2={t.x} y2={PAD.top + PH + 4}
              stroke="#3a5080" strokeWidth="1"
            />
          </g>
        ))}

        {/* Marqueurs big wins */}
        {bigWins.map((bw, i) => (
          <g key={i}>
            <line
              x1={bw.x} y1={PAD.top} x2={bw.x} y2={PAD.top + PH}
              stroke="#f5a023" strokeWidth="1.5" strokeDasharray="5 3" strokeOpacity="0.55"
            />
            <polygon
              points={`${bw.x},${bw.cy - 3} ${bw.x - 5},${bw.cy - 12} ${bw.x + 5},${bw.cy - 12}`}
              fill="#f5a023" fillOpacity="0.8"
            />
            <text
              x={bw.x} y={PAD.top - 10}
              textAnchor="middle" fontSize="9.5" fill="#f5a023" fontWeight="700"
            >
              🏆 {fmtY(bw.net)}
            </text>
          </g>
        ))}

        {/* Courbes (ordre inversé : non-sd en dessous, net au-dessus) */}
        {[...SERIES].reverse().map((s) => {
          if (!visible[s.key]) return null;
          return (
            <path
              key={s.key}
              d={buildPath(sessions, s.getValue, yMin, yMax)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.key === "net" ? 2.5 : 1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={
                s.key === "ev"    ? "7 3" :
                s.key === "nonSd" ? "3 3" : undefined
              }
              filter={`url(#glow-${s.key})`}
              opacity={s.key === "net" ? 1 : 0.80}
            />
          );
        })}

        {/* Zones de capture hover */}
        {sessions.map((_, i) => (
          <rect
            key={i}
            x={PAD.left + (i / Math.max(sessions.length - 1, 1)) * PW - PW / (2 * sessions.length)}
            y={PAD.top}
            width={PW / sessions.length}
            height={PH}
            fill="transparent"
            style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHovered(i)}
          />
        ))}

        {/* Indicateurs hover */}
        {hPt && (
          <g>
            <line
              x1={hX} y1={PAD.top} x2={hX} y2={PAD.top + PH}
              stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.25"
            />
            {SERIES.map((s) => {
              if (!visible[s.key]) return null;
              const val = s.getValue(hPt);
              const cy  = PAD.top + PH - ((val - yMin) / (yMax - yMin)) * PH;
              return (
                <g key={s.key}>
                  <circle cx={hX} cy={cy} r="4" fill={s.color} stroke="#060d1a" strokeWidth="2" />
                  <circle cx={hX} cy={cy} r="8" fill="none" stroke={s.color} strokeWidth="1" strokeOpacity="0.35" />
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Tooltip HTML */}
      {hPt && (
        <div
          className="prog-chart__tooltip"
          style={{ left: `calc(${((hX - PAD.left) / PW) * 100}% + ${PAD.left}px)` }}
        >
          <div className="prog-chart__tt-date">
            {new Date(hPt.date).toLocaleDateString("fr-FR", {
              weekday: "short", day: "numeric", month: "long", year: "numeric",
            })}
          </div>
          <div className="prog-chart__tt-name">{hPt.label}</div>
          <div
            className="prog-chart__tt-session-net"
            style={{ color: hPt.netEuros >= 0 ? "#4cde80" : "#e05252" }}
          >
            Session : {fmtSessionNet(hPt.netEuros)}
          </div>
          {SERIES.map((s) => {
            if (!visible[s.key]) return null;
            const val = s.getValue(hPt);
            return (
              <div key={s.key} className="prog-chart__tt-row" style={{ color: s.color }}>
                <span className="prog-chart__tt-serie">{s.label}</span>
                <span className="prog-chart__tt-val">
                  {val >= 0 ? "+" : ""}{val.toLocaleString("fr-FR")}€
                </span>
              </div>
            );
          })}
          <div className="prog-chart__tt-place">
            #{hPt.place.toLocaleString("fr-FR")} / {hPt.total.toLocaleString("fr-FR")} joueurs
            &nbsp;·&nbsp; {hPt.hands} mains
          </div>
        </div>
      )}
    </div>
  );
}
