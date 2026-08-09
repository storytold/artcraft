import { Button } from "@storyteller/ui-button";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { useRefreshAccountStateEvent } from "@storyteller/tauri-events";
import { RefreshAccountStateEvent } from "@storyteller/tauri-events";
import { WorldLabsGetCredentialInfo, WorldLabsGetCredentialInfoSuccess } from "@storyteller/tauri-api";

export const WorldLabsAccountBlock = () => {
  const [worldlabsSession, setWorldlabsSession] = useState<WorldLabsGetCredentialInfoSuccess| undefined>(undefined);
  const [isCheckingWorldlabsSession, setIsCheckingWorldlabsSession] = useState(false);

  const fetchSession = async () => {
    setIsCheckingWorldlabsSession(true);
    try {
      const result = await WorldLabsGetCredentialInfo();
      setWorldlabsSession(result);
    } catch (e) {
      console.error("Error fetching WorldLabs session", e);
      setWorldlabsSession(undefined);
    } finally {
      setIsCheckingWorldlabsSession(false);
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
      await invoke("worldlabs_clear_credentials_command");
    } catch (e) {
      console.error("Error clearing WorldLabs credentials", e);
    }
  }

  const openLogin = async() => {
    try {
      await invoke("worldlabs_open_login_command");
    } catch (e) {
      console.error("Error opening WorldLabs login", e);
    }
  }

  const handleWorldlabsButton = async () => {
    if (worldlabsSession?.payload?.can_clear_state) {
      await clearState();
      setWorldlabsSession(undefined);
    } else {
      await openLogin();
    }
  };

  console.log("worldlabs session", worldlabsSession);

  return(
    <div className="flex justify-between items-center">
      <span>WorldLabs Account:</span>
      <pre>{worldlabsSession?.payload?.maybe_email || "Not logged in"}</pre>
      <Button
        variant={
          worldlabsSession?.payload?.can_clear_state && !isCheckingWorldlabsSession
            ? "destructive"
            : worldlabsSession?.payload?.can_clear_state
            ? "primary"
            : "secondary"
        }
        className="h-[30px]"
        onClick={handleWorldlabsButton}
        disabled={isCheckingWorldlabsSession}
      >
        {isCheckingWorldlabsSession ? (
          <LoaderCircleIcon
            
            className="animate-spin text-sm" />
        ) : worldlabsSession?.payload?.can_clear_state ? (
          "Disconnect"
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  )
}