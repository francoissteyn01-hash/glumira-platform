/**
 * GluMira™ Admin Layout
 * Version: 7.0.0
 *
 * Wraps all /admin/* pages with:
 *  - Admin role guard (redirects non-admins to /dashboard)
 *  - Admin sidebar navigation
 *  - GluMira™ branding header
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

// ─── Nav items ────────────────────────────────────────────────

const NAV = [
  { href: "/admin",                  label: "Overview",     icon: "⬛" },
  { href: "/admin/participants",     label: "Participants", icon: "👥" },
  { href: "/admin/feedback",         label: "Feedback",     icon: "💬" },
  { href: "/admin/health",           label: "System Health",icon: "🩺" },
];

// ─── Layout ───────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [adminName, setAdminName] = useState<string>("Admin");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: profile } = await supabase
        .from("patient_profiles")
        .select("display_name, role")
        .eq("user_id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setAdminName(profile?.display_name ?? user.email ?? "Admin");
      setChecking(false);
    })();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-700">
          <p className="text-sm font-bold text-teal-400 tracking-wide">GluMira™</p>
          <p className="text-xs text-gray-400 mt-0.5">Admin Console</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-teal-600 text-white font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-700 space-y-2">
          <p className="text-xs text-gray-400 truncate">{adminName}</p>
          <Link
            href="/dashboard"
            className="block text-xs text-teal-400 hover:text-teal-300"
          >
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            {NAV.find((n) => pathname === n.href || pathname?.startsWith(n.href + "/"))?.label ?? "Admin"}
          </p>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
            ADMIN
          </span>
        </div>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
