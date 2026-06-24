import { useEffect } from "react";
import { bindingFromEvent } from "./matcher";
import { Binding } from "./types";

// While `active`, captures the next key press as a Binding (capture phase, so it
// beats app shortcuts). Escape cancels. A bare modifier press is ignored until a
// real key arrives.
export function useKeybindCapture(opts: {
  active: boolean;
  onCapture: (binding: Binding) => void;
  onCancel?: () => void;
}): void {
  const { active, onCapture, onCancel } = opts;

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Escape") {
        onCancel?.();
        return;
      }
      const binding = bindingFromEvent(e);
      if (binding) onCapture(binding);
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [active, onCapture, onCancel]);
}
