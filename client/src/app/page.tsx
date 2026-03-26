"use client";

/**
 * GluMira™ Landing Page
 * Version: 7.0.0
 * Route: /
 *
 * Tagline: "The science of insulin, made visible."
 * Tiers: Free (Beta) · Pro · AI
 * Powered by IOB Hunter™
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import React from "react";
import Link from "next/link";

// ─── Feature cards ────────────────────────────────────────────

const FEATURES = [
  {
    icon: "💉",
    title: "IOB Hunter™ Engine",
    description:
      "Biexponential decay model — the most accurate insulin-on-board calculation available. Supports NovoRapid, Humalog, Apidra, Fiasp, Tresiba, and Lantus.",
  },
  {
    icon: "📊",
    title: "Insulin Stacking Analysis",
    description:
      "See exactly how your doses overlap in real time. Risk-tiered alerts (low / moderate / high / critical) with plain-language narratives.",
  },
  {
    icon: "🍽️",
    title: "20 Meal Regime Profiles",
    description:
      "From Bernstein Protocol to Ramadan fasting, school care plans to athlete training — every ICR profile built in.",
  },
  {
    icon: "📋",
    title: "School Care Plan Generator",
    description:
      "Generate a printable, PDF-ready diabetes management plan for school staff in seconds. All 20 regime thresholds included.",
  },
  {
    icon: "🧠",
    title: "Bernstein AI Q&A",
    description:
      "Ask questions about Dr. Bernstein's diabetes management principles. AI-powered answers in plain language — no reading required.",
  },
  {
    icon: "🔒",
    title: "Enterprise Security",
    description:
      "HIPAA & GDPR ready. HMAC-SHA256 audit chains, CSRF protection, rate limiting, and GDPR erase on demand.",
  },
];

// ─── Social proof stats ───────────────────────────────────────

const STATS = [
  { value: "395", label: "Passing tests" },
  { value: "20", label: "Meal regime profiles" },
  { value: "6", label: "Insulin profiles" },
  { value: "30+", label: "API routes" },
];

// ─── How it works steps ───────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Connect your data",
    description: "Link your Nightscout CGM feed or enter readings manually.",
  },
  {
    step: "2",
    title: "Log your doses",
    description: "Enter insulin doses — GluMira™ calculates stacked IOB instantly.",
  },
  {
    step: "3",
    title: "See the science",
    description:
      "View your IOB timeline, TIR ring, and risk assessment in one clear dashboard.",
  },
  {
    step: "4",
    title: "Share with your team",
    description:
      "Generate School Care Plans and clinician reports — print or save as PDF.",
  },
];

// ─── Page Component ───────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-glumira-bg">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-glumira-blue">GluMira™</span>
            <span className="text-xs text-gray-400 font-medium hidden sm:block">
              IOB Hunter™
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium hidden sm:block"
            >
              Pricing
            </Link>
            <Link href="/login" className="glum-btn-secondary text-sm py-1.5 px-3">
              Sign In
            </Link>
            <Link href="/register" className="glum-btn-primary text-sm py-1.5 px-3">
              Join Beta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-20 px-4">
        <div className="inline-block bg-blue-50 text-glumira-blue text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-widest">
          Beta · Free to join
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6 max-w-3xl mx-auto">
          The science of insulin,
          <br />
          <span className="text-glumira-blue">made visible.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          GluMira™ is the only platform powered by IOB Hunter™ — a biexponential decay
          engine that shows exactly how much insulin is still active in your body, right now.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="glum-btn-primary text-base py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            Join the Beta — Free
          </Link>
          <Link
            href="/pricing"
            className="glum-btn-secondary text-base py-3 px-8 rounded-xl"
          >
            View Pricing
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Not a medical device. Educational tool only.
        </p>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-extrabold text-glumira-blue">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything you need to understand your insulin
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built for people with Type 1 diabetes, parents, and clinicians who want
              clarity — not guesswork.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-gray-100 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Four steps to insulin clarity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-glumira-blue text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers summary */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Three tiers. One mission.
          </h2>
          <p className="text-gray-500 mb-10">
            Start free during beta. Upgrade when you&apos;re ready.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { name: "GluMira™ Free", sub: "Beta Testing", price: "£0", cta: "Join Beta", href: "/register?plan=free" },
              { name: "GluMira™ Pro", sub: "Powered by IOB Hunter™", price: "£9/mo", cta: "Start Trial", href: "/register?plan=pro" },
              { name: "GluMira™ AI", sub: "Powered by IOB Hunter™", price: "£19/mo", cta: "Join Waitlist", href: "/register?plan=ai" },
            ].map((tier) => (
              <div key={tier.name} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-glumira-blue font-medium uppercase tracking-widest mb-1">
                  {tier.sub}
                </p>
                <h3 className="font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-2xl font-extrabold text-gray-900 mb-4">{tier.price}</p>
                <Link href={tier.href} className="glum-btn-primary text-sm w-full block text-center">
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="text-sm text-glumira-blue hover:underline font-medium">
            Compare all features →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 text-center">
        <p className="text-sm font-bold text-gray-900 mb-1">GluMira™ · IOB Hunter™</p>
        <p className="text-xs text-gray-400 mb-4">
          The science of insulin, made visible.
        </p>
        <div className="flex justify-center gap-6 text-xs text-gray-400 mb-4">
          <Link href="/pricing" className="hover:text-gray-600">Pricing</Link>
          <Link href="/login" className="hover:text-gray-600">Sign In</Link>
          <Link href="/register" className="hover:text-gray-600">Join Beta</Link>
        </div>
        <p className="text-xs text-gray-300">
          GluMira™ is an informational tool only. Not a medical device.
          Always consult your diabetes care team before adjusting insulin.
        </p>
      </footer>
    </div>
  );
}
