import type { AuthUser, AuthUserAdapter } from "@storyteller/ui-video-editor";
import type { UserInfo } from "@storyteller/api";
import { useSessionStore } from "../../../lib/session";

// Webapp AuthUserAdapter — reads the current signed-in user from
// `useSessionStore` (Zustand) and subscribes to its changes so the
// editor chrome re-renders on sign-in / sign-out without a remount.

function mapUser(user: UserInfo | undefined): AuthUser | null {
  if (!user) return null;
  return {
    id: user.user_token,
    displayName: user.display_name,
  };
}

export const webappAuthUserAdapter: AuthUserAdapter = {
  currentUser() {
    return mapUser(useSessionStore.getState().user);
  },
  subscribe(listener) {
    let previous = mapUser(useSessionStore.getState().user);
    return useSessionStore.subscribe((state) => {
      const next = mapUser(state.user);
      // Identity check on shape: zustand fires on any state change, but
      // we only want to notify when the *user* changed.
      if (
        (previous === null && next === null) ||
        (previous?.id === next?.id && previous?.displayName === next?.displayName)
      ) {
        return;
      }
      previous = next;
      listener(next);
    });
  },
};
