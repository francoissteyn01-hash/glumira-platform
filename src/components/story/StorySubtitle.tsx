/**
 * GluMira™ V7 — Story subtitle bar
 * Persistent bottom bar showing subtitle_text.
 */

interface Props {
  text: string;
}

export default function StorySubtitle({ text }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: "rgba(15, 27, 61, 0.85)",
        backdropFilter: "blur(8px)",
        padding: "16px 24px",
        minHeight: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "clamp(14px, 4vw, 18px)",
          color: "#ffffff",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 500,
          lineHeight: 1.5,
          textAlign: "center",
          maxWidth: 600,
        }}
      >
        {text}
      </p>
    </div>
  );
}
