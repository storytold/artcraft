import { Button } from "@storyteller/ui-button";
import { Transition, TransitionChild } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import { ArrowRightIcon } from "lucide-react";
import { DiscordIcon } from "@storyteller/icons";
import type { UserInfo } from "@storyteller/api";
import { DesktopLoginBridge } from "./DesktopLoginBridge";
import { LoginSuccess } from "./LoginSuccess";
import { ArtCraftSignUp } from "./artcraft-signup";
import { getNativeLoginSession, passwordLogin, passwordSignup, isDesktopLoginError } from "./NativeLoginBridge";
import { useLoginModalStore } from "./useLoginModalStore";

// Webapp auth-showcase video (swap by passing `videoUrl`).
const DEFAULT_SHOWCASE_VIDEO =
  "https://frontend-cdn.fakeyou.com/videos/knight-video.mp4";
const LOGIN_SUCCESS_DURATION_MS = 3000;
const FRAME_CORNERS = [
  "top-0 left-0",
  "top-0 right-0",
  "bottom-0 left-0",
  "bottom-0 right-0",
];

interface LoginModalProps {
  onClose?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  onArtCraftAuthSuccess?: (userInfo: any) => void;
  isSignUp?: boolean;
  /** Optional direct media URL for the right-pane showcase video. */
  videoUrl?: string;
  // Accepted for backwards compatibility with existing call sites (MainApp
  // passes these); no longer used now that the showcase is a single video.
  videoSrc2D?: string;
  videoSrc3D?: string;
}

export function LoginModal({
  onClose,
  onOpenChange,
  onArtCraftAuthSuccess,
  isSignUp: initialIsSignUp = true,
  videoUrl = DEFAULT_SHOWCASE_VIDEO,
}: LoginModalProps) {
  const { isOpen, recheckTrigger, closeModal } = useLoginModalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [_isLoggedInArtCraft, setIsLoggedInArtCraft] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDiscord, setShowDiscord] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);

  const authGeneration = useRef(0);
  const authSuccess = useRef(onArtCraftAuthSuccess);
  authSuccess.current = onArtCraftAuthSuccess;
  const afterClose = useRef(onClose);
  afterClose.current = onClose;

  // A stale startup/recheck response must never reopen the modal after login.
  useEffect(() => {
    const generation = ++authGeneration.current;
    let active = true;
    getNativeLoginSession().then((user) => {
      if (!active || generation !== authGeneration.current) return;
      if (user) {
        setIsLoggedInArtCraft(true);
        authSuccess.current?.(user);
        closeModal();
      } else {
        setIsLoading(false);
        setIsSignUp(initialIsSignUp);
        setErrorMessage("");
        setShowDiscord(false);
        setShowSuccess(false);
        setLoggedInUsername(null);
        setIsLoggedInArtCraft(false);
        useLoginModalStore.getState().openModal();
      }
    }).catch((error) => {
      if (!active || generation !== authGeneration.current) return;
      setErrorMessage(isDesktopLoginError(error) ? error.message : "Unable to check your account. Please sign in again.");
      useLoginModalStore.getState().openModal();
    });
    return () => { active = false; };
  }, [recheckTrigger, closeModal, initialIsSignUp]);

  useEffect(() => {
    if (onOpenChange) onOpenChange(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (loggedInUsername === null || !isOpen) return;
    const timer = window.setTimeout(() => {
      closeModal();
      afterClose.current?.();
    }, LOGIN_SUCCESS_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [loggedInUsername, isOpen, closeModal]);

  const handleClose = () => {
    closeModal();
    onClose?.();
  };

  const handleDiscordJoin = () => {
    window.open("https://discord.gg/75svZP2Vje", "_blank");
    setShowDiscord(false);
    setShowSuccess(true);
  };

  const handleLoginSuccess = (user: UserInfo) => {
    authGeneration.current += 1;
    setIsLoading(false);
    setIsLoggedInArtCraft(true);
    setIsChallengeActive(false);
    setLoggedInUsername(user.username);
    authSuccess.current?.(user);
  };

  const handleAuthSubmit = async (
    username: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    setIsLoading(true);
    setErrorMessage("");
    const generation = ++authGeneration.current;
    try {
      const user = isSignUp
        ? await passwordSignup(username, email, password, passwordConfirmation)
        : await passwordLogin(username || email, password);
      if (generation !== authGeneration.current) return;
      if (isSignUp) {
        setIsLoggedInArtCraft(true);
        authSuccess.current?.(user);
        setShowDiscord(true);
      } else {
        handleLoginSuccess(user);
      }
    } catch (error) {
      if (generation === authGeneration.current) setErrorMessage(isDesktopLoginError(error) ? error.message : "An unexpected error occurred. Please try again.");
    } finally {
      if (generation === authGeneration.current) setIsLoading(false);
    }
  };

  // ── Post-auth onboarding screens (full-width inside the same card) ────────
  const renderOnboarding = () => {
    if (showSuccess) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
          <h2 className="mb-3 font-display text-3xl leading-[1.05] tracking-tight text-white sm:text-4xl">
            Thank you for signing in!
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-white/60">
            You're all set to start creating amazing content.
          </p>
          <Button
            variant="primary"
            onClick={handleClose}
            icon={ArrowRightIcon}
            iconFlip={true}
            className="h-10 rounded-[3px] bg-white px-5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-black shadow-none hover:bg-white/90"
          >
            Get Started
          </Button>
        </div>
      );
    }

    // Discord
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
        <h2 className="mb-3 font-display text-3xl leading-[1.05] tracking-tight text-white sm:text-4xl">
          Join our <span className="font-serif-italic">community.</span>
        </h2>
        <p className="mb-8 max-w-md text-sm leading-relaxed text-white/60">
          Connect with other creators, share your work, and get the latest
          updates in our Discord community.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="h-10 rounded-[3px] border border-white/15 bg-white/5 px-4 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-none hover:bg-white/10"
            onClick={() => {
              setShowDiscord(false);
              setShowSuccess(true);
            }}
          >
            Skip for now
          </Button>
          <Button
            variant="primary"
            onClick={handleDiscordJoin}
            icon={DiscordIcon}
            className="h-10 rounded-[3px] bg-[#5865F2] px-4 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-none hover:bg-[#6a76ff]"
          >
            Join Discord
          </Button>
        </div>
      </div>
    );
  };

  const inOnboarding = showDiscord || showSuccess;

  return (
    <Transition appear show={isOpen} afterLeave={() => setLoggedInUsername(null)}>
      <div className="fixed inset-0 z-[100]">
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 cursor-pointer bg-black/80" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className={`relative w-full ${loggedInUsername !== null ? "max-w-md" : "max-w-lg lg:max-w-5xl"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`relative flex w-full overflow-hidden border border-white/20 bg-[#1e1f22] text-white ${loggedInUsername !== null ? "" : "lg:min-h-[560px]"}`}
              >
                {loggedInUsername !== null ? (
                  <LoginSuccess username={loggedInUsername} />
                ) : inOnboarding ? (
                  renderOnboarding()
                ) : (
                  <>
                    {/* ── Form pane ── (no dismiss control — login is required) */}
                    <div className="relative flex w-full flex-col lg:w-1/2">
                      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-12">
                        <div className="w-full">
                          <div className="mb-8 text-left">
                            <img
                              src="/resources/logo/artcraft-icon.png"
                              alt="ArtCraft"
                              className="pointer-events-none mb-8 h-8 w-auto select-none"
                              draggable={false}
                            />
                            <h1 className="mb-3 text-balance font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl">
                              {isSignUp ? (
                                "Create your account"
                              ) : (
                                <>
                                  Welcome{" "}
                                  <span className="font-serif-italic">back.</span>
                                </>
                              )}
                            </h1>
                            <p className="text-sm leading-relaxed text-white/60">
                              {isSignUp
                                ? "Sign up to start creating with ArtCraft"
                                : "Log in to your creative workspace."}
                            </p>
                          </div>

                          {!isSignUp && <DesktopLoginBridge onActiveChange={setIsChallengeActive} onStart={() => { authGeneration.current += 1; }} onSuccess={handleLoginSuccess} />}
                          {!isSignUp && !isChallengeActive && (
                            <div className="mb-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/15 after:h-px after:flex-1 after:bg-white/15">
                              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                                or
                              </span>
                            </div>
                          )}
                          {!isChallengeActive && <ArtCraftSignUp
                            onSubmit={handleAuthSubmit}
                            isSignUp={isSignUp}
                            onToggleMode={() => setIsSignUp((prev) => !prev)}
                            errorMessage={errorMessage}
                            isLoading={isLoading}
                          />}
                        </div>
                      </div>

                      <div className="px-6 pb-6 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-white/25 sm:px-10">
                        &copy; {new Date().getFullYear()} ArtCraft. All rights
                        reserved.
                      </div>
                    </div>

                    {/* ── Showcase pane (desktop only) ── */}
                    <div className="relative hidden border-l border-white/15 lg:block lg:w-1/2">
                      <LoginShowcase videoUrl={videoUrl} />
                    </div>
                  </>
                )}
              </div>
              {FRAME_CORNERS.map((corner) => (
                <span
                  key={corner}
                  aria-hidden="true"
                  className={`frame-corner-mark ${corner}`}
                />
              ))}
            </div>
          </TransitionChild>
        </div>
      </div>
    </Transition>
  );
}

// Right-pane video showcase — muted background video cropped to cover the pane,
// with a legibility gradient + caption. Mirrors the webapp auth-showcase.
function LoginShowcase({ videoUrl }: { videoUrl: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1e1f22]">
      <video
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/25"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-8">
        <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
          One of the cheapest
        </p>
        <h2 className="text-2xl font-bold leading-tight">
          Seedance 2.0 Video Generation
        </h2>
        <p className="mt-1 max-w-sm text-sm text-white/70">
          Generate jaw-dropping AI videos with Seedance 2.0.
        </p>
      </div>
    </div>
  );
}

export default LoginModal;
