// Auto-opens the edit-3D splash on mount. Owns the localStorage gate so
// pagescene.tsx never sees the key directly.
//
// Rules:
//   - Never auto-open when the URL has a scene token (the user is
//     visiting a specific scene; don't interrupt).
//   - Anonymous visitors: open every time (no localStorage gate).
//   - Signed-in users: open once, then suppress via SPLASH_SEEN_KEY.

import { useEffect } from "react";
import { useSession } from "../../../lib/session";
import { useSceneSplashStore } from "./scene-splash-store";

const SPLASH_SEEN_KEY = "edit_3d_splash_seen_v1";

export function markSplashSeen(): void {
  try {
    localStorage.setItem(SPLASH_SEEN_KEY, "1");
  } catch {
    // Private mode / storage disabled — splash will simply reopen next
    // visit, which is acceptable.
  }
}

export function useSceneSplashAutoOpen(sceneToken: string | undefined): void {
  const { loggedIn, authChecked } = useSession();
  const open = useSceneSplashStore((s) => s.open);

  useEffect(() => {
    if (sceneToken) return;
    if (!authChecked) return;
    if (loggedIn && localStorage.getItem(SPLASH_SEEN_KEY)) return;
    open();
  }, [sceneToken, loggedIn, authChecked, open]);
}
