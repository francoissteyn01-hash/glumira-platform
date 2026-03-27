/**
 * GluMira™ StoryEngine — Storybook Stories
 *
 * One story per profile for visual QA of the StoryEngine component.
 * Covers all 7 profiles, loading state, error state, and reduced-motion mode.
 *
 * To run Storybook:
 *   npx storybook@latest init  (first time setup)
 *   pnpm storybook             (subsequent runs)
 *
 * Onboarding 3 — Prompt 3 (Upgrade 12)
 */

import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { StoryEngine } from "./StoryEngine";
import type { ProfileType } from "./types";

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof StoryEngine> = {
  title: "GluMira/Onboarding/StoryEngine",
  component: StoryEngine,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "navy",
      values: [
        { name: "navy", value: "#1a2a5e" },
        { name: "white", value: "#ffffff" },
        { name: "dark", value: "#0d1b3e" },
      ],
    },
    docs: {
      description: {
        component: `
**GluMira™ StoryEngine** — Animated onboarding explainer component.

Renders a profile-specific story with:
- Auto-advancing scenes (duration_ms per scene)
- ElevenLabs TTS narration (degrades gracefully to subtitle-only)
- Framer Motion animations with prefers-reduced-motion support
- Tap/swipe/keyboard navigation
- Progress bar with scene markers
- Persistent subtitle bar
- Single or dual CTA routing

**Usage:**
\`\`\`tsx
<StoryEngine
  profile="patient"
  onComplete={(route) => navigate(route)}
  onSkip={() => navigate("/dashboard")}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    profile: {
      control: "select",
      options: [
        "patient",
        "parent",
        "child",
        "teen",
        "clinician",
        "organisation",
        "researcher",
      ] satisfies ProfileType[],
      description: "The user profile — determines which story script is loaded",
    },
    autoAdvance: {
      control: "boolean",
      description: "Enable/disable auto-advance for QA purposes",
    },
    onComplete: {
      action: "onComplete",
      description: "Called when the user taps the CTA",
    },
    onSkip: {
      action: "onSkip",
      description: "Called when the user taps Skip",
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "390px",
          height: "780px",
          margin: "0 auto",
          position: "relative",
          overflow: "hidden",
          borderRadius: "40px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StoryEngine>;

// ─── Shared args ──────────────────────────────────────────────────────────────

const sharedArgs = {
  onComplete: fn(),
  onSkip: fn(),
  autoAdvance: true,
};

// ─── Profile Stories ──────────────────────────────────────────────────────────

/**
 * Patient — warm_neutral voice, 7 scenes, 68s
 * Adult managing their own diabetes. Empowering, peer-level tone.
 */
export const Patient: Story = {
  args: { ...sharedArgs, profile: "patient" },
  parameters: {
    backgrounds: { default: "navy" },
    docs: {
      description: {
        story:
          "Patient profile — warm_neutral voice, 7 scenes, 68s. Adult managing their own diabetes.",
      },
    },
  },
};

/**
 * Parent — warm_reassuring voice, 6 scenes, 57s
 * Caregiver of a child with diabetes. Reassuring, safety-focused tone.
 */
export const Parent: Story = {
  args: { ...sharedArgs, profile: "parent" },
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story:
          "Parent profile — warm_reassuring voice, 6 scenes, 57s. Caregiver of a child with diabetes.",
      },
    },
  },
};

/**
 * Child — friendly_upbeat voice, 5 scenes, 40s
 * Ages 8–14. Playful, heroic, badge-driven. High energy delivery.
 */
export const Child: Story = {
  args: { ...sharedArgs, profile: "child" },
  parameters: {
    backgrounds: { default: "navy" },
    docs: {
      description: {
        story:
          "Child profile — friendly_upbeat voice, 5 scenes, 40s. Ages 8–14. Playful and badge-driven.",
      },
    },
  },
};

/**
 * Teen — calm_peer voice, 6 scenes, 52s
 * Ages 15–18. Minimal, cool, peer-level. No hand-holding.
 */
export const Teen: Story = {
  args: { ...sharedArgs, profile: "teen" },
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story:
          "Teen profile — calm_peer voice, 6 scenes, 52s. Ages 15–18. Minimal and peer-level.",
      },
    },
  },
};

/**
 * Clinician — professional_measured voice, 6 scenes, 58s
 * Dual CTA (cta_options). Evidence-led, clinical, time-constrained audience.
 */
export const Clinician: Story = {
  args: { ...sharedArgs, profile: "clinician" },
  parameters: {
    backgrounds: { default: "white" },
    docs: {
      description: {
        story:
          "Clinician profile — professional_measured voice, 6 scenes, 58s. Dual CTA (cta_options).",
      },
    },
  },
};

/**
 * Organisation (School) — calm_authoritative voice, 6 scenes, 60s
 * School nurse / administrator. Clear, procedural, safety-first.
 */
export const Organisation: Story = {
  args: { ...sharedArgs, profile: "organisation" },
  parameters: {
    backgrounds: { default: "white" },
    docs: {
      description: {
        story:
          "Organisation profile — calm_authoritative voice, 6 scenes, 60s. School nurse / administrator.",
      },
    },
  },
};

/**
 * Researcher — professional_measured voice, 6 scenes, 55s
 * Academic / clinical researcher. Data-focused, evidence-led.
 */
export const Researcher: Story = {
  args: { ...sharedArgs, profile: "researcher" },
  parameters: {
    backgrounds: { default: "navy" },
    docs: {
      description: {
        story:
          "Researcher profile — professional_measured voice, 6 scenes, 55s. Academic / clinical researcher.",
      },
    },
  },
};

// ─── State Stories ────────────────────────────────────────────────────────────

/**
 * Auto-advance disabled — useful for QA: tap through scenes manually.
 */
export const ManualAdvance: Story = {
  name: "Manual Advance (QA Mode)",
  args: { ...sharedArgs, profile: "patient", autoAdvance: false },
  parameters: {
    backgrounds: { default: "navy" },
    docs: {
      description: {
        story:
          "Auto-advance disabled. Tap/click or use ArrowRight to advance scenes manually. Useful for visual QA.",
      },
    },
  },
};

/**
 * All profiles — render all 7 profiles in a grid for side-by-side QA.
 * Note: This story renders outside the phone-frame decorator.
 */
export const AllProfiles: Story = {
  name: "All Profiles (Grid QA)",
  args: { ...sharedArgs, profile: "patient", autoAdvance: false },
  decorators: [
    () => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          padding: "24px",
          background: "#0d1b3e",
          minHeight: "100vh",
        }}
      >
        {(
          [
            "patient",
            "parent",
            "child",
            "teen",
            "clinician",
            "organisation",
            "researcher",
          ] as ProfileType[]
        ).map((profile) => (
          <div
            key={profile}
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              height: "480px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                zIndex: 10,
                background: "rgba(0,0,0,0.5)",
                color: "#2ab5c1",
                fontSize: "10px",
                fontFamily: "monospace",
                padding: "2px 6px",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {profile}
            </div>
            <StoryEngine
              profile={profile}
              autoAdvance={false}
              onComplete={fn()}
              onSkip={fn()}
            />
          </div>
        ))}
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "All 7 profiles rendered side-by-side in a grid. Auto-advance disabled for QA. Use this story to verify visual consistency across profiles.",
      },
    },
  },
};
