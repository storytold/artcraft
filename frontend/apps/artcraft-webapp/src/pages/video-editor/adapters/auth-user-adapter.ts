import type { AuthUser, AuthUserAdapter } from "@storyteller/ui-video-editor";
import type { UserInfo } from "@storyteller/api";
import { useSessionStore } from "../../../lib/session";

// Webapp AuthUserAdapter — reads the current signed-in user from
// `useSessionStore` (Zustand) and subscribes to its changes so the
// editor chrome re-renders on sign-in / sign-out without a remount.
//
// `currentUser()` must return a stable reference across calls when the
// underlying user hasn't changed (otherwise React's useSyncExternalStore
// loop sees a new snapshot every render). We cache the last computed
// AuthUser keyed on the source UserInfo identity.

let cachedSource: UserInfo | undefined = undefined;
let cachedResult: AuthUser | null = null;

function snapshot(): AuthUser | null {
  const source = useSessionStore.getState().user;
  if (source === cachedSource) return cachedResult;
  cachedSource = source;
  cachedResult = source
    ? { id: source.user_token, displayName: source.display_name }
    : null;
  return cachedResult;
}

export const webappAuthUserAdapter: AuthUserAdapter = {
  currentUser() {
    return snapshot();
  },
  subscribe(listener) {
    return useSessionStore.subscribe(() => {
      // Recompute and only fire if the projected AuthUser changed.
      const previous = cachedResult;
      const next = snapshot();
      if (
        (previous === null && next === null) ||
        (previous?.id === next?.id && previous?.displayName === next?.displayName)
      ) {
        return;
      }
      listener(next);
    });
  },
};
