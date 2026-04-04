import { useState } from "react";
import { useNavigate } from "react-router-dom";

const T = {
  navy: "#1a2a5e",
  navyDeep: "#0d1b3e",
  teal: "#2ab5c1",
  amber: "#f59e0b",
  white: "#ffffff",
  bg: "#f8f9fa",
  muted: "rgba(255,255,255,0.5)",
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
};

type ProfileType = "caregiver" | "adult_patient" | "newly_diagnosed" | "clinician" | "teen";

interface ProfileOption {
  id: ProfileType;
  icon: string;
  title: string;
  subtitle: string;
}

const PROFILES: ProfileOption[] = [
  { id: "caregiver", icon: "🤱", title: "Caregiver", subtitle: "Parent or guardian of someone with T1D" },
  { id: "adult_patient", icon: "🩺", title: "Patient", subtitle: "Living with Type 1 Diabetes" },
  { id: "newly_diagnosed", icon: "🌱", title: "Newly Diagnosed", subtitle: "Diagnosed in the last 3 months" },
  { id: "teen", icon: "⚡", title: "Teen / Young Adult", subtitle: "13-18, managing my own T1D" },
  { id: "clinician", icon: "🧑‍⚕️", title: "Clinician", subtitle: "Healthcare professional" },
];

const INSULIN_TYPES = [
  "NovoRapid / Fiasp",
  "Humalog",
  "Actrapid",
  "Tresiba",
  "Levemir",
  "Lantus / Toujeo",
  "Pump (various)",
  "Not sure yet",
];

interface ModuleRec {
  id: string;
  label: string;
  href: string;
  reason: string;
}

// Auto-recommend modules based on profile
function getRecommendedModules(profile: ProfileType, age: string): ModuleRec[] {
  const all: ModuleRec[] = [];

  if (profile === "caregiver" || profile === "newly_diagnosed") {
    all.push({ id: "sick-day", label: "Sick Day Management", href: "/modules/sick-day", reason: "Essential for every caregiver" });
    all.push({ id: "education", label: "Education Library", href: "/education", reason: "100 topics for your journey" });
  }

  if (profile === "caregiver") {
    const ageNum = parseInt(age) || 0;
    if (ageNum <= 5) {
      all.push({ id: "paediatric", label: "Paediatric Module", href: "/modules/paediatric", reason: "Age-specific guidance for under-5s" });
    } else if (ageNum <= 13) {
      all.push({ id: "paediatric", label: "Paediatric Module", href: "/modules/paediatric", reason: "School-age management" });
      all.push({ id: "school-care", label: "School Care Plan", href: "/modules/school-care", reason: "Everything school needs to know" });
    } else {
      all.push({ id: "paediatric", label: "Paediatric Module", href: "/modules/paediatric", reason: "Teen independence support" });
    }
  }

  if (profile === "teen") {
    all.push({ id: "education", label: "Education Library", href: "/education", reason: "Real answers, no BS" });
    all.push({ id: "adhd", label: "ADHD Module", href: "/modules/adhd", reason: "If relevant — medication + insulin overlap" });
    all.push({ id: "menstrual", label: "Menstrual Cycle", href: "/modules/menstrual", reason: "Hormones affect insulin — track the pattern" });
  }

  if (profile === "adult_patient") {
    all.push({ id: "meal-plan", label: "Meal Planning", href: "/meals/plan", reason: "Profile-driven nutrition" });
    all.push({ id: "thyroid", label: "Thyroid Module", href: "/modules/thyroid", reason: "Common autoimmune overlap" });
    all.push({ id: "bernstein", label: "Bernstein Protocol", href: "/modules/bernstein", reason: "Low-carb approach option" });
  }

  if (profile === "clinician") {
    all.push({ id: "education", label: "Education Library", href: "/education", reason: "100 evidence-based topics for patients" });
    all.push({ id: "pregnancy", label: "Pregnancy Module", href: "/modules/pregnancy", reason: "Trimester-specific guidance" });
  }

  // Always suggest Mira
  all.push({ id: "mira", label: "Meet Mira AI", href: "/mira", reason: "Your 24/7 education companion" });

  return all.slice(0, 5); // Max 5 recommendations
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [age, setAge] = useState("");
  const [insulinType, setInsulinType] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const totalSteps = 4;

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const finish = () => {
    // In production: save profile to database
    if (profile) {
      navigate("/onboarding/story");
    } else {
      navigate("/dashboard");
    }
  };

  const toggleModule = (id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const recommendations = profile ? getRecommendedModules(profile, age) : [];

  // Shared styles
  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: `linear-gradient(155deg, ${T.navyDeep} 0%, ${T.navy} 100%)`,
    fontFamily: T.body,
    color: T.white,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 20px",
  };

  const dotRow: React.CSSProperties = {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    padding: "24px 0 32px",
  };

  const cardStyle = (selected: boolean): React.CSSProperties => ({
    width: "100%",
    maxWidth: 400,
    padding: "16px 20px",
    borderRadius: 12,
    border: `1.5px solid ${selected ? T.teal : "rgba(255,255,255,0.1)"}`,
    background: selected ? "rgba(42,181,193,0.1)" : "rgba(255,255,255,0.03)",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  });

  const btnPrimary: React.CSSProperties = {
    padding: "14px 40px",
    borderRadius: 8,
    border: "none",
    background: T.teal,
    color: T.white,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: T.body,
    cursor: "pointer",
    minWidth: 160,
    minHeight: 48,
    transition: "opacity 0.2s",
  };

  const btnGhost: React.CSSProperties = {
    padding: "14px 24px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontFamily: T.body,
    cursor: "pointer",
    minHeight: 48,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 400,
    padding: "14px 16px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.05)",
    color: T.white,
    fontSize: 15,
    fontFamily: T.body,
    outline: "none",
    minHeight: 48,
  };

  return (
    <div style={pageStyle}>
      {/* Progress dots */}
      <div style={dotRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i <= step ? T.teal : "rgba(255,255,255,0.15)",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>

      {/* STEP 0: Who are you? */}
      {step === 0 && (
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
          <h1 style={{ fontFamily: T.heading, fontSize: "clamp(24px, 5vw, 32px)", marginBottom: 8 }}>
            Who are you?
          </h1>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 28 }}>
            This helps Mira personalise your experience
          </p>
          {PROFILES.map(p => (
            <div
              key={p.id}
              style={cardStyle(profile === p.id)}
              onClick={() => setProfile(p.id)}
            >
              <span style={{ fontSize: 28 }}>{p.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{p.subtitle}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
            <button style={{ ...btnPrimary, opacity: profile ? 1 : 0.4 }} disabled={!profile} onClick={next}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: Quick setup */}
      {step === 1 && (
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
          <h1 style={{ fontFamily: T.heading, fontSize: "clamp(24px, 5vw, 32px)", marginBottom: 8 }}>
            Quick setup
          </h1>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 28 }}>
            Just 3 things — you can change these later
          </p>

          <div style={{ textAlign: "left", marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>
              {profile === "caregiver" ? "Child's age" : "Your age"}
            </label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="e.g. 8"
              style={inputStyle}
              min="0"
              max="99"
            />
          </div>

          <div style={{ textAlign: "left", marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>
              Rapid-acting insulin
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {INSULIN_TYPES.slice(0, 4).map(t => (
                <button
                  key={t}
                  onClick={() => setInsulinType(t)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: `1px solid ${insulinType === t ? T.teal : "rgba(255,255,255,0.1)"}`,
                    background: insulinType === t ? "rgba(42,181,193,0.1)" : "transparent",
                    color: insulinType === t ? T.teal : "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    fontFamily: T.body,
                    cursor: "pointer",
                    minHeight: 44,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "left", marginBottom: 28 }}>
            <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>
              Diagnosis date (approximate is fine)
            </label>
            <input
              type="month"
              value={diagnosisDate}
              onChange={e => setDiagnosisDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button style={btnGhost} onClick={back}>Back</button>
            <button style={btnPrimary} onClick={next}>Continue</button>
          </div>

          <button
            onClick={next}
            style={{ background: "none", border: "none", color: T.muted, fontSize: 12, marginTop: 16, cursor: "pointer" }}
          >
            Skip for now
          </button>
        </div>
      )}

      {/* STEP 2: Your modules */}
      {step === 2 && (
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
          <h1 style={{ fontFamily: T.heading, fontSize: "clamp(24px, 5vw, 32px)", marginBottom: 8 }}>
            Recommended for you
          </h1>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 28 }}>
            Based on your profile — tap to select
          </p>
          {recommendations.map(mod => (
            <div
              key={mod.id}
              style={cardStyle(selectedModules.includes(mod.id))}
              onClick={() => toggleModule(mod.id)}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                border: `1.5px solid ${selectedModules.includes(mod.id) ? T.teal : "rgba(255,255,255,0.2)"}`,
                background: selectedModules.includes(mod.id) ? T.teal : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 12, color: T.white,
              }}>
                {selectedModules.includes(mod.id) && "✓"}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{mod.label}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{mod.reason}</div>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <button style={btnGhost} onClick={back}>Back</button>
            <button style={btnPrimary} onClick={next}>Continue</button>
          </div>
        </div>
      )}

      {/* STEP 3: Meet Mira */}
      {step === 3 && (
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center", paddingTop: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(42,181,193,0.15)", border: `2px solid ${T.teal}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 36,
          }}>
            🦉
          </div>
          <h1 style={{ fontFamily: T.heading, fontSize: "clamp(24px, 5vw, 32px)", marginBottom: 8 }}>
            Meet Mira
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 1.7, marginBottom: 8, maxWidth: 360, margin: "0 auto 24px" }}>
            Mira is your GluMira™ companion. She knows everything about insulin science and will explain it like a trusted friend.
          </p>
          <p style={{ color: T.muted, fontSize: 13, marginBottom: 32 }}>
            She'll introduce herself in a short story — then you're ready.
          </p>

          <button style={btnPrimary} onClick={finish}>
            Let's go
          </button>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{ background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer" }}
            >
              Skip to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <div style={{ marginTop: "auto", padding: "24px 0 16px", textAlign: "center" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
          GluMira™ is an educational platform, not a medical device.
        </p>
      </div>
    </div>
  );
}
