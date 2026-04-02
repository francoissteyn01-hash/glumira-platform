/**
 * GluMira™ V7 — client/src/pages/BadgesPage.tsx
 */

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { cn } from "../lib/utils";
import type { BadgeTier } from "../lib/constants";

interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  tier: BadgeTier;
  iconEmoji: string;
  earnedAt: string | null;
}

const TIER_COLOURS: Record<BadgeTier, string> = {
  bronze:   "border-amber-600  bg-amber-50  dark:bg-amber-900/20  text-amber-700  dark:text-amber-400",
  silver:   "border-gray-400   bg-gray-50   dark:bg-[#f0f4f8]      text-[#718096]   dark:text-[#4a5568]",
  gold:     "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
  platinum: "border-brand-500 bg-brand-50 dark:bg-brand-600/20 text-brand-600 dark:text-brand-500",
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Badge[]>("/api/badges")
      .then(setBadges)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const earned = badges.filter((b) => b.earnedAt !== null);
  const locked = badges.filter((b) => b.earnedAt === null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#718096] animate-pulse">Loading badges…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#f8f9fa]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#1a2a5e]">Your Badges</h1>
          <p className="text-sm text-[#718096] dark:text-[#718096] mt-1">
            {earned.length} of {badges.length} earned
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {earned.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#718096] dark:text-[#718096] uppercase tracking-wide mb-3">Earned</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {earned.map((b) => <BadgeCard key={b.id} badge={b} />)}
            </div>
          </section>
        )}

        {locked.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#718096] dark:text-[#718096] uppercase tracking-wide mb-3">Locked</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {locked.map((b) => <BadgeCard key={b.id} badge={b} locked />)}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

function BadgeCard({ badge, locked = false }: { badge: Badge; locked?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 text-center transition-opacity",
        TIER_COLOURS[badge.tier],
        locked && "opacity-40 grayscale"
      )}
    >
      <div className="text-4xl mb-2">{locked ? "🔒" : badge.iconEmoji}</div>
      <p className="text-xs font-bold uppercase tracking-wide">{badge.tier}</p>
      <p className="text-sm font-semibold mt-1">{badge.name}</p>
      <p className="text-xs mt-1 opacity-75">{badge.description}</p>
      {badge.earnedAt && (
        <p className="text-xs mt-2 opacity-60">
          {new Date(badge.earnedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
