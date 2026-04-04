/**
 * GluMira™ V7 — MiraOwl.tsx
 * Canonical Mira owl SVG.
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
    <div
      style={{ width: size, height: size }}
      className={className}
      role="img"
      aria-label="Mira — GluMira™ owl mascot"
    />
  );
}
