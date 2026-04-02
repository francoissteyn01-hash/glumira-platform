/**
 * GluMira™ V7 — Story progress bar
 * Fills across the top of the story player.
 */

interface Props {
  progress: number; // 0-1
}

export default function StoryProgress({ progress }: Props) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 4, zIndex: 20,
      background: "rgba(255,255,255,0.1)",
    }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, progress * 100)}%`,
          background: "linear-gradient(90deg, #2ab5c1, #f59e0b)",
          transition: "width 0.3s linear",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
