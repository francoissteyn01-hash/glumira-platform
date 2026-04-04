/**
 * GluMira™ V7 — Placeholder animation component
 * Renders a styled card with visual_note text.
 * Will be replaced with Lottie / CSS animations in Phase 2.
 */

interface Props {
  visualNote: string;
  label: string;
}

export default function PlaceholderAnimation({ visualNote, label }: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a2a5e 0%, #0f1b3d 100%)",
        borderRadius: 16,
        padding: 32,
        textAlign: "center",
        animation: "fadeIn 0.6s ease",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(42,181,193,0.15)",
          border: "2px solid rgba(42,181,193,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 32, filter: "grayscale(0.3)" }}>{getIcon(label)}</span>
      </div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#2ab5c1",
          margin: "0 0 8px",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label.replace(/_/g, " ")}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
          margin: 0,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          lineHeight: 1.5,
          maxWidth: 300,
        }}
      >
        {visualNote}
      </p>
    </div>
  );
}

function getIcon(label: string): string {
  const icons: Record<string, string> = {
    owl_sentinel_reveal: "\u{1F989}",
    insulin_curve_building: "\u{1F4C8}",
    stacking_overlap_reveal: "\u{1F4CA}",
    density_map_terrain: "\u{1F5FA}\uFE0F",
    quiet_tail_highlight: "\u{1F30A}",
    report_preview_slide: "\u{1F4CB}",
    dashboard_walkthrough: "\u{1F3AF}",
    pattern_detection_demo: "\u{1F50D}",
    safety_shield: "\u{1F6E1}\uFE0F",
    profile_complete_celebration: "\u{1F389}",
  };
  return icons[label] ?? "\u2728";
}
