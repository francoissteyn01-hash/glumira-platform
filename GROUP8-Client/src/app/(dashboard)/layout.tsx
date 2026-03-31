/**
 * GluMira™ Dashboard Layout
 * Version: 7.0.0
 *
 * Wraps all authenticated (dashboard) pages with:
 *   - Sidebar navigation
 *   - Auth guard (redirects to /login if no session)
 *   - Patient context provider
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import React from "react";
import { headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Sidebar } from "../../components/layout/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Auth guard
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch patient profile for display name and tier
  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("display_name, status")
    .eq("id", session.user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? session.user.email?.split("@")[0] ?? "User";
  const tier = profile?.status === "beta" ? "free" : profile?.status ?? "free";

  // Get current path from headers
  const headersList = headers();
  const currentPath = headersList.get("x-pathname") ?? "/dashboard";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        displayName={displayName}
        tier={tier}
        currentPath={currentPath}
      />
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
