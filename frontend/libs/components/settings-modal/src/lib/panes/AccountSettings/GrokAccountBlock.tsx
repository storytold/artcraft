import { Button } from "@storyteller/ui-button";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { useRefreshAccountStateEvent } from "@storyteller/tauri-events";
import { RefreshAccountStateEvent } from "@storyteller/tauri-events";
import { GrokGetCredentialInfo, GrokGetCredentialInfoSuccess } from "@storyteller/tauri-api";

export const GrokAccountBlock = () => {
  const [grokSession, setGrokSession] = useState<GrokGetCredentialInfoSuccess| undefined>(undefined);
  const [isCheckingGrokSession, setIsCheckingGrokSession] = useState(false);

  const fetchSession = async () => {
    setIsCheckingGrokSession(true);
    try {
      const result = await GrokGetCredentialInfo();
      setGrokSession(result);
    } catch (e) {
      console.error("Error fetching Grok session", e);
      setGrokSession(undefined);
    } finally {
      setIsCheckingGrokSession(false);
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
      await invoke("grok_clear_credentials_command");
    } catch (e) {
      console.error("Error clearing Grok credentials", e);
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
      await clearState();
      setGrokSession(undefined);
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