// src/hooks/useFocusTrap.js
// Lightweight focus trap for modal dialogs — no external dependencies.
// Traps Tab/Shift+Tab within the referenced element.

import { useEffect, useRef } from "react";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(isActive = true) {
  const trapRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!isActive || !trapRef.current) return;

    // Save current focus to restore later
    previousFocus.current = document.activeElement;

    // Focus the first focusable element inside the trap
    const focusable = trapRef.current.querySelectorAll(FOCUSABLE);
    if (focusable.length > 0) {
      setTimeout(() => focusable[0]?.focus(), 50);
    }

    const handleKeyDown = (e) => {
      if (e.key !== "Tab" || !trapRef.current) return;

      const nodes = trapRef.current.querySelectorAll(FOCUSABLE);
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if at first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if at last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus when trap deactivates
      if (previousFocus.current && typeof previousFocus.current.focus === "function") {
        previousFocus.current.focus();
      }
    };
  }, [isActive]);

  return trapRef;
}
