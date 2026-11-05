import { useState, useEffect } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@storyteller/ui-button";

import { UsersApi } from "@storyteller/api";
import { UserInfo } from "@storyteller/api";
import { useLoginModalStore } from "@storyteller/ui-login-modal";
import { invoke } from "@tauri-apps/api/core";

const usersApi = new UsersApi();

export interface ArtcraftAccountBlockProps {
  globalAccountLogoutCallback: () => void;
}

export const ArtcraftAccountBlock = ({
  globalAccountLogoutCallback,
}: ArtcraftAccountBlockProps) => {
  const { triggerRecheck } = useLoginModalStore();
  const [artcraftSession, setArtcraftSession] = useState<UserInfo | undefined>(
    undefined
  );
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isCheckingArtcraftSession, setIsCheckingArtcraftSession] =
    useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      setIsCheckingArtcraftSession(true);
      try {
        const result = await usersApi.GetSession();
        // FIX: a debug `console.log(">>> result", result)` used to dump the
        // whole session response (user profile) to the console; removed.
        setArtcraftSession(result?.data?.user);
        setIsLoggedIn(result?.data?.loggedIn || false);
      } catch (e) {
        console.error("Error fetching Artcraft session", e);
        setArtcraftSession(undefined);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingArtcraftSession(false);
      }
    };
    fetchSession();
  }, []);

  const handleArtcraftButton = async () => {
    if (isCheckingArtcraftSession) return;
    if (isLoggedIn) {
      setIsCheckingArtcraftSession(true);
      // FIX: Logout() used to be awaited with no catch. When the request threw
      // the spinner never cleared (the button stayed disabled forever) and the
      // rejection went unhandled. Now we always clear the spinner, and on
      // failure we stay logged in (nothing was logged out) so the user can retry.
      try {
        await usersApi.Logout();
      } catch (e) {
        console.error("Error logging out of Artcraft", e);
        setIsCheckingArtcraftSession(false);
        return;
      }
      setArtcraftSession(undefined);
      setIsLoggedIn(false);
      setIsCheckingArtcraftSession(false);
      globalAccountLogoutCallback(); // TODO: This resets the old global application state


      triggerRecheck(); // Trigger modal to recheck session and potentially open

      // WHY: the purge command rejects when the Rust side cannot delete the
      // stored credentials; uncaught, that surfaces as an unhandled promise
      // rejection from this click handler.
      try {
        await invoke("storyteller_purge_credentials_command");
      } catch (e) {
        console.error("Error purging Artcraft credentials", e);
      }
    } else {
      triggerRecheck(); // Open login modal instead of redirecting
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
          ArtCraft account
        </p>
        <p className="truncate text-sm font-medium text-base-fg/80">
          {artcraftSession?.display_name || "Not logged in"}
        </p>
      </div>
      <Button
        variant={
          isCheckingArtcraftSession
            ? "secondary"
            : isLoggedIn
            ? "destructive"
            : "primary"
        }
        className="h-9 shrink-0 px-3"
        onClick={handleArtcraftButton}
        disabled={isCheckingArtcraftSession}
      >
        {isCheckingArtcraftSession ? (
          <LoaderCircleIcon className="animate-spin text-sm" />
        ) : isLoggedIn ? (
          "Log Out"
        ) : (
          "Log In"
        )}
      </Button>
    </div>
  );
};
