/**
 * GluMira™ V7 — DonatePage
 *
 * Research donation landing page. Any donation (any currency, any amount)
 * unlocks the Research Champion badge on the donor's profile.
 *
 * Payment rail: XE (Stripe does not operate in Namibia).
 * XE handoff is a placeholder until founder provides merchant credentials;
 * this page currently captures the donor's intent and routes them to the
 * XE sign-up flow. Badge is awarded on the server after XE webhook confirms
 * the payment.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

const T = {
  navy:    "#0D2149",
  navyDeep:"#0D1B3E",
  teal:    "#2AB5C1",
  amber:   "#F59E0B",
  muted:   "#64748b",
  border:  "#e2e8f0",
  bgLight: "#f8f9fa",
  heading: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', -apple-system, sans-serif",
};

const CURRENCIES = [
  { code: "NAD", symbol: "N$", label: "Namibian Dollar" },
  { code: "ZAR", symbol: "R",  label: "South African Rand" },
  { code: "USD", symbol: "$",  label: "US Dollar" },
  { code: "EUR", symbol: "€",  label: "Euro" },
  { code: "GBP", symbol: "£",  label: "British Pound" },
];

const AMOUNT_TIERS: { amount: number; label: string; note: string }[] = [
  { amount: 5,   label: "Supporter",         note: "One month of hosting for ten free-tier users." },
  { amount: 25,  label: "Advocate",          note: "One pediatric module's clinical review cycle." },
  { amount: 100, label: "Research Champion", note: "One cohort-week of data storage + anonymisation." },
];

export default function DonatePage() {
  const { isDark, toggle } = useTheme();
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom]   = useState<string>("");
  const [email, setEmail]     = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const finalAmount = custom ? Number(custom) : amount;
  const canSubmit   = finalAmount > 0 && email.includes("@");

  const submit = async () => {
    setSubmitting(true);
    // Record the donation intent so the server can award the badge
    // once the XE webhook confirms the payment.
    try {
      await fetch(`/api/donations/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: finalAmount,
          currency: currency.code,
        }),
      });
    } catch {
      /* non-blocking — XE handoff is still the source of truth */
    }
    // Redirect to XE — founder will replace this URL with the merchant
    // payment link once XE Money account is provisioned.
    const xeUrl = `https://www.xe.com/send-money?to=GluMira&amount=${finalAmount}&currency=${currency.code}&reference=${encodeURIComponent(email)}`;
    window.location.href = xeUrl;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? T.navyDeep : T.bgLight,
        color: isDark ? "#fff" : T.navy,
        fontFamily: T.body,
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Top bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: isDark ? "rgba(13,27,62,0.92)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : T.border}`,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
            <img src="/brand/mira-hero.png" alt="Mira" style={{ width: 36, height: 36, objectFit: "contain", mixBlendMode: isDark ? "screen" : "multiply" }} />
            <span style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 700, letterSpacing: -0.2 }}>
              GluMira<span style={{ color: T.teal }}>™</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 40, height: 40, borderRadius: 999,
              background: "transparent", border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "inherit", fontSize: 18,
            }}
          >
            {isDark ? "☀" : "🌙"}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <Link to="/" style={{ color: T.teal, fontSize: 14, textDecoration: "none" }}>← Back home</Link>

        {/* Headline */}
        <div style={{ textAlign: "center", margin: "24px 0 32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 999,
            background: `${T.amber}22`, border: `1px solid ${T.amber}55`,
            color: T.amber, fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
            textTransform: "uppercase",
          }}>
            <span>🎗️</span> Research Champion
          </div>
          <h1 style={{ fontFamily: T.heading, fontSize: 36, lineHeight: 1.15, margin: "16px 0 10px", fontWeight: 700 }}>
            Donate to keep the free tier free.
          </h1>
          <p style={{ color: isDark ? "#94a3b8" : T.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>
            GluMira™ exists for families who can't afford premium glucose monitoring.
            Any donation — any amount, any currency — unlocks the Research Champion
            badge on your profile and goes directly to hosting, clinical review,
            and open-sourcing the PK engine.
          </p>
        </div>

        {/* Badge preview */}
        <div style={{
          background: isDark ? "rgba(245,158,11,0.08)" : "#fffbea",
          border: `2px solid ${T.amber}`,
          borderRadius: 16,
          padding: 20,
          display: "grid", gridTemplateColumns: "72px 1fr", gap: 16, alignItems: "center",
          marginBottom: 32,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 999,
            background: `linear-gradient(135deg, ${T.amber}, #d97706)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
            boxShadow: "0 6px 18px rgba(245,158,11,0.35)",
          }}>
            🎗️
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, letterSpacing: 1.2, textTransform: "uppercase" }}>
              Gold tier · Unlocks on first donation
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Research Champion</div>
            <div style={{ fontSize: 13, color: isDark ? "#94a3b8" : T.muted, marginTop: 4, lineHeight: 1.5 }}>
              Displayed on your profile. Signals to the community that your contribution
              keeps GluMira's free tier running.
            </div>
          </div>
        </div>

        {/* Currency */}
        <section style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: isDark ? "#94a3b8" : T.muted }}>
            Currency
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c)}
                style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: currency.code === c.code ? T.navy : (isDark ? "rgba(255,255,255,0.05)" : "#fff"),
                  color: currency.code === c.code ? "#fff" : "inherit",
                  border: `1px solid ${currency.code === c.code ? T.navy : (isDark ? "rgba(255,255,255,0.15)" : T.border)}`,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {c.symbol} {c.code}
              </button>
            ))}
          </div>
        </section>

        {/* Amount tiers */}
        <section style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: isDark ? "#94a3b8" : T.muted }}>
            Amount
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 8 }}>
            {AMOUNT_TIERS.map((tier) => (
              <button
                key={tier.amount}
                type="button"
                onClick={() => { setAmount(tier.amount); setCustom(""); }}
                style={{
                  textAlign: "left",
                  padding: 16, borderRadius: 12,
                  background: amount === tier.amount && !custom
                    ? T.teal
                    : (isDark ? "rgba(255,255,255,0.05)" : "#fff"),
                  color: amount === tier.amount && !custom ? "#fff" : "inherit",
                  border: `1px solid ${amount === tier.amount && !custom ? T.teal : (isDark ? "rgba(255,255,255,0.15)" : T.border)}`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700 }}>{currency.symbol}{tier.amount}</div>
                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.9, marginTop: 2 }}>{tier.label}</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6, lineHeight: 1.4 }}>{tier.note}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Custom amount"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); }}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : T.border}`,
                background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                color: "inherit", fontSize: 14,
              }}
            />
          </div>
        </section>

        {/* Email */}
        <section style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: isDark ? "#94a3b8" : T.muted }}>
            Email (to assign your badge)
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 10,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : T.border}`,
              background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              color: "inherit", fontSize: 14,
            }}
          />
          <p style={{ fontSize: 11, color: isDark ? "#94a3b8" : T.muted, marginTop: 6 }}>
            We match the XE payment to your GluMira profile using this email, then award your badge automatically.
          </p>
        </section>

        {/* Submit */}
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={submit}
          style={{
            width: "100%", minHeight: 56, borderRadius: 12,
            background: canSubmit ? T.amber : (isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"),
            color: canSubmit ? T.navy : (isDark ? "#64748b" : "#94a3b8"),
            border: "none",
            fontSize: 16, fontWeight: 700, fontFamily: T.body,
            cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
            transition: "all 0.15s",
            letterSpacing: 0.2,
            boxShadow: canSubmit ? "0 6px 20px rgba(245,158,11,0.35)" : "none",
          }}
        >
          {submitting ? "Redirecting to XE…" : `Donate ${currency.symbol}${finalAmount || 0} via XE →`}
        </button>

        <p style={{ fontSize: 11, color: isDark ? "#94a3b8" : T.muted, marginTop: 16, textAlign: "center", lineHeight: 1.6 }}>
          Payments handled by XE Money. GluMira never sees or stores your card details.
          The Research Champion badge is awarded within a few minutes of XE confirming
          your payment. No recurring billing.
        </p>

        {/* Disclaimer (founding-statement lock: educational, not a device) */}
        <p style={{ fontSize: 10, color: isDark ? "#64748b" : "#94a3b8", marginTop: 32, textAlign: "center", fontStyle: "italic" }}>
          GluMira™ is an educational pharmacology platform, not a medical device.
          Donations fund open-source clinical software — they do not purchase treatment
          or medical advice.
        </p>
      </main>
    </div>
  );
}
