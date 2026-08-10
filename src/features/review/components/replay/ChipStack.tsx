import type { CSSProperties } from "react";

/**
 * Jeton poker procédural (SVG) — pas d’image bitmap.
 * Stack 3D, reflet animé, toss au spawn.
 */

type ChipTone = "cream" | "red" | "blue" | "black" | "gold";

interface ChipStackProps {
  amountBb: number;
  /** Variante pot (plus compacte / or) */
  variant?: "bet" | "pot";
  className?: string;
}

function toneForAmount(amountBb: number): ChipTone {
  if (amountBb >= 50) return "black";
  if (amountBb >= 20) return "gold";
  if (amountBb >= 8) return "blue";
  if (amountBb >= 3) return "red";
  return "cream";
}

function stackCount(amountBb: number, variant: "bet" | "pot"): number {
  const max = variant === "pot" ? 4 : 5;
  if (amountBb <= 0) return 1;
  if (amountBb < 2) return 1;
  if (amountBb < 5) return 2;
  if (amountBb < 12) return 3;
  if (amountBb < 30) return Math.min(4, max);
  return max;
}

const TONE: Record<
  ChipTone,
  { rim: string; face: string; face2: string; accent: string; ink: string }
> = {
  cream: {
    rim: "#d6d3d1",
    face: "#fafaf9",
    face2: "#e7e5e4",
    accent: "#a8a29e",
    ink: "#44403c",
  },
  red: {
    rim: "#9f1239",
    face: "#e11d48",
    face2: "#be123c",
    accent: "#fecdd3",
    ink: "#fff1f2",
  },
  blue: {
    rim: "#1e3a8a",
    face: "#2563eb",
    face2: "#1d4ed8",
    accent: "#bfdbfe",
    ink: "#eff6ff",
  },
  black: {
    rim: "#0f172a",
    face: "#1e293b",
    face2: "#0f172a",
    accent: "#fbbf24",
    ink: "#fef3c7",
  },
  gold: {
    rim: "#a16207",
    face: "#eab308",
    face2: "#ca8a04",
    accent: "#fef9c3",
    ink: "#422006",
  },
};

function PokerChipSvg({
  tone,
  index,
}: {
  tone: ChipTone;
  index: number;
}) {
  const c = TONE[tone];
  const uid = `chip-${tone}-${index}`;

  return (
    <svg
      className="pro-chip__svg"
      viewBox="0 0 64 64"
      width="28"
      height="28"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${uid}-face`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor={c.face} />
          <stop offset="55%" stopColor={c.face2} />
          <stop offset="100%" stopColor={c.rim} />
        </radialGradient>
        <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Ombre portée locale */}
      <ellipse cx="32" cy="58" rx="18" ry="3.5" fill="rgba(0,0,0,0.28)" />

      {/* Corps */}
      <g filter={`url(#${uid}-soft)`}>
        <circle cx="32" cy="32" r="29" fill={c.rim} />
        <circle cx="32" cy="32" r="25.5" fill={`url(#${uid}-face)`} />

        {/* Motifs périphériques type jeton casino */}
        <circle
          cx="32"
          cy="32"
          r="22.5"
          fill="none"
          stroke={c.accent}
          strokeWidth="3.2"
          strokeDasharray="4.2 5.4"
          strokeLinecap="round"
          opacity="0.9"
        />
        <circle
          cx="32"
          cy="32"
          r="17"
          fill="none"
          stroke={c.accent}
          strokeWidth="1.4"
          opacity="0.55"
        />

        {/* Centre */}
        <circle cx="32" cy="32" r="11" fill={c.rim} opacity="0.35" />
        <circle cx="32" cy="32" r="9" fill={`url(#${uid}-face)`} />
        <circle
          cx="32"
          cy="32"
          r="9"
          fill="none"
          stroke={c.accent}
          strokeWidth="1.1"
          opacity="0.7"
        />

        {/* Reflet dynamique */}
        <g className="pro-chip__shine">
          <ellipse
            cx="24"
            cy="22"
            rx="10"
            ry="6"
            fill={`url(#${uid}-shine)`}
            transform="rotate(-28 24 22)"
          />
        </g>
      </g>
    </svg>
  );
}

export function ChipStack({ amountBb, variant = "bet", className = "" }: ChipStackProps) {
  const tone = variant === "pot" ? "gold" : toneForAmount(amountBb);
  const n = stackCount(amountBb, variant);
  const chips = Array.from({ length: n }, (_, i) => i);

  return (
    <div
      className={["pro-chip", `pro-chip--${variant}`, `pro-chip--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${amountBb.toFixed(1)} bb`}
    >
      <div className="pro-chip__pile" aria-hidden>
        {chips.map((i) => (
          <span
            key={i}
            className="pro-chip__unit"
            style={
              {
                ["--i"]: i,
                ["--n"]: n,
                ["--rot"]: `${(i - (n - 1) / 2) * 7}deg`,
                animationDelay: `${i * 45}ms`,
              } as CSSProperties
            }
          >
            <PokerChipSvg tone={tone} index={i} />
          </span>
        ))}
        <span className="pro-chip__spark" />
      </div>
      <span className="pro-chip__amt">
        {amountBb.toFixed(1)}
        <span className="pro-chip__unit-label">bb</span>
      </span>
    </div>
  );
}
