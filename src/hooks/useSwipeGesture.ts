/**
 * GluMira™ V7 — useSwipeGesture hook
 * Detects horizontal swipe gestures on a ref element.
 * swipe-left → onSwipeLeft, swipe-right → onSwipeRight
 */

import { useRef, useEffect, useCallback } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // px, default 50
}

export function useSwipeGesture<T extends HTMLElement>(options: SwipeOptions) {
  const ref = useRef<T>(null);
  const startX = useRef(0);
  const startY = useRef(0);

  const threshold = options.threshold ?? 50;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;

      // Only trigger if horizontal movement exceeds vertical
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;

      if (dx < 0) options.onSwipeLeft?.();
      else options.onSwipeRight?.();
    },
    [options.onSwipeLeft, options.onSwipeRight, threshold]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return ref;
}
