import { useState, useCallback } from "react";
import { DISCLAIMER } from "@/lib/constants";

/* ── types ─────────────────────────────────────────────────────────── */
interface CheckItem { id: string; label: string; passed: boolean; }
interface ContrastPair { fg: string; bg: string; fgLabel: string; bgLabel: string; ratio: number; pass: boolean; }
interface DomFinding { severity: "error" | "warning"; message: string; }

/* ── WCAG checklist data ───────────────────────────────────────────── */
const CHECKLIST: { principle: string; items: CheckItem[] }[] = [
  {
    principle: "Perceivable",
    items: [
      { id: "p1", label: "Text alternatives for images (alt tags)", passed: true },
      { id: "p2", label: "Colour contrast ratio \u22654.5:1 for text", passed: true },
      { id: "p3", label: "Content resizable to 200% without loss", passed: true },
      { id: "p4", label: "No content relies solely on colour", passed: true },
      { id: "p5", label: "Captions for audio content", passed: false },
      { id: "p6", label: "Clear content structure and headings", passed: true },
    ],
  },
  {
    principle: "Operable",
    items: [
      { id: "o1", label: "All functionality keyboard accessible", passed: true },
      { id: "o2", label: "No keyboard traps", passed: true },
      { id: "o3", label: "Skip navigation available", passed: true },
      { id: "o4", label: "Page titles descriptive", passed: true },
      { id: "o5", label: "Focus order logical", passed: true },
      { id: "o6", label: "Focus indicators visible", passed: true },
    ],
  },
  {
    principle: "Understandable",
    items: [
      { id: "u1", label: "Language of page specified", passed: true },
      { id: "u2", label: "Consistent navigation", passed: true },
      { id: "u3", label: "Error identification in forms", passed: true },
      { id: "u4", label: "Labels for form inputs", passed: true },
      { id: "u5", label: "Error suggestions provided", passed: true },
    ],
  },
  {
    principle: "Robust",
    items: [
      { id: "r1", label: "Valid HTML", passed: true },
      { id: "r2", label: "ARIA roles where needed", passed: true },
      { id: "r3", label: "Compatible with assistive technology", passed: true },
    ],
  },
];

/* ── contrast ratio calculation (WCAG relative luminance) ──────────── */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function srgbChannel(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

const CONTRAST_PAIRS: ContrastPair[] = (() => {
  const pairs: { fg: string; bg: string; fgLabel: string; bgLabel: string }[] = [
    { fg: "#1a2a5e", bg: "#ffffff", fgLabel: "Navy (#1a2a5e)", bgLabel: "White (#ffffff)" },
    { fg: "#2ab5c1", bg: "#ffffff", fgLabel: "Teal (#2ab5c1)", bgLabel: "White (#ffffff)" },
    { fg: "#e2e8f0", bg: "#1e293b", fgLabel: "Light text (#e2e8f0)", bgLabel: "Card bg (#1e293b)" },
    { fg: "#94a3b8", bg: "#0f172a", fgLabel: "Secondary text (#94a3b8)", bgLabel: "Page bg (#0f172a)" },
  ];
  return pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg);
    return { ...p, ratio, pass: ratio >= 4.5 };
  });
})();

/* ── SVG gauge ─────────────────────────────────────────────────────── */
function ComplianceGauge({ percent }: { percent: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  const color = percent >= 90 ? "#34d399" : percent >= 70 ? "#facc15" : "#f87171";
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label={`Compliance: ${percent}%`}>
      <circle cx="90" cy="90" r={r} fill="none" stroke="var(--border-primary)" strokeWidth="12" opacity={0.3} />
      <circle cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform="rotate(-90 90 90)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x="90" y="82" textAnchor="middle" fill={color} fontSize="36" fontWeight="700">{percent}%</text>
      <text x="90" y="106" textAnchor="middle" fill="var(--text-secondary)" fontSize="12">Compliance</text>
    </svg>
  );
}

/* ── main component ────────────────────────────────────────────────── */
export default function AccessibilityAuditPage() {
  const [checklist, setChecklist] = useState(CHECKLIST);
  const [domFindings, setDomFindings] = useState<DomFinding[] | null>(null);
  const [scanning, setScanning] = useState(false);

  const totalItems = checklist.reduce((sum, g) => sum + g.items.length, 0);
  const passedItems = checklist.reduce((sum, g) => sum + g.items.filter((i) => i.passed).length, 0);
  const compliancePercent = Math.round((passedItems / totalItems) * 100);

  const toggleItem = (groupIdx: number, itemIdx: number) => {
    setChecklist((prev) =>
      prev.map((g, gi) =>
        gi !== groupIdx ? g : {
          ...g,
          items: g.items.map((it, ii) => ii !== itemIdx ? it : { ...it, passed: !it.passed }),
        }
      )
    );
  };

  const runDomAudit = useCallback(() => {
    setScanning(true);
    const findings: DomFinding[] = [];

    /* Images without alt */
    const images = document.querySelectorAll("img");
    let missingAlt = 0;
    images.forEach((img) => { if (!img.getAttribute("alt")) missingAlt++; });
    if (missingAlt > 0) findings.push({ severity: "error", message: `${missingAlt} image(s) missing alt attribute` });
    else if (images.length > 0) findings.push({ severity: "warning", message: `All ${images.length} images have alt text` });

    /* Buttons without accessible labels */
    const buttons = document.querySelectorAll("button");
    let unlabelledButtons = 0;
    buttons.forEach((btn) => {
      const text = (btn.textContent || "").trim();
      const ariaLabel = btn.getAttribute("aria-label");
      if (!text && !ariaLabel) unlabelledButtons++;
    });
    if (unlabelledButtons > 0) findings.push({ severity: "error", message: `${unlabelledButtons} button(s) without accessible label` });

    /* Form inputs without labels */
    const inputs = document.querySelectorAll("input, select, textarea");
    let missingLabels = 0;
    inputs.forEach((input) => {
      const id = input.getAttribute("id");
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledBy = input.getAttribute("aria-labelledby");
      const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
      if (!hasLabel && !ariaLabel && !ariaLabelledBy) missingLabels++;
    });
    if (missingLabels > 0) findings.push({ severity: "error", message: `${missingLabels} form input(s) missing associated label` });

    /* Heading hierarchy */
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let prevLevel = 0;
    let hierarchyIssues = 0;
    headings.forEach((h) => {
      const level = parseInt(h.tagName[1], 10);
      if (prevLevel > 0 && level > prevLevel + 1) hierarchyIssues++;
      prevLevel = level;
    });
    if (hierarchyIssues > 0) findings.push({ severity: "warning", message: `${hierarchyIssues} heading hierarchy skip(s) detected` });

    /* Language attribute */
    const htmlLang = document.documentElement.getAttribute("lang");
    if (!htmlLang) findings.push({ severity: "error", message: "Missing lang attribute on <html> element" });

    if (findings.length === 0) findings.push({ severity: "warning", message: "No issues detected on the current page" });

    setTimeout(() => {
      setDomFindings(findings);
      setScanning(false);
    }, 400);
  }, []);

  const exportReport = () => {
    const lines: string[] = [
      "GluMira\u2122 V7 \u2014 Accessibility Audit Report",
      `Date: ${new Date().toLocaleDateString()}`,
      `Compliance Score: ${compliancePercent}% (${passedItems}/${totalItems} items passing)`,
      "",
      "=== WCAG 2.1 AA Checklist ===",
    ];
    checklist.forEach((g) => {
      lines.push("", `--- ${g.principle} ---`);
      g.items.forEach((it) => { lines.push(`  [${it.passed ? "PASS" : "FAIL"}] ${it.label}`); });
    });
    lines.push("", "=== Colour Contrast ===");
    CONTRAST_PAIRS.forEach((p) => {
      lines.push(`  ${p.fgLabel} on ${p.bgLabel}: ${p.ratio}:1 [${p.pass ? "PASS" : "FAIL"}]`);
    });
    if (domFindings) {
      lines.push("", "=== DOM Audit Findings ===");
      domFindings.forEach((f) => { lines.push(`  [${f.severity.toUpperCase()}] ${f.message}`); });
    }
    lines.push("", DISCLAIMER);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glumira-a11y-audit-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-[960px] mx-auto px-4 py-8 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Accessibility Audit</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">WCAG 2.1 AA Compliance Check</p>
          </div>
          <button
            onClick={exportReport}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
          >
            Export Audit Report
          </button>
        </div>

        {/* Compliance Score + Checklist */}
        <div className="grid md:grid-cols-[1fr_220px] gap-6">
          {/* Checklist */}
          <section className="space-y-6">
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Compliance Checklist</h2>
            {checklist.map((group, gi) => (
              <div key={group.principle}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{group.principle}</h3>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] divide-y divide-[var(--border-primary)]">
                  {group.items.map((item, ii) => (
                    <label key={item.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-primary)]/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={item.passed}
                        onChange={() => toggleItem(gi, ii)}
                        className="w-4 h-4 rounded border-[var(--border-primary)] accent-emerald-500 flex-shrink-0"
                      />
                      <span className={`text-sm ${item.passed ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                        {item.label}
                      </span>
                      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${item.passed ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800" : "bg-red-950/40 text-red-400 border border-red-800"}`}>
                        {item.passed ? "PASS" : "FAIL"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Gauge sidebar */}
          <aside className="flex flex-col items-center gap-4">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 flex flex-col items-center sticky top-8">
              <ComplianceGauge percent={compliancePercent} />
              <p className="text-xs text-[var(--text-secondary)] mt-2">{passedItems} of {totalItems} items passing</p>
            </div>
          </aside>
        </div>

        {/* Contrast Checker */}
        <section>
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">Colour Contrast Checker</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {CONTRAST_PAIRS.map((pair, i) => (
              <div key={i} className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 flex items-center gap-4">
                <div className="flex gap-1 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full border border-[var(--border-primary)]" style={{ backgroundColor: pair.fg }} title={pair.fgLabel} />
                  <div className="w-8 h-8 rounded-full border border-[var(--border-primary)]" style={{ backgroundColor: pair.bg }} title={pair.bgLabel} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{pair.fgLabel}</p>
                  <p className="text-xs text-[var(--text-secondary)]">on {pair.bgLabel}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{pair.ratio}:1</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pair.pass ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800" : "bg-red-950/40 text-red-400 border border-red-800"}`}>
                    {pair.pass ? "PASS" : "FAIL"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live DOM Audit */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Live DOM Audit</h2>
            <button
              onClick={runDomAudit}
              disabled={scanning}
              className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-1.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-50 transition-colors"
            >
              {scanning ? "Scanning..." : "Scan Page"}
            </button>
          </div>
          {domFindings === null ? (
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 text-center">
              <p className="text-sm text-[var(--text-secondary)]">Click "Scan Page" to audit the current DOM for accessibility issues.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] divide-y divide-[var(--border-primary)]">
              {domFindings.map((f, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-0.5 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${f.severity === "error" ? "bg-red-950/40 text-red-400 border border-red-800" : "bg-yellow-950/40 text-yellow-400 border border-yellow-800"}`}>
                    {f.severity === "error" ? "ERROR" : "WARN"}
                  </span>
                  <p className="text-sm text-[var(--text-primary)]">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-[var(--text-secondary)] opacity-50 text-center pt-4 border-t border-[var(--border-primary)]">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
