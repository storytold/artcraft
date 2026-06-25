import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Binding } from "../types";
import { useKeybindCapture } from "../useKeybindCapture";
import { KbdBindings } from "./Kbd";

// A click-to-record control showing the action's current binding(s). Clicking
// arms capture ("Press a key…"); the next key press is reported via onCapture.
// Dependency-free (plain elements) so the foundation lib needs no UI-lib refs.
export function KeybindCaptureInput({
  bindings,
  onCapture,
  accent,
  className,
}: {
  bindings: Binding[];
  onCapture: (binding: Binding) => void;
  /** Tint the resting state to mark a customized (overridden) binding. */
  accent?: boolean;
  className?: string;
}) {
  const [capturing, setCapturing] = useState(false);

  useKeybindCapture({
    active: capturing,
    onCapture: (b) => {
      setCapturing(false);
      onCapture(b);
    },
    onCancel: () => setCapturing(false),
  });

  return (
    <button
      type="button"
      onClick={() => setCapturing((v) => !v)}
      aria-label="Change keybinding"
      className={twMerge(
        "inline-flex min-h-8 min-w-[7rem] items-center justify-center rounded-md border px-2 py-1 text-sm transition-colors",
        capturing
          ? "border-primary/80 bg-primary/10 text-primary animate-pulse"
          : accent
            ? "border-primary/40 bg-primary/[0.06] hover:bg-primary/10"
            : "border-ui-controls-border bg-ui-controls hover:bg-ui-controls/80",
        className,
      )}
    >
      {capturing ? (
        <span className="text-[12px] font-medium">Press a key… (Esc to cancel)</span>
      ) : (
        <KbdBindings bindings={bindings} />
      )}
    </button>
  );
}
