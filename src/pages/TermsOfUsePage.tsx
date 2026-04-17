/**
 * GluMira™ V7 — TermsOfUsePage.tsx
 * Block 88: Terms of Use. Scandinavian Minimalist.
 */

import PublicPageHeader from "@/components/PublicPageHeader";

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
  disclaimer: {
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    padding: "20px 24px",
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

export default function TermsOfUsePage() {
  return (
    <div style={S.page}>
      <PublicPageHeader />
      <div style={S.container}>
        <button
          type="button"
          onClick={() => window.print()}
          style={S.printBtn}
        >
          Print this page
        </button>

        <h1 style={S.h1}>Terms of Use</h1>
        <p style={S.updated}>Last updated: 8 April 2026</p>

        <h2 style={{ ...S.h2, marginTop: 0 }}>1. Acceptance of Terms</h2>
        <p style={S.p}>
          By accessing or using GluMira™, you agree to be bound by these Terms
          of Use. If you do not agree to these terms, you must not use the
          platform. These terms constitute a legally binding agreement between
          you and GluMira™.
        </p>

        <h2 style={S.h2}>2. Platform Description</h2>
        <p style={S.p}>
          GluMira™ is a diabetes education platform that provides insulin
          pharmacology visualisation, glucose pattern analysis, and educational
          content for people living with diabetes, their caregivers, and
          healthcare professionals. GluMira™ is NOT a medical device, and is not
          intended to be used as one.
        </p>

        <h2 style={S.h2}>3. Medical Disclaimer</h2>
        <div style={S.disclaimer}>
          <p style={{ ...S.p, fontWeight: 600 }}>
            IMPORTANT: Please read this section carefully.
          </p>
          <ul style={{ ...S.ul, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              GluMira™ is an educational platform that provides insulin
              pharmacology visualisation and glucose pattern analysis.
            </li>
            <li style={{ marginBottom: 8 }}>
              GluMira™ does <strong>NOT</strong> provide medical advice,
              diagnosis, or treatment.
            </li>
            <li style={{ marginBottom: 8 }}>
              GluMira™ does <strong>NOT</strong> calculate prescribed doses.
            </li>
            <li style={{ marginBottom: 8 }}>
              Always consult qualified healthcare professionals before making any
              changes to diabetes management.
            </li>
            <li>
              Users are solely responsible for all treatment decisions.
            </li>
          </ul>
          <p style={{ ...S.p, marginBottom: 0 }}>
            The educational information, visualisations, and pattern analyses
            provided by GluMira™ are intended to support — not replace —
            professional medical guidance. No information on this platform
            should be interpreted as a recommendation to alter insulin dosing,
            medication, or any aspect of diabetes treatment.
          </p>
        </div>

        <h2 style={S.h2}>4. User Responsibilities</h2>
        <p style={S.p}>As a user of GluMira™, you agree to:</p>
        <ul style={S.ul}>
          <li>Provide accurate and truthful information when creating your account and logging data.</li>
          <li>Maintain the confidentiality of your account credentials.</li>
          <li>Not use the platform as a substitute for professional medical advice.</li>
          <li>Consult your healthcare team before making any changes to your diabetes management based on information from GluMira™.</li>
          <li>Not misuse the platform, attempt to gain unauthorised access, or interfere with other users.</li>
          <li>Comply with all applicable laws and regulations in your jurisdiction.</li>
        </ul>

        <h2 style={S.h2}>5. Account Terms</h2>
        <p style={S.p}>
          You must be at least 13 years of age to create an account. Users under
          13 require verified parental or guardian consent via the Caregiver
          Portal. You are responsible for all activity that occurs under your
          account. You must notify us immediately of any unauthorised use or
          security breach. We reserve the right to suspend or terminate accounts
          that violate these terms.
        </p>

        <h2 style={S.h2}>6. Subscription and Billing</h2>
        <p style={S.p}>
          GluMira™ offers both free and paid subscription tiers. Paid
          subscriptions are billed on a recurring basis (monthly or annually) as
          selected at the time of purchase. You may cancel your subscription at
          any time from Settings; cancellation takes effect at the end of the
          current billing period. Refunds are handled in accordance with
          applicable consumer protection laws. Prices may change with 30 days'
          advance notice. Free-tier features remain available without payment.
        </p>

        <h2 style={S.h2}>7. Intellectual Property</h2>
        <p style={S.p}>
          GluMira™ and IOB Hunter™ are trademarks. All content, design,
          graphics, code, educational materials, visualisations, and algorithms
          within GluMira™ are the intellectual property of GluMira™ and are
          protected by copyright and trademark laws. You may not copy,
          reproduce, distribute, modify, or create derivative works from any
          part of the platform without prior written consent. Your logged data
          remains your property, and you may export it at any time.
        </p>

        <h2 style={S.h2}>8. Limitation of Liability</h2>
        <p style={S.p}>
          To the maximum extent permitted by applicable law, GluMira™ and its
          directors, employees, partners, and affiliates shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages,
          including but not limited to loss of profits, data, or health outcomes,
          arising from your use of or inability to use the platform. GluMira™
          provides educational information only and accepts no liability for
          treatment decisions made by users. Our total liability for any claim
          arising from these terms shall not exceed the amount you have paid to
          GluMira™ in the 12 months preceding the claim.
        </p>

        <h2 style={S.h2}>9. Indemnification</h2>
        <p style={S.p}>
          You agree to indemnify, defend, and hold harmless GluMira™ and its
          officers, directors, employees, and agents from any claims, damages,
          losses, liabilities, and expenses (including legal fees) arising from
          your use of the platform, your violation of these terms, or your
          violation of any rights of a third party.
        </p>

        <h2 style={S.h2}>10. Termination</h2>
        <p style={S.p}>
          We may suspend or terminate your access to GluMira™ at any time, with
          or without cause, with or without notice. Upon termination, your right
          to use the platform ceases immediately. You may request export of your
          data before or within 30 days of termination. Provisions that by their
          nature should survive termination (including limitation of liability,
          indemnification, and intellectual property) shall survive.
        </p>

        <h2 style={S.h2}>11. Governing Law</h2>
        <p style={S.p}>
          These terms shall be governed by and construed in accordance with the
          laws of the jurisdiction in which GluMira™ operates, without regard to
          conflict of law principles. Any disputes arising from these terms or
          your use of the platform shall be resolved through binding arbitration
          or in the competent courts of the governing jurisdiction.
        </p>

        <h2 style={S.h2}>12. Changes to These Terms</h2>
        <p style={S.p}>
          We reserve the right to modify these Terms of Use at any time. We will
          notify users of material changes via email and an in-app notification
          at least 30 days before the changes take effect. Continued use of the
          platform after the effective date constitutes acceptance of the revised
          terms. If you do not agree to the revised terms, you must stop using
          the platform.
        </p>

        <h2 style={S.h2}>13. Contact</h2>
        <p style={S.p}>
          For questions or concerns about these Terms of Use:
        </p>
        <p style={S.p}>
          Email:{" "}
          <a href="mailto:legal@glumira.ai" style={{ color: T.teal }}>
            legal@glumira.ai
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
