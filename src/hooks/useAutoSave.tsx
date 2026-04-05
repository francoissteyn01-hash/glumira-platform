/**
 * GluMira™ V7 — useAutoSave hook
 * Debounced auto-save (500ms) with inline "✓ Saved" indicator.
 * Usage:
 *   const { status, save } = useAutoSave(async (val) => { await api.patch(...) });
 *   <input onChange={e => { setVal(e.target.value); save(e.target.value); }} />
 *   <SavedIndicator status={status} />
 */

import { useState, useRef, useCallback, useEffect } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface Options {
  debounceMs?: number;
  clearAfterMs?: number;
}

export function useAutoSave<T>(
  saveFn: (value: T) => Promise<void> | void,
  opts: Options = {}
) {
  const { debounceMs = 500, clearAfterMs = 2000 } = opts;
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (clearRef.current) clearTimeout(clearRef.current);
    };
  }, []);

  const save = useCallback(
    (value: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (clearRef.current) clearTimeout(clearRef.current);

      timerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        setStatus("saving");
        setError(null);
        try {
          await saveFn(value);
          if (!mountedRef.current) return;
          setStatus("saved");
          clearRef.current = setTimeout(() => {
            if (mountedRef.current) setStatus("idle");
          }, clearAfterMs);
        } catch (e: any) {
          if (!mountedRef.current) return;
          setStatus("error");
          setError(e?.message ?? "Save failed");
        }
      }, debounceMs);
    },
    [saveFn, debounceMs, clearAfterMs]
  );

  return { status, error, save };
}

/** Inline saved indicator — use next to any field */
export function SavedIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const styles: Record<SaveStatus, React.CSSProperties> = {
    idle: {},
    saving: { color: "#718096" },
    saved: { color: "#10b981", animation: "fadeIn 0.2s ease" },
    error: { color: "#ef4444" },
  };
  const text: Record<SaveStatus, string> = {
    idle: "",
    saving: "Saving...",
    saved: "\u2713 Saved",
    error: "\u26a0 Error",
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        marginLeft: 8,
        transition: "opacity 0.3s",
        ...styles[status],
      }}
      role="status"
      aria-live="polite"
    >
      {text[status]}
    </span>
  );
}
