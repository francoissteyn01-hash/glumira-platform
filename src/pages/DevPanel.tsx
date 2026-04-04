import { useState } from "react";

const NAVY = "#1a2a5e";
const NAVY_DEEP = "#0D1B3E";
const TEAL = "#2ab5c1";
const AMBER = "#f59e0b";

const SECTIONS = [
  {
    label: "CORE",
    routes: [
      { path: "/", name: "Landing Page" },
      { path: "/auth", name: "Auth" },
      { path: "/dashboard", name: "Dashboard" },
      { path: "/settings", name: "Settings" },
      { path: "/settings/caregivers", name: "Caregiver Management" },
      { path: "/faq", name: "FAQ" },
    ],
  },
  {
    label: "EDUCATION & AI",
    routes: [
      { path: "/education", name: "Education Hub" },
      { path: "/education/topic/1", name: "Education Topic (sample)" },
      { path: "/mira", name: "Mira AI Chat" },
      { path: "/badges", name: "Badge System" },
    ],
  },
  {
    label: "ONBOARDING",
    routes: [
      { path: "/onboarding/story", name: "Story Engine" },
      { path: "/meals/plan", name: "Meal Plan" },
    ],
  },
  {
    label: "CLINICAL MODULES",
    routes: [
      { path: "/modules/pregnancy", name: "Pregnancy" },
      { path: "/modules/paediatric", name: "Paediatric" },
      { path: "/modules/school-care", name: "School Care Plan" },
      { path: "/modules/menstrual", name: "Menstrual Cycle" },
      { path: "/modules/adhd", name: "ADHD" },
      { path: "/modules/thyroid", name: "Thyroid" },
    ],
  },
  {
    label: "DIETARY MODULES",
    routes: [
      { path: "/modules/ramadan", name: "Ramadan" },
      { path: "/modules/kosher", name: "Kosher" },
      { path: "/modules/halal", name: "Halal" },
      { path: "/modules/bernstein", name: "Bernstein Protocol" },
      { path: "/modules/sick-day", name: "Sick Day Management" },
    ],
  },
  {
    label: "SAFE MODE",
    routes: [
      { path: "/safe-mode", name: "Safe Mode Hub" },
      { path: "/safe-mode/profile/demo-parent-toddler", name: "Demo: Sarah & Lily" },
      { path: "/safe-mode/profile/demo-teen", name: "Demo: Aisha (Teen)" },
      { path: "/safe-mode/profile/demo-clinician", name: "Demo: Dr Naidoo" },
      { path: "/safe-mode/create", name: "Create Custom Profile" },
    ],
  },
  {
    label: "API ENDPOINTS",
    routes: [
      { path: "/api/auth", name: "Auth API", api: true },
      { path: "/api/iob", name: "IOB Calculator API", api: true },
      { path: "/api/patient", name: "Patient API", api: true },
      { path: "/api/caregiver", name: "Caregiver API", api: true },
      { path: "/api/mira", name: "Mira AI API", api: true },
      { path: "/api/education", name: "Education API", api: true },
      { path: "/api/meal-plan", name: "Meal Plan API", api: true },
      { path: "/api/adhd", name: "ADHD API", api: true },
      { path: "/api/thyroid", name: "Thyroid API", api: true },
      { path: "/api/badges", name: "Badges API", api: true },
      { path: "/api/analytics", name: "Analytics API", api: true },
      { path: "/api/settings", name: "Settings API", api: true },
      { path: "/api/subscription", name: "Subscription API", api: true },
      { path: "/api/feedback", name: "Feedback API", api: true },
      { path: "/api/school-care-plan", name: "School Care Plan API", api: true },
      { path: "/api/glucose-prediction", name: "Glucose Prediction API", api: true },
    ],
  },
  {
    label: "INFRASTRUCTURE",
    routes: [
      { path: "https://glumira-platform-production.up.railway.app", name: "Railway Backend", ext: true },
      { path: "https://supabase.com/dashboard/project/lsmxsqgckcxsbayfdtxs", name: "Supabase Dashboard", ext: true },
      { path: "https://github.com/francoissteyn01-hash/glumira-platform", name: "GitHub Repo", ext: true },
      { path: "https://app.netlify.com", name: "Netlify Deploys", ext: true },
    ],
  },
];

const TIER_MAP: Record<string, string[]> = {
  "Free": ["Landing Page", "Auth", "Dashboard", "Education Hub", "Mira AI Chat", "Badge System", "FAQ", "Settings", "Story Engine"],
  "Pro": ["Meal Plan", "Pregnancy", "Paediatric", "School Care Plan", "Menstrual Cycle", "Ramadan", "Kosher", "Halal", "Bernstein Protocol", "Sick Day Management"],
  "AI": ["ADHD", "Thyroid"],
  "Clinical": ["Caregiver Management"],
};

export default function DevPanel() {
  const [filter, setFilter] = useState("");

  const filtered = SECTIONS.map((s) => ({
    ...s,
    routes: s.routes.filter(
      (r) =>
        r.name.toLowerCase().includes(filter.toLowerCase()) ||
        r.path.toLowerCase().includes(filter.toLowerCase())
    ),
  })).filter((s) => s.routes.length > 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .dev-page {
          min-height: 100vh;
          background: ${NAVY_DEEP};
          color: #c8d6e5;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
        }

        .dev-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 20px;
          border-bottom: 1px solid rgba(42,181,193,0.15);
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .dev-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          color: ${TEAL};
          letter-spacing: 1px;
        }
        .dev-title span {
          color: ${AMBER};
        }

        .dev-search {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(42,181,193,0.2);
          border-radius: 6px;
          padding: 8px 14px;
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          outline: none;
          width: 260px;
          max-width: 100%;
          transition: border-color 0.2s;
        }
        .dev-search:focus {
          border-color: ${TEAL};
        }
        .dev-search::placeholder {
          color: #4a5568;
        }

        .dev-section {
          margin-bottom: 28px;
        }
        .dev-section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          color: #4a5568;
          margin-bottom: 10px;
          padding-left: 2px;
        }

        .dev-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 6px;
        }

        .dev-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 6px;
          text-decoration: none;
          color: #c8d6e5;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s;
          cursor: pointer;
        }
        .dev-link:hover {
          background: rgba(42,181,193,0.08);
          border-color: rgba(42,181,193,0.25);
          color: white;
        }
        .dev-link .path {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #4a5568;
          margin-top: 2px;
        }
        .dev-link .tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 3px;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .tag-api {
          background: rgba(245,158,11,0.15);
          color: ${AMBER};
        }
        .tag-ext {
          background: rgba(42,181,193,0.12);
          color: ${TEAL};
        }

        .dev-stats {
          display: flex;
          gap: 24px;
          padding: 14px 0;
          border-top: 1px solid rgba(42,181,193,0.1);
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .dev-stat {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #4a5568;
        }
        .dev-stat strong {
          color: ${TEAL};
          font-size: 18px;
          display: block;
          margin-bottom: 2px;
        }

        @media (max-width: 600px) {
          .dev-grid {
            grid-template-columns: 1fr;
          }
          .dev-search {
            width: 100%;
          }
        }
      `}</style>

      <div className="dev-page">
        <div className="dev-header">
          <div className="dev-title">
            GLUMIRA<span>&trade;</span> V7 &mdash; DEV PANEL
          </div>
          <input
            className="dev-search"
            type="text"
            placeholder="filter routes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {filtered.map((section) => (
          <div className="dev-section" key={section.label}>
            <div className="dev-section-label">{section.label}</div>
            <div className="dev-grid">
              {section.routes.map((r: any) => (
                <a
                  key={r.path}
                  className="dev-link"
                  href={r.path}
                  target={r.ext ? "_blank" : undefined}
                  rel={r.ext ? "noopener noreferrer" : undefined}
                >
                  <div>
                    <div>{r.name}</div>
                    <div className="path">{r.path}</div>
                  </div>
                  {r.api && <span className="tag tag-api">API</span>}
                  {r.ext && <span className="tag tag-ext">EXT</span>}
                </a>
              ))}
            </div>
          </div>
        ))}

        <div className="dev-stats">
          <div className="dev-stat"><strong>6</strong>core pages</div>
          <div className="dev-stat"><strong>11</strong>modules</div>
          <div className="dev-stat"><strong>16</strong>API routes</div>
          <div className="dev-stat"><strong>4</strong>infra links</div>
          <div className="dev-stat"><strong>23</strong>tables</div>
        </div>
      </div>
    </>
  );
}
