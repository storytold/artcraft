import type { AuthUser, AuthUserAdapter } from "@storyteller/ui-video-editor";
import type { UserInfo } from "~/models";
import { authentication } from "~/signals/authentication/authentication";

// Tauri AuthUserAdapter — wraps the Preact signal that holds the
// signed-in user. currentUser() reads the signal's value; subscribe()
// re-derives the projected AuthUser and notifies only on actual change.
//
// currentUser() must return a stable reference across calls while the
// underlying UserInfo identity is unchanged — React's
// useSyncExternalStore loop sees a new snapshot on every render
// otherwise and infinite-loops. The cache lives at module scope and
// is **only mutated by snapshot()**. Subscribers each maintain their
// own `previous` baseline so the cache can't be observed in a way
// that races between concurrent subscribers (the bug a webapp version
// of this file had earlier, which silently dropped sign-in/sign-out
// notifications to the second-and-later useAuthUser consumer when one
// ran before the others).

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
  const source = authentication.userInfo.value;
  if (source === cachedSource) return cachedResult;
  cachedSource = source;
  cachedResult = projectUser(source);
  return cachedResult;
}

export const tauriAuthUserAdapter: AuthUserAdapter = {
  currentUser() {
    return snapshot();
  },
  subscribe(listener) {
    // Per-listener `previous` — closed-over, not shared.
    let previous = projectUser(authentication.userInfo.value);
    return authentication.userInfo.subscribe((value) => {
      const next = projectUser(value);
      if (authUsersEqual(previous, next)) return;
      previous = next;
      listener(next);
    });
  },
};
