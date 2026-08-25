import { useEffect, useState } from "react";
import { create } from "zustand";
import { useKeybindsStore } from "../keybinds-store";

const HOLD_MS = 3000;

// Session-only pin state, in a shared store (not hook-local) so chrome outside
// the surface that renders the overlay — e.g. the 3D editor's "Shortcuts"
// button — can toggle it. Pinned = the cheatsheet stays up until Esc, a click
// outside it, or the toggle again dismiss it.
interface CheatsheetPinState {
  pinned: boolean;
  setPinned: (v: boolean) => void;
  togglePinned: () => void;
}

export const useCheatsheetPin = create<CheatsheetPinState>((set) => ({
  pinned: false,
  setPinned: (pinned) => set({ pinned }),
  togglePinned: () => set((s) => ({ pinned: !s.pinned })),
}));

// Elements that opt out of the pinned overlay's click-outside dismissal:
// the overlay panel itself, and any button that toggles the pin (otherwise
// the toggle's own pointerdown would unpin first and the click would re-pin,
// making the button appear to do nothing).
const DISMISS_EXEMPT =
  "[data-keybinds-cheatsheet], [data-cheatsheet-toggle]";

// Visibility for the cheatsheet overlay. Two paths compose:
//  - Hold-to-peek: holding Ctrl (Cmd on Mac) ALONE for HOLD_MS shows it; any
//    other keydown cancels (a real Ctrl+C never trips it). On release it
//    hides — unless the `cheatsheetSticky` preference is on, in which case
//    the peek converts into a pin.
//  - Pin (useCheatsheetPin): stays visible until Esc, a click outside the
//    panel, or the pin toggle. Lifted from the moodboard's
//    useShortcutCheatsheet so every editor surface shares one implementation.
export const useCheatsheetVisibility = (): boolean => {
  const [held, setHeld] = useState(false);
  const pinned = useCheatsheetPin((s) => s.pinned);

  // Hold-to-peek.
  useEffect(() => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const modKey = isMac ? "Meta" : "Control";
    let timer: ReturnType<typeof setTimeout> | null = null;
    let modHeld = false;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const hide = () => setHeld((v) => (v ? false : v));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === modKey) {
        if (modHeld) return; // ignore auto-repeat
        modHeld = true;
        clearTimer();
        timer = setTimeout(() => {
          timer = null;
          setHeld(true);
        }, HOLD_MS);
        return;
      }
      // Any non-modifier press while held means a real combo — cancel.
      clearTimer();
      hide();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === modKey) {
        modHeld = false;
        clearTimer();
        // Sticky preference: releasing the modifier hands the peek over to
        // the pin instead of hiding, so it stays until Esc / click outside.
        setHeld((v) => {
          if (v && useKeybindsStore.getState().cheatsheetSticky) {
            useCheatsheetPin.getState().setPinned(true);
          }
          return false;
        });
      }
    };

    const onBlur = () => {
      modHeld = false;
      clearTimer();
      hide();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      clearTimer();
    };
  }, []);

  // Pinned dismissal: Esc (captured before the surface's own Escape actions)
  // or a pointerdown outside the panel/toggle.
  useEffect(() => {
    if (!pinned) return;
    const unpin = () => useCheatsheetPin.getState().setPinned(false);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        unpin();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.(DISMISS_EXEMPT)) return;
      unpin();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
    };
  }, [pinned]);

  // Leaving the surface (route change/unmount) drops the pin — the next
  // editor shouldn't open with a cheatsheet the user pinned somewhere else.
  useEffect(() => () => useCheatsheetPin.getState().setPinned(false), []);

  return held || pinned;
};
