/**
 * GluMira™ V7 — MiraOwl.tsx
 * Canonical "The Sentinel" / Mira owl SVG.
 *
 * Brand spec:
 *   Navy body (#1a2a5e / #0d1b3e)
 *   Teal chest chevrons (#2ab5c1)
 *   Gold/amber eyes (#d4a229)
 *   Amber teardrop on chest (#f59e0b) — NON-NEGOTIABLE
 *   White eye highlights
 *   Ear tufts
 *   Small beak
 *
 * Usage: <MiraOwl size={80} />
 */

interface MiraOwlProps {
  /** Width & height in px (square viewBox). Default 80. */
  size?: number;
  /** Optional extra className for the wrapper svg. */
  className?: string;
}

export default function MiraOwl({ size = 80, className }: MiraOwlProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Mira the Sentinel — GluMira owl mascot"
    >
      {/* ── Background glow ── */}
      <circle cx="60" cy="60" r="58" fill="rgba(42,181,193,0.06)" />

      {/* ── Body ── */}
      <ellipse cx="60" cy="78" rx="28" ry="32" fill="#1a2a5e" />

      {/* ── Head ── */}
      <ellipse cx="60" cy="44" rx="26" ry="24" fill="#1a2a5e" />

      {/* ── Ear tufts ── */}
      <path d="M38 28 L42 40 L34 38Z" fill="#0d1b3e" />
      <path d="M82 28 L78 40 L86 38Z" fill="#0d1b3e" />
      <path d="M39 29 L42 38 L36 37Z" fill="#152348" />
      <path d="M81 29 L78 38 L84 37Z" fill="#152348" />

      {/* ── Face disc (lighter inner face) ── */}
      <ellipse cx="60" cy="46" rx="20" ry="18" fill="#223670" />

      {/* ── Eye sockets ── */}
      <circle cx="48" cy="43" r="10" fill="#0d1b3e" />
      <circle cx="72" cy="43" r="10" fill="#0d1b3e" />

      {/* ── Gold iris rings ── */}
      <circle cx="48" cy="43" r="8" fill="#d4a229" />
      <circle cx="72" cy="43" r="8" fill="#d4a229" />

      {/* ── Pupils ── */}
      <circle cx="48" cy="43" r="5" fill="#0d1b3e" />
      <circle cx="72" cy="43" r="5" fill="#0d1b3e" />

      {/* ── Eye highlights (life spark) ── */}
      <circle cx="50.5" cy="41" r="2" fill="white" opacity="0.9" />
      <circle cx="74.5" cy="41" r="2" fill="white" opacity="0.9" />
      <circle cx="46" cy="45" r="1" fill="white" opacity="0.5" />
      <circle cx="70" cy="45" r="1" fill="white" opacity="0.5" />

      {/* ── Beak ── */}
      <path d="M57 52 L60 57 L63 52Z" fill="#e8a825" />

      {/* ── Teal chest chevrons ── */}
      <path d="M44 68 L60 76 L76 68" stroke="#2ab5c1" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M46 73 L60 80 L74 73" stroke="#2ab5c1" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M48 78 L60 84 L72 78" stroke="#2ab5c1" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.45" />

      {/* ── Amber teardrop on chest (NON-NEGOTIABLE) ── */}
      <path
        d="M60 86 C60 86 55 94 55 97 C55 99.8 57.2 102 60 102 C62.8 102 65 99.8 65 97 C65 94 60 86 60 86Z"
        fill="#f59e0b"
      />
      {/* Teardrop highlight */}
      <ellipse cx="58.5" cy="95" rx="1.5" ry="2" fill="#fcd34d" opacity="0.6" />

      {/* ── Feet ── */}
      <ellipse cx="50" cy="108" rx="6" ry="3" fill="#e8a825" />
      <ellipse cx="70" cy="108" rx="6" ry="3" fill="#e8a825" />

      {/* ── Wing hints ── */}
      <path d="M32 65 C28 75 30 90 36 95" stroke="#152348" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M88 65 C92 75 90 90 84 95" stroke="#152348" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
