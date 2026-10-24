// useDesktopUsername: hook that looks up the signed-in user's username.
// Used by the Generate Image / Video / Audio pages, which need the username to ask the gallery list API for
// that user's media. Talks to the web backend through UsersApi.GetSession() from @storyteller/api.

import { useEffect, useState } from "react";
import { UsersApi } from "@storyteller/api";

// Resolve the current session's username (needed by the gallery list API).
// Mirrors the gallery modal's session fetch; null while loading / logged out.
// Returns the username string, or null while loading, when logged out, or if the lookup failed.
export function useDesktopUsername(): string | null {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Guards against setting state after the component unmounted while the request was still in flight.
    let cancelled = false;
    (async () => {
      try {
        const session = await new UsersApi().GetSession();
        if (!cancelled && session.success && session.data?.user) {
          setUsername(session.data.user.username);
        }
      } catch {
        // ignore — stays null and the page shows the empty state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return username;
}
