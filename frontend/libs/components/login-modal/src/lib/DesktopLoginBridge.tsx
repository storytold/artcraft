import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeftIcon } from "lucide-react";
import type { UserInfo } from "@storyteller/api";
import { createDesktopLoginChallenge, pollDesktopLoginChallenge, cancelDesktopLoginChallenge, isDesktopLoginError, type DesktopLoginChallenge } from "./NativeLoginBridge";

const OpenUrl = (url: string) => invoke("plugin:opener|open_url", { url });

export function DesktopLoginBridge({ onSuccess, onStart, onActiveChange }: { onSuccess: (user: UserInfo) => void; onStart?: () => void; onActiveChange?: (active: boolean) => void }) {
  const [challenge, setChallenge] = useState<DesktopLoginChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now);
  const generation = useRef(0);
  const success = useRef(onSuccess);
  success.current = onSuccess;
  const isActive = busy || challenge !== null;

  useEffect(() => { onActiveChange?.(isActive); }, [isActive, onActiveChange]);

  useEffect(() => () => { generation.current += 1; }, []);
  useEffect(() => {
    if (!challenge) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);

  useEffect(() => {
    if (!challenge) return;
    let active = true;
    const current = generation.current;
    let timer: ReturnType<typeof setTimeout>;
    let delay = Math.max(5, challenge.poll_interval_seconds) * 1000;
    const deadline = Date.parse(challenge.expires_at);
    const finish = (text: string) => {
      setChallenge(null);
      setMessage(text);
    };
    const poll = async () => {
      if (!active || current !== generation.current) return;
      if (Date.now() >= deadline) { finish("Login request expired. Start a new request."); return; }
      try {
        const result = await pollDesktopLoginChallenge(challenge.challenge_id);
        if (!active || current !== generation.current) return;
        if (result.status === "redeemed") {
          if (!result.maybe_user) throw new Error("Native session verification did not return a user");
          active = false;
          setChallenge(null);
          setMessage("Signed in successfully.");
          success.current(result.maybe_user);
          return;
        }
        if (result.status === "failed") {
          finish(result.maybe_failure_type === "user_declined" ? "Login was declined on the website." : result.maybe_failure_type === "expired" ? "Login request expired. Start a new request." : "Login failed. Start a new request.");
          return;
        }
        if (!["pending", "approved"].includes(result.status)) {
          finish("This login request could not be completed. Start a new request.");
          return;
        }
        delay = Math.max(5, challenge.poll_interval_seconds) * 1000;
        setMessage("Waiting for your confirmation on the website…");
      } catch (error) {
        if (!active || current !== generation.current) return;
        if (isDesktopLoginError(error) && !error.retryable) {
          finish(error.message);
          return;
        }
        delay = Math.min(delay * 2, 30_000);
        setMessage("Connection interrupted. Retrying…");
      }
      if (active) timer = setTimeout(poll, Math.min(delay, Math.max(0, deadline - Date.now())));
    };
    timer = setTimeout(poll, Math.min(delay, Math.max(0, deadline - Date.now())));
    return () => {
      active = false;
      clearTimeout(timer);
      void cancelDesktopLoginChallenge(challenge.challenge_id).catch(() => {});
    };
  }, [challenge]);

  const start = async (openBrowser: boolean) => {
    if (busy) return;
    onStart?.();
    const current = ++generation.current;
    setBusy(true);
    setMessage("");
    try {
      const created = await createDesktopLoginChallenge();
      if (current !== generation.current) {
        void cancelDesktopLoginChallenge(created.challenge_id).catch(() => {});
        return;
      }
      // Rust validates the approval URL against the configured API environment.
      setNow(Date.now());
      setChallenge(created);
      setMessage("Waiting for your confirmation on the website…");
      if (openBrowser) await OpenUrl(created.verification_url);
    } catch (error) {
      if (current === generation.current) setMessage(isDesktopLoginError(error) ? error.message : "Unable to open website login. Try again or scan the QR code.");
    } finally {
      if (current === generation.current) setBusy(false);
    }
  };

  const back = () => {
    generation.current += 1;
    setChallenge(null);
    setBusy(false);
    setMessage("");
  };

  const remaining = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.expires_at) - now) / 1000)) : 0;
  return <section aria-label="Website login" className="mb-6 border border-white/15 bg-white/[0.03] p-4 text-center">
    {isActive && <div className="mb-4 text-left">
      <button type="button" className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60 transition-colors hover:text-white" onClick={back}>
        <ArrowLeftIcon size={16} aria-hidden="true" /> Back
      </button>
    </div>}
    {challenge ? <>
      <p className="mb-3 text-sm text-white/70">Scan with your phone or approve in your browser.</p>
      <QRCodeSVG value={challenge.verification_url} size={192} marginSize={4} title="Scan to approve desktop login" className="mx-auto" />
      <p className="my-3 font-mono text-2xl tracking-[0.2em]">{challenge.confirmation_code.slice(0, 4)}-{challenge.confirmation_code.slice(4)}</p>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">Verify this code on the website. Expires in {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p>
      <button type="button" className="h-10 rounded-[3px] border border-white/15 bg-white/5 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10" onClick={() => OpenUrl(challenge.verification_url).catch(() => setMessage("Unable to open the browser. Scan the QR code instead."))}>Open website</button>
    </> : busy ? <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60" role="status">Preparing login…</p> : <div className="flex flex-col gap-2">
      <button type="button" className="h-10 rounded-[3px] bg-white px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-white/90" onClick={() => start(true)}>Login with Website</button>
      <button type="button" className="h-10 rounded-[3px] border border-white/15 bg-white/5 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10" onClick={() => start(false)}>Scan to Login</button>
      <p className="text-xs text-white/50">Use Google or any account already signed in on the website.</p>
    </div>}
    {message && <p className="mt-3 text-sm text-white/70" role="status">{message}</p>}
  </section>;
}
