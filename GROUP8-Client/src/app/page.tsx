"use client";

import React from "react";
import Link from "next/link";

const OWL_CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_asset_owl_glow_608d9d80.png";
const HERO_OWL = "/hero_owl_v1.png";

const FEATURES = [
  { icon: "\u{1F489}", title: "IOB Hunter\u2122 Engine", desc: "Biexponential decay model \u2014 the most accurate insulin-on-board calculation available." },
  { icon: "\u{1F4CA}", title: "Insulin Stacking Analysis", desc: "See exactly how your doses overlap in real time with risk-tiered alerts." },
  { icon: "\u{1F37D}\uFE0F", title: "20 Meal Regime Profiles", desc: "From Bernstein Protocol to Ramadan fasting, school care plans to athlete training." },
  { icon: "\u{1F4CB}", title: "School Care Plan Generator", desc: "Generate a printable, PDF-ready diabetes management plan for school staff." },
  { icon: "\u{1F9E0}", title: "Bernstein AI Q&A", desc: "AI-powered answers about Dr. Bernstein\u2019s principles in plain language." },
  { icon: "\u{1F512}", title: "Enterprise Security", desc: "HIPAA & GDPR ready. HMAC-SHA256 audit chains, CSRF protection, rate limiting." },
];

const STATS = [
  { value: "395", label: "Passing tests" },
  { value: "20", label: "Meal regime profiles" },
  { value: "6", label: "Insulin profiles" },
  { value: "30+", label: "API routes" },
];

const STEPS = [
  { n: "1", title: "Connect your data", desc: "Link your Nightscout CGM feed or enter readings manually." },
  { n: "2", title: "Log your doses", desc: "Enter insulin doses \u2014 GluMira\u2122 calculates stacked IOB instantly." },
  { n: "3", title: "See the science", desc: "View your IOB timeline, TIR ring, and risk assessment in one dashboard." },
  { n: "4", title: "Share with your team", desc: "Generate School Care Plans and clinician reports \u2014 print or PDF." },
];

const TIERS = [
  { name: "GluMira\u2122 Free", sub: "Beta Testing", price: "\u00A30", cta: "Join Beta", href: "/register?plan=free", hl: false },
  { name: "GluMira\u2122 Pro", sub: "Powered by IOB Hunter\u2122", price: "\u00A39/mo", cta: "Start Trial", href: "/register?plan=pro", hl: true },
  { name: "GluMira\u2122 AI", sub: "Powered by IOB Hunter\u2122", price: "\u00A319/mo", cta: "Join Waitlist", href: "/register?plan=ai", hl: false },
];

function WaveDivider({ flip, color }: { flip?: boolean; color?: string }) {
  return (
    <div className="w-full overflow-hidden leading-[0]" style={{ transform: flip ? "rotate(180deg)" : undefined }}>
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
        <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0Z" fill={color || "#0d1b3e"} />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulseGlow { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
        .hero-owl { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(13,27,62,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(42,181,193,0.15)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={OWL_CDN} alt="" className="w-8 h-8 object-contain" />
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.25rem", color: "#fff" }}>GluMira&#8482;</span>
            <span className="hidden sm:block text-xs" style={{ color: "rgba(42,181,193,0.8)" }}>The science of insulin, made visible</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm hidden sm:block" style={{ color: "rgba(255,255,255,0.7)" }}>Pricing</Link>
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg" style={{ color: "#2ab5c1", border: "1px solid rgba(42,181,193,0.4)" }}>Sign In</Link>
            <Link href="/register" className="text-sm px-5 py-2 rounded-lg" style={{ background: "linear-gradient(135deg,#2ab5c1,#1a9ba6)", color: "#fff", fontWeight: 600 }}>Join Beta</Link>
          </div>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="relative overflow-hidden pt-16" style={{ background: "linear-gradient(135deg,#0d1b3e 0%,#1a2a5e 40%,#0d1b3e 100%)", minHeight: "100vh" }}>
        {/* Teal wave bg */}
        <div className="absolute inset-0 opacity-15">
          <svg viewBox="0 0 1440 900" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0 400C200 300 400 500 600 400C800 300 1000 500 1200 350C1300 280 1400 320 1440 300V900H0Z" fill="url(#w1)" />
            <path d="M0 550C300 450 500 650 700 530C900 410 1100 570 1440 470V900H0Z" fill="url(#w2)" />
            <defs>
              <linearGradient id="w1" x1="0" y1="0" x2="1440" y2="0"><stop offset="0%" stopColor="#2ab5c1" /><stop offset="100%" stopColor="#1a9ba6" /></linearGradient>
              <linearGradient id="w2" x1="0" y1="0" x2="1440" y2="0"><stop offset="0%" stopColor="#2ab5c1" stopOpacity="0.4" /><stop offset="100%" stopColor="#1a2a5e" /></linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          {/* LEFT text */}
          <div className="flex-1 text-left">
            <div className="inline-block rounded-full px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-widest" style={{ background: "rgba(42,181,193,0.15)", color: "#2ab5c1", border: "1px solid rgba(42,181,193,0.25)" }}>Beta &middot; Free to join</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, lineHeight: 1.1 }}>
              <span className="block text-5xl md:text-7xl" style={{ color: "#ffffff" }}>GluMira&#8482;</span>
              <span className="block text-3xl md:text-5xl mt-3" style={{ color: "#2ab5c1" }}>The science of insulin,</span>
              <span className="block text-3xl md:text-5xl" style={{ color: "#2ab5c1" }}>made visible.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-xl" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
              The only platform powered by <strong style={{ color: "#f59e0b" }}>IOB Hunter&#8482;</strong> &mdash; a biexponential decay engine that shows exactly how much insulin is still active in your body, right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/register" className="text-center text-base py-3.5 px-8 rounded-xl font-semibold" style={{ background: "linear-gradient(135deg,#2ab5c1,#1a9ba6)", color: "#fff", boxShadow: "0 4px 20px rgba(42,181,193,0.4)" }}>Join the Beta &mdash; Free</Link>
              <Link href="/pricing" className="text-center text-base py-3.5 px-8 rounded-xl font-semibold" style={{ color: "#fff", border: "2px solid rgba(255,255,255,0.25)" }}>View Pricing</Link>
            </div>
            <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Not a medical device. Educational tool only.</p>
          </div>
          {/* RIGHT owl */}
          <div className="flex-1 flex justify-center lg:justify-end hero-owl">
            <div className="relative">
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(42,181,193,0.2) 0%, transparent 70%)", transform: "scale(1.3)" }} />
              <img src={HERO_OWL} alt="GluMira owl mascot" className="relative w-72 md:w-96 lg:w-[28rem] drop-shadow-2xl" style={{ filter: "drop-shadow(0 0 40px rgba(42,181,193,0.3))" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ WAVE ══════ */}
      <WaveDivider flip color="#ffffff" />

      {/* ══════ STATS ══════ */}
      <section className="py-12" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold" style={{ color: "#1a2a5e" }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: "#52667a" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section className="py-20 px-6" style={{ background: "#f0f8ff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#1a2a5e" }}>Everything you need to understand your insulin</h2>
            <p style={{ color: "#52667a" }} className="max-w-xl mx-auto">Built for people with Type 1 diabetes, parents, and clinicians who want clarity &mdash; not guesswork.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1" style={{ background: "#ffffff", border: "1px solid rgba(26,42,94,0.08)", boxShadow: "0 2px 12px rgba(26,42,94,0.06)" }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "#1a2a5e" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#52667a" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS — Dark section ══════ */}
      <WaveDivider color="#0d1b3e" />
      <section className="py-20 px-6" style={{ background: "linear-gradient(180deg,#0d1b3e,#1a2a5e)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#ffffff" }}>How it works</h2>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>Four steps to insulin clarity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold" style={{ background: "linear-gradient(135deg,#2ab5c1,#1a9ba6)", color: "#fff", boxShadow: "0 4px 14px rgba(42,181,193,0.3)" }}>{s.n}</div>
                <h3 className="font-semibold mb-2" style={{ color: "#ffffff" }}>{s.title}</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WaveDivider flip color="#ffffff" />

      {/* ══════ TIERS ══════ */}
      <section className="py-20 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#1a2a5e" }}>Three tiers. One mission.</h2>
          <p className="mb-12" style={{ color: "#52667a" }}>Start free during beta. Upgrade when you&apos;re ready.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {TIERS.map((t) => (
              <div key={t.name} className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1" style={{
                background: t.hl ? "linear-gradient(135deg,#0d1b3e,#1a2a5e)" : "#ffffff",
                border: t.hl ? "2px solid #2ab5c1" : "1px solid rgba(26,42,94,0.1)",
                boxShadow: t.hl ? "0 8px 32px rgba(42,181,193,0.2)" : "0 2px 12px rgba(26,42,94,0.06)",
              }}>
                <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "#2ab5c1" }}>{t.sub}</p>
                <h3 className="font-bold mb-2" style={{ color: t.hl ? "#fff" : "#1a2a5e" }}>{t.name}</h3>
                <p className="text-3xl font-extrabold mb-5" style={{ color: t.hl ? "#fff" : "#1a2a5e" }}>{t.price}</p>
                <Link href={t.href} className="block w-full text-center py-3 rounded-xl font-semibold text-sm" style={{
                  background: t.hl ? "linear-gradient(135deg,#2ab5c1,#1a9ba6)" : "transparent",
                  color: t.hl ? "#fff" : "#1a2a5e",
                  border: t.hl ? "none" : "2px solid #1a2a5e",
                }}>{t.cta}</Link>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="text-sm font-medium" style={{ color: "#2ab5c1" }}>Compare all features &rarr;</Link>
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <WaveDivider color="#0d1b3e" />
      <section className="py-20 px-6 text-center" style={{ background: "linear-gradient(135deg,#0d1b3e,#1a2a5e)" }}>
        <div className="max-w-3xl mx-auto">
          <img src={OWL_CDN} alt="" className="w-16 h-16 mx-auto mb-6 object-contain" style={{ filter: "drop-shadow(0 0 20px rgba(42,181,193,0.4))" }} />
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#ffffff" }}>Ready to see the science?</h2>
          <p className="mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>Join the beta today. Free forever during testing.</p>
          <Link href="/register" className="inline-block text-base py-3.5 px-10 rounded-xl font-semibold" style={{ background: "linear-gradient(135deg,#2ab5c1,#1a9ba6)", color: "#fff", boxShadow: "0 4px 20px rgba(42,181,193,0.4)" }}>Join the Beta &mdash; Free</Link>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="py-10 px-6 text-center" style={{ background: "#0a1530", borderTop: "1px solid rgba(42,181,193,0.1)" }}>
        <p className="font-bold mb-1" style={{ color: "#ffffff" }}>GluMira&#8482; &middot; IOB Hunter&#8482;</p>
        <p className="text-xs mb-4" style={{ color: "rgba(42,181,193,0.6)" }}>The science of insulin, made visible.</p>
        <div className="flex justify-center gap-6 text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/register" className="hover:text-white transition-colors">Join Beta</Link>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          GluMira&#8482; is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice. Always consult your diabetes care team before adjusting insulin.
        </p>
      </footer>
    </div>
  );
}
