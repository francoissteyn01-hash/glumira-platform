/**
 * GluMira™ V7 — IOB Hunter v7 · What-If Sandbox (dual-mode)
 *
 * "My data" ↔ "What-if" toggle with immutable actualDoses + mutable
 * workingDoses deep clone. All what-if edits happen on workingDoses.
 * "Return to my data" button: workingDoses = structuredClone(actualDoses).
 *
 * Canonical rule: actualDoses is IMMUTABLE. Never mutate. Always clone.
 *
 * Edit operations supported:
 *   - Drag dose time (shift earlier/later) via number input for v1;
 *     touch-drag on the chart itself is a follow-up after slice 2.7
 *   - Tap dose → change units (decimal, 0.25U increments)
 *   - Tap insulin name → swap via regional resolver dropdown
 *   - Add dose, remove dose
 *   - Reset (restore working from actual)
 *   - Save scenario (tier-gated — shows TierGate if over limit)
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useMemo, useState } from "react";
import type {
  InsulinDose,
  InsulinProfile,
  Tier,
  WhatIfScenario,
  WhatIfResult,
} from "@/iob-hunter/types";
import { applyWhatIfScenario } from "@/iob-hunter/engine/iob-engine";
import { TIER_CONFIG } from "@/iob-hunter/engine/iob-engine";
import WhatIfConstraintBanner from "@/iob-hunter/components/IOBHunterWhatIfConstraintBanner";
import {
  buildWhatIfConstraints,
  flattenWhatIfConstraints,
  minutesToTime,
  validateWhatIfDose,
} from "@/iob-hunter/lib/whatif-constraints";

export type WhatIfMode = "my_data" | "what_if";

export type IOBHunterWhatIfProps = {
  /** IMMUTABLE — fetched from Supabase or passed in by parent. Never mutated. */
  actualDoses: InsulinDose[];
  /** Available profiles for insulin swap. */
  profiles: readonly InsulinProfile[];
  /** User's tier — controls save-scenario gating. */
  tier: Tier;
  /** How many scenarios the user has already saved this period. */
  savedScenarioCount: number;
  /** Called when the working doses change — parent updates the chart. */
  onWorkingDosesChange: (doses: InsulinDose[], result: WhatIfResult | null) => void;
  /** Called when the user clicks "Save scenario" and the tier allows it. */
  onSaveScenario?: (scenario: WhatIfScenario) => void;
  /** Called when the user hits a tier limit — parent shows the TierGate. */
  onTierGate?: (feature: "extra_what_if" | "save_scenario") => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function cloneDoses(doses: InsulinDose[]): InsulinDose[] {
  return doses.map((d) => ({ ...d }));
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function IOBHunterWhatIf({
  actualDoses,
  profiles,
  tier,
  savedScenarioCount,
  onWorkingDosesChange,
  onSaveScenario,
  onTierGate,
}: IOBHunterWhatIfProps) {
  const [mode, setMode] = useState<WhatIfMode>("my_data");
  const [workingDoses, setWorkingDoses] = useState<InsulinDose[]>(() =>
    cloneDoses(actualDoses),
  );
  const [constraintMessage, setConstraintMessage] = useState<string | undefined>();

  const tierLimits = TIER_CONFIG[tier];
  const canSave = savedScenarioCount < tierLimits.whatIfScenarios;
  const constraints = useMemo(() => buildWhatIfConstraints(actualDoses), [actualDoses]);
  const constraintMap = useMemo(
    () => new Map(flattenWhatIfConstraints(constraints).map((constraint) => [constraint.doseId, constraint])),
    [constraints],
  );

  /* ─── Notify parent whenever workingDoses or mode change ──────────── */
  const notifyParent = useCallback(
    (next: InsulinDose[]) => {
      if (mode === "my_data") {
        onWorkingDosesChange(actualDoses, null);
        return;
      }
      const result = applyWhatIfScenario(
        actualDoses,
        { name: "live", modified_doses: next },
        profiles,
      );
      onWorkingDosesChange(next, result);
    },
    [actualDoses, profiles, mode, onWorkingDosesChange],
  );

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "my_data" ? "what_if" : "my_data";
      if (next === "my_data") {
        onWorkingDosesChange(actualDoses, null);
      } else {
        const result = applyWhatIfScenario(
          actualDoses,
          { name: "live", modified_doses: workingDoses },
          profiles,
        );
        onWorkingDosesChange(workingDoses, result);
      }
      return next;
    });
  }, [actualDoses, profiles, workingDoses, onWorkingDosesChange]);

  const returnToMyData = useCallback(() => {
    const fresh = cloneDoses(actualDoses);
    setWorkingDoses(fresh);
    setMode("my_data");
    setConstraintMessage(undefined);
    onWorkingDosesChange(actualDoses, null);
  }, [actualDoses, onWorkingDosesChange]);

  const reset = useCallback(() => {
    const fresh = cloneDoses(actualDoses);
    setWorkingDoses(fresh);
    setConstraintMessage(undefined);
    if (mode === "what_if") {
      const result = applyWhatIfScenario(
        actualDoses,
        { name: "live", modified_doses: fresh },
        profiles,
      );
      onWorkingDosesChange(fresh, result);
    }
  }, [actualDoses, mode, profiles, onWorkingDosesChange]);

  /* ─── Dose-level edits ────────────────────────────────────────────── */

  const updateDose = useCallback(
    (id: string, patch: Partial<InsulinDose>) => {
      setWorkingDoses((prev) => {
        const currentDose = prev.find((dose) => dose.id === id);
        const constraint = constraintMap.get(id);
        if (!currentDose || !constraint) {
          setConstraintMessage("That dose can no longer be edited because its profile anchor is missing.");
          return prev;
        }

        const candidate = { ...currentDose, ...patch };
        const validation = validateWhatIfDose(
          {
            insulinType: candidate.insulin_name,
            time: candidate.administered_at,
            units: candidate.dose_units,
          },
          constraint,
        );

        if (!validation.valid) {
          setConstraintMessage(validation.reason);
          return prev;
        }

        setConstraintMessage(undefined);
        const next = prev.map((d) => (d.id === id ? candidate : d));
        notifyParent(next);
        return next;
      });
    },
    [constraintMap, notifyParent],
  );

  const removeDose = useCallback(
    (_id: string) => {
      setConstraintMessage("Removing doses is disabled in constrained What-If mode.");
    },
    [],
  );

  const addDose = useCallback(() => {
    setConstraintMessage("Adding new doses is disabled in constrained What-If mode.");
  }, []);

  const saveScenario = useCallback(() => {
    if (!canSave) {
      onTierGate?.("save_scenario");
      return;
    }
    onSaveScenario?.({
      name: `Scenario ${savedScenarioCount + 1}`,
      modified_doses: workingDoses,
    });
  }, [canSave, onTierGate, onSaveScenario, savedScenarioCount, workingDoses]);

  /* ─── Render ──────────────────────────────────────────────────────── */

  return (
    <section
      aria-label="What-if sandbox"
      style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        border: "1px solid var(--border-light)",
        padding: "clamp(16px, 4vw, 20px)",
        marginTop: 16,
      }}
    >
      {/* ─── Mode toggle + action buttons ────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          role="tablist"
          aria-label="Data mode"
          style={{
            display: "inline-flex",
            background: "var(--card-hover, #f1f5f9)",
            borderRadius: 999,
            padding: 4,
            gap: 2,
          }}
        >
          <ModeTab
            active={mode === "my_data"}
            onClick={() => mode === "what_if" && toggleMode()}
            label="My data"
          />
          <ModeTab
            active={mode === "what_if"}
            onClick={() => mode === "my_data" && toggleMode()}
            label="What-if"
          />
        </div>

        <button
          type="button"
          onClick={reset}
          aria-label="Reset working doses to actual"
          style={iconBtnStyle}
        >
          Reset
        </button>

        {mode === "what_if" && (
          <>
            <button
              type="button"
              onClick={returnToMyData}
              aria-label="Return to my data"
              style={iconBtnStyle}
            >
              ← My data
            </button>
            <button
              type="button"
              onClick={saveScenario}
              aria-label="Save scenario"
              style={{
                ...iconBtnStyle,
                background: canSave ? "var(--accent-teal, #2ab5c1)" : "var(--card-hover, #f1f5f9)",
                color: canSave ? "#fff" : "var(--text-faint)",
                borderColor: canSave ? "var(--accent-teal, #2ab5c1)" : "var(--border-light)",
              }}
            >
              Save scenario{canSave ? "" : " (Pro)"}
            </button>
          </>
        )}
      </div>

      {mode === "what_if" && (
        <WhatIfConstraintBanner message={constraintMessage} />
      )}

      {/* ─── Dose list (editable in what_if, readonly in my_data) ─── */}
      {mode === "what_if" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {workingDoses.map((dose) => (
            <DoseRow
              key={dose.id}
              dose={dose}
              constraint={constraintMap.get(dose.id)}
              onUpdate={(patch) => updateDose(dose.id, patch)}
              onRemove={() => removeDose(dose.id)}
            />
          ))}
          <button
            type="button"
            onClick={addDose}
            style={{
              ...iconBtnStyle,
              alignSelf: "flex-start",
              marginTop: 4,
            }}
          >
            + Add dose
          </button>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 11,
              color: "var(--text-faint)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontStyle: "italic",
            }}
          >
            Your actual data is never modified. Edits apply only in What-if mode.
          </p>
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--text-secondary)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          Showing your actual regimen. Switch to <strong>What-if</strong> to
          experiment with timing, insulin swaps, and dose splits without
          touching your real data.
        </p>
      )}
    </section>
  );
}

/* ─── Small sub-components ───────────────────────────────────────────── */

function ModeTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: "8px 18px",
        borderRadius: 999,
        border: "none",
        background: active ? "var(--bg-card)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        cursor: "pointer",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {label}
    </button>
  );
}

function DoseRow({
  dose,
  constraint,
  onUpdate,
  onRemove,
}: {
  dose: InsulinDose;
  constraint?: {
    insulinType: string;
    minTime: number;
    maxTime: number;
    minUnits: number;
    maxUnits: number;
  };
  onUpdate: (patch: Partial<InsulinDose>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 8,
        background: "var(--card-hover, #f8fafc)",
        border: "1px solid var(--border-light)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={dose.insulin_name}
          aria-label="Insulin"
          disabled
          style={{ ...inputStyle, color: "var(--text-secondary)", cursor: "not-allowed" }}
        />

        <input
          type="number"
          inputMode="decimal"
          step="0.25"
          min={constraint ? constraint.minUnits : 0}
          max={constraint ? constraint.maxUnits : undefined}
          value={dose.dose_units}
          onChange={(e) => onUpdate({ dose_units: Number(e.target.value) })}
          aria-label="Dose units"
          style={{ ...inputStyle, textAlign: "right" }}
        />

        <input
          type="time"
          value={dose.administered_at.length === 5 ? dose.administered_at : "12:00"}
          onChange={(e) => onUpdate({ administered_at: e.target.value })}
          aria-label="Time"
          style={inputStyle}
        />

        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove dose"
          style={{
            ...iconBtnStyle,
            color: "var(--text-faint)",
            borderColor: "var(--border-light)",
            minWidth: 38,
            padding: "0 10px",
          }}
        >
          ×
        </button>
      </div>

      {constraint && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-secondary)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          Locked to {constraint.insulinType}. Time window {minutesToTime(constraint.minTime)}-{minutesToTime(constraint.maxTime)}. Dose window {constraint.minUnits.toFixed(1)}-{constraint.maxUnits.toFixed(1)} U.
        </div>
      )}
    </div>
  );
}

/* ─── Shared inline styles ───────────────────────────────────────────── */

const iconBtnStyle: React.CSSProperties = {
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 8,
  border: "1px solid var(--border-light)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  minHeight: 38,
  padding: "0 10px",
  borderRadius: 6,
  border: "1px solid var(--border-light)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "'DM Sans', system-ui, sans-serif",
};
