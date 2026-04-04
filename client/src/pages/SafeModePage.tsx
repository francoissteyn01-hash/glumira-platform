/**
 * GluMira™ V7 — Safe Mode Entry Page
 * Scandinavian Minimalist. Mobile first. No images.
 */

import { Link } from "react-router-dom";
import { DEMO_PROFILES } from "../data/demo-profiles";
import { DISCLAIMER } from "../lib/constants";

const ROLE_BADGE: Record<string, { label: string; color: string; border: string; bg: string }> = {
  caregiver: { label: "Caregiver", color: "text-[#2ab5c1]", border: "border-[#2ab5c1]", bg: "bg-[#2ab5c1]/10" },
  patient:   { label: "Patient",   color: "text-[#1a2a5e]", border: "border-[#1a2a5e]", bg: "bg-[#1a2a5e]/10" },
  clinician: { label: "Clinician", color: "text-amber-700",  border: "border-amber-400", bg: "bg-amber-50" },
};

function getCustomSlots(): number {
  let used = 0;
  try {
    if (localStorage.getItem("glumira-custom-profile-1")) used++;
    if (localStorage.getItem("glumira-custom-profile-2")) used++;
  } catch {}
  return used;
}

export default function SafeModePage() {
  const usedSlots = getCustomSlots();

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2a5e] tracking-tight">
            Explore GluMira™ — Safe Mode
          </h1>
          <p className="text-sm text-[#718096] max-w-md mx-auto">
            No real data needed. Pick a demo profile or create your own.
          </p>
        </div>

        {/* Demo Profile Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEMO_PROFILES.map((profile) => {
            const badge = ROLE_BADGE[profile.role] ?? ROLE_BADGE.patient;
            return (
              <div
                key={profile.id}
                className="rounded-xl border border-[#e2e8f0] bg-white p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[#1a2a5e] flex-1">
                    {profile.name}
                  </h2>
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.color} ${badge.border} ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-[#718096] leading-relaxed flex-1">
                  {profile.description}
                </p>
                <Link
                  to={`/safe-mode/profile/${profile.id}`}
                  className="self-start rounded-lg bg-[#2ab5c1] hover:bg-[#229aaa] text-[#1a2a5e] px-4 py-2 text-xs font-medium transition-colors"
                >
                  Explore
                </Link>
              </div>
            );
          })}
        </div>

        {/* Custom Profile Section */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-3">
          <h2 className="text-base font-semibold text-[#1a2a5e]">
            Or create your own
          </h2>
          <p className="text-xs text-[#718096]">
            Up to 2 custom profiles. Saved locally on this device.
          </p>
          <div className="flex flex-wrap gap-3">
            {[1, 2].map((slot) => {
              const key = `glumira-custom-profile-${slot}`;
              let saved: { name?: string } | null = null;
              try {
                const raw = localStorage.getItem(key);
                if (raw) saved = JSON.parse(raw);
              } catch {}

              if (saved) {
                return (
                  <div key={slot} className="flex items-center gap-2">
                    <Link
                      to={`/safe-mode/profile/custom-${slot}`}
                      className="rounded-lg bg-[#f0f4f8] border border-[#e2e8f0] text-[#1a2a5e] px-4 py-2 text-xs font-medium hover:bg-[#e2e8f0] transition-colors"
                    >
                      {saved.name ?? `Custom ${slot}`}
                    </Link>
                    <Link
                      to={`/safe-mode/create?slot=${slot}`}
                      className="text-[10px] text-[#718096] hover:text-[#1a2a5e] underline"
                    >
                      Edit
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={slot}
                  to={`/safe-mode/create?slot=${slot}`}
                  className={`rounded-lg border border-dashed border-[#e2e8f0] px-4 py-2 text-xs font-medium transition-colors ${
                    usedSlots >= slot && !saved
                      ? "text-[#cbd5e0] cursor-not-allowed"
                      : "text-[#718096] hover:text-[#1a2a5e] hover:border-[#2ab5c1]"
                  }`}
                >
                  Create Profile {slot}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-[#718096]">
            Safe sandbox. No real patient data stored. All demo data is fictional.
          </p>
          <p className="text-[10px] text-[#a0aec0]">{DISCLAIMER}</p>
        </div>

      </div>
    </div>
  );
}
