/**
 * GluMira™ V7 — Region & Language Setup Page
 * Blocks 8 & 9: Region Lock + Language Selector (Onboarding)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  detectRegion,
  getRegionConfig,
  getAllRegions,
  type RegionConfig,
} from "@/lib/region-engine";
import {
  setLanguage,
  getLanguageLabel,
  getSupportedLanguages,
  type SupportedLanguage,
} from "@/lib/i18n-engine";

const FLAG_EMOJI: Record<string, string> = {
  ZA: "\ud83c\uddff\ud83c\udde6",
  NA: "\ud83c\uddf3\ud83c\udde6",
  GB: "\ud83c\uddec\ud83c\udde7",
  IE: "\ud83c\uddee\ud83c\uddea",
  US: "\ud83c\uddfa\ud83c\uddf8",
  CA: "\ud83c\udde8\ud83c\udde6",
  AU: "\ud83c\udde6\ud83c\uddfa",
  NZ: "\ud83c\uddf3\ud83c\uddff",
  DE: "\ud83c\udde9\ud83c\uddea",
  FR: "\ud83c\uddeb\ud83c\uddf7",
  NL: "\ud83c\uddf3\ud83c\uddf1",
  SE: "\ud83c\uddf8\ud83c\uddea",
  NO: "\ud83c\uddf3\ud83c\uddf4",
  DK: "\ud83c\udde9\ud83c\uddf0",
  AE: "\ud83c\udde6\ud83c\uddea",
  SA: "\ud83c\uddf8\ud83c\udde6",
  IN: "\ud83c\uddee\ud83c\uddf3",
  JP: "\ud83c\uddef\ud83c\uddf5",
  BR: "\ud83c\udde7\ud83c\uddf7",
  NG: "\ud83c\uddf3\ud83c\uddec",
  KE: "\ud83c\uddf0\ud83c\uddea",
  EG: "\ud83c\uddea\ud83c\uddec",
  IL: "\ud83c\uddee\ud83c\uddf1",
};

function getFlag(code: string): string {
  return FLAG_EMOJI[code] ?? "\ud83c\udff3\ufe0f";
}

function unitLabel(units: "mmol" | "mg"): string {
  return units === "mmol" ? "mmol/L" : "mg/dL";
}

export default function RegionSetupPage() {
  const navigate = useNavigate();
  const allRegions = getAllRegions();

  const [detected, setDetected] = useState<RegionConfig | null>(null);
  const [selected, setSelected] = useState<RegionConfig | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [chosenLang, setChosenLang] = useState<SupportedLanguage>("en-GB");

  useEffect(() => {
    const region = detectRegion();
    setDetected(region);
    setSelected(region);
    setChosenLang(region.language as SupportedLanguage);
  }, []);

  const region = selected ?? detected;
  const discountPct = region ? Math.round(region.pppDiscount * 100) : 0;

  const availableLangs: SupportedLanguage[] = region
    ? (region.availableLanguages.filter((l) =>
        getSupportedLanguages().includes(l as SupportedLanguage)
      ) as SupportedLanguage[])
    : ["en-GB"];

  function handleRegionChange(code: string) {
    const config = getRegionConfig(code);
    if (config) {
      setSelected(config);
      setChosenLang(config.language as SupportedLanguage);
      setConfirmed(true);
      setShowSelector(false);
    }
  }

  function handleContinue() {
    if (!region) return;
    setLanguage(chosenLang);
    localStorage.setItem("glumira_region", region.code);
    localStorage.setItem("glumira_glucose_units", region.glucoseUnits);
    localStorage.setItem("glumira_currency", region.currency);
    localStorage.setItem("glumira_timezone", region.timezone);
    navigate("/consent");
  }

  if (!region) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0d1f3c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 16px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: "#e2e8f0",
      }}
    >
      {/* Top branding */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Glu
          <span style={{ color: "#38bdf8" }}>Mira</span>
          <span style={{ fontSize: 14, verticalAlign: "super" }}>{"\u2122"}</span>
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "4px 0 0" }}>
          Region &amp; Language Setup
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Auto-detected region card */}
        {!confirmed && !showSelector && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <p style={{ fontSize: 16, margin: "0 0 16px", lineHeight: 1.5 }}>
              We detected you're in{" "}
              <strong>
                {getFlag(region.code)} {region.name}
              </strong>
              . Is this correct?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setConfirmed(true)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#38bdf8",
                  color: "#0a1628",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Yes, that's correct
              </button>
              <button
                onClick={() => setShowSelector(true)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#94a3b8",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Change region
              </button>
            </div>
          </div>
        )}

        {/* Region selector dropdown */}
        {showSelector && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: "#cbd5e1",
              }}
            >
              Select your region
            </label>
            <select
              value={region.code}
              onChange={(e) => handleRegionChange(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "#1e293b",
                color: "#e2e8f0",
                fontSize: 15,
                cursor: "pointer",
                appearance: "auto",
              }}
            >
              {allRegions.map((r) => (
                <option key={r.code} value={r.code}>
                  {getFlag(r.code)} {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Confirmed region header */}
        {confirmed && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              border: "1px solid rgba(56,189,248,0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {getFlag(region.code)} {region.name}
            </span>
            <button
              onClick={() => {
                setConfirmed(false);
                setShowSelector(true);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#38bdf8",
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Change
            </button>
          </div>
        )}

        {/* Language selector */}
        {(confirmed || showSelector) && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: "#cbd5e1",
              }}
            >
              Language
            </label>
            {availableLangs.length > 1 ? (
              <select
                value={chosenLang}
                onChange={(e) => setChosenLang(e.target.value as SupportedLanguage)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "#1e293b",
                  color: "#e2e8f0",
                  fontSize: 15,
                  cursor: "pointer",
                  appearance: "auto",
                }}
              >
                {availableLangs.map((lang) => (
                  <option key={lang} value={lang}>
                    {getLanguageLabel(lang)}
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ margin: 0, fontSize: 15, color: "#94a3b8" }}>
                {getLanguageLabel(availableLangs[0])}
              </p>
            )}
          </div>
        )}

        {/* Defaults preview card */}
        {(confirmed || showSelector) && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#cbd5e1",
                margin: "0 0 16px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Your defaults
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <DefaultRow label="Glucose units" value={unitLabel(region.glucoseUnits)} />
              <DefaultRow
                label="Currency"
                value={`${region.currencySymbol} (${region.currency})`}
              />
              <DefaultRow label="Language" value={getLanguageLabel(chosenLang)} />
              <DefaultRow label="Timezone" value={region.timezone} />
            </div>
          </div>
        )}

        {/* PPP notice */}
        {(confirmed || showSelector) && discountPct > 0 && (
          <div
            style={{
              background: "rgba(56,189,248,0.08)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              border: "1px solid rgba(56,189,248,0.25)",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{"\ud83c\udf0d"}</span>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#7dd3fc" }}>
              Regional pricing applied &mdash; <strong>{discountPct}% discount</strong>{" "}
              based on your location.
            </p>
          </div>
        )}

        {/* Continue button */}
        {confirmed && (
          <button
            onClick={handleContinue}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #38bdf8, #818cf8)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              marginBottom: 24,
              letterSpacing: "0.01em",
            }}
          >
            Continue
          </button>
        )}
      </div>

      {/* Bottom branding */}
      <div style={{ marginTop: "auto", paddingTop: 32, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
          GluMira{"\u2122"} V7 &mdash; Diabetes education for everyone.
        </p>
        <p style={{ fontSize: 11, color: "#334155", margin: "4px 0 0" }}>
          Not medical advice. Always consult your clinician.
        </p>
      </div>
    </div>
  );
}

function DefaultRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 14, color: "#94a3b8" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{value}</span>
    </div>
  );
}
