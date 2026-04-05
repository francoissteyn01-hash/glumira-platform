/**
 * SimplifiedLogger — 3 big buttons (Ate / Dosed / Checked)
 * Progressive inline expansion: tap a button, reveal one field at a time.
 * Touch targets respect the current sensory mode's touchTargetMin.
 */
import { useState } from "react";
import { useSensory } from "@/contexts/SensoryContext";

type Action = "ate" | "dosed" | "checked";

export default function SimplifiedLogger() {
  const { sensoryConfig } = useSensory();
  const [active, setActive] = useState<Action | null>(null);
  const [step, setStep] = useState(0);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const minSize = Math.max(56, sensoryConfig.touchTargetMin);

  const reset = () => {
    setActive(null);
    setStep(0);
    setValue("");
  };

  const commit = () => {
    setFeedback(`${active} logged`);
    setTimeout(() => setFeedback(null), 2000);
    reset();
  };

  const BigButton = ({ action, label }: { action: Action; label: string }) => (
    <button
      type="button"
      onClick={() => { setActive(action); setStep(1); }}
      style={{ minHeight: minSize }}
      className="flex-1 rounded-2xl bg-[#2AB5C1]/10 border border-[#2AB5C1]/30 px-4 py-5 text-base font-semibold text-[#1A2A5E] hover:bg-[#2AB5C1]/20"
    >
      {label}
    </button>
  );

  if (!active) {
    return (
      <div>
        <div className="flex gap-3">
          <BigButton action="ate" label="I ate" />
          <BigButton action="dosed" label="I dosed" />
          <BigButton action="checked" label="I checked" />
        </div>
        {feedback && (
          <p className="mt-3 text-center text-sm font-medium text-green-700 bg-green-50 rounded-lg py-2">
            {feedback}
          </p>
        )}
      </div>
    );
  }

  const prompts: Record<Action, string[]> = {
    ate: ["What did you eat?", "How many carbs (grams)?"],
    dosed: ["How many units?", "Which insulin (rapid/long)?"],
    checked: ["What was the number?", "Units (mmol/L or mg/dL)?"],
  };

  const currentPrompt = prompts[active][step - 1];
  const isLastStep = step >= prompts[active].length;

  return (
    <div className="rounded-2xl border border-[#2AB5C1]/30 bg-white p-4">
      <p className="text-sm text-gray-500 mb-1">Step {step} of {prompts[active].length}</p>
      <label className="block text-base font-semibold text-[#1A2A5E] mb-2">{currentPrompt}</label>
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ minHeight: minSize }}
        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base mb-3 focus:outline-none focus:ring-2 focus:ring-[#2AB5C1]"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          style={{ minHeight: minSize }}
          className="flex-1 rounded-lg border border-gray-300 bg-white text-[#1A2A5E] font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => { setValue(""); isLastStep ? commit() : setStep(step + 1); }}
          style={{ minHeight: minSize }}
          className="flex-1 rounded-lg bg-[#2AB5C1] text-white font-semibold"
        >
          {isLastStep ? "Save" : "Next"}
        </button>
      </div>
    </div>
  );
}
