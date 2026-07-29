import { useEffect, useState } from "react";

const HOLD_MS = 3000;

// Shows the cheatsheet when the user holds Ctrl (or Cmd on Mac) alone for
// HOLD_MS with no other key pressed. Any other keydown cancels the timer,
// so a real `Ctrl+C` / `Cmd+X` never trips it. Releasing the modifier hides
// the cheatsheet immediately.
export const useShortcutCheatsheet = (): boolean => {
  const [visible, setVisible] = useState(false);

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

    const hide = () => {
      setVisible((v) => (v ? false : v));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === modKey) {
        // Ignore auto-repeat keydown while already held.
        if (modHeld) return;
        modHeld = true;
        clearTimer();
        timer = setTimeout(() => {
          timer = null;
          setVisible(true);
        }, HOLD_MS);
        return;
      }
      // Any non-modifier key press while the modifier is held cancels the
      // planned cheatsheet — the user is running a real combo.
      clearTimer();
      hide();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === modKey) {
        modHeld = false;
        clearTimer();
        hide();
      }
    };

    // Losing focus while holding the key should also cancel.
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

  return visible;
};
