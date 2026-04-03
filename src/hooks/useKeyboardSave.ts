import { useEffect } from "react";

/**
 * Ctrl+S / Cmd+S save shortcut.
 * Prevents browser default save-page dialog.
 */
export function useKeyboardSave(onSave: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave]);
}
