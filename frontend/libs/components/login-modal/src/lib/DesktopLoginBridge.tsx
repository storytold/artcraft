// React hooks used below: useState holds values that re-draw the panel when they change, useRef holds values that
// must survive re-draws WITHOUT causing one, useEffect runs side effects (timers, polling) and cleans them up.
import { useEffect, useRef, useState } from "react";
// Draws a QR code as an SVG picture from a piece of text (here, the website approval address).
import { QRCodeSVG } from "qrcode.react";
// Tauri bridge to the Rust half of the app (used here to open the system browser).
import { invoke } from "@tauri-apps/api/core";
// Back-arrow icon for the "Back" button.
import { ArrowLeftIcon } from "lucide-react";
// The signed-in user type.
import type { UserInfo } from "@storyteller/api";
// The Rust-command wrappers for the website-login flow (see `NativeLoginBridge.ts`).
import { createDesktopLoginChallenge, pollDesktopLoginChallenge, cancelDesktopLoginChallenge, isDesktopLoginError, type DesktopLoginChallenge } from "./NativeLoginBridge";

// Opens an address in the system browser through the Tauri opener plugin (exported so the modal's Discord button uses the same route).
export const OpenUrl = (url: string) => invoke("plugin:opener|open_url", { url });

// The "Login with Website" panel of the login dialog. How it works, in order:
//   1. The person presses a button; the app asks Rust to create a login "challenge" (a pending request).
//   2. The panel shows a QR code and a confirmation code (and, for "Login with Website", opens the browser too).
//      The person approves the request on the website.
//   3. Meanwhile this component polls Rust every few seconds; when the request comes back "redeemed" with a user,
//      it calls `onSuccess(user)` and the dialog moves on.
// Props: `onSuccess` gets the signed-in user; `onStart` (optional) fires when a new request begins (the dialog uses
// it to clear its own error message); `onActiveChange` (optional) reports whether a request is in progress, so the
// dialog can hide its own password form meanwhile (B-155 in BUGS.md is about that dialog's error message).
export function DesktopLoginBridge({ onSuccess, onStart, onActiveChange }: { onSuccess: (user: UserInfo) => void; onStart?: () => void; onActiveChange?: (active: boolean) => void }) {
  // The pending request, or null when none exists (before a start, after a finish, after Back).
  const [challenge, setChallenge] = useState<DesktopLoginChallenge | null>(null);
  // True between pressing a button and the request being ready ("Preparing login…").
  const [busy, setBusy] = useState(false);
  // The one-line status or error text under the panel.
  const [message, setMessage] = useState("");
  // The current time, refreshed once a second while a request is showing, so the countdown re-draws.
  // (`Date.now` is passed without calling it: React calls it once to get the starting value.)
  const [now, setNow] = useState(Date.now);
  // A counter that goes up every time the current attempt is abandoned or replaced (Back, a new start, leaving the
  // page). Async work remembers the number it started under and ignores its own result if the counter has moved on.
  const generation = useRef(0);
  // Always holds the latest `onSuccess` prop, so the long-running poll below calls the current one without having
  // to restart whenever the parent re-draws.
  const success = useRef(onSuccess);
  success.current = onSuccess;
  // "In progress" means either preparing or showing a request.
  const isActive = busy || challenge !== null;

  // Tell the parent whenever "in progress" flips on or off.
  useEffect(() => { onActiveChange?.(isActive); }, [isActive, onActiveChange]);

  // When this panel leaves the screen, bump the counter so any in-flight call ignores its result.
  useEffect(() => () => { generation.current += 1; }, []);
  // While a request is showing, tick `now` once a second so the "Expires in m:ss" text counts down.
  useEffect(() => {
    if (!challenge) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);

  // The polling loop. It runs whenever a new request appears (`challenge` changes) and is torn down when the request
  // ends, so there is at most one loop at a time.
  useEffect(() => {
    // No request: nothing to poll.
    if (!challenge) return;
    // `active` becomes false when this loop is torn down; every step checks it.
    let active = true;
    // The attempt number this loop belongs to.
    const current = generation.current;
    // The pending "poll again" timer.
    let timer: ReturnType<typeof setTimeout>;
    // Wait between polls: the server's suggested interval, but never under 5 seconds. It grows after errors (below).
    let delay = Math.max(5, challenge.poll_interval_seconds) * 1000;
    // When the request expires, as a millisecond timestamp.
    const deadline = Date.parse(challenge.expires_at);
    // End the request with a message: clearing `challenge` hides the QR code and stops this loop (via the cleanup below).
    const finish = (text: string) => {
      setChallenge(null);
      setMessage(text);
    };
    // One round of "ask Rust whether it was approved yet".
    const poll = async () => {
      // Stale loop (torn down, or the attempt was replaced): do nothing.
      if (!active || current !== generation.current) return;
      // The request has run out of time: stop and say so.
      if (Date.now() >= deadline) { finish("Login request expired. Start a new request."); return; }
      try {
        const result = await pollDesktopLoginChallenge(challenge.challenge_id);
        // The person pressed Back or the panel closed while the call was running: ignore the answer.
        if (!active || current !== generation.current) return;
        // "redeemed" means the website approved it and Rust has the session.
        if (result.status === "redeemed") {
          // A redeemed request must carry the user; if not, treat it as an error (the catch below retries).
          if (!result.maybe_user) throw new Error("Native session verification did not return a user");
          // Stop this loop, clear the request, and hand the user to the parent.
          active = false;
          setChallenge(null);
          setMessage("Signed in successfully.");
          success.current(result.maybe_user);
          return;
        }
        // "failed": show the reason (declined on the website, expired, or anything else) and stop.
        if (result.status === "failed") {
          finish(result.maybe_failure_type === "user_declined" ? "Login was declined on the website." : result.maybe_failure_type === "expired" ? "Login request expired. Start a new request." : "Login failed. Start a new request.");
          return;
        }
        // Any status other than "pending" or "approved" is unknown to this code: stop rather than poll forever.
        if (!["pending", "approved"].includes(result.status)) {
          finish("This login request could not be completed. Start a new request.");
          return;
        }
        // Still waiting: go back to the normal polling pace (undoing any slow-down from earlier errors).
        delay = Math.max(5, challenge.poll_interval_seconds) * 1000;
        setMessage("Waiting for your confirmation on the website…");
      } catch (error) {
        // Same stale check as above, for a call that failed after the person had moved on.
        if (!active || current !== generation.current) return;
        // Rust said asking again cannot help (the request is dead): show its message and stop.
        if (isDesktopLoginError(error) && !error.retryable) {
          finish(error.message);
          return;
        }
        // Otherwise assume a network blip: wait twice as long (at most 30 seconds) and try again.
        delay = Math.min(delay * 2, 30_000);
        setMessage("Connection interrupted. Retrying…");
      }
      // Schedule the next round, but never later than the deadline (so the expiry message is not delayed).
      if (active) timer = setTimeout(poll, Math.min(delay, Math.max(0, deadline - Date.now())));
    };
    // Start the first round after one delay.
    timer = setTimeout(poll, Math.min(delay, Math.max(0, deadline - Date.now())));
    // Cleanup, run when the request ends or the panel closes: stop the loop and tell Rust to discard the request.
    // On the Rust side this only removes the id from the app's in-memory list of pending requests (nothing is sent to
    // the server), so calling it again for a request that already finished just does nothing. The result is ignored
    // (`.catch(() => {})`) because nothing in the panel depends on it.
    return () => {
      active = false;
      clearTimeout(timer);
      void cancelDesktopLoginChallenge(challenge.challenge_id).catch(() => {});
    };
  }, [challenge]);

  // Begins a new request. `openBrowser` is true for "Login with Website" (also open the system browser) and false
  // for "Scan to Login" (show the QR code only).
  const start = async (openBrowser: boolean) => {
    // A request is already being prepared: ignore a second press.
    if (busy) return;
    // Let the parent clear its own messages.
    onStart?.();
    // Claim a new attempt number; anything older will now ignore its results.
    const current = ++generation.current;
    setBusy(true);
    setMessage("");
    try {
      // Ask Rust to create the request.
      const created = await createDesktopLoginChallenge();
      // The person pressed Back (or left) while it was being created: discard the new request and stop.
      if (current !== generation.current) {
        void cancelDesktopLoginChallenge(created.challenge_id).catch(() => {});
        return;
      }
      // Rust validates the approval URL against the configured API environment.
      // Refresh the clock first so the countdown starts at the right value, then show the request (this also starts
      // the polling loop above).
      setNow(Date.now());
      setChallenge(created);
      setMessage("Waiting for your confirmation on the website…");
      // For "Login with Website", open the approval address in the system browser.
      if (openBrowser) await OpenUrl(created.verification_url);
    } catch (error) {
      // Show Rust's own message when it sent one, otherwise a general one; only if this attempt is still current.
      if (current === generation.current) setMessage(isDesktopLoginError(error) ? error.message : "Unable to open website login. Try again or scan the QR code.");
    } finally {
      // "Preparing" is over, unless a newer attempt has taken over the flag.
      if (current === generation.current) setBusy(false);
    }
  };

  // The Back button: abandon the attempt. Bumping the counter makes in-flight calls ignore their results, and
  // clearing `challenge` stops the polling loop and cancels the request on the Rust side (the loop's cleanup).
  const back = () => {
    generation.current += 1;
    setChallenge(null);
    setBusy(false);
    setMessage("");
  };

  // Seconds left until the request expires, never below 0 (0 when no request is showing).
  const remaining = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.expires_at) - now) / 1000)) : 0;
  // What is drawn. A bordered box with, from top to bottom:
  //   - a Back button, whenever a request is in progress;
  //   - one of three bodies: the QR code + confirmation code + "Open website" button (request showing);
  //     "Preparing login…" (request being created); or the two start buttons (idle);
  //   - the status or error message, when there is one.
  return <section aria-label="Website login" className="mb-6 border border-white/15 bg-white/[0.03] p-4 text-center">
    {isActive && <div className="mb-4 text-left">
      <button type="button" className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white" onClick={back}>
        <ArrowLeftIcon size={16} aria-hidden="true" /> Back
      </button>
    </div>}
    {challenge ? <>
      {/* Instruction line. */}
      <p className="mb-3 text-sm text-white/70">Scan with your phone or approve in your browser.</p>
      {/* The QR code of the approval address, so a phone can approve the login. */}
      <QRCodeSVG value={challenge.verification_url} size={192} marginSize={4} title="Scan to approve desktop login" className="mx-auto" />
      {/* The confirmation code split in the middle ("ABCDEFGH" shown as "ABCD-EFGH"); the person checks it matches the website. */}
      <p className="my-3 font-mono text-2xl tracking-[0.2em]">{challenge.confirmation_code.slice(0, 4)}-{challenge.confirmation_code.slice(4)}</p>
      {/* The countdown as minutes:seconds (seconds padded to two digits). */}
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">Verify this code on the website. Expires in {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p>
      {/* Opens the approval address in the browser; if that fails, the message points back to the QR code. */}
      <button type="button" className="h-10 rounded-[3px] border border-white/15 bg-white/5 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10" onClick={() => OpenUrl(challenge.verification_url).catch(() => setMessage("Unable to open the browser. Scan the QR code instead."))}>Open website</button>
    </> : busy ? <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60" role="status">Preparing login…</p> : <div className="flex flex-col gap-2">
      {/* Start and open the browser. */}
      <button type="button" className="h-10 rounded-[3px] bg-white px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-white/90" onClick={() => start(true)}>Login with Website</button>
      {/* Start and show only the QR code. */}
      <button type="button" className="h-10 rounded-[3px] border border-white/15 bg-white/5 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10" onClick={() => start(false)}>Scan to Login</button>
      <p className="text-xs text-white/50">Use Google or any account already signed in on the website.</p>
    </div>}
    {/* Status or error line; `role="status"` makes a screen reader announce changes to it. */}
    {message && <p className="mt-3 text-sm text-white/70" role="status">{message}</p>}
  </section>;
}
