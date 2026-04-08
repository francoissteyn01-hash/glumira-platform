/**
 * GluMira™ V7 — Dev Panel
 * Route index for dev phase. No auth required.
 * Scandinavian Minimalist: #f8f9fa bg, #1a2a5e navy, #2ab5c1 teal.
 */

import { useState } from "react";

const BG = "var(--bg-primary)";
const NAVY = "var(--text-primary)";
const TEAL = "var(--accent-teal)";
const MUTED = "var(--text-muted)";
const BORDER = "var(--border)";

type Route = { path: string; name: string };
type Section = { label: string; routes: Route[] };

const SECTIONS: Section[] = [
  {
    label: "CORE",
    routes: [
      { path: "/", name: "Landing" },
      { path: "/auth", name: "Auth" },
      { path: "/dashboard", name: "Dashboard" },
      { path: "/settings", name: "Settings" },
      { path: "/settings/caregivers", name: "Caregivers" },
      { path: "/faq", name: "FAQ" },
    ],
  },
  {
    label: "EDUCATION & AI",
    routes: [
      { path: "/education", name: "Education Hub" },
      { path: "/mira", name: "Mira AI" },
      { path: "/badges", name: "Badges" },
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
      { path: "/modules/adhd", name: "ADHD" },
      { path: "/modules/autism", name: "Autism + T1D" },
      { path: "/modules/menstrual", name: "Menstrual Cycle" },
      { path: "/modules/paediatric", name: "Paediatric" },
      { path: "/modules/pregnancy", name: "Pregnancy" },
      { path: "/modules/school-care", name: "School Care Plan" },
      { path: "/modules/thyroid", name: "Thyroid" },
    ],
  },
  {
    label: "DIETARY MODULES",
    routes: [
      { path: "/modules/bernstein", name: "Bernstein" },
      { path: "/modules/carnivore", name: "Carnivore" },
      { path: "/modules/dash", name: "DASH" },
      { path: "/modules/full-carb", name: "Full Carb (Standard)" },
      { path: "/modules/gluten-free", name: "Gluten-Free (GFD)" },
      { path: "/modules/halal", name: "Halal" },
      { path: "/modules/high-protein", name: "High Protein" },
      { path: "/modules/intermittent-fasting", name: "Intermittent Fasting" },
      { path: "/modules/keto", name: "Keto (Ketogenic)" },
      { path: "/modules/kosher", name: "Kosher" },
      { path: "/modules/low-carb", name: "Low Carb" },
      { path: "/modules/low-gi", name: "Low GI" },
      { path: "/modules/mediterranean", name: "Mediterranean" },
      { path: "/modules/mixed-balanced", name: "Mixed / Balanced" },
      { path: "/modules/paleo", name: "Paleo" },
      { path: "/modules/plant-based", name: "Plant-Based" },
      { path: "/modules/ramadan", name: "Ramadan" },
      { path: "/modules/sick-day", name: "Sick Day" },
      { path: "/modules/vegetarian", name: "Vegetarian" },
      { path: "/modules/zone", name: "Zone" },
    ],
  },
];

export default function DevPanel() {
  const [q, setQ] = useState("");

  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const filtered = SECTIONS
    .map((s) => ({ ...s, routes: s.routes.filter((r) => match(r.name) || match(r.path)) }))
    .filter((s) => s.routes.length > 0);

  const totalRoutes = SECTIONS.reduce((acc, s) => acc + s.routes.length, 0);
  const shownRoutes = filtered.reduce((acc, s) => acc + s.routes.length, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        .dp-root { min-height: 100vh; background: ${BG}; font-family: 'DM Sans', system-ui, sans-serif; color: ${NAVY}; }
        .dp-wrap { max-width: 640px; margin: 0 auto; padding: 0 20px 48px; }

        .dp-sticky {
          position: sticky; top: 0; z-index: 10;
          background: ${BG};
          padding: 24px 0 16px;
          border-bottom: 1px solid ${BORDER};
          margin-bottom: 8px;
        }
        .dp-title-row {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 14px;
        }
        .dp-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; font-weight: 500;
          color: ${TEAL}; letter-spacing: 1.5px;
        }
        .dp-title b { color: #f59e0b; font-weight: 500; }
        .dp-count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: ${MUTED}; letter-spacing: 1px;
        }
        .dp-search {
          width: 100%;
          padding: 11px 14px;
          background: var(--bg-card);
          border: 1px solid ${BORDER};
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; color: ${NAVY};
          outline: none;
          transition: border-color 0.15s;
        }
        .dp-search:focus { border-color: ${TEAL}; }
        .dp-search::placeholder { color: #a0aec0; }

        .dp-section { margin-top: 22px; }
        .dp-section-header {
          display: flex; align-items: center; gap: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 500; letter-spacing: 2px;
          color: ${MUTED};
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .dp-section-header::after {
          content: ''; flex: 1; height: 1px;
          background: ${BORDER};
        }

        .dp-link {
          display: flex; align-items: baseline;
          gap: 10px;
          padding: 10px 2px;
          text-decoration: none;
          color: ${NAVY};
          font-size: 14px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          transition: background 0.12s, padding-left 0.12s;
        }
        .dp-link:hover {
          background: rgba(42,181,193,0.04);
          padding-left: 8px;
        }
        .dp-link:last-child { border-bottom: none; }
        .dp-name { font-weight: 500; white-space: nowrap; }
        .dp-dots {
          flex: 1;
          border-bottom: 1px dotted ${BORDER};
          transform: translateY(-4px);
          min-width: 12px;
        }
        .dp-path {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: ${MUTED};
          white-space: nowrap;
        }

        .dp-empty {
          text-align: center;
          padding: 40px 20px;
          color: ${MUTED};
          font-size: 13px;
        }

        @media (max-width: 480px) {
          .dp-wrap { padding: 0 16px 40px; }
          .dp-name { font-size: 13px; }
          .dp-path { font-size: 10px; }
        }
      `}</style>

      <div className="dp-root">
        <div className="dp-wrap">
          <div className="dp-sticky">
            <div className="dp-title-row">
              <div className="dp-title">GLUMIRA<b>&trade;</b> V7 &middot; DEV</div>
              <div className="dp-count">
                {shownRoutes}/{totalRoutes} routes
              </div>
            </div>
            <input
              className="dp-search"
              type="text"
              placeholder="filter routes..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>

          {filtered.length === 0 ? (
            <div className="dp-empty">No routes match &ldquo;{q}&rdquo;</div>
          ) : (
            filtered.map((section) => (
              <div className="dp-section" key={section.label}>
                <div className="dp-section-header">{section.label}</div>
                {section.routes.map((r) => (
                  <a key={r.path} href={r.path} className="dp-link">
                    <span className="dp-name">{r.name}</span>
                    <span className="dp-dots" />
                    <span className="dp-path">{r.path}</span>
                  </a>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
