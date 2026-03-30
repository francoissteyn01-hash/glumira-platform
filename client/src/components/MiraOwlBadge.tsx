/**
 * GluMira™ V7 — MiraOwlBadge.tsx
 * Sovereign Mira owl on heraldic shield
 */
export function MiraOwlBadge({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Heraldic shield */}
      <path
        d="M 50,8 L 90,20 L 90,55 Q 90,80 50,95 Q 10,80 10,55 L 10,20 Z"
        fill="#1a2a5e"
        stroke="#2ab5c1"
        strokeWidth="2.5"
      />
      {/* Owl body */}
      <ellipse cx="50" cy="52" rx="18" ry="22" fill="#f8f9fa" opacity="0.95"/>
      {/* Owl eyes */}
      <circle cx="43" cy="46" r="6" fill="#2ab5c1"/>
      <circle cx="57" cy="46" r="6" fill="#2ab5c1"/>
      <circle cx="43" cy="46" r="3" fill="#1a2a5e"/>
      <circle cx="57" cy="46" r="3" fill="#1a2a5e"/>
      <circle cx="44.5" cy="44.5" r="1" fill="white"/>
      <circle cx="58.5" cy="44.5" r="1" fill="white"/>
      {/* Beak */}
      <path d="M 47,52 L 53,52 L 50,57 Z" fill="#f59e0b"/>
      {/* Wings */}
      <path d="M 32,55 Q 28,45 35,40 Q 38,50 50,52" fill="#e2e8f0" opacity="0.8"/>
      <path d="M 68,55 Q 72,45 65,40 Q 62,50 50,52" fill="#e2e8f0" opacity="0.8"/>
      {/* Ear tufts */}
      <path d="M 43,32 L 40,24 L 46,30" fill="#1a2a5e" opacity="0.9"/>
      <path d="M 57,32 L 60,24 L 54,30" fill="#1a2a5e" opacity="0.9"/>
      {/* Shield border accent */}
      <path
        d="M 50,12 L 86,23 L 86,55 Q 86,77 50,91"
        fill="none"
        stroke="#2ab5c1"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
}