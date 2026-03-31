"use client";

/**
 * GluMira™ Pricing Page
 * Version: 7.0.0
 * Route: /pricing
 *
 * Three tiers:
 *  1. GluMira Free (Beta Testing) — Powered by IOB Hunter™
 *  2. GluMira Pro — Powered by IOB Hunter™
 *  3. GluMira AI — Powered by IOB Hunter™
 *
 * Tagline: "The science of insulin, made visible."
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import React, { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────

interface PricingTier {
  id: "free" | "pro" | "ai";
  name: string;
  subtitle: string;
  price: string;
  priceNote: string;
  badge?: string;
  badgeColour?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
}

// ─── Tier data ────────────────────────────────────────────────

const TIERS: PricingTier[] = [
  {
    id: "free",
    name: "GluMira™ Free",
    subtitle: "Beta Testing",
    price: "£0",
    priceNote: "Free during beta",
    features: [
      "IOB Hunter™ biexponential engine",
      "6 rapid-acting insulin profiles",
      "20 meal regime profiles",
      "Basic IOB timeline chart",
      "Meal logging (last 20 entries)",
      "School Care Plan generator",
      "Nightscout CGM sync (read-only)",
      "Beta feedback channel",
      "Community support",
    ],
    cta: "Join Beta",
    ctaHref: "/register?plan=free",
    highlighted: false,
  },
  {
    id: "pro",
    name: "GluMira™ Pro",
    subtitle: "Powered by IOB Hunter™",
    price: "£9",
    priceNote: "per month",
    badge: "Most Popular",
    badgeColour: "bg-glumira-blue text-white",
    features: [
      "Everything in Free",
      "Insulin stacking analysis",
      "Full CGM overlay chart",
      "14-day & 30-day TIR reports",
      "Variability score (CV%)",
      "Hypo risk forecasting",
      "School Care Plan PDF export",
      "Nightscout full read/write sync",
      "Priority email support",
      "Early access to new features",
    ],
    cta: "Start Pro Trial",
    ctaHref: "/register?plan=pro",
    highlighted: true,
  },
  {
    id: "ai",
    name: "GluMira™ AI",
    subtitle: "Powered by IOB Hunter™",
    price: "£19",
    priceNote: "per month",
    badge: "Phase 2",
    badgeColour: "bg-purple-600 text-white",
    features: [
      "Everything in Pro",
      "Clinician AI pattern analysis",
      "Dr. Bernstein Q&A engine",
      "Claude Sonnet AI insights",
      "Automated pattern narratives",
      "Clinician-ready PDF reports",
      "Multi-patient clinician view",
      "GDPR erase on demand",
      "Dedicated onboarding call",
      "SLA-backed uptime guarantee",
    ],
    cta: "Join AI Waitlist",
    ctaHref: "/register?plan=ai",
    highlighted: false,
  },
];

// ─── Feature check icon ───────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── Page Component ───────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const adjustedPrice = (tier: PricingTier): string => {
    if (tier.id === "free") return "£0";
    const monthly = tier.id === "pro" ? 9 : 19;
    if (annual) {
      return `£${Math.round(monthly * 0.8)}`;
    }
    return `£${monthly}`;
  };

  return (
    <div className="min-h-screen bg-glumira-bg">
      {/* Hero */}
      <div className="text-center py-16 px-4">
        <p className="text-sm font-medium text-glumira-blue uppercase tracking-widest mb-3">
          GluMira™ · IOB Hunter™
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          <span className="block">GluMira™</span>
          <span className="block text-glumira-blue">The science of insulin, made visible.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Choose the plan that fits your journey. All plans include the IOB Hunter™
          biexponential decay engine — the most accurate IOB model available.
        </p>

        {/* Annual toggle */}
        <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <span className={`text-sm ${!annual ? "font-semibold text-gray-900" : "text-gray-400"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              annual ? "bg-glumira-blue" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                annual ? "translate-x-5" : ""
              }`}
            />
          </button>
          <span className={`text-sm ${annual ? "font-semibold text-gray-900" : "text-gray-400"}`}>
            Annual
            <span className="ml-1 text-xs text-green-600 font-medium">Save 20%</span>
          </span>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-6 flex flex-col ${
                tier.highlighted
                  ? "bg-glumira-blue text-white shadow-xl ring-2 ring-glumira-blue scale-[1.02]"
                  : "bg-white border border-gray-200 shadow-sm"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow ${tier.badgeColour}`}
                  >
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Tier name */}
              <div className="mb-4">
                <p
                  className={`text-xs font-medium uppercase tracking-widest mb-1 ${
                    tier.highlighted ? "text-blue-200" : "text-glumira-blue"
                  }`}
                >
                  {tier.subtitle}
                </p>
                <h2
                  className={`text-xl font-bold ${
                    tier.highlighted ? "text-white" : "text-gray-900"
                  }`}
                >
                  {tier.name}
                </h2>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span
                  className={`text-4xl font-extrabold ${
                    tier.highlighted ? "text-white" : "text-gray-900"
                  }`}
                >
                  {adjustedPrice(tier)}
                </span>
                <span
                  className={`text-sm ml-1 ${
                    tier.highlighted ? "text-blue-200" : "text-gray-500"
                  }`}
                >
                  {tier.id === "free"
                    ? "free during beta"
                    : annual
                    ? "/ month, billed annually"
                    : "/ month"}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    {tier.highlighted ? (
                      <svg
                        className="w-4 h-4 text-blue-200 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <CheckIcon />
                    )}
                    <span
                      className={`text-sm ${
                        tier.highlighted ? "text-blue-100" : "text-gray-600"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-colors ${
                  tier.highlighted
                    ? "bg-white text-glumira-blue hover:bg-blue-50"
                    : "bg-glumira-blue text-white hover:bg-blue-700"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ / Trust section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-1">HIPAA &amp; GDPR Ready</h3>
            <p className="text-sm text-gray-500">
              End-to-end encryption, audit logs, and GDPR erase on demand.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🧪</div>
            <h3 className="font-semibold text-gray-900 mb-1">395 Passing Tests</h3>
            <p className="text-sm text-gray-500">
              Every calculation is verified by an automated test suite.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-gray-900 mb-1">Not a Medical Device</h3>
            <p className="text-sm text-gray-500">
              GluMira™ is an educational tool. Always consult your diabetes care team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
