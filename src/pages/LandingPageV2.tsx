/**
 * GluMira™ V7 — LandingPageV2.tsx
 *
 * Medvi-inspired landing page: quiz-first intake, bundled "Diabetes OS" framing,
 * three-tier support stack, checkout-then-activate pricing. Self-contained —
 * only depends on react-router-dom and Tailwind (no MarketingLayout, no
 * brand-specific components) so it can be iterated without touching the
 * existing LandingPage.tsx.
 */

import { useState } from "react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-white text-slate-900 font-[DM_Sans]">
      <TopNav />
      <Hero
        quizStep={quizStep}
        dtype={dtype}
        cgm={cgm}
        goal={goal}
        onDtype={(d) => { setDtype(d); advance(); }}
        onCgm={(c) => { setCgm(c); advance(); }}
        onGoal={(g) => { setGoal(g); advance(); }}
        onReset={() => { setQuizStep(0); setDtype(null); setCgm(null); setGoal(null); }}
      />
      <SocialStrip />
      <BundleSection />
      <SupportStack />
      <IobHunterStrip />
      <Pricing />
      <AudienceStrip />
      <EvidenceStrip />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ──────────────────────────── Top nav ─────────────────────────── */

function TopNav() {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <LogoMark />
          <span className="font-[Playfair_Display] text-xl font-bold tracking-tight text-[#0D2149]">
            GluMira<span className="text-[#2A8FA8]">™</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          <a href="#bundle"   className="hover:text-slate-900 transition-colors">Platform</a>
          <a href="#support"  className="hover:text-slate-900 transition-colors">Support</a>
          <a href="#pricing"  className="hover:text-slate-900 transition-colors">Pricing</a>
          <Link to="/clinician" className="hover:text-slate-900 transition-colors">For Clinicians</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden sm:inline-flex items-center h-11 px-4 text-sm text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Sign in
          </Link>
          <a
            href="#quiz"
            className="inline-flex items-center h-11 px-4 rounded-full bg-[#0D2149] text-white text-sm font-medium hover:bg-[#14307a] transition-colors cursor-pointer"
          >
            Start the 60-second match
          </a>
        </div>
      </div>
    </header>
  );
}

/* ──────────────────────────── Hero + quiz ─────────────────────────── */

function Hero(props: {
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
    <section
      id="quiz"
      className="relative overflow-hidden bg-gradient-to-b from-[#0D2149] to-[#14307a] text-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
        {/* Left: copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wider text-[#f0c05a]">
            <SparkIcon className="w-3.5 h-3.5" /> Educational platform, not a medical device
          </span>
          <h1 className="mt-6 font-[Playfair_Display] text-4xl md:text-5xl lg:text-6xl leading-tight font-bold !text-white">
            The science of insulin,
            <br />
            <span className="!text-[#7bd3df]">made visible.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-200/90 max-w-xl">
            Answer three quick questions and we'll match you with the GluMira™
            dashboard, educator, and care pathway that fits your regimen — not a
            generic diabetes app.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
            <TrustPill>Powered by IOB Hunter™</TrustPill>
            <TrustPill>Works with Dexcom, Libre &amp; Nightscout</TrustPill>
            <TrustPill>No dosing advice — education only</TrustPill>
          </div>
        </div>

        {/* Right: quiz card */}
        <div
          aria-live="polite"
          className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-white/10"
        >
          <QuizProgress step={quizStep} />
          {!complete && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Step {quizStep + 1} of 3
              </p>
              <h3 className="mt-1 font-[Playfair_Display] text-2xl font-bold !text-[#0D2149]">
                {QUIZ_STEPS[quizStep].title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{QUIZ_STEPS[quizStep].hint}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {quizStep === 0 && (
                  <>
                    <QuizOption label="Type 1"        sub="Adult or teen"   onClick={() => onDtype("t1d")} selected={dtype === "t1d"} />
                    <QuizOption label="Type 2"        sub="Insulin user"    onClick={() => onDtype("t2d")} selected={dtype === "t2d"} />
                    <QuizOption label="Gestational"   sub="Pregnancy care"  onClick={() => onDtype("gdm")} selected={dtype === "gdm"} />
                    <QuizOption label="Caregiver"     sub="Child or parent" onClick={() => onDtype("caregiver")} selected={dtype === "caregiver"} />
                  </>
                )}
                {quizStep === 1 && (
                  <>
                    <QuizOption label="Dexcom"     sub="G6 / G7"           onClick={() => onCgm("dexcom")} selected={cgm === "dexcom"} />
                    <QuizOption label="Libre"      sub="FreeStyle 2 / 3"   onClick={() => onCgm("libre")}  selected={cgm === "libre"} />
                    <QuizOption label="Nightscout" sub="Any CGM"           onClick={() => onCgm("nightscout")} selected={cgm === "nightscout"} />
                    <QuizOption label="No CGM yet" sub="Fingersticks"      onClick={() => onCgm("none")}   selected={cgm === "none"} />
                  </>
                )}
                {quizStep === 2 && (
                  <>
                    <QuizOption label="Insulin stacking"  sub="Am I doubling up?"       onClick={() => onGoal("stacking")}  selected={goal === "stacking"} />
                    <QuizOption label="Overnight lows"    sub="Why did this happen?"    onClick={() => onGoal("overnight")} selected={goal === "overnight"} />
                    <QuizOption label="Pregnancy"         sub="Trimester adjustments"   onClick={() => onGoal("pregnancy")} selected={goal === "pregnancy"} />
                    <QuizOption label="My child's school" sub="Care plan, made easy"    onClick={() => onGoal("pediatric")} selected={goal === "pediatric"} />
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

      {/* decorative grid */}
      <svg
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-20 w-full text-white/5"
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
      >
        <path d="M0 40 Q300 0 600 40 T1200 40 V80 H0Z" fill="currentColor" />
      </svg>
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
            step > i ? "bg-[#2A8FA8]" : step === i ? "bg-[#7bd3df]" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function QuizOption(props: {
  label: string; sub: string; onClick: () => void; selected: boolean;
}) {
  const { label, sub, onClick, selected } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left h-full min-h-[72px] rounded-lg border-2 px-4 py-3 cursor-pointer transition-all
        ${selected
          ? "border-[#2A8FA8] bg-[#2A8FA8]/10"
          : "border-slate-200 hover:border-[#2A8FA8] hover:bg-slate-50"}`}
      aria-pressed={selected}
    >
      <div className="font-semibold text-[#0D2149]">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </button>
  );
}

function QuizResult(props: {
  dtype: DiabetesType | null; cgm: CgmBrand | null; goal: Goal | null;
  onReset: () => void;
}) {
  const { dtype, cgm, goal, onReset } = props;
  const pathway = pickPathway(dtype, cgm, goal);

  return (
    <div className="mt-2">
      <p className="text-xs uppercase tracking-wider text-[#2A8FA8]">Your matched track</p>
      <h3 className="mt-1 font-[Playfair_Display] text-2xl font-bold !text-[#0D2149]">
        {pathway.title}
      </h3>
      <p className="mt-2 text-sm text-slate-600">{pathway.blurb}</p>

      <ul className="mt-4 space-y-2">
        {pathway.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
            <CheckIcon className="w-4 h-4 text-[#2A8FA8] mt-0.5 flex-shrink-0" />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/auth?plan=pro"
          className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#0D2149] text-white text-sm font-medium hover:bg-[#14307a] transition-colors cursor-pointer"
        >
          Start Pro — $29.99/mo
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Link>
        <Link
          to="/auth?plan=free"
          className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Try the free tier
        </Link>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-xs text-slate-500 underline hover:text-slate-700 cursor-pointer"
      >
        Start over
      </button>
      <p className="mt-4 text-xs text-slate-500">
        You'll complete your clinical settings (carb ratio, ISF, basal rate) after
        checkout. No card required for the free tier.
      </p>
    </div>
  );
}

function pickPathway(
  dtype: DiabetesType | null, cgm: CgmBrand | null, goal: Goal | null
): { title: string; blurb: string; bullets: string[] } {
  if (dtype === "gdm" || goal === "pregnancy") {
    return {
      title: "Pregnancy & Gestational track",
      blurb: "Trimester-aware dashboards aligned with NICE NG3 and CONCEPTT evidence, with educator support.",
      bullets: [
        "Trimester-based ISF and carb-ratio reminders",
        "Weekly educator async check-in",
        "IOB Hunter™ tuned for tighter pregnancy targets",
      ],
    };
  }
  if (dtype === "caregiver" || goal === "pediatric") {
    return {
      title: "Pediatric & School-Care track",
      blurb: "Built for parents and school nurses, with shareable care-plan PDFs and age-appropriate education clips.",
      bullets: [
        "School Care Plan generator (one-page PDF)",
        "Caregiver sharing with granular permissions",
        "Kids-mode education clips by age band (6–16)",
      ],
    };
  }
  if (goal === "overnight") {
    return {
      title: "Overnight-safety track",
      blurb: "Basal evaluation + stacking detection tuned for the 00:00–06:00 window — the question behind most 2am panics.",
      bullets: [
        "IOB Hunter™ overnight basal evaluator",
        "Mira™ AI explains each low in plain language",
        "Optional educator review of your patterns",
      ],
    };
  }
  return {
    title: "Stacking-first track",
    blurb: "Start with the thing GluMira is built for: making insulin stacking visible.",
    bullets: [
      "IOB Hunter™ pharmacokinetic curves for 9+ insulins",
      `Auto-sync from ${cgm === "dexcom" ? "Dexcom" : cgm === "libre" ? "Libre" : cgm === "nightscout" ? "Nightscout" : "your logs"}`,
      "Mira™ AI walks you through each stacking event",
    ],
  };
}

/* ──────────────────────────── Social strip ─────────────────────────── */

function SocialStrip() {
  return (
    <section className="bg-slate-50 border-y border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-4 gap-6 items-center text-center md:text-left">
        <p className="text-sm text-slate-500 md:col-span-1">Built on evidence from:</p>
        <EvidencePill>NICE NG3</EvidencePill>
        <EvidencePill>ADA Standards of Care</EvidencePill>
        <EvidencePill>CONCEPTT study</EvidencePill>
      </div>
    </section>
  );
}

function EvidencePill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700">
      {children}
    </div>
  );
}

/* ──────────────────────────── Bundle (Diabetes OS) ─────────────────────────── */

function BundleSection() {
  return (
    <section id="bundle" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#2A8FA8]/10 px-3 py-1 text-xs uppercase tracking-wider text-[#0D2149]">
            The Diabetes OS
          </span>
          <h2 className="mt-4 font-[Playfair_Display] text-3xl md:text-4xl font-bold !text-[#0D2149] leading-tight">
            One bundle. Not a scattered toolkit.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Most diabetes apps give you a log. GluMira™ gives you an operating system
            — the engine, the educator, and the pathway to your supplies, working as
            one.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          <BundleCard
            kicker="01 — Engine"
            title="IOB Hunter™"
            body="Pharmacokinetic curves for 13 insulins with global regional variants. Surfaces insulin stacking before hypoglycemia occurs."
            icon={<GaugeIcon className="w-6 h-6" />}
          />
          <BundleCard
            kicker="02 — Educator"
            title="Mira™ AI"
            body="Mira™ Lite is free for every user — ask anything about insulin, stacking, or your patterns. Pro and AI tiers unlock deeper models and higher daily limits. Every answer is educational, never a dosing instruction."
            icon={<ChatIcon className="w-6 h-6" />}
          />
          <BundleCard
            kicker="03 — Pathway"
            title="Supplies & clinicians"
            body="Referral pathways to CGM, pump, and sensor partners — and a clinician portal if your care team wants to see your patterns."
            icon={<PathIcon className="w-6 h-6" />}
          />
        </div>
      </div>
    </section>
  );
}

function BundleCard(props: { kicker: string; title: string; body: string; icon: React.ReactNode }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#2A8FA8] hover:shadow-lg transition-all cursor-default">
      <div className="w-10 h-10 rounded-lg bg-[#0D2149] text-white flex items-center justify-center">
        {props.icon}
      </div>
      <p className="mt-5 text-xs uppercase tracking-wider text-[#2A8FA8] font-semibold">{props.kicker}</p>
      <h3 className="mt-2 font-[Playfair_Display] text-2xl font-bold !text-[#0D2149]">{props.title}</h3>
      <p className="mt-3 text-slate-600 leading-relaxed">{props.body}</p>
    </article>
  );
}

/* ──────────────────────────── Support stack (tiered) ─────────────────────────── */

function SupportStack() {
  return (
    <section id="support" className="bg-[#0D2149] text-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wider text-[#7bd3df]">
            Three-tier support
          </span>
          <h2 className="mt-4 font-[Playfair_Display] text-3xl md:text-4xl font-bold leading-tight !text-white">
            The right level of help, at the right moment.
          </h2>
          <p className="mt-4 text-lg text-slate-200/90">
            You shouldn't need to book a clinician just to ask "what is IOB?". You
            shouldn't get an AI when you need a human. One unified inbox, three
            layers:
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          <TierCard
            tier="Tier 1"
            label="Mira™ AI"
            availability="24/7, instant"
            sample='"Explain why I went low at 2am after dinner insulin."'
            accent="#7bd3df"
          />
          <TierCard
            tier="Tier 2"
            label="Certified diabetes educator"
            availability="Async, same-day"
            sample='"Review my basal pattern for the last 14 days."'
            accent="#f0c05a"
            highlight
          />
          <TierCard
            tier="Tier 3"
            label="Clinician portal"
            availability="Scheduled"
            sample='"Share my trend report with my endocrinologist."'
            accent="#2A8FA8"
          />
        </div>
        <p className="mt-8 text-sm text-slate-300 max-w-2xl">
          Every reply — from Mira™ AI, educators, and clinicians — lands in one
          thread. No more switching between five apps and hoping someone remembers
          what they told you last week.
        </p>
      </div>
    </section>
  );
}

function TierCard(props: {
  tier: string; label: string; availability: string; sample: string; accent: string; highlight?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl p-6 border ${props.highlight
        ? "bg-white text-slate-900 border-transparent shadow-2xl"
        : "bg-white/5 text-white border-white/10"}`}
    >
      <p className="text-xs uppercase tracking-wider" style={{ color: props.accent }}>
        {props.tier}
      </p>
      <h3 className={`mt-2 font-[Playfair_Display] text-2xl font-bold ${props.highlight ? "!text-[#0D2149]" : "!text-white"}`}>{props.label}</h3>
      <p className={`mt-1 text-sm ${props.highlight ? "text-slate-500" : "text-slate-300"}`}>
        {props.availability}
      </p>
      <blockquote className={`mt-5 text-sm italic border-l-2 pl-3 ${props.highlight ? "border-slate-300 text-slate-700" : "border-white/30 text-slate-200"}`}>
        {props.sample}
      </blockquote>
    </article>
  );
}

/* ──────────────────────────── IOB Hunter strip ─────────────────────────── */

function IobHunterStrip() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#0D2149]/5 px-3 py-1 text-xs uppercase tracking-wider text-[#0D2149]">
            Powered by IOB Hunter™
          </span>
          <h2 className="mt-4 font-[Playfair_Display] text-3xl md:text-4xl font-bold !text-[#0D2149] leading-tight">
            Insulin has a shape. We draw it.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            IOB Hunter™ renders the pharmacokinetic curve of every insulin still
            active in your body across 13 insulin types globally. Covers rapid-acting,
            intermediate, and long-acting profiles with support for all major brands and
            formulations worldwide.
          </p>
          <ul className="mt-6 space-y-3 text-slate-700">
            <BulletLine>Stacking alerts before they become lows</BulletLine>
            <BulletLine>Basal evaluation tuned to your time-in-range target</BulletLine>
            <BulletLine>Evidence-grounded in Plank 2005 PK data and the ADA Standards</BulletLine>
          </ul>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-[#0D2149] to-[#14307a] p-6 md:p-8 text-white shadow-xl">
          <IobGraphic />
        </div>
      </div>
    </section>
  );
}

function BulletLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <CheckIcon className="w-5 h-5 text-[#2A8FA8] mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function IobGraphic() {
  // simple static pharmacokinetic-style curves
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wider text-[#7bd3df]">Active insulin</p>
        <p className="text-xs text-slate-300">00:00 – 12:00</p>
      </div>
      <svg viewBox="0 0 400 180" className="w-full h-auto" role="img" aria-label="Illustrative insulin-on-board curves">
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#7bd3df" stopOpacity="0.5" />
            <stop offset="1" stopColor="#7bd3df" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f0c05a" stopOpacity="0.35" />
            <stop offset="1" stopColor="#f0c05a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" x2="400" y1={30 + i * 40} y2={30 + i * 40}
            stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
        ))}
        {/* basal curve */}
        <path d="M0 140 Q 80 70 200 80 T 400 110" stroke="#7bd3df" strokeWidth="2.5" fill="none" />
        <path d="M0 140 Q 80 70 200 80 T 400 110 L 400 180 L 0 180 Z" fill="url(#g1)" />
        {/* bolus curve */}
        <path d="M60 160 Q 110 40 160 90 T 260 150 L 260 160" stroke="#f0c05a" strokeWidth="2.5" fill="none" />
        <path d="M60 160 Q 110 40 160 90 T 260 150 L 260 180 L 60 180 Z" fill="url(#g2)" />
        {/* labels */}
        <text x="12" y="20" fill="#7bd3df" fontSize="11" fontFamily="DM Sans">Basal (Tresiba)</text>
        <text x="200" y="40" fill="#f0c05a" fontSize="11" fontFamily="DM Sans">Bolus (Humalog) — stacking risk at 11:00</text>
      </svg>
      <p className="mt-4 text-xs text-slate-300 italic">
        Illustrative only — your actual curves depend on regimen and data.
      </p>
    </div>
  );
}

/* ──────────────────────────── Pricing ─────────────────────────── */

function Pricing() {
  return (
    <section id="pricing" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#2A8FA8]/10 px-3 py-1 text-xs uppercase tracking-wider text-[#0D2149]">
            Free is the flagship
          </span>
          <h2 className="mt-4 font-[Playfair_Display] text-3xl md:text-4xl font-bold !text-[#0D2149] leading-tight">
            The platform starts free. Upgrade only when you want more.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            GluMira™ is built for the 2am caregiver, whether they're in Berlin or
            Katima Mulilo. The Free tier is a real product — not a trial. Paid
            tiers add reach, not the core engine.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <PricingCard
            tier="Free"
            price="$0"
            period="forever"
            cta="Start — no card"
            ctaHref="/auth?plan=free"
            featured
            badge="Flagship"
            features={[
              "IOB Hunter™ full engine (9+ insulins, regional names)",
              "CSV import (Dexcom Clarity, Libre export, Nightscout)",
              "Manual insulin, meal & condition logs",
              "Mira™ Lite — 20 messages/day",
              "Community support",
            ]}
          />
          <PricingCard
            tier="Pro"
            price="$29.99"
            period="/ month"
            cta="Go Pro"
            ctaHref="/auth?plan=pro"
            features={[
              "Everything in Free",
              "Direct Dexcom / Libre OAuth sync",
              "PDF + CSV clinical reports (unlimited)",
              "Mira™ Full — 200 messages/day",
              "Automated basal evaluation",
              "Email support",
            ]}
          />
          <PricingCard
            tier="AI"
            price="$49.99"
            period="/ month"
            cta="Go AI"
            ctaHref="/auth?plan=ai"
            features={[
              "Everything in Pro",
              "Mira™ Pro — adaptive-thinking model, 500 msgs/day",
              "Predictive insights — 100 runs/day",
              "Custom dashboards",
              "Priority support queue",
            ]}
          />
          <PricingCard
            tier="Clinic"
            price="$299.99"
            period="/ month"
            cta="Talk to sales"
            ctaHref="/contact?plan=clinic"
            features={[
              "10 providers + 100 patients included",
              "All Pro features for every patient",
              "Clinician portal, audit trails, RLS",
              "Caregiver sharing with granular permissions",
              "Priority clinical reports generation",
            ]}
          />
        </div>
        <p className="mt-8 text-xs text-slate-500 max-w-3xl">
          Research / Enterprise: $499–999/month, custom-quoted. Includes unlimited
          providers &amp; patients, API access, and dedicated support.
          <br />
          <span className="text-slate-400">
            Each Clinic license helps keep the Free tier strong. That is the model —
            no investor, no subsidy, just every paid subscription doing its share.
          </span>
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
    <article
      className={`rounded-2xl p-7 border ${props.featured
        ? "bg-[#0D2149] text-white border-[#0D2149] shadow-2xl scale-[1.02]"
        : "bg-white text-slate-900 border-slate-200"}`}
    >
      {props.featured && (
        <div className="inline-flex items-center h-6 px-2 rounded-full bg-[#f0c05a] text-[#0D2149] text-[10px] font-bold uppercase tracking-wider">
          {props.badge ?? "Most popular"}
        </div>
      )}
      <h3 className={`mt-3 font-[Playfair_Display] text-2xl font-bold ${props.featured ? "!text-white" : "!text-[#0D2149]"}`}>GluMira™ {props.tier}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-[Playfair_Display] text-4xl font-bold">{props.price}</span>
        <span className={`text-sm ${props.featured ? "text-slate-300" : "text-slate-500"}`}>{props.period}</span>
      </div>
      <ul className={`mt-6 space-y-3 text-sm ${props.featured ? "text-slate-200" : "text-slate-700"}`}>
        {props.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${props.featured ? "text-[#7bd3df]" : "text-[#2A8FA8]"}`} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={props.ctaHref}
        className={`mt-7 inline-flex w-full items-center justify-center h-11 px-5 rounded-full text-sm font-medium transition-colors cursor-pointer
          ${props.featured
            ? "bg-white text-[#0D2149] hover:bg-slate-100"
            : "bg-[#0D2149] text-white hover:bg-[#14307a]"}`}
      >
        {props.cta}
      </Link>
    </article>
  );
}

/* ──────────────────────────── Audience strip ─────────────────────────── */

function AudienceStrip() {
  const audiences = [
    "Type 1 adults", "Type 1 teens", "Gestational", "Pediatric",
    "Newly diagnosed", "School nurses", "Endocrinologists", "Diabetes educators",
    "Ramadan", "Pregnancy planning", "Pump users", "MDI users",
  ];
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="text-xs uppercase tracking-wider text-[#2A8FA8] font-semibold">Built for every corner of diabetes</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {audiences.map((a) => (
            <span key={a} className="inline-flex items-center h-9 px-4 rounded-full bg-slate-100 text-sm text-slate-700">
              {a}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Evidence strip ─────────────────────────── */

function EvidenceStrip() {
  return (
    <section className="bg-white border-t border-slate-200 py-14">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <blockquote className="font-[Playfair_Display] text-2xl md:text-3xl italic text-[#0D2149] leading-snug">
          "We make the invisible visible — for every child, every caregiver, every
          clinician who has ever stared at a number and not known why."
        </blockquote>
        <p className="mt-4 text-sm text-slate-500">— GluMira™ brand promise</p>
      </div>
    </section>
  );
}

/* ──────────────────────────── Final CTA ─────────────────────────── */

function FinalCta() {
  return (
    <section className="bg-gradient-to-br from-[#0D2149] via-[#14307a] to-[#2A8FA8] text-white">
      <div className="mx-auto max-w-4xl px-4 py-16 md:py-20 text-center">
        <h2 className="font-[Playfair_Display] text-3xl md:text-4xl font-bold leading-tight !text-white">
          Ready to stop guessing?
        </h2>
        <p className="mt-4 text-lg text-slate-200/90">
          Take the 60-second match. No credit card for the free tier.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#quiz"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-white text-[#0D2149] text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Match me to a pathway
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </a>
          <Link
            to="/clinician"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
          >
            I'm a clinician
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Footer ─────────────────────────── */

function Footer() {
  return (
    <footer className="bg-[#0a1838] text-slate-400 text-sm">
      <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-[Playfair_Display] text-lg font-bold text-white">
              GluMira<span className="text-[#7bd3df]">™</span>
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            GluMira™ is an educational platform, not a medical device. Always consult
            your healthcare provider for medical decisions.
          </p>
        </div>
        <FooterCol title="Platform" items={[
          ["Quiz match", "#quiz"],
          ["Pricing", "#pricing"],
          ["For clinicians", "/clinician"],
          ["For researchers", "/researcher"],
        ]} />
        <FooterCol title="Tracks" items={[
          ["Pregnancy", "/tracks/pregnancy"],
          ["Pediatric + school", "/tracks/pediatric"],
          ["Overnight safety", "/tracks/overnight"],
          ["Ramadan care", "/tracks/ramadan"],
        ]} />
        <FooterCol title="Legal" items={[
          ["Privacy", "/privacy"],
          ["Terms", "/terms"],
          ["Disclaimer", "/disclaimer"],
          ["Contact", "/contact"],
        ]} />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col md:flex-row gap-3 justify-between items-center text-xs">
          <p>© {new Date().getFullYear()} GluMira™. All rights reserved.</p>
          <p>Evidence-based — NICE NG3 · ADA Standards · CONCEPTT</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold">{title}</p>
      <ul className="mt-3 space-y-2">
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

/* ──────────────────────────── Shared bits ─────────────────────────── */

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center h-8 px-3 rounded-full bg-white/10 text-xs text-slate-100">
      {children}
    </span>
  );
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <circle cx="14" cy="14" r="13" fill="#0D2149" />
      <path d="M8 18 Q 14 6 20 18" stroke="#7bd3df" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="10" r="2" fill="#f0c05a" />
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

function GaugeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M4 16a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16l4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ChatIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M4 6h16v10H8l-4 4V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="13" cy="11" r="1" fill="currentColor" />
      <circle cx="17" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function PathIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M6 8v4a4 4 0 0 0 4 4h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
