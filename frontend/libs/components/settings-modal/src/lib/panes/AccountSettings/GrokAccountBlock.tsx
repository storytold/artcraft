import { Button } from "@storyteller/ui-button";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { useRefreshAccountStateEvent } from "@storyteller/tauri-events";
import { RefreshAccountStateEvent } from "@storyteller/tauri-events";
import { GrokGetCredentialInfo, GrokGetCredentialInfoSuccess } from "@storyteller/tauri-api";

export const GrokAccountBlock = () => {
  const [grokSession, setGrokSession] = useState<GrokGetCredentialInfoSuccess| undefined>(undefined);
  const [isCheckingGrokSession, setIsCheckingGrokSession] = useState(false);

  // WHY: the mount fetch and the refresh-event fetch can overlap; only the
  // newest request may write state, otherwise a slow older "logged out"
  // answer overwrites the fresh "logged in" one (and clears the spinner early).
  const latestFetchId = useRef(0);

  const fetchSession = async () => {
    const fetchId = ++latestFetchId.current;
    setIsCheckingGrokSession(true);
    try {
      const result = await GrokGetCredentialInfo();
      if (fetchId !== latestFetchId.current) return;
      setGrokSession(result);
    } catch (e) {
      console.error("Error fetching Grok session", e);
      if (fetchId !== latestFetchId.current) return;
      setGrokSession(undefined);
    } finally {
      if (fetchId === latestFetchId.current) {
        setIsCheckingGrokSession(false);
      }
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useRefreshAccountStateEvent(async (event: RefreshAccountStateEvent) => {
    fetchSession();
  });

  const clearState = async(): Promise<boolean> => {
    try {
      await invoke("grok_clear_credentials_command");
      return true;
    } catch (e) {
      console.error("Error clearing Grok credentials", e);
      return false;
    }
  }

  const openLogin = async() => {
    try {
      await invoke("grok_open_login_command");
    } catch (e) {
      console.error("Error opening Grok login", e);
    }
  }

  const handleGrokButton = async () => {
    if (grokSession?.payload?.can_clear_state) {
      // WHY: only show "Not logged in" if the clear really succeeded;
      // on failure the credentials are still stored, so keep Disconnect.
      const cleared = await clearState();
      if (cleared) setGrokSession(undefined);
    } else {
      await openLogin();
    }
  };

  return(
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
          Grok account
        </p>
        <p className="truncate text-sm font-medium text-base-fg/80">
          {grokSession?.payload?.maybe_email || "Not logged in"}
        </p>
      </div>
      <Button
        variant={
          grokSession?.payload?.can_clear_state && !isCheckingGrokSession
            ? "destructive"
            : grokSession?.payload?.can_clear_state
            ? "primary"
            : "secondary"
        }
        className="h-9 shrink-0 px-3"
        onClick={handleGrokButton}
        disabled={isCheckingGrokSession}
      >
        {isCheckingGrokSession ? (
          <LoaderCircleIcon className="animate-spin text-sm" />
        ) : grokSession?.payload?.can_clear_state ? (
          "Disconnect"
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  )
}