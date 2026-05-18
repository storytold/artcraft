import { useEffect } from "react";
import { create } from "zustand";
import { UsersApi, type UserInfo } from "@storyteller/api";

interface SessionState {
  user: UserInfo | undefined;
  loggedIn: boolean;
  authChecked: boolean;
  setSession: (next: Partial<Omit<SessionState, "setSession">>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: undefined,
  loggedIn: false,
  authChecked: false,
  setSession: (next) => set(next),
}));

// Module-level coalescing so every consumer shares one in-flight network call.
let inflight: Promise<void> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;
const TIMEOUT_MS = 1500;

async function fetchAndStoreSession(): Promise<void> {
  try {
    const response = await Promise.race([
      new UsersApi().GetSession(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("session-timeout")), TIMEOUT_MS);
      }),
    ]);

    const loggedIn = !!(response.success && response.data?.loggedIn && response.data.user);
    useSessionStore.getState().setSession({
      user: loggedIn ? response.data!.user : undefined,
      loggedIn,
      authChecked: true,
    });
  } catch {
    // Backend unreachable or timed out — clear cache so next call retries.
    inflight = null;
    cachedAt = 0;
    useSessionStore.getState().setSession({
      user: undefined,
      loggedIn: false,
      authChecked: true,
    });
  }
}

export function refreshSession(force = false): Promise<void> {
  const now = Date.now();
  if (!force && inflight && now - cachedAt < CACHE_TTL_MS) {
    return inflight;
  }
  cachedAt = now;
  inflight = fetchAndStoreSession();
  return inflight;
}

export function invalidateSession(): void {
  inflight = null;
  cachedAt = 0;
}

export function updateSessionUser(partial: Partial<UserInfo>): void {
  const current = useSessionStore.getState().user;
  if (!current) return;
  useSessionStore.getState().setSession({
    user: { ...current, ...partial },
  });
  invalidateSession();
}

// Attach the auth-change listener exactly once per page load. Login/logout/
// password-reset flows dispatch this event; every consumer shares the resulting
// store update instead of each re-running its own effect.
let listenerAttached = false;
function ensureAuthChangeListener(): void {
  if (listenerAttached || typeof window === "undefined") return;
  listenerAttached = true;
  window.addEventListener("auth-change", () => {
    invalidateSession();
    refreshSession(true);
  });
}

let bootRequested = false;

export interface UseSessionResult {
  user: UserInfo | undefined;
  loggedIn: boolean;
  authChecked: boolean;
}

/** Subscribe to session state. The first caller per page-load triggers the fetch. */
export function useSession(): UseSessionResult {
  const user = useSessionStore((s) => s.user);
  const loggedIn = useSessionStore((s) => s.loggedIn);
  const authChecked = useSessionStore((s) => s.authChecked);

  useEffect(() => {
    ensureAuthChangeListener();
    if (!bootRequested) {
      bootRequested = true;
      refreshSession();
    }
  }, []);

  return { user, loggedIn, authChecked };
}

// Backwards-compatible response shape for legacy `await getSession()` callers.
type LegacyResponse = {
  success: boolean;
  data: { loggedIn: boolean; user?: UserInfo };
};

export async function getSession(force = false): Promise<LegacyResponse> {
  await refreshSession(force);
  const state = useSessionStore.getState();
  return {
    success: true,
    data: { loggedIn: state.loggedIn, user: state.user },
  };
}
