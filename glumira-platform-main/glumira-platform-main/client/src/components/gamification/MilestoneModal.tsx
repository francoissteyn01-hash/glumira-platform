/**
 * GluMira™ — Milestone Modal Component
 * Version: 1.0.0
 *
 * Full-screen elegant modal for high-significance milestone events:
 *   - Diaversary (anniversary of diagnosis)
 *   - Birthday
 *   - Caregiver Encouragement
 *
 * These events deserve more than a toast — they get a dedicated moment.
 * Design: Backdrop blur, centered card, easy to dismiss.
 * Tone: Deeply empathetic, validating, no toxic positivity.
 *
 * The modal does NOT auto-dismiss — the user must actively close it.
 * This respects the weight of the moment.
 */

import React, { useEffect } from "react";
import type { MilestoneMessage } from "../../lib/gamification/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MilestoneModalProps {
  milestone: MilestoneMessage;
  onClose: (id: string) => void;
}

// ─── Modal Icon ───────────────────────────────────────────────────────────────

function ModalIcon({ type }: { type: MilestoneMessage["type"] }) {
  const icons: Partial<Record<MilestoneMessage["type"], string>> = {
    diaversary: "🕯️",
    birthday: "🎂",
    caregiver_burnout: "❤️",
  };

  const icon = icons[type] ?? "✨";

  const bgColors: Partial<Record<MilestoneMessage["type"], string>> = {
    diaversary: "linear-gradient(135deg, #1a2a5e 0%, #0d1b3e 100%)",
    birthday: "linear-gradient(135deg, #1a2a5e 0%, #2ab5c1 100%)",
    caregiver_burnout: "linear-gradient(135deg, #7f1d1d 0%, #1a2a5e 100%)",
  };

  const glowColors: Partial<Record<MilestoneMessage["type"], string>> = {
    diaversary: "rgba(245, 158, 11, 0.4)",
    birthday: "rgba(42, 181, 193, 0.4)",
    caregiver_burnout: "rgba(239, 68, 68, 0.3)",
  };

  return (
    <div
      className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-4xl"
      style={{
        background: bgColors[type] ?? "linear-gradient(135deg, #1a2a5e 0%, #0d1b3e 100%)",
        boxShadow: `0 0 30px ${glowColors[type] ?? "rgba(42, 181, 193, 0.3)"}`,
        animation: "badge-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      }}
    >
      {icon}
    </div>
  );
}

// ─── Milestone Type Label ─────────────────────────────────────────────────────

function TypeLabel({ type }: { type: MilestoneMessage["type"] }) {
  const labels: Partial<Record<MilestoneMessage["type"], string>> = {
    diaversary: "Diaversary",
    birthday: "Happy Birthday",
    caregiver_burnout: "For You, Caregiver",
  };

  const colors: Partial<Record<MilestoneMessage["type"], string>> = {
    diaversary: "text-amber-600",
    birthday: "text-teal-600",
    caregiver_burnout: "text-rose-600",
  };

  const label = labels[type];
  if (!label) return null;

  return (
    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${colors[type] ?? "text-blue-600"}`}>
      {label}
    </p>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
  // Trap focus and handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(milestone.id);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [milestone.id, onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const isCaregiverType = milestone.type === "caregiver_burnout";
  const isDiaversary = milestone.type === "diaversary";
  const isBirthday = milestone.type === "birthday";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13, 27, 62, 0.75)", backdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-modal-title"
    >
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0"
        onClick={() => onClose(milestone.id)}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ animation: "modal-fade-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards" }}
      >
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{
            background: isDiaversary
              ? "linear-gradient(90deg, #1a2a5e, #f59e0b)"
              : isBirthday
              ? "linear-gradient(90deg, #1a2a5e, #2ab5c1)"
              : isCaregiverType
              ? "linear-gradient(90deg, #1a2a5e, #ef4444)"
              : "linear-gradient(90deg, #1a2a5e, #2ab5c1)",
          }}
        />

        <div className="p-8 text-center">
          {/* Icon */}
          <ModalIcon type={milestone.type} />

          {/* Type label */}
          <TypeLabel type={milestone.type} />

          {/* Title */}
          <h2
            id="milestone-modal-title"
            className="text-2xl font-bold text-gray-900 mb-4 leading-tight"
          >
            {milestone.title}
          </h2>

          {/* Body */}
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {milestone.body}
          </p>

          {/* Subtext */}
          {milestone.subtext && (
            <p className="text-xs text-gray-400 italic mb-5">
              {milestone.subtext}
            </p>
          )}

          {/* Points (if applicable) */}
          {milestone.pointsAwarded && milestone.pointsAwarded > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5 mb-6">
              <span className="text-amber-500 font-bold text-sm">+{milestone.pointsAwarded}</span>
              <span className="text-amber-600 text-xs font-medium">points earned</span>
            </div>
          )}

          {/* GluMira signature */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">GluMira™</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* Close button */}
          <button
            onClick={() => onClose(milestone.id)}
            className="w-full py-3 px-6 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
            autoFocus
          >
            {isCaregiverType ? "Thank you" : isDiaversary ? "Thank you" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Queue Manager ──────────────────────────────────────────────────────

interface MilestoneModalQueueProps {
  milestones: MilestoneMessage[];
  onClose: (id: string) => void;
}

/**
 * Shows one modal at a time from the queue.
 * Only shows modal-appropriate types (diaversary, birthday, caregiver).
 */
export function MilestoneModalQueue({
  milestones,
  onClose,
}: MilestoneModalQueueProps) {
  const modalTypes = ["diaversary", "birthday", "caregiver_burnout"];
  const modalMilestones = milestones.filter((m) => modalTypes.includes(m.type));

  if (modalMilestones.length === 0) return null;

  // Show only the first pending modal
  const current = modalMilestones[0];

  return (
    <MilestoneModal
      key={current.id}
      milestone={current}
      onClose={onClose}
    />
  );
}

export default MilestoneModal;
