/**
 * GluMira™ V7 — Story CTA button(s)
 * Handles both single cta and cta_options (clinician variant).
 */

interface CTA {
  label: string;
  href: string;
}

interface Props {
  cta?: CTA;
  ctaOptions?: CTA[];
}

export default function StoryCTA({ cta, ctaOptions }: Props) {
  const items = ctaOptions ?? (cta ? [cta] : []);
  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 90,
        left: 0,
        right: 0,
        zIndex: 25,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "0 24px",
      }}
    >
      {items.map((item, i) => (
        <a
          key={i}
          href={item.href}
          style={{
            display: "inline-block",
            padding: "14px 36px",
            borderRadius: 10,
            border: "none",
            background: i === 0 ? "#2ab5c1" : "rgba(42,181,193,0.15)",
            color: i === 0 ? "#ffffff" : "#2ab5c1",
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            cursor: "pointer",
            textAlign: "center",
            minWidth: 200,
            transition: "transform 0.15s, background 0.15s",
          }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
