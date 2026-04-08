/**
 * GluMira™ V7 — PrivacyPolicyPage.tsx
 * Block 88: Full privacy policy. Scandinavian Minimalist.
 */

const T = {
  navy: "#1a2a5e",
  teal: "#2ab5c1",
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', -apple-system, sans-serif",
};

const S = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-primary, #f8f9fa)",
    fontFamily: T.body,
    color: "var(--text-primary, #1a1a2e)",
    lineHeight: 1.7,
  } as React.CSSProperties,
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "48px 24px 64px",
  } as React.CSSProperties,
  h1: {
    fontFamily: T.heading,
    fontSize: 32,
    fontWeight: 700,
    color: T.navy,
    marginBottom: 8,
  } as React.CSSProperties,
  updated: {
    fontSize: 13,
    color: "var(--text-secondary, #64748b)",
    marginBottom: 40,
  } as React.CSSProperties,
  h2: {
    fontFamily: T.heading,
    fontSize: 20,
    fontWeight: 700,
    color: T.navy,
    marginTop: 40,
    marginBottom: 12,
  } as React.CSSProperties,
  p: {
    fontSize: 15,
    marginBottom: 12,
  } as React.CSSProperties,
  ul: {
    paddingLeft: 24,
    marginBottom: 12,
    fontSize: 15,
  } as React.CSSProperties,
  printBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    color: T.teal,
    background: "transparent",
    border: `1px solid ${T.teal}`,
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: T.body,
    marginBottom: 32,
  } as React.CSSProperties,
};

export default function PrivacyPolicyPage() {
  return (
    <div style={S.page}>
      <div style={S.container}>
        <button
          type="button"
          onClick={() => window.print()}
          style={S.printBtn}
        >
          Print this page
        </button>

        <h1 style={S.h1}>Privacy Policy</h1>
        <p style={S.updated}>Last updated: 8 April 2026</p>

        <h2 style={{ ...S.h2, marginTop: 0 }}>1. Data Controller</h2>
        <p style={S.p}>
          GluMira™ ("we", "us", "our") is the data controller responsible for
          your personal data. GluMira™ is a diabetes education platform
          committed to protecting the privacy and security of all users.
        </p>

        <h2 style={S.h2}>2. What Data We Collect</h2>
        <p style={S.p}>We collect and process the following categories of data:</p>
        <ul style={S.ul}>
          <li><strong>Profile information:</strong> Name, email address, date of birth, diabetes type, diagnosis date, and preferred units.</li>
          <li><strong>Glucose readings:</strong> Blood glucose values entered manually or imported via CGM/Nightscout integrations.</li>
          <li><strong>Insulin logs:</strong> Insulin type, units administered, injection site, and timing data.</li>
          <li><strong>Meal logs:</strong> Carbohydrate intake, meal descriptions, photos, and nutritional estimates.</li>
          <li><strong>Usage analytics:</strong> Feature usage patterns, session duration, and interaction data used to improve the platform experience.</li>
          <li><strong>Device information:</strong> Browser type, operating system, and screen resolution for compatibility purposes.</li>
        </ul>

        <h2 style={S.h2}>3. How We Use Your Data</h2>
        <ul style={S.ul}>
          <li><strong>Platform functionality:</strong> Delivering core features including glucose logging, insulin tracking, and educational content.</li>
          <li><strong>Pattern analysis:</strong> Generating personalised educational insights about glucose trends and patterns.</li>
          <li><strong>Education delivery:</strong> Tailoring educational modules and content to your diabetes type and management context.</li>
          <li><strong>Anonymised research:</strong> Aggregated, de-identified data may be used for academic research and platform improvement. Individual users cannot be identified from this data.</li>
          <li><strong>Platform improvement:</strong> Usage analytics help us improve features, fix issues, and enhance the user experience.</li>
        </ul>

        <h2 style={S.h2}>4. Data Storage</h2>
        <p style={S.p}>
          All personal data is stored in Supabase PostgreSQL databases with
          row-level security (RLS) policies ensuring users can only access their
          own data. Data is encrypted at rest using AES-256 and in transit using
          TLS 1.3. Database backups are encrypted and stored in geographically
          distributed, access-controlled environments.
        </p>

        <h2 style={S.h2}>5. Data Retention</h2>
        <p style={S.p}>
          Data associated with active accounts is retained for as long as the
          account remains active. Upon receiving an account deletion request, all
          personal data — including glucose readings, insulin logs, meal logs, and
          profile information — will be permanently deleted within 30 days. Anonymised
          aggregate data that cannot be linked to an individual may be retained
          for research and improvement purposes.
        </p>

        <h2 style={S.h2}>6. Third-Party Sharing</h2>
        <p style={S.p}>
          We do not sell, rent, or trade your personal data to any third party.
          Anonymised, aggregate data that cannot identify individual users may be
          shared with academic research partners for diabetes education research.
          We use the following service providers who process data on our behalf:
        </p>
        <ul style={S.ul}>
          <li><strong>Supabase:</strong> Database hosting and authentication.</li>
          <li><strong>Netlify:</strong> Application hosting and deployment.</li>
          <li><strong>Stripe:</strong> Payment processing (we do not store card details).</li>
        </ul>

        <h2 style={S.h2}>7. CGM &amp; Nightscout Data</h2>
        <p style={S.p}>
          When you connect a continuous glucose monitor (CGM) via Nightscout or
          other supported integrations, imported glucose data is treated with the
          same security and privacy protections as manually entered data. We
          access only the data you explicitly authorise. CGM connection
          credentials are stored encrypted and can be revoked at any time from
          Settings. Imported data is used solely for educational visualisation
          and pattern analysis within GluMira™.
        </p>

        <h2 style={S.h2}>8. Children's Privacy</h2>
        <p style={S.p}>
          GluMira™ is aligned with the Children's Online Privacy Protection Act
          (COPPA) and equivalent regulations. Users under the age of 13 require
          verified parental or guardian consent before creating an account. The
          Caregiver Portal allows parents and guardians to manage a child's
          account, review data, and control privacy settings. We do not knowingly
          collect data from children under 13 without parental consent.
        </p>

        <h2 style={S.h2}>9. Your Rights</h2>
        <p style={S.p}>
          Depending on your jurisdiction, you have the following rights regarding
          your personal data:
        </p>
        <ul style={S.ul}>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
          <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
          <li><strong>Portability:</strong> Request your data in a structured, machine-readable format (JSON/CSV export available in Settings).</li>
          <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances.</li>
          <li><strong>Objection:</strong> Object to processing of your data for specific purposes.</li>
        </ul>
        <p style={S.p}>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:privacy@glumira.ai" style={{ color: T.teal }}>
            privacy@glumira.ai
          </a>{" "}
          or use the data management tools in Settings.
        </p>

        <h2 style={S.h2}>10. Cookies</h2>
        <p style={S.p}>
          GluMira™ uses minimal, functional cookies only. We use a single
          authentication cookie to maintain your session and a preferences cookie
          to store your theme and unit settings. We do not use advertising
          cookies, tracking cookies, or third-party analytics cookies.
        </p>

        <h2 style={S.h2}>11. Security Measures</h2>
        <ul style={S.ul}>
          <li>AES-256 encryption at rest for all stored data.</li>
          <li>TLS 1.3 encryption for all data in transit.</li>
          <li>Row-level security (RLS) on all database tables ensuring data isolation between users.</li>
          <li>Role-based access controls for internal team members.</li>
          <li>Regular security audits and penetration testing.</li>
          <li>PKCE authentication flow to prevent token interception.</li>
          <li>Automatic session expiry and token refresh mechanisms.</li>
        </ul>

        <h2 style={S.h2}>12. Changes to This Policy</h2>
        <p style={S.p}>
          We may update this Privacy Policy from time to time. We will notify
          users of material changes via email and an in-app notification. The
          "Last updated" date at the top of this page will be revised
          accordingly. Continued use of the platform after changes constitutes
          acceptance of the revised policy.
        </p>

        <h2 style={S.h2}>13. Contact</h2>
        <p style={S.p}>
          For privacy-related enquiries, data requests, or concerns:
        </p>
        <p style={S.p}>
          Email:{" "}
          <a href="mailto:privacy@glumira.ai" style={{ color: T.teal }}>
            privacy@glumira.ai
          </a>
        </p>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid var(--border, #e2e8f0)",
            fontSize: 13,
            color: "var(--text-secondary, #64748b)",
          }}
        >
          GluMira™ is an educational platform. It does not provide medical
          advice, diagnosis, or treatment.
        </div>
      </div>
    </div>
  );
}
