import { UsersApi } from "@storyteller/api";

type SessionResponse = Awaited<ReturnType<UsersApi["GetSession"]>>;

// Coalesce concurrent GetSession calls into a single in-flight request, and
// cap the wait so an unreachable backend (e.g. localhost desktop API not
// running) doesn't tie up connection slots for ~2.35s × N callers waiting on
// the OS-level TCP timeout. Callers who need a fresh result after auth state
// changes pass force=true to bypass the cache.
let inflight: Promise<SessionResponse> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;
const TIMEOUT_MS = 1500;

export function getSession(force = false): Promise<SessionResponse> {
  const now = Date.now();
  if (!force && inflight && now - cachedAt < CACHE_TTL_MS) {
    return inflight;
  }
  cachedAt = now;
  inflight = (async () => {
    try {
      return await Promise.race([
        new UsersApi().GetSession(),
        new Promise<SessionResponse>((_, reject) => {
          setTimeout(() => reject(new Error("session-timeout")), TIMEOUT_MS);
        }),
      ]);
    } catch {
      // Backend unreachable or timed out — return a not-logged-in shape so
      // callers don't need to special-case errors. Clear the cache so the
      // next call retries instead of serving the failure forever.
      inflight = null;
      cachedAt = 0;
      return {
        success: false,
        data: { loggedIn: false },
      } as SessionResponse;
    }
  })();
  return inflight;
}

export function invalidateSession() {
  inflight = null;
  cachedAt = 0;
}
