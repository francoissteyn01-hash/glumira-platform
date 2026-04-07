/**
 * GluMira™ V7 — Share Button
 * Uses navigator.share on mobile, clipboard copy on desktop.
 */

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const title = "GluMira\u2122 Dashboard";

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <button type="button"
      onClick={share}
      style={{
        minWidth: 40, minHeight: 40, borderRadius: 8,
        border: "1px solid var(--border-light)", background: "var(--bg-card)",
        color: copied ? "#22c55e" : "var(--text-secondary)",
        fontSize: copied ? 12 : 18, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6, padding: "0 12px",
        transition: "all 0.15s",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 600,
      }}
      title="Share dashboard"
    >
      {copied ? "\u2713 Copied" : "\u{1F517}"}
    </button>
  );
}
