import { Button } from "@storyteller/ui-button";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { useRefreshAccountStateEvent } from "@storyteller/tauri-events";

interface CredentialInfo {
  payload: { maybe_email?: string; can_clear_state: boolean };
}

interface ProviderAccountBlockProps {
  /** Shown in the heading and in logged errors, e.g. "Grok". */
  name: string;
  /** Prefix of the provider's Tauri commands, e.g. "grok" for `grok_open_login_command`. */
  commandPrefix: string;
  getCredentialInfo: () => Promise<CredentialInfo>;
}

/** A provider account signed in through the app's own login window: who is signed in, and Connect / Disconnect. */
export const ProviderAccountBlock = ({
  name,
  commandPrefix,
  getCredentialInfo,
}: ProviderAccountBlockProps) => {
  const [session, setSession] = useState<CredentialInfo | undefined>(undefined);
  const [isChecking, setIsChecking] = useState(false);

  const fetchSession = async () => {
    setIsChecking(true);
    try {
      setSession(await getCredentialInfo());
    } catch (e) {
      console.error(`Error fetching ${name} session`, e);
      setSession(undefined);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    void fetchSession();
  }, []);

  useRefreshAccountStateEvent(async () => {
    void fetchSession();
  });

  /** Whether the stored credentials were cleared. */
  const clearState = async () => {
    try {
      await invoke(`${commandPrefix}_clear_credentials_command`);
      return true;
    } catch (e) {
      console.error(`Error clearing ${name} credentials`, e);
      return false;
    }
  };

  const openLogin = async () => {
    try {
      await invoke(`${commandPrefix}_open_login_command`);
    } catch (e) {
      console.error(`Error opening ${name} login`, e);
    }
  };

  const handleButton = async () => {
    if (session?.payload?.can_clear_state) {
      // A failed clear may have cleared part of the state; show what is left (Disconnect again retries).
      if (await clearState()) setSession(undefined);
      else await fetchSession();
    } else {
      await openLogin();
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
          {name} account
        </p>
        <p className="truncate text-sm font-medium text-base-fg/80">
          {session?.payload?.maybe_email || "Not logged in"}
        </p>
      </div>
      <Button
        variant={
          session?.payload?.can_clear_state && !isChecking
            ? "destructive"
            : session?.payload?.can_clear_state
            ? "primary"
            : "secondary"
        }
        className="h-9 shrink-0 px-3"
        onClick={handleButton}
        disabled={isChecking}
      >
        {isChecking ? (
          <LoaderCircleIcon className="animate-spin text-sm" />
        ) : session?.payload?.can_clear_state ? (
          "Disconnect"
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  );
};
