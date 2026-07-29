import { Button } from "@storyteller/ui-button";
import { Transition, TransitionChild } from "@headlessui/react";
import { useState, useEffect } from "react";
import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { ArtCraftSignUp } from "./artcraft-signup";
import { UsersApi } from "@storyteller/api";
import { useLoginModalStore } from "./useLoginModalStore";

const SIGNUP_SOURCE_ARTCRAFT = "artcraft";

// Webapp auth-showcase video (swap by passing `videoUrl`).
const DEFAULT_SHOWCASE_VIDEO =
  "https://player.vimeo.com/video/1169289718?background=1&autoplay=1&loop=1&muted=1";

interface LoginModalProps {
  onClose?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  onArtCraftAuthSuccess?: (userInfo: any) => void;
  isSignUp?: boolean;
  /** Optional override for the right-pane showcase video. */
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

  const checkArtCraftLogin = async () => {
    const usersApi = new UsersApi();
    const session = await usersApi.GetSession();
    const loggedIn = session.data?.loggedIn;
    return loggedIn;
  };

  // Check session on mount and when recheckTrigger changes.
  useEffect(() => {
    checkArtCraftLogin().then((loggedIn) => {
      if (loggedIn) {
        setIsLoggedInArtCraft(true);
        closeModal();
      } else {
        // Reset modal state to initial values.
        setIsLoading(false);
        setIsSignUp(initialIsSignUp);
        setErrorMessage("");
        setShowDiscord(false);
        setShowSuccess(false);
        setIsLoggedInArtCraft(false);

        const { openModal } = useLoginModalStore.getState();
        openModal();
      }
    });
  }, [recheckTrigger, closeModal, initialIsSignUp]);

  useEffect(() => {
    if (onOpenChange) onOpenChange(isOpen);
  }, [isOpen, onOpenChange]);

  const handleClose = () => {
    closeModal();
    onClose?.();
  };

  const handleDiscordJoin = () => {
    window.open("https://discord.gg/75svZP2Vje", "_blank");
    setShowDiscord(false);
    setShowSuccess(true);
  };

  const handleAuthSubmit = async (
    username: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    setIsLoading(true);
    const usersApi = new UsersApi();
    try {
      let signupResponse, loginResponse;
      if (isSignUp) {
        signupResponse = await usersApi.Signup({
          username,
          email,
          password,
          passwordConfirmation,
          signupSource: SIGNUP_SOURCE_ARTCRAFT,
        });

        if (!signupResponse.success) {
          setErrorMessage(
            signupResponse.errorMessage || "Signup failed, please try again."
          );
          setIsLoading(false);
          return;
        }
        loginResponse = await usersApi.Login({
          usernameOrEmail: username || email,
          password,
        });
      } else {
        loginResponse = await usersApi.Login({
          usernameOrEmail: username || email,
          password,
        });
      }

      if (!loginResponse.success) {
        setErrorMessage(
          loginResponse.errorMessage || "Login failed, please try again."
        );
        setIsLoading(false);
        return;
      }

      setIsLoggedInArtCraft(true);
      if (onArtCraftAuthSuccess) {
        const session = await usersApi.GetSession();
        const userInfo = session.data?.user;
        if (userInfo) onArtCraftAuthSuccess(userInfo);
      }
      setShowDiscord(true); // Onboarding step after successful auth.
    } catch (e) {
      console.error(e);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Post-auth onboarding screens (full-width inside the same card) ────────
  const renderOnboarding = () => {
    if (showSuccess) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
          <h2 className="mb-2 text-3xl font-bold text-white">
            Thank you for signing in!
          </h2>
          <p className="mb-6 text-white/70">
            You're all set to start creating amazing content.
          </p>
          <Button
            variant="primary"
            onClick={handleClose}
            icon={faArrowRight}
            iconFlip={true}
            className="text-md"
          >
            Get Started
          </Button>
        </div>
      );
    }

    // Discord
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
        <h2 className="mb-2 text-3xl font-bold text-white">
          Join Our Community
        </h2>
        <p className="mb-6 max-w-md text-white/70">
          Connect with other creators, share your work, and get the latest
          updates in our Discord community.
        </p>
        <div className="flex gap-4">
          <Button
            variant="secondary"
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
            icon={faDiscord}
            className="text-md bg-[#5865F2] hover:bg-[#6a76ff]"
          >
            Join Discord
          </Button>
        </div>
      </div>
    );
  };

  const inOnboarding = showDiscord || showSuccess;

  return (
    <Transition appear show={isOpen}>
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
              className="relative flex w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[4%] bg-[#1C1C20] text-white shadow-2xl lg:min-h-[640px]"
              onClick={(e) => e.stopPropagation()}
            >
              {inOnboarding ? (
                renderOnboarding()
              ) : (
                <>
                  {/* ── Form pane ── (no dismiss control — login is required) */}
                  <div className="relative flex w-full flex-col lg:w-1/2">
                    <div className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-10">
                      <div className="mx-auto w-full max-w-sm">
                        <div className="mb-8 text-center">
                          <img
                            src="/resources/logo/artcraft-icon.png"
                            alt="ArtCraft"
                            className="pointer-events-none mx-auto mb-6 h-12 w-auto select-none"
                            draggable={false}
                          />
                          <h1 className="mb-2 text-2xl font-semibold">
                            {isSignUp ? "Create your account" : "Welcome back"}
                          </h1>
                          <p className="text-sm text-white/60">
                            {isSignUp
                              ? "Sign up to start creating with ArtCraft"
                              : "Log in to your account"}
                          </p>
                        </div>

                        <ArtCraftSignUp
                          onSubmit={handleAuthSubmit}
                          isSignUp={isSignUp}
                          onToggleMode={() => setIsSignUp((prev) => !prev)}
                          errorMessage={errorMessage}
                          isLoading={isLoading}
                        />
                      </div>
                    </div>

                    <div className="px-8 pb-8 text-center text-xs text-white/20">
                      &copy; {new Date().getFullYear()} ArtCraft. All rights
                      reserved.
                    </div>
                  </div>

                  {/* ── Showcase pane (desktop only) ── */}
                  <div className="relative hidden lg:block lg:w-1/2">
                    <LoginShowcase videoUrl={videoUrl} />
                  </div>
                </>
              )}
            </div>
          </TransitionChild>
        </div>
      </div>
    </Transition>
  );
}

// Right-pane video showcase — Vimeo background embed scaled to cover the pane,
// with a legibility gradient + caption. Mirrors the webapp auth-showcase.
function LoginShowcase({ videoUrl }: { videoUrl: string }) {
  return (
    <div
      className="absolute inset-2 overflow-hidden rounded-2xl bg-black"
      style={{ containerType: "size" }}
    >
      <iframe
        src={videoUrl}
        title="ArtCraft"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "max(100cqw, calc(100cqh * 16 / 9))",
          height: "max(100cqh, calc(100cqw * 9 / 16))",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/25"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-300">
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
