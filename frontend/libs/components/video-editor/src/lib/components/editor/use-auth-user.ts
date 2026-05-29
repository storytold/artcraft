import { useCallback, useSyncExternalStore } from "react";
import type { AuthUser, AuthUserAdapter } from "../../adapters";

// Subscribe to the host's AuthUserAdapter so the editor chrome
// re-renders on sign-in / sign-out without a remount. Works whether
// or not the adapter implements the optional `subscribe` method —
// adapters without subscription support resolve once at mount.
export function useAuthUser(adapter: AuthUserAdapter): AuthUser | null {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!adapter.subscribe) {
        return () => {};
      }
      return adapter.subscribe(() => listener());
    },
    [adapter],
  );

  const getSnapshot = useCallback(
    () => adapter.currentUser(),
    [adapter],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
