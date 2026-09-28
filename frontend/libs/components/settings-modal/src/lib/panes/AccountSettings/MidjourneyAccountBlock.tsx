import { Button } from "@storyteller/ui-button";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { MidjourneyGetCredentialInfo, MidjourneyGetCredentialInfoSuccess } from "@storyteller/tauri-api";
import { LoaderCircleIcon } from "lucide-react";
import { useRefreshAccountStateEvent } from "@storyteller/tauri-events";
import { RefreshAccountStateEvent } from "@storyteller/tauri-events";

export const MidjourneyAccountBlock = () => {
  const [midjourneySession, setMidjourneySession] = useState<MidjourneyGetCredentialInfoSuccess| undefined>(undefined);
  const [isCheckingMidjourneySession, setIsCheckingMidjourneySession] = useState(false);

  const fetchSession = async () => {
    setIsCheckingMidjourneySession(true);
    try {
      const result = await MidjourneyGetCredentialInfo();
      setMidjourneySession(result);
    } catch (e) {
      console.error("Error fetching Midjourney session", e);
      setMidjourneySession(undefined);
    } finally {
      setIsCheckingMidjourneySession(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useRefreshAccountStateEvent(async (event: RefreshAccountStateEvent) => {
    fetchSession();
  });

  const clearState = async() => {
    try {
      await invoke("midjourney_clear_credentials_command");
    } catch (e) {
      console.error("Error clearing Midjourney credentials", e);
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
      await clearState();
      setMidjourneySession(undefined);
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