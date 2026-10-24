// `invoke` is Tauri's bridge from the web page to the Rust half of the desktop app: `invoke("some_command", args)`
// runs the Rust function registered under that name and gives back its result (or throws its error).
import { invoke } from "@tauri-apps/api/core";
// The shape of a signed-in user as the Storyteller API describes it.
import type { UserInfo } from "@storyteller/api";

// This file is the only place the login modal talks to Rust. Everything here is a thin wrapper: one function per
// Rust command, with the TypeScript type of what that command returns. No state is kept in this file.

// What Rust returns when a "login with the website" request has been created (the desktop-login flow, see
// `DesktopLoginBridge.tsx`): the user approves the request on the website, using a QR code or a link.
export interface DesktopLoginChallenge {
  // Identifies this request in every later poll or cancel call.
  challenge_id: string;
  // The website address the user opens (or scans) to approve the login.
  verification_url: string;
  // The short code shown in the app and on the website so the user can check they match (shown as "ABCD-EFGH").
  confirmation_code: string;
  // When the request stops being valid (an ISO date-time string).
  expires_at: string;
  // How often the app should ask "has it been approved yet?", in seconds.
  poll_interval_seconds: number;
}

// The answer to one "has it been approved yet?" poll.
export interface DesktopLoginOutcome {
  // "pending", "approved", "redeemed" (finished, a user is attached) or "failed".
  status: string;
  // When `status` is "failed": why (for example "user_declined" or "expired"); otherwise null.
  maybe_failure_type: string | null;
  // When `status` is "redeemed": the signed-in user; otherwise null.
  maybe_user: UserInfo | null;
}

// What Rust throws (the rejected value of `invoke`) when a login command fails.
export interface DesktopLoginError {
  // The HTTP status of the failed backend call, or null if the failure was not an HTTP response.
  status: number | null;
  // Text safe to show the person.
  message: string;
  // True when asking again could succeed (a network blip); false when it cannot (the request is dead).
  retryable: boolean;
}

// Ask Rust to create a new website-login request.
export const createDesktopLoginChallenge = () => invoke<DesktopLoginChallenge>("storyteller_create_login_challenge_command");
// Ask Rust whether the request with this id has been approved yet. (`challengeId` is camelCase here because Tauri
// converts argument names; the Rust side sees it as `challenge_id`.)
export const pollDesktopLoginChallenge = (challengeId: string) => invoke<DesktopLoginOutcome>("storyteller_poll_login_challenge_command", { challengeId });
// Tell Rust the person gave up (pressed Back or closed the dialog) so it can discard the request.
export const cancelDesktopLoginChallenge = (challengeId: string) => invoke<void>("storyteller_cancel_login_challenge_command", { challengeId });

// Type guard: true when a caught value looks like a `DesktopLoginError` (an object with `message` and `retryable`),
// as opposed to a plain JavaScript Error or a string. Callers use it to decide whether to retry.
export function isDesktopLoginError(error: unknown): error is DesktopLoginError {
  return typeof error === "object" && error !== null && "message" in error && "retryable" in error;
}

// Ask Rust who is signed in, using the session cookies the desktop app keeps (null when nobody is signed in).
export const getNativeLoginSession = () => invoke<UserInfo | null>("storyteller_get_login_session_command");
// Sign in with a username or e-mail address and a password. Rust sends them to the Storyteller server (through the
// app's cookie jar and credential manager, so the session lives on the Rust side, not in this page) and returns the user.
export const passwordLogin = (usernameOrEmail: string, password: string) => invoke<UserInfo>("storyteller_password_login_command", {
  // The field names on the right are what the Rust command expects (snake_case).
  request: { username_or_email: usernameOrEmail, password },
});
// Create a new account and sign in (same Rust route as `passwordLogin`). `signup_source: "artcraft"` labels the
// sign-up as coming from this app.
export const passwordSignup = (username: string, email: string, password: string, passwordConfirmation: string) => invoke<UserInfo>("storyteller_password_signup_command", {
  request: { username, email_address: email, password, password_confirmation: passwordConfirmation, signup_source: "artcraft" },
});
