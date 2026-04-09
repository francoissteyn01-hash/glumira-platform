import { useState, useEffect, useRef, useCallback } from "react";

const SLIDES = [
  { src: "/images/showcase/showcase-1-levemir-24h.jpeg", alt: "Levemir 24-hour basal activity curve" },
  { src: "/images/showcase/showcase-2-tresiba-60s.jpeg", alt: "60-second interpretation — Tresiba explanation" },
  { src: "/images/showcase/showcase-3-basal-bolus-overlay.jpeg", alt: "Full basal and bolus overlay — 3-day snapshot" },
  { src: "/images/showcase/showcase-4-pressure-map.jpeg", alt: "24-hour insulin pressure map" },
  { src: "/images/showcase/showcase-5-pressure-60s.jpeg", alt: "60-second interpretation — pressure map explanation" },
  { src: "/images/showcase/showcase-6-pressure-description.jpeg", alt: "Pressure map feature description" },
];

const INTERVAL_MS = 6000;
const FADE_MS = 400;

export default function ShowcaseCarousel() {
  const [active, setActive] = useState(0);
  const paused = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      if (!paused.current) {
        setActive((i) => (i + 1) % SLIDES.length);
      }
    }, INTERVAL_MS);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [startTimer]);

  const pause = () => { paused.current = true; };
  const resume = () => { paused.current = false; };

  const goTo = (i: number) => {
    setActive(i);
    startTimer();
  };

  return (
    <div style={{ background: "#f8f9fa", marginBottom: 20 }}>
      <div
        style={{ position: "relative", width: "100%", overflow: "hidden" }}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        {SLIDES.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            loading="lazy"
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              position: i === 0 ? "relative" : "absolute",
              top: 0,
              left: 0,
              opacity: i === active ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease-in-out`,
              pointerEvents: i === active ? "auto" : "none",
              borderRadius: 0,
            }}
          />
        ))}
      </div>

      {/* Dot indicators */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "12px 0" }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: i === active ? "#22AABB" : "#CBD5E1",
              transition: "background 200ms",
            }}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <p style={{
        textAlign: "center",
        fontSize: 12,
        fontStyle: "italic",
        color: "#94A3B8",
        margin: "0 0 4px",
        padding: "0 16px 12px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        GluMira™ is an educational platform, not a medical device. This visualisation does not constitute medical advice.
      </p>
    </div>
  );
}
