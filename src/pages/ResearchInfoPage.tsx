import { Link } from "react-router-dom";

const T = {
  navy:    "#1a2a5e",
  teal:    "#2ab5c1",
  muted:   "#64748b",
  border:  "#e2e8f0",
  bg:      "#f8f9fa",
  heading: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', -apple-system, sans-serif",
};

export default function ResearchInfoPage() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "40px 24px", fontFamily: T.body }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link to="/" style={{ color: T.teal, fontSize: 14, textDecoration: "none" }}>← Back</Link>

        <h1 style={{ fontFamily: T.heading, color: T.navy, fontSize: 28, margin: "20px 0 8px" }}>
          GluMira™ Real-World Research Programme
        </h1>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 32 }}>
          Voluntary · Anonymous · Withdrawable at any time
        </p>

        {[
          {
            title: "What data is collected",
            body: "Anonymised glucose patterns, insulin dose ranges, and module inputs (e.g. menopause stage, diet type). No names, emails, locations, or any identifying information is ever collected for research purposes.",
          },
          {
            title: "How it is used",
            body: "Data is aggregated across participants to identify real-world patterns in T1D management. Findings may be used to improve GluMira's algorithms, published in academic journals (aggregate only), or shared with research partners under strict anonymisation agreements. No individual data is ever shared.",
          },
          {
            title: "Who has access",
            body: "GluMira's internal research team only. Third parties receive aggregated, de-identified statistical summaries — never raw data.",
          },
          {
            title: "Your rights",
            body: "Participation is entirely voluntary and has no effect on your access to GluMira's features. You may withdraw at any time from Settings → Research. Withdrawal stops future data collection immediately. Previously collected data remains in aggregated form (it cannot be individually identified or removed from aggregate summaries).",
          },
          {
            title: "Legal basis",
            body: "Data processing is based on explicit informed consent under GDPR Article 9(2)(a) for special category health data used for research purposes, with appropriate anonymisation safeguards.",
          },
        ].map(section => (
          <div
            key={section.title}
            style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}
          >
            <h3 style={{ fontFamily: T.heading, color: T.navy, fontSize: 17, margin: "0 0 10px" }}>{section.title}</h3>
            <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{section.body}</p>
          </div>
        ))}

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link
            to="/app-settings"
            style={{ display: "inline-block", background: T.teal, color: "#fff", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
          >
            Manage research preferences in Settings
          </Link>
        </div>

        <p style={{ textAlign: "center", color: T.muted, fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
          Questions? Contact us at privacy@glumira.ai
        </p>
      </div>
    </div>
  );
}
