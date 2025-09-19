import { useState, useEffect } from "react";
import { Button } from "@storyteller/ui-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import {
  CheckSoraSession,
  SoraSessionState,
  LogoutSoraSession,
  useSoraLoginListener,
} from "@storyteller/tauri-api";
import { invoke } from "@tauri-apps/api/core";

interface SoraAccountButtonProps {
  cacheKey?: string;
  cacheTtlMs?: number;
}

export const SoraAccountButton = ({
  cacheKey = "soraSettingsSessionCache",
  cacheTtlMs = 5 * 60 * 1000,
}: SoraAccountButtonProps) => {
  const [soraSession, setSoraSession] = useState<SoraSessionState | null>(null);
  const [isCheckingSoraSession, setIsCheckingSoraSession] = useState(false);

  useSoraLoginListener(() => {
    setIsCheckingSoraSession(true);
    CheckSoraSession()
      .then((result) => {
        setSoraSession(result.state);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ state: result.state, timestamp: Date.now() })
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
          const { state, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheTtlMs) {
            setSoraSession(state);
            setIsCheckingSoraSession(false);
            return;
          }
        }
        const result = await CheckSoraSession();
        setSoraSession(result.state);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ state: result.state, timestamp: Date.now() })
        );
      } catch (e) {
        console.error("Error fetching Sora session", e);
        setSoraSession(null);
      } finally {
        setIsCheckingSoraSession(false);
      }
    };
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, cacheTtlMs]);

  const handleSoraButton = async () => {
    if (isCheckingSoraSession) return;
    if (soraSession === SoraSessionState.Valid) {
      setIsCheckingSoraSession(true);
      await LogoutSoraSession();
      setSoraSession(SoraSessionState.NotSetUp);
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

  return (
    <Button
      variant={
        soraSession === SoraSessionState.Valid && !isCheckingSoraSession
          ? "destructive"
          : soraSession === SoraSessionState.NotSetUp
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
      ) : soraSession === SoraSessionState.Valid ? (
        "Disconnect"
      ) : (
        "Connect"
      )}
    </Button>
  );
};
