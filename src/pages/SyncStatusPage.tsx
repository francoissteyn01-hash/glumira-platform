/**
 * GluMira™ V7 — Sync & Device Status Page
 *
 * Combined view of offline state, device probes, and sync history.
 * Replaces the originally-planned `OfflineModePanel`, `SyncQueueViewer`,
 * `ConflictResolutionModal`, and `DeviceStatusMonitor` from Stage 4.2.
 *
 * Note on ConflictResolutionModal: there is no live sync-conflict source
 * in this codebase (Nightscout sync is one-way pull, no merge required),
 * so a conflict modal would be a stub. Documented in ARCHIVE-LOG.md.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { DISCLAIMER } from "@/lib/constants";
import OfflineModePanel    from "@/components/widgets/OfflineModePanel";
import DeviceStatusMonitor from "@/components/widgets/DeviceStatusMonitor";
import SyncQueueViewer     from "@/components/widgets/SyncQueueViewer";

export default function SyncStatusPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 4px",
          }}>
            Sync & Device Status
          </h1>
          <p style={{
            fontSize: 14, color: "var(--text-secondary)", margin: 0,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            Connection health, offline cache, and Nightscout sync history
          </p>
        </div>

        {/* Disclaimer */}
        <div style={{
          borderRadius: 8,
          background: "var(--disclaimer-bg)",
          border: "1px solid var(--disclaimer-border)",
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 12,
          color: "var(--disclaimer-text)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {DISCLAIMER}
        </div>

        {/* 3-column responsive grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}>
          <OfflineModePanel />
          <DeviceStatusMonitor />
          <SyncQueueViewer />
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
