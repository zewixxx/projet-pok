import { useId } from "react";

/** Logo de l'application : deux cartes sur un carré dégradé. */
export function Logo({ size = 36 }: { size?: number }) {
  const gid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c86ff" />
          <stop offset="1" stopColor="#8b4fe8" />
        </linearGradient>
        <linearGradient id={`${gid}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gid}-bg)`} />
      <rect width="40" height="40" rx="11" fill={`url(#${gid}-sheen)`} />
      <g transform="rotate(-13 17 21)">
        <rect x="8.5" y="9" width="15" height="21" rx="3" fill="#fff" opacity="0.38" />
      </g>
      <g transform="rotate(9 23 21)">
        <rect x="15.5" y="8.5" width="15" height="21" rx="3" fill="#fff" />
        <path
          d="M23 14.2c-2.4 2.5-4.2 4-4.2 5.8a2.2 2.2 0 0 0 3.8 1.5c-.1 1.1-.5 2-1.3 2.6h3.4c-.8-.6-1.2-1.5-1.3-2.6a2.2 2.2 0 0 0 3.8-1.5c0-1.8-1.8-3.3-4.2-5.8Z"
          fill="#4f58e0"
        />
      </g>
    </svg>
  );
}
