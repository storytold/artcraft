import { Button } from "@storyteller/ui-button";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import { MidjourneyGetCredentialInfo, MidjourneyGetCredentialInfoSuccess } from "@storyteller/tauri-api";
import { LoaderCircleIcon } from "lucide-react";
import { useRefreshAccountStateEvent } from "@storyteller/tauri-events";
import { RefreshAccountStateEvent } from "@storyteller/tauri-events";

export const MidjourneyAccountBlock = () => {
  const [midjourneySession, setMidjourneySession] = useState<MidjourneyGetCredentialInfoSuccess| undefined>(undefined);
  const [isCheckingMidjourneySession, setIsCheckingMidjourneySession] = useState(false);

  // WHY: the mount fetch and the refresh-event fetch can overlap; only the
  // newest request may write state, otherwise a slow older "logged out"
  // answer overwrites the fresh "logged in" one (and clears the spinner early).
  const latestFetchId = useRef(0);

  const fetchSession = async () => {
    const fetchId = ++latestFetchId.current;
    setIsCheckingMidjourneySession(true);
    try {
      const result = await MidjourneyGetCredentialInfo();
      if (fetchId !== latestFetchId.current) return;
      setMidjourneySession(result);
    } catch (e) {
      console.error("Error fetching Midjourney session", e);
      if (fetchId !== latestFetchId.current) return;
      setMidjourneySession(undefined);
    } finally {
      if (fetchId === latestFetchId.current) {
        setIsCheckingMidjourneySession(false);
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
      await invoke("midjourney_clear_credentials_command");
      return true;
    } catch (e) {
      console.error("Error clearing Midjourney credentials", e);
      return false;
    }
  }

  const openLogin = async() => {
    try {
      await invoke("midjourney_open_login_command");
    } catch (e) {
      console.error("Error opening Midjourney login", e);
    }
  }

  const handleMidjourneyButton = async () => {
    if (midjourneySession?.payload?.can_clear_state) {
      // WHY: only show "Not logged in" if the clear really succeeded;
      // on failure the credentials are still stored, so keep Disconnect.
      const cleared = await clearState();
      if (cleared) setMidjourneySession(undefined);
    } else {
      await openLogin();
    }
  };

  return(
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
          Midjourney account
        </p>
        <p className="truncate text-sm font-medium text-base-fg/80">
          {midjourneySession?.payload?.maybe_email || "Not logged in"}
        </p>
      </div>
      <Button
        variant={
          midjourneySession?.payload?.can_clear_state && !isCheckingMidjourneySession
            ? "destructive"
            : midjourneySession?.payload?.can_clear_state
            ? "primary"
            : "secondary"
        }
        className="h-9 shrink-0 px-3"
        onClick={handleMidjourneyButton}
        disabled={isCheckingMidjourneySession}
      >
        {isCheckingMidjourneySession ? (
          <LoaderCircleIcon className="animate-spin text-sm" />
        ) : midjourneySession?.payload?.can_clear_state ? (
          "Disconnect"
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  )
}