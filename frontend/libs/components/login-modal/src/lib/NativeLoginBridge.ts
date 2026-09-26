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

export const getNativeLoginSession = () => invoke<UserInfo | null>("storyteller_get_login_session_command");
export const passwordLogin = (usernameOrEmail: string, password: string) => invoke<UserInfo>("storyteller_password_login_command", {
  request: { username_or_email: usernameOrEmail, password },
});
export const passwordSignup = (username: string, email: string, password: string, passwordConfirmation: string) => invoke<UserInfo>("storyteller_password_signup_command", {
  request: { username, email_address: email, password, password_confirmation: passwordConfirmation, signup_source: "artcraft" },
});
