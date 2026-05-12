import { Link, useLocation } from "react-router-dom";
import { create } from "zustand";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/pro-solid-svg-icons";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { useSession } from "../lib/session";

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
  "Generate images and videos with top AI models",
  "Save your work and access it from any device",
];

export function SignupCtaModal() {
  const isOpen = useSignupCtaStore((s) => s.isOpen);
  const close = useSignupCtaStore((s) => s.close);
  const location = useLocation();
  const from = encodeURIComponent(location.pathname + location.search);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      className="rounded-2xl w-full max-w-md overflow-hidden border border-white/10 bg-[#161618] p-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
      allowBackgroundInteraction={false}
      showClose={true}
      closeOnOutsideClick={true}
      resizable={false}
      childPadding={false}
      backdropClassName="bg-black/80"
    >
      <div className="relative overflow-hidden">
        {/* Off-center ambient glow — feels designed, not generic */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/25 blur-[80px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />

        <div className="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-[34px] sm:leading-[1.1]">
            Start <span className="text-primary">crafting</span> in seconds.
          </h2>
          <p className="mt-3 max-w-[20rem] text-[15px] leading-relaxed text-white/55">
            Free to try. Sign up and pick up where you left off.
          </p>

          <ul className="mt-7 space-y-3">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-start gap-3 text-[14px] text-white/75"
              >
                <span className="mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-[9px] text-primary"
                  />
                </span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-2">
            <Link to={`/signup?from=${from}`} onClick={close} className="block">
              <Button
                variant="primary"
                className="w-full h-12 text-sm font-semibold rounded-full"
              >
                Create free account
              </Button>
            </Link>
            <Link
              to={`/login?from=${from}`}
              onClick={close}
              className="text-center text-[13px] text-white/55 hover:text-white transition-colors py-2"
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
