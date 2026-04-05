/**
 * GluMira™ V7 — DecimalInput
 *
 * Keyboard-friendly decimal input that accepts intermediate typing states
 * like "", "1", "1.", ".5", "0.25". Parses to a number only onBlur so the
 * user is never interrupted mid-type.
 *
 * Replaces <input type="number"> everywhere in the app. Critical for
 * insulin dosing (0.25U increments) and carb/protein/fat gram entry.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useEffect, useState } from "react";

export interface DecimalInputProps {
  value: number | string | null | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number; // UI hint only — does not restrict input
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  allowNegative?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

function numberToString(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (Number.isNaN(v)) return "";
  return String(v);
}

export default function DecimalInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  disabled,
  readOnly,
  className,
  style,
  id,
  name,
  allowNegative = false,
  onBlur,
  onFocus,
  ...aria
}: DecimalInputProps) {
  const [localValue, setLocalValue] = useState<string>(() => numberToString(value));

  // Sync external value → local only when not focused (avoid interrupting typing)
  useEffect(() => {
    const str = numberToString(value);
    setLocalValue((prev) => {
      const prevParsed = parseFloat(prev);
      if (!Number.isNaN(prevParsed) && prevParsed === parseFloat(str)) return prev;
      return str;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const regex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Allow empty, digits, single decimal point, leading decimal, optional leading minus
    if (raw === "" || raw === "-" || regex.test(raw)) {
      setLocalValue(raw);
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const raw = e.target.value.trim();
    if (raw === "" || raw === "-" || raw === ".") {
      onChange(0);
      setLocalValue("");
    } else {
      let parsed = parseFloat(raw);
      if (Number.isNaN(parsed)) {
        parsed = 0;
        setLocalValue("");
      } else {
        if (typeof min === "number" && parsed < min) parsed = min;
        if (typeof max === "number" && parsed > max) parsed = max;
        setLocalValue(String(parsed));
      }
      onChange(parsed);
    }
    onBlur?.(e);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      pattern={allowNegative ? "-?[0-9]*\\.?[0-9]*" : "[0-9]*\\.?[0-9]*"}
      autoComplete="off"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      style={style}
      id={id}
      name={name}
      {...aria}
    />
  );
}
