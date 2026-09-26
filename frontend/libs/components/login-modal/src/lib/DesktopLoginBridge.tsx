import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { invoke } from "@tauri-apps/api/core";
import { LoginChallengesApi, UsersApi, HttpApiError, type LoginChallenge, type UserInfo } from "@storyteller/api";
import { OpenUrl } from "@storyteller/tauri-api";

export function DesktopLoginBridge({ onSuccess }: { onSuccess: (user: UserInfo) => void }) {
  const api = useMemo(() => new LoginChallengesApi(), []);
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now);
  const generation = useRef(0);
  const success = useRef(onSuccess);
  success.current = onSuccess;

  useEffect(() => () => { generation.current += 1; }, []);
  useEffect(() => {
    if (!challenge) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);

  useEffect(() => {
    if (!challenge) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let delay = Math.max(5, challenge.poll_interval_seconds) * 1000;
    const deadline = Date.parse(challenge.expires_at);
    const finish = (text: string) => {
      setChallenge(null);
      setMessage(text);
    };
    const poll = async () => {
      if (!active) return;
      if (Date.now() >= deadline) { finish("Login request expired. Start a new request."); return; }
      try {
        const result = await api.poll(challenge.device_token);
        if (!active) return;
        if (result.status === "redeemed") {
          api.acceptSession(result);
          // The response's Set-Cookie is already in Tauri's HTTP cookie jar.
          // Synchronize the native API client before declaring login complete.
          await invoke("storyteller_sync_login_session_command");
          if (!active) return;
          const session = await new UsersApi().GetSession();
          if (!session.success || !session.data?.loggedIn || !session.data.user) throw new Error("Session verification failed");
          if (!active) return;
          active = false;
          setChallenge(null);
          setMessage("Signed in successfully.");
          success.current(session.data.user);
          return;
        }
        if (result.status === "failed") {
          finish(result.maybe_failure_type === "user_declined" ? "Login was declined on the website." : result.maybe_failure_type === "expired" ? "Login request expired. Start a new request." : "Login failed. Start a new request.");
          return;
        }
        if (!result.success || !["pending", "approved"].includes(result.status)) {
          finish("This login request could not be completed. Start a new request.");
          return;
        }
        delay = Math.max(5, challenge.poll_interval_seconds) * 1000;
        setMessage("Waiting for your confirmation on the website…");
      } catch (error) {
        if (!active) return;
        if (error instanceof HttpApiError && [400, 401, 403, 404].includes(error.status)) {
          finish("This login request is no longer valid. Start a new request.");
          return;
        }
        delay = Math.min(delay * 2, 30_000);
        setMessage("Connection interrupted. Retrying…");
      }
      if (active) timer = setTimeout(poll, Math.min(delay, Math.max(0, deadline - Date.now())));
    };
    timer = setTimeout(poll, Math.min(delay, Math.max(0, deadline - Date.now())));
    return () => { active = false; clearTimeout(timer); };
  }, [api, challenge]);

  const start = async (openBrowser: boolean) => {
    if (busy) return;
    const current = ++generation.current;
    setBusy(true);
    setMessage("");
    try {
      const created = await api.create();
      if (current !== generation.current) return;
      const url = new URL(created.verification_url);
      if (!created.success || url.origin !== "https://app.getartcraft.com" || url.pathname !== "/login/desktop" || !Number.isFinite(Date.parse(created.expires_at))) {
        throw new Error("Invalid login challenge");
      }
      setNow(Date.now());
      setChallenge(created);
      setMessage("Waiting for your confirmation on the website…");
      if (openBrowser) await OpenUrl(created.verification_url);
    } catch {
      if (current === generation.current) setMessage("Unable to open website login. Try again or scan the QR code.");
    } finally {
      if (current === generation.current) setBusy(false);
    }
  };

  const remaining = challenge ? Math.max(0, Math.ceil((Date.parse(challenge.expires_at) - now) / 1000)) : 0;
  return <section aria-label="Website login" className="mb-6 rounded-xl border border-white/15 p-4 text-center">
    {challenge ? <>
      <p className="mb-3 text-sm text-white/70">Scan with your phone or approve in your browser.</p>
      <QRCodeSVG value={challenge.verification_url} size={192} marginSize={4} title="Scan to approve desktop login" className="mx-auto rounded-lg" />
      <p className="my-3 font-mono text-2xl tracking-widest">{challenge.confirmation_code.slice(0, 4)}-{challenge.confirmation_code.slice(4)}</p>
      <p className="mb-3 text-xs text-white/60">Verify this code on the website. Expires in {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p>
      <button type="button" className="rounded-lg border border-white/30 px-4 py-2" onClick={() => OpenUrl(challenge.verification_url).catch(() => setMessage("Unable to open the browser. Scan the QR code instead."))}>Open website</button>
    </> : <div className="flex flex-col gap-2">
      <button type="button" disabled={busy} className="rounded-lg bg-white px-4 py-3 font-medium text-black disabled:opacity-50" onClick={() => start(true)}>{busy ? "Preparing login…" : "Login with Website"}</button>
      <button type="button" disabled={busy} className="rounded-lg border border-white/30 px-4 py-2" onClick={() => start(false)}>Scan to Login</button>
      <p className="text-xs text-white/50">Use Google or any account already signed in on the website.</p>
    </div>}
    {message && <p className="mt-3 text-sm text-white/70" role="status">{message}</p>}
  </section>;
}
