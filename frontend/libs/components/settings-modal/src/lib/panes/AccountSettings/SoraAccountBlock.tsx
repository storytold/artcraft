import { useState, useEffect } from "react";
import { Button } from "@storyteller/ui-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import {
  CheckSoraSession,
  SoraSessionState,
  LogoutSoraSession,
  useSoraLoginListener,
  CheckSoraSessionResult,
} from "@storyteller/tauri-api";
import { invoke } from "@tauri-apps/api/core";

const DEFAULT_CACHE_TTL_MS = 1 * 60 * 1000; // 1 minute

interface SoraAccountBlockProps {
  cacheKey?: string;
  cacheTtlMs?: number;
}

export const SoraAccountBlock = ({
  cacheKey = "soraSettingsSessionCache",
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
}: SoraAccountBlockProps) => {
  const [soraSession, setSoraSession] = useState<CheckSoraSessionResult| undefined>(undefined);
  const [isCheckingSoraSession, setIsCheckingSoraSession] = useState(false);

  useSoraLoginListener(() => {
    setIsCheckingSoraSession(true);
    CheckSoraSession()
      .then((result) => {
        setSoraSession(result);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ session: result, timestamp: Date.now() })
        );
      })
      .finally(() => setIsCheckingSoraSession(false));
  });

  useEffect(() => {
    const fetchSession = async () => {
      setIsCheckingSoraSession(true);
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { session, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheTtlMs) {
            setSoraSession(session);
            setIsCheckingSoraSession(false);
            return;
          }
        }
        const result = await CheckSoraSession();
        setSoraSession(result);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ session: result, timestamp: Date.now() })
        );
      } catch (e) {
        console.error("Error fetching Sora session", e);
        setSoraSession(undefined);
      } finally {
        setIsCheckingSoraSession(false);
      }
    };
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, cacheTtlMs]);

  const handleSoraButton = async () => {
    if (isCheckingSoraSession) return;
    if (soraSession?.state === SoraSessionState.Valid) {
      setIsCheckingSoraSession(true);
      await LogoutSoraSession();
      setSoraSession({state: SoraSessionState.NotSetUp});
      localStorage.removeItem(cacheKey);
      setIsCheckingSoraSession(false);
    } else {
      setIsCheckingSoraSession(true);
      try {
        await invoke("open_sora_login_command");
      } catch (e) {
      } finally {
        setIsCheckingSoraSession(false);
      }
    }
  };

  return(
    <div className="flex justify-between items-center">
      <span>OpenAI / Sora Account:</span>
      <pre>{soraSession?.maybe_account_email || ""}</pre>
      <Button
        variant={
          soraSession?.state === SoraSessionState.Valid && !isCheckingSoraSession
            ? "destructive"
            : soraSession?.state === SoraSessionState.NotSetUp
            ? "primary"
            : "secondary"
        }
        className="h-[30px]"
        onClick={handleSoraButton}
        disabled={isCheckingSoraSession}
      >
        {isCheckingSoraSession ? (
          <FontAwesomeIcon
            icon={faSpinnerThird}
            className="animate-spin text-sm"
          />
        ) : soraSession?.state === SoraSessionState.Valid ? (
          "Disconnect"
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  )
}