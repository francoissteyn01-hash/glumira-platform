import { type CSSProperties } from "react";

interface StorySubtitleProps {
  text: string;
}

export default function StorySubtitle({ text }: StorySubtitleProps) {
  if (!text) return null;

  const barStyle: CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(248,249,250,0.92)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    padding: "16px 24px",
    zIndex: 100,
    borderTop: "1px solid rgba(26,42,94,0.08)",
  };

  const textStyle: CSSProperties = {
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: "clamp(14px, 3vw, 16px)",
    fontWeight: 400,
    color: "#1a2a5e",
    lineHeight: 1.5,
    textAlign: "center",
    maxWidth: 480,
    margin: "0 auto",
  };

  return (
    <div style={barStyle}>
      <p style={textStyle}>{text}</p>
    </div>
  );
}
