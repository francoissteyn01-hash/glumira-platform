/**
 * GluMira™ V7 — SplashScreen
 * Intro animation that plays on first page visit.
 * Sequence: navy hold → owl fades in → particle wave → cross-fade out.
 * Total duration: ~4.2 seconds. Self-removes from DOM when done.
 * Rule 22: owl uses mixBlendMode lighten, no forehead gem.
 * Rule 24: no casino flash — smooth, slow, clinical.
 */

import { useEffect, useRef, useState } from "react";

const NAVY_DEEP = "#0D1B3E";
const TEAL      = "#2AB5C1";
const AMBER     = "#F59E0B";

/* ─── Timing (ms) ────────────────────────────────────────────────────────── */
const T_OWL_IN   = 800;   // hold before owl appears
const T_WAVE_IN  = 1600;  // wave starts
const T_HOLD_END = 3200;  // hold ends, fade-out begins
const T_DONE     = 4400;  // component unmounts

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const [phase, setPhase] = useState<"hold" | "owl" | "wave" | "fade">("hold");

  /* ─── Phase sequencer ─────────────────────────────────────────────────── */
  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("owl"),  T_OWL_IN);
    const t2 = window.setTimeout(() => setPhase("wave"), T_WAVE_IN);
    const t3 = window.setTimeout(() => setPhase("fade"), T_HOLD_END);
    const t4 = window.setTimeout(() => onDone(),         T_DONE);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  /* ─── Particle wave canvas ────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "wave" && phase !== "fade") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const waves = [
      { color: "rgba(255,255,255,0.30)", speed: 0.4,  amp: 22, freq: 0.012, phase: 0 },
      { color: `rgba(42,181,193,0.22)`, speed: 0.65, amp: 16, freq: 0.018, phase: 2.1 },
      { color: `rgba(245,158,11,0.14)`, speed: 0.9,  amp: 12, freq: 0.024, phase: 4.3 },
    ];

    let tick = 0;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = canvas;
      const baseY = height * 0.62;

      ctx.clearRect(0, 0, width, height);

      waves.forEach((w) => {
        ctx.beginPath();
        ctx.moveTo(0, baseY);

        // draw wave path
        for (let x = 0; x <= width; x += 4) {
          const y = baseY + Math.sin(x * w.freq + tick * w.speed + w.phase) * w.amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        ctx.fillStyle = w.color;
        ctx.fill();

        // particles along the wave crest
        ctx.fillStyle = w.color.replace(/[\d.]+\)$/, "0.55)");
        for (let x = 20; x <= width - 20; x += 38) {
          const y = baseY + Math.sin(x * w.freq + tick * w.speed + w.phase) * w.amp;
          const r = 1.2 + Math.random() * 1.4;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      tick += 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [phase]);

  /* ─── Render ──────────────────────────────────────────────────────────── */
  const fading = phase === "fade";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: NAVY_DEEP,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: fading ? 0 : 1,
        transition: fading ? `opacity ${T_DONE - T_HOLD_END}ms ease-in-out` : "none",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* ── Particle wave canvas (behind owl) ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: phase === "wave" || phase === "fade" ? 1 : 0,
          transition: "opacity 0.8s ease-in-out",
        }}
      />

      {/* ── Mira owl ── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          opacity: phase === "hold" ? 0 : 1,
          transform: phase === "hold" ? "scale(0.84)" : "scale(1)",
          transition: "opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.34,1.28,0.64,1)",
          textAlign: "center",
        }}
      >
        <img
          src="/images/mira-hero.png"
          alt="Mira — GluMira™ AI companion"
          style={{
            width: "clamp(120px, 22vw, 200px)",
            height: "auto",
            mixBlendMode: "lighten",
            filter: "drop-shadow(0 0 64px rgba(42,181,193,0.28))",
            display: "block",
            margin: "0 auto",
          }}
        />

        {/* Wordmark beneath owl */}
        <p
          style={{
            marginTop: 22,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(26px, 5vw, 38px)",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            opacity: phase === "owl" || phase === "wave" || phase === "fade" ? 1 : 0,
            transition: "opacity 0.6s ease-out 0.3s",
          }}
        >
          GluMira<span style={{ fontSize: "0.32em", verticalAlign: "super" }}>™</span>
        </p>
        <p
          style={{
            marginTop: 6,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(13px, 2.5vw, 17px)",
            fontWeight: 700,
            color: AMBER,
            textShadow: "0 0 24px rgba(245,158,11,0.4)",
            letterSpacing: "0.01em",
            opacity: phase === "wave" || phase === "fade" ? 1 : 0,
            transition: "opacity 0.6s ease-out",
          }}
        >
          made visible.
        </p>
      </div>

      {/* ── Teal accent line at bottom ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)`,
          opacity: phase === "wave" || phase === "fade" ? 0.6 : 0,
          transition: "opacity 0.8s ease-in-out",
        }}
      />
    </div>
  );
}
