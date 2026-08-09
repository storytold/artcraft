import { useState, useEffect } from "react";
import { Button } from "@storyteller/ui-button";
import { LoaderCircleIcon } from "lucide-react";
import {
  SoraGetCredentialInfo,
  LogoutSoraSession,
  SoraGetCredentialInfoSuccess,
} from "@storyteller/tauri-api";
import { invoke } from "@tauri-apps/api/core";
import { RefreshAccountStateEvent, useRefreshAccountStateEvent } from "@storyteller/tauri-events";

export const SoraAccountBlock = () => {
  const [soraSession, setSoraSession] = useState<SoraGetCredentialInfoSuccess| undefined>(undefined);
  const [isCheckingSoraSession, setIsCheckingSoraSession] = useState(false);

  const fetchSession = async () => {
    setIsCheckingSoraSession(true);
    try {
      const result = await SoraGetCredentialInfo();
      setSoraSession(result);
    } catch (e) {
      console.error("Error fetching Sora session", e);
      setSoraSession(undefined);
    } finally {
      setIsCheckingSoraSession(false);
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
      await LogoutSoraSession();
      //await invoke("sora_clear_credentials_command"); // TODO: Wrong command name
    } catch (e) {
      console.error("Error clearing Sora credentials", e);
    }
  }

  const openLogin = async() => {
    try {
      await invoke("open_sora_login_command");
    } catch (e) {
      console.error("Error opening Sora login", e);
    }
  }

  const handleSoraButton = async () => {
    if (soraSession?.payload?.can_clear_state) {
      await clearState();
      setSoraSession(undefined);
    } else {
      await openLogin();
    }
  };

  return(
    <div className="flex justify-between items-center">
      <span>Sora (OpenAI) Account:</span>
      <pre>{soraSession?.payload?.maybe_email || "Not logged in"}</pre>
      <Button
        variant={
          soraSession?.payload?.can_clear_state && !isCheckingSoraSession
            ? "destructive"
            : soraSession?.payload?.can_clear_state
            ? "primary"
            : "secondary"
        }
        className="h-[30px]"
        onClick={handleSoraButton}
        disabled={isCheckingSoraSession}
      >
        {isCheckingSoraSession ? (
          <LoaderCircleIcon
            
            className="animate-spin text-sm" />
        ) : soraSession?.payload?.can_clear_state ? (
          "Disconnect"
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  )
}