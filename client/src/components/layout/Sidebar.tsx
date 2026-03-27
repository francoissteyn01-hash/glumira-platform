/**
 * GluMira™ Navigation Sidebar
 * Version: 7.0.0
 *
 * Responsive sidebar with collapsible mobile drawer.
 * Links: Dashboard, Meals, School Care Plan, Clinician, Settings.
 * Shows current user display name and tier badge.
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React, { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ─── Nav Items ────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: string;
  tier?: "free" | "pro" | "ai";
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "⬡" },
  { href: "/meals", label: "Meals & Regimes", icon: "🍽" },
  { href: "/school-care-plan", label: "School Care Plan", icon: "📋" },
  { href: "/clinician", label: "Clinician View", icon: "🩺", tier: "pro" },
  { href: "/bernstein", label: "Bernstein AI", icon: "🤖", tier: "ai" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

const TIER_COLOURS: Record<string, string> = {
  free: "bg-gray-100 text-gray-500",
  pro: "bg-blue-100 text-blue-600",
  ai: "bg-violet-100 text-violet-600",
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  ai: "AI",
};

// ─── Nav Link ─────────────────────────────────────────────────

function NavLink({
  item,
  currentPath,
  onClick,
}: {
  item: NavItem;
  currentPath: string;
  onClick?: () => void;
}) {
  const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");

  return (
    <a
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className="text-base w-5 text-center">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.tier && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
            isActive ? "bg-white/20 text-white" : TIER_COLOURS[item.tier]
          }`}
        >
          {TIER_LABELS[item.tier]}
        </span>
      )}
    </a>
  );
}

// ─── Sidebar Content ──────────────────────────────────────────

function SidebarContent({
  currentPath,
  displayName,
  tier,
  onSignOut,
  onClose,
}: {
  currentPath: string;
  displayName: string;
  tier: string;
  onSignOut: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">G</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">GluMira™</p>
            <p className="text-[10px] text-glumira-blue leading-tight">Visualizing the science of insulin</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Powered by IOB Hunter™</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} currentPath={currentPath} onClick={onClose} />
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-blue-600">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 capitalize">{tier} tier</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full text-left text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Sign out
        </button>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          Not a medical device · Not a dosing tool
        </p>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────

interface SidebarProps {
  displayName?: string;
  tier?: string;
  currentPath?: string;
}

export function Sidebar({ displayName = "User", tier = "free", currentPath = "/" }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, [supabase]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <SidebarContent
          currentPath={currentPath}
          displayName={displayName}
          tier={tier}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Mobile Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900 block leading-tight">GluMira™</span>
            <span className="text-[9px] text-glumira-blue leading-tight">Visualizing the science of insulin</span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 bg-white h-full shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent
              currentPath={currentPath}
              displayName={displayName}
              tier={tier}
              onSignOut={handleSignOut}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
