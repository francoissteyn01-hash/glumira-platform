/**
 * GluMira™ V7 — LandingPageV2.tsx
 *
 * Redesigned 2026-04-17: IOB Hunter as crown jewel hero, day/night toggle,
 * research + subscriber dual track, female health / Ramadan module suite.
 * Section order mirrors top-performing SaaS (Flo, Levels, Eight Sleep):
 *   Nav → IOB Hero → Evidence Bar → "Only Platform" differentiator →
 *   Module Suite → Research Track → Quiz Match → Support Tiers →
 *   Pricing → Owl / Final CTA → Footer
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

type QuizStep = 0 | 1 | 2 | 3;
type DiabetesType = "t1d" | "t2d" | "gdm" | "caregiver";
type CgmBrand = "dexcom" | "libre" | "nightscout" | "none";
type Goal = "stacking" | "overnight" | "pregnancy" | "pediatric";

const QUIZ_STEPS: { title: string; hint: string }[] = [
  { title: "Who is this for?",        hint: "You, your child, or someone you care for." },
  { title: "Which CGM do you use?",   hint: "We plug into whatever you already have." },
  { title: "What's the #1 worry?",    hint: "We'll tune the dashboard to that first." },
];

export default function LandingPageV2() {
  const [quizStep, setQuizStep] = useState<QuizStep>(0);
  const [dtype, setDtype] = useState<DiabetesType | null>(null);
  const [cgm, setCgm] = useState<CgmBrand | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  const advance = () => setQuizStep((s) => (s < 3 ? ((s + 1) as QuizStep) : s));

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1B3E] text-slate-900 dark:text-white font-[DM_Sans] transition-colors duration-300">
      <TopNav />
      <IobHero />
      <EvidenceBar />
      <OnlyPlatformSection />
      <ModuleSuiteSection />
      <ResearchSection />
      <QuizSection
        quizStep={quizStep}
        dtype={dtype}
        cgm={cgm}
        goal={goal}
        onDtype={(d) => { setDtype(d); advance(); }}
        onCgm={(c) => { setCgm(c); advance(); }}
        onGoal={(g) => { setGoal(g); advance(); }}
        onReset={() => { setQuizStep(0); setDtype(null); setCgm(null); setGoal(null); }}
      />
      <SupportStack />
      <Pricing />
      <EvidenceQuote />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* TOP NAV                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function TopNav() {
  const { toggle, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0D1B3E]/90 backdrop-blur border-b border-slate-200 dark:border-white/10 transition-colors duration-300">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/brand/mira-hero.png" alt="Mira" style={{ width: 36, height: 36, objectFit: "contain", mixBlendMode: "multiply" }} />
          <span className="font-[Playfair_Display] text-xl font-bold tracking-tight text-[#0D2149] dark:text-white">
            GluMira<span className="text-[#2AB5C1]">™</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
          <a href="#iob-hunter" className="hover:text-[#2AB5C1] transition-colors">IOB Hunter™</a>
          <a href="#modules"    className="hover:text-[#2AB5C1] transition-colors">Modules</a>
          <a href="#research"   className="hover:text-[#2AB5C1] transition-colors">Research</a>
          <a href="#pricing"    className="hover:text-[#2AB5C1] transition-colors">Pricing</a>
          <Link to="/clinician" className="hover:text-[#2AB5C1] transition-colors">Clinicians</Link>
        </nav>

        {/* Right: theme toggle + auth + CTA */}
        <div className="flex items-center gap-2">
          {/* Day/Night toggle */}
          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>

          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center h-10 px-4 text-sm text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/auth?plan=free"
            className="inline-flex items-center h-10 px-4 rounded-full bg-[#0D2149] dark:bg-[#2AB5C1] text-white dark:text-[#0D1B3E] text-sm font-semibold hover:bg-[#1A2A5E] dark:hover:bg-[#25a3ae] transition-colors cursor-pointer"
          >
            Try free
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden w-10 h-10 flex items-center justify-center"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Open menu"
          >
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-[#0D2149] border-t border-slate-200 dark:border-white/10 px-4 py-4 flex flex-col gap-3 text-sm">
          <a href="#iob-hunter" onClick={() => setMobileOpen(false)} className="py-2 text-slate-700 dark:text-slate-200">IOB Hunter™</a>
          <a href="#modules"    onClick={() => setMobileOpen(false)} className="py-2 text-slate-700 dark:text-slate-200">Modules</a>
          <a href="#research"   onClick={() => setMobileOpen(false)} className="py-2 text-slate-700 dark:text-slate-200">Research</a>
          <a href="#pricing"    onClick={() => setMobileOpen(false)} className="py-2 text-slate-700 dark:text-slate-200">Pricing</a>
          <Link to="/auth"      onClick={() => setMobileOpen(false)} className="py-2 text-slate-700 dark:text-slate-200">Sign in</Link>
        </div>
      )}
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* HERO — IOB Hunter front and centre                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

function IobHero() {
  return (
    <section
      id="iob-hunter"
      className="relative overflow-hidden bg-gradient-to-b from-[#0D2149] via-[#1A2A5E] to-[#0D2149]"
    >
      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(42,181,193,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,181,193,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-0">
        {/* Eyebrow */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#2AB5C1]/20 border border-[#2AB5C1]/40 px-4 py-1.5 text-xs uppercase tracking-widest text-[#2AB5C1] font-semibold">
            <SparkIcon className="w-3 h-3" />
            Crown Jewel — No other platform shows you this
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center font-[Playfair_Display] text-white leading-tight font-bold mb-5"
          style={{ fontSize: "clamp(38px, 6vw, 76px)" }}>
          The science of insulin,<br />
          <span className="text-[#2AB5C1]" style={{ textShadow: "0 0 40px rgba(42,181,193,0.5)" }}>
            made visible.
          </span>
        </h1>

        <p className="text-center text-slate-300 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          IOB Hunter™ renders the pharmacokinetic curve of every insulin still active in
          your body — stacked, in real time. 13+ insulins. Global regional variants.
          Evidence-grounded in FDA / EMA PK data and Plank 2005.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Link
            to="/auth?plan=free"
            className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-[#2AB5C1] text-[#0D1B3E] text-sm font-bold hover:bg-[#25a3ae] transition-colors cursor-pointer"
          >
            Try IOB Hunter™ — free
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
          >
            See live demo →
          </Link>
        </div>

        {/* Trust pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {["Plank 2005 PK data", "FDA / EMA validated", "13+ insulins", "Dexcom · Libre · Nightscout", "Educational platform"].map((p) => (
            <span key={p} className="inline-flex items-center h-7 px-3 rounded-full bg-white/8 border border-white/15 text-xs text-slate-300">
              {p}
            </span>
          ))}
        </div>

        {/* IOB visualization — full width, anchored to bottom of hero */}
        <div className="relative rounded-t-2xl overflow-hidden border-t border-x border-white/15 bg-[#0a1838]/80 backdrop-blur">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs text-slate-400 font-mono">IOB Hunter™ — Live stacking view</span>
            <span className="ml-auto text-xs text-[#2AB5C1] font-semibold">● LIVE</span>
          </div>
          <div className="p-5 md:p-8">
            <IOBVisualization />
          </div>
        </div>
      </div>
    </section>
  );
}

function IOBVisualization() {
  return (
    <div>
      {/* Labels row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-8 h-0.5 bg-[#2AB5C1] inline-block rounded" />Tresiba (basal)</span>
          <span className="flex items-center gap-1.5 text-[#F59E0B]"><span className="w-8 h-0.5 bg-[#F59E0B] inline-block rounded" />Humalog (bolus)</span>
          <span className="flex items-center gap-1.5 text-white/60"><span className="w-8 h-0.5 bg-white/60 inline-block rounded border-dashed" />Total IOB</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold">⚠ Stacking risk 11:00–12:30</span>
        </div>
      </div>

      {/* SVG chart */}
      <svg viewBox="0 0 800 220" className="w-full h-auto" role="img" aria-label="IOB Hunter pharmacokinetic stacking visualization">
        <defs>
          <linearGradient id="gradBasal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2AB5C1" stopOpacity="0.4" />
            <stop offset="1" stopColor="#2AB5C1" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="gradBolus" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#F59E0B" stopOpacity="0.45" />
            <stop offset="1" stopColor="#F59E0B" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="gradTotal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.02" />
          </linearGradient>
          {/* Stacking danger zone */}
          <linearGradient id="gradDanger" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#ef4444" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ef4444" stopOpacity="0.12" />
            <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid */}
        {[40, 90, 140, 190].map((y) => (
          <line key={y} x1="0" x2="800" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
        ))}

        {/* Y-axis labels */}
        <text x="6" y="44"  fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="DM Sans">100%</text>
        <text x="6" y="94"  fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="DM Sans">75%</text>
        <text x="6" y="144" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="DM Sans">50%</text>
        <text x="6" y="194" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="DM Sans">25%</text>

        {/* X-axis time labels */}
        {["00:00","03:00","06:00","09:00","12:00","15:00","18:00","21:00","24:00"].map((t, i) => (
          <text key={t} x={i * 100} y="215" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="DM Sans" textAnchor="middle">{t}</text>
        ))}

        {/* Danger zone overlay */}
        <rect x="370" y="0" width="200" height="200" fill="url(#gradDanger)" />

        {/* Basal curve — Tresiba flat plateau, starts non-zero */}
        <path
          d="M0 130 C50 128 100 125 200 122 S400 118 600 120 S750 122 800 124"
          stroke="#2AB5C1" strokeWidth="2.5" fill="none" strokeLinecap="round"
        />
        <path
          d="M0 130 C50 128 100 125 200 122 S400 118 600 120 S750 122 800 124 L800 210 L0 210 Z"
          fill="url(#gradBasal)"
        />

        {/* Bolus 1 — morning injection ~07:00 */}
        <path
          d="M230 200 C250 160 270 80 310 55 C350 30 380 50 410 90 C440 130 460 170 490 200"
          stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round"
        />
        <path
          d="M230 200 C250 160 270 80 310 55 C350 30 380 50 410 90 C440 130 460 170 490 200 Z"
          fill="url(#gradBolus)"
        />

        {/* Bolus 2 — stacking injection ~10:00 */}
        <path
          d="M370 200 C385 175 400 110 430 75 C460 40 490 55 520 95 C550 135 565 170 580 200"
          stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="5 3"
        />

        {/* Total IOB outline */}
        <path
          d="M0 128 C100 122 200 100 310 52 C350 28 395 45 430 72 C470 55 505 60 530 90 C560 120 600 118 700 120 L800 122"
          stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"
        />

        {/* Injection markers */}
        <line x1="230" x2="230" y1="60" y2="200" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="230" cy="58" r="4" fill="#F59E0B" />
        <text x="234" y="54" fill="#F59E0B" fontSize="9" fontFamily="DM Sans">Bolus 1</text>

        <line x1="370" x2="370" y1="80" y2="200" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="370" cy="78" r="4" fill="#ef4444" />
        <text x="374" y="74" fill="#ef4444" fontSize="9" fontFamily="DM Sans">Bolus 2 ⚠</text>

        {/* Peak label */}
        <text x="305" y="44" fill="#F59E0B" fontSize="10" fontFamily="DM Sans" fontWeight="600">Peak 09:45</text>
      </svg>

      <p className="mt-3 text-xs text-slate-500 italic text-center">
        Illustrative PK curves — your actual profile is built from your regimen and CGM data. Educational only.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* EVIDENCE BAR                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function EvidenceBar() {
  return (
    <section className="bg-slate-50 dark:bg-[#0D2149]/60 border-y border-slate-200 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Built on evidence from</span>
          {["Plank 2005 · PMID:15855574", "ADA Standards of Care", "NICE NG3", "CONCEPTT", "FDA / EMA PK data"].map((e) => (
            <span key={e} className="text-sm font-medium text-slate-700 dark:text-slate-200">{e}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ONLY PLATFORM — competitive differentiator                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function OnlyPlatformSection() {
  return (
    <section className="bg-[#0D2149] dark:bg-[#0a1430] text-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="inline-block rounded-full bg-[#2AB5C1]/20 border border-[#2AB5C1]/40 px-4 py-1.5 text-xs uppercase tracking-widest text-[#2AB5C1] font-semibold mb-5">
            No other platform does this
          </span>
          <h2 className="font-[Playfair_Display] text-white leading-tight font-bold mb-5"
            style={{ fontSize: "clamp(26px, 4vw, 44px)" }}>
            Every other app shows you a number.<br />
            <span className="text-[#2AB5C1]">GluMira™ shows you the shape.</span>
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            When insulin stacks, your CGM shows you a low — after it happens.
            IOB Hunter™ shows you the collision coming — before it happens.
            That's the difference between reacting and understanding.
          </p>
        </div>

        {/* Comparison grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* What others do */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-7">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">Other platforms</p>
            <ul className="space-y-4">
              {[
                "Shows glucose number — not what caused it",
                "Logs insulin dose — doesn't model what it's doing",
                "Static dose calculator — ignores active insulin from previous doses",
                "No stacking detection — finds out after hypoglycemia",
                "One insulin type — misses global formulations",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                  <XIcon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* What GluMira does */}
          <div className="rounded-2xl bg-[#2AB5C1]/10 border border-[#2AB5C1]/30 p-7">
            <p className="text-xs uppercase tracking-widest text-[#2AB5C1] mb-4">GluMira™ IOB Hunter™</p>
            <ul className="space-y-4">
              {[
                "Renders pharmacokinetic curve — the full shape of insulin action",
                "Models every active dose simultaneously — stacked, real-time",
                "Detects overlap before it drives a low — with time to act",
                "13+ insulin types, global brand variants, dose-dependent DOA",
                "Evidence citations per profile — FDA/EMA/PMID, not guesswork",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white">
                  <CheckIcon className="w-4 h-4 text-[#2AB5C1] mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Research angle */}
        <p className="mt-8 text-center text-sm text-slate-400 max-w-2xl mx-auto">
          This visualization is the foundation of GluMira's research programme —
          generating IRB-quality cohort data that no other platform can produce.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* MODULE SUITE                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function ModuleSuiteSection() {
  return (
    <section id="modules" className="py-20 md:py-28 bg-white dark:bg-[#0D1B3E]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl mb-12">
          <span className="inline-block rounded-full bg-[#2AB5C1]/10 dark:bg-[#2AB5C1]/20 px-3 py-1.5 text-xs uppercase tracking-widest text-[#0D2149] dark:text-[#2AB5C1] font-semibold mb-5">
            Specialised modules
          </span>
          <h2 className="font-[Playfair_Display] text-[#0D2149] dark:text-white leading-tight font-bold mb-4"
            style={{ fontSize: "clamp(24px, 3.5vw, 40px)" }}>
            T1D doesn't live in a vacuum.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
            Hormones, fasting, growth, pregnancy — every one changes insulin sensitivity.
            GluMira layers T1D protocols on top of each life stage and lifestyle module.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ModuleCard
            icon="♀"
            color="#A78BFA"
            kicker="Female Health Suite"
            title="Menstrual Cycle · Pregnancy · Menopause"
            body="Cycle-phase ISF overlays, CONCEPTT-aligned pregnancy targets, menopause insulin resistance modelling. Like Flo — but for T1D."
            badge="Pro"
            href="/modules/menstrual"
          />
          <ModuleCard
            icon="☪"
            color="#34D399"
            kicker="Ramadan Research Engine"
            title="Ramadan Fasting Module"
            body="Full-scale Suhoor/Iftar IOB analysis, basal adjustment protocols, anonymous cohort data collection for clinical research. EMRO-focused."
            badge="Research"
            href="/modules/ramadan"
          />
          <ModuleCard
            icon="🌱"
            color="#F59E0B"
            kicker="Pediatric + Teen Growth"
            title="Growth · School Care · Teen Support"
            body="Age-appropriate dashboards, school care plan PDF generator, growth-phase insulin sensitivity tracking. ISPAD-aligned."
            badge="Free"
            href="/modules/paediatric"
          />
          <ModuleCard
            icon="🤰"
            color="#FB923C"
            kicker="Pregnancy Assist"
            title="Gestational & Pre-conception"
            body="Trimester-aware ISF and carb-ratio reminders, NICE NG3 targets, weekly educator async check-in for gestational diabetes."
            badge="Pro"
            href="/modules/pregnancy"
          />
          <ModuleCard
            icon="🩺"
            color="#2AB5C1"
            kicker="Clinician Portal"
            title="For Endocrinologists & Educators"
            body="Share IOB Hunter™ trend reports with your care team. Audit trails, RLS, and caregiver permission controls built in."
            badge="Clinic"
            href="/clinician"
          />
          <ModuleCard
            icon="📊"
            color="#60A5FA"
            kicker="Research Portal"
            title="For Researchers & Institutions"
            body="IRB-quality anonymous cohort data export. FHIR / CSV / de-identified JSON. Publish with GluMira as your data source."
            badge="Research"
            href="/researcher"
          />
        </div>
      </div>
    </section>
  );
}

function ModuleCard({
  icon, color, kicker, title, body, badge, href,
}: {
  icon: string; color: string; kicker: string; title: string;
  body: string; badge: string; href: string;
}) {
  const badgeColor: Record<string, string> = {
    Free: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    Pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    Research: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    Clinic: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  };

  return (
    <Link to={href} className="group block rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 hover:border-[#2AB5C1] hover:shadow-lg dark:hover:shadow-[#2AB5C1]/10 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${color}20` }}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${badgeColor[badge] ?? badgeColor.Free}`}>
          {badge}
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color }}>{kicker}</p>
      <h3 className="font-[Playfair_Display] text-lg font-bold text-[#0D2149] dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{body}</p>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* RESEARCH SECTION — dual track                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function ResearchSection() {
  return (
    <section id="research" className="bg-[#0D2149] dark:bg-[#060e20] text-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: subscriber angle */}
          <div>
            <span className="inline-block rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 px-3 py-1.5 text-xs uppercase tracking-widest text-[#F59E0B] font-semibold mb-5">
              For subscribers
            </span>
            <h2 className="font-[Playfair_Display] text-white text-3xl md:text-4xl font-bold leading-tight mb-4">
              Understand your insulin.<br />Not just your glucose.
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mb-6">
              Every logged dose becomes a pharmacokinetic model. Watch the curves, spot
              the overlap, share the trend report with your educator. Your data, made
              legible.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              {[
                "14-day free trial — no card required",
                "IOB Hunter™ full engine on the free tier",
                "PDF clinical reports on Pro ($29.99/mo)",
                "AI insights on the AI tier ($49.99/mo)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                to="/auth?plan=free"
                className="inline-flex items-center h-12 px-6 rounded-full bg-[#F59E0B] text-[#0D2149] text-sm font-bold hover:bg-[#e8900a] transition-colors cursor-pointer"
              >
                Start free trial
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>

          {/* Right: research angle */}
          <div>
            <span className="inline-block rounded-full bg-[#2AB5C1]/20 border border-[#2AB5C1]/40 px-3 py-1.5 text-xs uppercase tracking-widest text-[#2AB5C1] font-semibold mb-5">
              For researchers &amp; institutions
            </span>
            <h2 className="font-[Playfair_Display] text-white text-3xl md:text-4xl font-bold leading-tight mb-4">
              The only platform generating<br />
              <span className="text-[#2AB5C1]">IRB-quality IOB cohort data.</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mb-6">
              Every consenting user contributes to an anonymised PK dataset no other
              platform can produce. Ramadan fasting cohorts, female hormonal cycles,
              pediatric growth phases — all with real IOB curves attached.
            </p>
            <ul className="space-y-3 text-sm text-slate-300">
              {[
                "Anonymous cohort export — FHIR / CSV / JSON",
                "Ramadan engine — Suhoor/Iftar stacking analysis",
                "Researcher portal with ORCID integration",
                "Publication-ready de-identified datasets",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-[#2AB5C1] mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/researcher"
                className="inline-flex items-center h-12 px-6 rounded-full border border-[#2AB5C1] text-[#2AB5C1] text-sm font-semibold hover:bg-[#2AB5C1]/10 transition-colors cursor-pointer"
              >
                Researcher portal →
              </Link>
              <Link
                to="/donate"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[#F59E0B] text-[#0D2149] text-sm font-bold hover:bg-[#e8900a] transition-colors cursor-pointer"
              >
                <span aria-hidden>🎗️</span>
                Donate to research
                <span className="ml-1 inline-flex items-center h-6 px-2 rounded-full bg-[#0D2149] text-[#F59E0B] text-[10px] font-bold uppercase tracking-wider">
                  Champion badge
                </span>
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Any donation — in any currency — unlocks the Research Champion badge on your profile. Funds open-source the PK engine and keep the free tier free.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* QUIZ SECTION                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function QuizSection(props: {
  quizStep: QuizStep;
  dtype: DiabetesType | null;
  cgm: CgmBrand | null;
  goal: Goal | null;
  onDtype: (d: DiabetesType) => void;
  onCgm: (c: CgmBrand) => void;
  onGoal: (g: Goal) => void;
  onReset: () => void;
}) {
  const { quizStep, dtype, cgm, goal, onDtype, onCgm, onGoal, onReset } = props;
  const complete = quizStep === 3;

  return (
    <section id="quiz" className="py-20 md:py-28 bg-slate-50 dark:bg-[#0D2149]/40">
      <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block rounded-full bg-[#2AB5C1]/10 dark:bg-[#2AB5C1]/20 px-3 py-1.5 text-xs uppercase tracking-widest text-[#0D2149] dark:text-[#2AB5C1] font-semibold mb-5">
            60-second match
          </span>
          <h2 className="font-[Playfair_Display] text-[#0D2149] dark:text-white text-3xl md:text-4xl font-bold leading-tight mb-4">
            Your regimen is unique.<br />Your dashboard should be too.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-6">
            Three questions. We'll match you to the GluMira™ dashboard, educator, and
            care pathway that fits — not a generic diabetes app.
          </p>
          <div className="flex flex-wrap gap-2">
            {["No credit card", "Free tier is real", "Change anytime"].map((p) => (
              <span key={p} className="inline-flex items-center h-8 px-3 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 text-xs text-slate-600 dark:text-slate-300">
                <CheckIcon className="w-3 h-3 text-[#2AB5C1] mr-1.5" />{p}
              </span>
            ))}
          </div>
        </div>

        {/* Quiz card */}
        <div className="bg-white dark:bg-[#0D2149] rounded-2xl shadow-xl dark:shadow-black/40 border border-slate-200 dark:border-white/10 p-6 md:p-8" aria-live="polite">
          <QuizProgress step={quizStep} />
          {!complete && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Step {quizStep + 1} of 3
              </p>
              <h3 className="mt-1 font-[Playfair_Display] text-2xl font-bold text-[#0D2149] dark:text-white">
                {QUIZ_STEPS[quizStep].title}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{QUIZ_STEPS[quizStep].hint}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {quizStep === 0 && (
                  <>
                    <QuizOption label="Type 1" sub="Adult or teen" onClick={() => onDtype("t1d")} selected={dtype === "t1d"} />
                    <QuizOption label="Type 2" sub="Insulin user" onClick={() => onDtype("t2d")} selected={dtype === "t2d"} />
                    <QuizOption label="Gestational" sub="Pregnancy care" onClick={() => onDtype("gdm")} selected={dtype === "gdm"} />
                    <QuizOption label="Caregiver" sub="Child or parent" onClick={() => onDtype("caregiver")} selected={dtype === "caregiver"} />
                  </>
                )}
                {quizStep === 1 && (
                  <>
                    <QuizOption label="Dexcom" sub="G6 / G7" onClick={() => onCgm("dexcom")} selected={cgm === "dexcom"} />
                    <QuizOption label="Libre" sub="FreeStyle 2 / 3" onClick={() => onCgm("libre")} selected={cgm === "libre"} />
                    <QuizOption label="Nightscout" sub="Any CGM" onClick={() => onCgm("nightscout")} selected={cgm === "nightscout"} />
                    <QuizOption label="No CGM yet" sub="Fingersticks" onClick={() => onCgm("none")} selected={cgm === "none"} />
                  </>
                )}
                {quizStep === 2 && (
                  <>
                    <QuizOption label="Insulin stacking" sub="Am I doubling up?" onClick={() => onGoal("stacking")} selected={goal === "stacking"} />
                    <QuizOption label="Overnight lows" sub="Why did this happen?" onClick={() => onGoal("overnight")} selected={goal === "overnight"} />
                    <QuizOption label="Pregnancy" sub="Trimester adjustments" onClick={() => onGoal("pregnancy")} selected={goal === "pregnancy"} />
                    <QuizOption label="My child's school" sub="Care plan, made easy" onClick={() => onGoal("pediatric")} selected={goal === "pediatric"} />
                  </>
                )}
              </div>
            </div>
          )}
          {complete && (
            <QuizResult dtype={dtype} cgm={cgm} goal={goal} onReset={onReset} />
          )}
        </div>
      </div>
    </section>
  );
}

function QuizProgress({ step }: { step: QuizStep }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            step > i ? "bg-[#2AB5C1]" : step === i ? "bg-[#2AB5C1]/50" : "bg-slate-200 dark:bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

function QuizOption(props: { label: string; sub: string; onClick: () => void; selected: boolean }) {
  const { label, sub, onClick, selected } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left min-h-[72px] rounded-xl border-2 px-4 py-3 cursor-pointer transition-all
        ${selected
          ? "border-[#2AB5C1] bg-[#2AB5C1]/10"
          : "border-slate-200 dark:border-white/15 hover:border-[#2AB5C1] hover:bg-slate-50 dark:hover:bg-white/5"}`}
      aria-pressed={selected}
    >
      <div className="font-semibold text-[#0D2149] dark:text-white text-sm">{label}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</div>
    </button>
  );
}

function QuizResult(props: { dtype: DiabetesType | null; cgm: CgmBrand | null; goal: Goal | null; onReset: () => void }) {
  const { dtype, cgm, goal, onReset } = props;
  const pathway = pickPathway(dtype, cgm, goal);

  return (
    <div className="mt-2">
      <p className="text-xs uppercase tracking-wider text-[#2AB5C1]">Your matched track</p>
      <h3 className="mt-1 font-[Playfair_Display] text-2xl font-bold text-[#0D2149] dark:text-white">{pathway.title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pathway.blurb}</p>
      <ul className="mt-4 space-y-2">
        {pathway.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
            <CheckIcon className="w-4 h-4 text-[#2AB5C1] mt-0.5 flex-shrink-0" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/auth?plan=pro" className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#0D2149] dark:bg-[#2AB5C1] text-white dark:text-[#0D1B3E] text-sm font-semibold hover:bg-[#1A2A5E] dark:hover:bg-[#25a3ae] transition-colors cursor-pointer">
          Start Pro — $29.99/mo
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Link>
        <Link to="/auth?plan=free" className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          Try free tier
        </Link>
      </div>
      <button type="button" onClick={onReset} className="mt-4 text-xs text-slate-500 dark:text-slate-400 underline hover:text-slate-700 dark:hover:text-white cursor-pointer">
        Start over
      </button>
    </div>
  );
}

function pickPathway(dtype: DiabetesType | null, cgm: CgmBrand | null, goal: Goal | null) {
  if (dtype === "gdm" || goal === "pregnancy") {
    return {
      title: "Pregnancy & Gestational track",
      blurb: "Trimester-aware dashboards aligned with NICE NG3 and CONCEPTT evidence.",
      bullets: ["Trimester-based ISF and carb-ratio reminders", "Weekly educator async check-in", "IOB Hunter™ tuned for tighter pregnancy targets"],
    };
  }
  if (dtype === "caregiver" || goal === "pediatric") {
    return {
      title: "Pediatric & School-Care track",
      blurb: "Built for parents and school nurses, with shareable care-plan PDFs.",
      bullets: ["School Care Plan generator (one-page PDF)", "Caregiver sharing with granular permissions", "Kids-mode education clips by age band (6–16)"],
    };
  }
  if (goal === "overnight") {
    return {
      title: "Overnight-safety track",
      blurb: "Basal evaluation + stacking detection tuned for the 00:00–06:00 window.",
      bullets: ["IOB Hunter™ overnight basal evaluator", "Mira™ AI explains each low in plain language", "Optional educator review of your patterns"],
    };
  }
  return {
    title: "Stacking-first track",
    blurb: "Start with the thing GluMira™ is built for: making insulin stacking visible.",
    bullets: [
      "IOB Hunter™ pharmacokinetic curves for 9+ insulins",
      `Auto-sync from ${cgm === "dexcom" ? "Dexcom" : cgm === "libre" ? "Libre" : cgm === "nightscout" ? "Nightscout" : "your logs"}`,
      "Mira™ AI walks you through each stacking event",
    ],
  };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* SUPPORT STACK                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function SupportStack() {
  return (
    <section className="bg-[#0D2149] dark:bg-[#080f1e] text-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl mb-12">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1.5 text-xs uppercase tracking-widest text-[#2AB5C1] font-semibold mb-5">
            Three-tier support
          </span>
          <h2 className="font-[Playfair_Display] text-white text-3xl md:text-4xl font-bold leading-tight mb-4">
            The right level of help, at the right moment.
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            You shouldn't need to book a clinician just to ask "what is IOB?". One
            unified inbox, three layers.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <TierCard tier="Tier 1" label="Mira™ AI" availability="24/7, instant" sample='"Explain why I went low at 2am after dinner insulin."' accent="#2AB5C1" />
          <TierCard tier="Tier 2" label="Certified educator" availability="Async, same-day" sample='"Review my basal pattern for the last 14 days."' accent="#F59E0B" highlight />
          <TierCard tier="Tier 3" label="Clinician portal" availability="Scheduled" sample='"Share my trend report with my endocrinologist."' accent="#2AB5C1" />
        </div>
      </div>
    </section>
  );
}

function TierCard(props: { tier: string; label: string; availability: string; sample: string; accent: string; highlight?: boolean }) {
  return (
    <article className={`rounded-2xl p-6 border ${props.highlight ? "bg-white text-slate-900 border-transparent shadow-2xl" : "bg-white/5 text-white border-white/10"}`}>
      <p className="text-xs uppercase tracking-wider" style={{ color: props.accent }}>{props.tier}</p>
      <h3 className={`mt-2 font-[Playfair_Display] text-2xl font-bold ${props.highlight ? "text-[#0D2149]" : "text-white"}`}>{props.label}</h3>
      <p className={`mt-1 text-sm ${props.highlight ? "text-slate-500" : "text-slate-300"}`}>{props.availability}</p>
      <blockquote className={`mt-5 text-sm italic border-l-2 pl-3 ${props.highlight ? "border-slate-300 text-slate-700" : "border-white/30 text-slate-200"}`}>{props.sample}</blockquote>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* PRICING                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-slate-50 dark:bg-[#0D1B3E]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl mb-12">
          <span className="inline-block rounded-full bg-[#2AB5C1]/10 dark:bg-[#2AB5C1]/20 px-3 py-1.5 text-xs uppercase tracking-widest text-[#0D2149] dark:text-[#2AB5C1] font-semibold mb-5">
            Free is the flagship
          </span>
          <h2 className="font-[Playfair_Display] text-[#0D2149] dark:text-white text-3xl md:text-4xl font-bold leading-tight mb-4">
            The platform starts free. Upgrade when you want more.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Free tier is a real product — not a trial. 14-day free trial on Pro and above.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <PricingCard tier="Free" price="$0" period="forever" cta="Start — no card" ctaHref="/auth?plan=free" featured badge="Flagship"
            features={["IOB Hunter™ full engine (13+ insulins)", "CSV import (Dexcom, Libre, Nightscout)", "Manual logs — insulin, meal, condition", "Mira™ Lite — 20 messages/day", "Community support"]} />
          <PricingCard tier="Pro" price="$29.99" period="/ month" cta="Start Pro trial" ctaHref="/auth?plan=pro"
            features={["Everything in Free", "Direct Dexcom / Libre OAuth sync", "PDF + CSV clinical reports (unlimited)", "Mira™ Full — 200 messages/day", "Automated basal evaluation", "Email support"]} />
          <PricingCard tier="AI" price="$49.99" period="/ month" cta="Start AI trial" ctaHref="/auth?plan=ai"
            features={["Everything in Pro", "Mira™ Pro — adaptive-thinking model", "Predictive insights — 100 runs/day", "Custom dashboards", "Priority support"]} />
          <PricingCard tier="Clinic" price="$299.99" period="/ month" cta="Talk to sales" ctaHref="/contact?plan=clinic"
            features={["10 providers + 100 patients", "All Pro features per patient", "Clinician portal + audit trails", "Caregiver sharing, granular permissions", "Priority clinical report generation"]} />
        </div>
        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
          Research / Enterprise: $499–999/month, custom-quoted. API access, unlimited providers, dedicated support.
          Every paid subscription helps keep the Free tier strong — that's the model.
        </p>
      </div>
    </section>
  );
}

function PricingCard(props: {
  tier: string; price: string; period: string; cta: string; ctaHref: string;
  features: string[]; featured?: boolean; badge?: string;
}) {
  return (
    <article className={`rounded-2xl p-7 border ${props.featured
      ? "bg-[#0D2149] dark:bg-[#2AB5C1]/20 text-white border-[#0D2149] dark:border-[#2AB5C1]/40 shadow-2xl scale-[1.02]"
      : "bg-white dark:bg-white/5 text-slate-900 dark:text-white border-slate-200 dark:border-white/10"}`}>
      {props.featured && (
        <div className="inline-flex items-center h-6 px-2 rounded-full bg-[#F59E0B] text-[#0D2149] text-[10px] font-bold uppercase tracking-wider mb-2">
          {props.badge ?? "Most popular"}
        </div>
      )}
      <h3 className={`mt-1 font-[Playfair_Display] text-2xl font-bold ${props.featured ? "text-white" : "text-[#0D2149] dark:text-white"}`}>
        GluMira™ {props.tier}
      </h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-[Playfair_Display] text-4xl font-bold">{props.price}</span>
        <span className={`text-sm ${props.featured ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>{props.period}</span>
      </div>
      <ul className={`mt-6 space-y-3 text-sm ${props.featured ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}`}>
        {props.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${props.featured ? "text-[#2AB5C1]" : "text-[#2AB5C1]"}`} />
            {f}
          </li>
        ))}
      </ul>
      <Link to={props.ctaHref}
        className={`mt-7 inline-flex w-full items-center justify-center h-11 px-5 rounded-full text-sm font-semibold transition-colors cursor-pointer
          ${props.featured
            ? "bg-white text-[#0D2149] hover:bg-slate-100"
            : "bg-[#0D2149] dark:bg-[#2AB5C1] text-white dark:text-[#0D1B3E] hover:bg-[#1A2A5E] dark:hover:bg-[#25a3ae]"}`}>
        {props.cta}
      </Link>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* EVIDENCE QUOTE                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function EvidenceQuote() {
  return (
    <section className="bg-white dark:bg-[#0D2149] border-t border-slate-200 dark:border-white/10 py-14">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <blockquote className="font-[Playfair_Display] text-2xl md:text-3xl italic text-[#0D2149] dark:text-white leading-snug">
          "We make the invisible visible — for every child, every caregiver, every
          clinician who has ever stared at a number and not known why."
        </blockquote>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">— GluMira™ brand promise</p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* FINAL CTA — with owl (Rule 43)                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="bg-gradient-to-br from-[#0D2149] via-[#1A2A5E] to-[#2AB5C1]/60 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 text-center">
        {/* Owl — Rule 43: canonical Mira PNG */}
        <div className="mb-8 flex justify-center">
          <img src="/brand/mira-hero.png" alt="Mira — GluMira™ guardian owl"
            style={{ width: 180, height: 180, objectFit: "contain", filter: "drop-shadow(0 4px 24px rgba(42,181,193,0.35))" }} />
        </div>

        <h2 className="font-[Playfair_Display] text-white leading-tight font-bold mb-4"
          style={{ fontSize: "clamp(26px, 4vw, 44px)" }}>
          Ready to stop guessing?
        </h2>
        <p className="text-slate-200 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          Take the 60-second match. IOB Hunter™ free on every account.
          No credit card for the free tier.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <a href="#quiz"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-[#0D2149] text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer">
            Match me to a pathway
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </a>
          <Link to="/researcher"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer">
            I'm a researcher
          </Link>
          <Link to="/clinician"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full border border-white/20 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer">
            I'm a clinician
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          GluMira™ is an educational platform, not a medical device. Always consult your healthcare provider.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* FOOTER                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-[#070e1c] text-slate-400 text-sm">
      <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src="/brand/mira-hero.png" alt="Mira" style={{ width: 32, height: 32, objectFit: "contain" }} />
            <span className="font-[Playfair_Display] text-lg font-bold text-white">
              GluMira<span className="text-[#2AB5C1]">™</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed">
            Educational platform, not a medical device. Always consult your healthcare
            provider for medical decisions.
          </p>
        </div>
        <FooterCol title="Platform" items={[
          ["IOB Hunter™", "#iob-hunter"],
          ["Pricing", "#pricing"],
          ["For clinicians", "/clinician"],
          ["For researchers", "/researcher"],
          ["Live demo", "/demo"],
        ]} />
        <FooterCol title="Modules" items={[
          ["Pregnancy", "/modules/pregnancy"],
          ["Pediatric + school", "/modules/paediatric"],
          ["Menstrual cycle", "/modules/menstrual"],
          ["Ramadan", "/modules/ramadan"],
          ["Overnight safety", "#quiz"],
        ]} />
        <FooterCol title="Legal" items={[
          ["Privacy", "/privacy"],
          ["Terms", "/terms"],
          ["Consent", "/consent"],
          ["Contact", "/contact"],
        ]} />
      </div>
      <div className="border-t border-white/8">
        <div className="mx-auto max-w-6xl px-4 py-5 flex flex-col md:flex-row gap-3 justify-between items-center text-xs">
          <p>© {new Date().getFullYear()} GluMira™. All rights reserved.</p>
          <p>Evidence-based — NICE NG3 · ADA Standards · CONCEPTT · Plank 2005</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-3">{title}</p>
      <ul className="space-y-2">
        {items.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("/")
              ? <Link to={href} className="hover:text-white transition-colors cursor-pointer">{label}</Link>
              : <a href={href} className="hover:text-white transition-colors cursor-pointer">{label}</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ICONS + MARKS                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */


function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <path d="M4 10h12m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden>
      <path d="M10 1l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
    </svg>
  );
}
