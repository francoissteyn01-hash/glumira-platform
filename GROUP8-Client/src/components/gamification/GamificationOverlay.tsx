/**
 * GluMira™ — Gamification Overlay
 * Version: 1.0.0
 *
 * Renders the milestone toast container and modal queue.
 * This component should be placed once in the dashboard layout
 * so it appears on every authenticated page.
 *
 * It reads from the GamificationContext and renders:
 *   - MilestoneToastContainer (for badge/streak/tier events)
 *   - MilestoneModalQueue (for diaversary/birthday/caregiver events)
 */

import React from "react";
import { useGamification } from "../../lib/gamification/GamificationContext";
import { MilestoneToastContainer } from "./MilestoneToast";
import { MilestoneModalQueue } from "./MilestoneModal";
import "./mascot-animations.css";

export function GamificationOverlay() {
  const { pendingMilestones, dismissMilestone } = useGamification();

  return (
    <>
      {/* Toast notifications (badge earned, streak, tier upgrade, in-range) */}
      <MilestoneToastContainer
        milestones={pendingMilestones}
        onDismiss={dismissMilestone}
      />

      {/* Modal notifications (diaversary, birthday, caregiver) */}
      <MilestoneModalQueue
        milestones={pendingMilestones}
        onClose={dismissMilestone}
      />
    </>
  );
}

export default GamificationOverlay;
