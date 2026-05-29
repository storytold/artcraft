import type { AuthUser, AuthUserAdapter } from "@storyteller/ui-video-editor";
import type { UserInfo } from "@storyteller/api";
import { useSessionStore } from "../../../lib/session";

// Webapp AuthUserAdapter — reads the current signed-in user from
// `useSessionStore` (Zustand) and subscribes to its changes so the
// editor chrome re-renders on sign-in / sign-out without a remount.
//
// currentUser() must return a stable reference across calls when the
// underlying user hasn't changed — otherwise React's
// useSyncExternalStore loop sees a new snapshot every render and
// infinite-loops. We cache the projection at module scope keyed on the
// source UserInfo identity. **Only snapshot() mutates the cache.**
// Subscribers each maintain their own `previous` baseline so the cache
// can't be observed in a way that races between concurrent subscribers
// (the bug a previous version of this file had, which silently dropped
// sign-in/sign-out notifications to the second-and-later useAuthUser
// consumer when one ran before the others).

function projectUser(user: UserInfo | undefined): AuthUser | null {
  if (!user) return null;
  return { id: user.user_token, displayName: user.display_name };
}

function authUsersEqual(a: AuthUser | null, b: AuthUser | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  return a.id === b.id && a.displayName === b.displayName;
}

let cachedSource: UserInfo | undefined = undefined;
let cachedResult: AuthUser | null = null;

function snapshot(): AuthUser | null {
  const source = useSessionStore.getState().user;
  if (source === cachedSource) return cachedResult;
  cachedSource = source;
  cachedResult = projectUser(source);
  return cachedResult;
}

export const webappAuthUserAdapter: AuthUserAdapter = {
  currentUser() {
    return snapshot();
  },
  subscribe(listener) {
    // Per-listener `previous` — closed-over, not shared. Each
    // subscriber computes its own baseline so it doesn't observe other
    // subscribers' cache writes.
    let previous = projectUser(useSessionStore.getState().user);
    return useSessionStore.subscribe((state) => {
      const next = projectUser(state.user);
      if (authUsersEqual(previous, next)) return;
      previous = next;
      listener(next);
    });
  },
};
