import { useEffect, useState } from "react";
import { UsersApi } from "@storyteller/api";

// Resolve the current session's username (needed by the gallery list API).
// Mirrors the gallery modal's session fetch; null while loading / logged out.
export function useDesktopUsername(): string | null {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
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
