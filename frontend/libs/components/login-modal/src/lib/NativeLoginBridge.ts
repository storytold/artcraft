import { invoke } from "@tauri-apps/api/core";
import type { UserInfo } from "@storyteller/api";

export interface DesktopLoginChallenge {
  challenge_id: string;
  verification_url: string;
  confirmation_code: string;
  expires_at: string;
  poll_interval_seconds: number;
}

export interface DesktopLoginOutcome {
  status: string;
  maybe_failure_type: string | null;
  maybe_user: UserInfo | null;
}

export interface DesktopLoginError {
  status: number | null;
  message: string;
  retryable: boolean;
}

export const createDesktopLoginChallenge = () => invoke<DesktopLoginChallenge>("storyteller_create_login_challenge_command");
export const pollDesktopLoginChallenge = (challengeId: string) => invoke<DesktopLoginOutcome>("storyteller_poll_login_challenge_command", { challengeId });
export const cancelDesktopLoginChallenge = (challengeId: string) => invoke<void>("storyteller_cancel_login_challenge_command", { challengeId });

export function isDesktopLoginError(error: unknown): error is DesktopLoginError {
  return typeof error === "object" && error !== null && "message" in error && "retryable" in error;
}
