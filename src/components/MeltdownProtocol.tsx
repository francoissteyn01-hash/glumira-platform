/**
 * MeltdownProtocol — 6-step high-contrast, no-animation protocol.
 * Renders identically in all sensory modes (safety-critical).
 */

const STEPS = [
  {
    n: 1,
    title: "Check glucose first",
    body: "Meltdown symptoms and hypoglycaemia look similar. Check blood glucose before anything else. If below 4 mmol/L (72 mg/dL), treat as hypo immediately using the preferred treatment.",
  },
  {
    n: 2,
    title: "Treat hypo if present",
    body: "Give 15g fast-acting carbs (preferred sensory-safe option). Wait 15 minutes. Recheck. Do not try to reason or de-escalate until glucose is above 4 mmol/L.",
  },
  {
    n: 3,
    title: "Reduce sensory input",
    body: "Dim lights. Lower voices. Remove the audience. Offer a quiet space. Do not touch unless invited. Do not say 'calm down' or 'just relax'.",
  },
  {
    n: 4,
    title: "Wait in silence",
    body: "Give time. A meltdown is not a tantrum — it cannot be stopped on demand. Your job is to keep the person physically safe and wait.",
  },
  {
    n: 5,
    title: "Recheck glucose after",
    body: "Stress hormones can push glucose up sharply after a meltdown. Recheck 30-60 minutes later. Watch for rebound highs or delayed lows.",
  },
  {
    n: 6,
    title: "Log and reflect",
    body: "Record trigger, glucose before/after, duration, and what helped. Over time, patterns emerge. Share with your care team.",
  },
];

export default function MeltdownProtocol() {
  const printPdf = () => window.print();

  return (
    <div style={{ color: "#000", background: "#fff" }}>
      {/* Red glucagon banner */}
      <div
        style={{
          background: "#B00020",
          color: "#fff",
          padding: "14px 16px",
          borderRadius: 12,
          marginBottom: 16,
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1.4,
        }}
      >
        EMERGENCY: If the person is unconscious, having a seizure, or cannot swallow —
        use glucagon immediately and call emergency services.
      </div>

      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {STEPS.map((s) => (
          <li
            key={s.n}
            style={{
              border: "2px solid #000",
              padding: 16,
              marginBottom: 12,
              borderRadius: 8,
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
              {s.n}. {s.title}
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.5 }}>{s.body}</div>
          </li>
        ))}
      </ol>

      <p
        style={{
          fontSize: 14,
          marginTop: 16,
          padding: 12,
          background: "#F5F5F5",
          borderRadius: 8,
          color: "#333",
        }}
      >
        Educational information only. Not medical advice. Always follow the plan agreed with your
        endocrinologist and psychologist. In an emergency, call your local emergency number.
      </p>

      <button
        type="button"
        onClick={printPdf}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "14px",
          fontSize: 16,
          fontWeight: 700,
          background: "#000",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Print protocol
      </button>
    </div>
  );
}
