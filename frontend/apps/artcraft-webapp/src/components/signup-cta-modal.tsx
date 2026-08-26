import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { create } from "zustand";
import { CheckIcon } from "lucide-react";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { GoogleLoginButton } from "./auth";
import { refreshSession, useSession } from "../lib/session";
import { hasActiveSubscription } from "../lib/billing";

interface SignupCtaState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const useSignupCtaStore = create<SignupCtaState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

/**
 * Hook that exposes the logged-in flag plus an imperative `openSignupCta()`
 * trigger. Use it at the top of a generate handler:
 *
 *   const { loggedIn, openSignupCta } = useSignupCta();
 *   if (!loggedIn) { openSignupCta(); return; }
 */
export function useSignupCta(): {
  loggedIn: boolean;
  openSignupCta: () => void;
} {
  const { loggedIn } = useSession();
  const openSignupCta = useSignupCtaStore((s) => s.open);
  return { loggedIn, openSignupCta };
}

const PERKS: string[] = [
  "Generate images and videos with latest AI models",
  "Save your work and access it from any device",
  "Access to our desktop app",
];

export function SignupCtaModal() {
  const isOpen = useSignupCtaStore((s) => s.isOpen);
  const close = useSignupCtaStore((s) => s.close);
  const navigate = useNavigate();
  const location = useLocation();
  const from = encodeURIComponent(location.pathname + location.search);
  const [error, setError] = useState<string | null>(null);

  // Mirror the login/signup pages: refresh the session, then push users without
  // an active subscription to pricing. Subscribers just close the modal and stay
  // on the page they were on.
  const handleGoogleSuccess = async () => {
    const [, subscribed] = await Promise.all([
      refreshSession(true),
      hasActiveSubscription(),
    ]);
    close();
    if (!subscribed) {
      navigate("/pricing");
    }
  };

  const handleGoogleError = (message: string) => {
    setError(message);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      className="w-full max-w-md overflow-hidden border border-white/15 bg-ui-modal p-0"
      allowBackgroundInteraction={false}
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      childPadding={false}
      backdropClassName="bg-black/80"
    >
      <div className="relative overflow-hidden">
        <div className="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-[34px] sm:leading-[1.1]">
            Start <span className="text-primary">crafting</span> in seconds.
          </h2>
          <p className="mt-3 max-w-[20rem] text-[15px] leading-relaxed text-white/55">
            Sign up and start creating right away.
          </p>

          <ul className="mt-7 space-y-3">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-start gap-3 text-[14px] text-white/75"
              >
                <span className="mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center bg-white/10">
                  <CheckIcon className="text-[9px] text-white" />
                </span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3">
            {error && (
              <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
                {error}
              </div>
            )}

            <Link to={`/signup?from=${from}`} onClick={close} className="block">
              <Button variant="primary" className="w-full h-10">
                Create account with email
              </Button>
            </Link>

            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-ui-modal px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">
                or
              </span>
            </div>

            <GoogleLoginButton
              mode="signup"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />

            <Link
              to={`/login?from=${from}`}
              onClick={close}
              className="text-center text-[13px] text-white/55 hover:text-white transition-colors py-1"
            >
              Already have an account?{" "}
              <span className="font-medium text-white/90">Log in</span>
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
