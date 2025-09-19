import { Button } from "@storyteller/ui-button";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { MidjourneyGetCredentialInfo, MidjourneyGetCredentialInfoSuccess } from "@storyteller/tauri-api";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

  const handleMidjourneyButton = async () => {
    if (midjourneySession?.payload?.can_clear_state) {
      await clearState();
      setMidjourneySession(undefined);
    } else {
      await openLogin();
    }
  };

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

  return(
    <div className="flex justify-between items-center">
      <span>Midjourney Account:</span>
      <pre>{midjourneySession?.payload?.maybe_email || "Not logged in"}</pre>
      <Button
        variant={
          midjourneySession?.payload?.can_clear_state && !isCheckingMidjourneySession
            ? "destructive"
            : midjourneySession?.payload?.can_clear_state
            ? "primary"
            : "secondary"
        }
        className="h-[30px]"
        onClick={handleMidjourneyButton}
        disabled={isCheckingMidjourneySession}
      >
        {isCheckingMidjourneySession ? (
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-sm"
          />
        ) : midjourneySession?.payload?.can_clear_state ? (
          "Disconnect"
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  )
}