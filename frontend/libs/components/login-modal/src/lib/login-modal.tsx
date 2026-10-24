// The app's shared button component (used for "Get Started", "Skip for now" and "Join Discord").
import { Button } from "@storyteller/ui-button";
// Headless UI's fade/scale animation helpers: `Transition` is the outer wrapper that decides whether the dialog is shown,
// `TransitionChild` animates one piece (the dark backdrop, the card) when it appears or leaves.
import { Transition, TransitionChild } from "@headlessui/react";
// `useState` holds a value that re-draws the dialog when it changes; `useEffect` runs code after a draw; `useRef` holds a value
// that survives re-draws WITHOUT causing one.
import { useState, useEffect, useRef } from "react";
// The arrow drawn on the "Get Started" button.
import { ArrowRightIcon } from "lucide-react";
// The Discord logo drawn on the "Join Discord" button.
import { DiscordIcon } from "@storyteller/icons";
// Only the TYPE of the signed-in user (erased at build time, so this does not load the API library).
import type { UserInfo } from "@storyteller/api";
// The "log in through the website" panel, and the helper that opens a web address in the user's real browser.
import { DesktopLoginBridge, OpenUrl } from "./DesktopLoginBridge";
// The 3-second "welcome back" card shown after a log-in.
import { LoginSuccess } from "./LoginSuccess";
// The username/email/password form.
import { ArtCraftSignUp } from "./artcraft-signup";
// The wrappers around the Rust commands that do the real network work (check the saved session, log in, sign up).
import { getNativeLoginSession, passwordLogin, passwordSignup, isDesktopLoginError } from "./NativeLoginBridge";
// The shared store that says whether the dialog is open, and lets any part of the app open, close or re-check it.
import { useLoginModalStore } from "./useLoginModalStore";

// Webapp auth-showcase video (swap by passing `videoUrl`).
const DEFAULT_SHOWCASE_VIDEO =
  "https://frontend-cdn.fakeyou.com/videos/knight-video.mp4";
// How long the "welcome back" card stays up after a log-in before the dialog closes by itself (3 seconds).
const LOGIN_SUCCESS_DURATION_MS = 3000;
// Tailwind position classes for the four small corner marks drawn on the card's frame (one entry per corner).
const FRAME_CORNERS = [
  "top-0 left-0",
  "top-0 right-0",
  "bottom-0 left-0",
  "bottom-0 right-0",
];

// What the parent gives the dialog. Every item is optional.
interface LoginModalProps {
  // Called after the dialog has been closed (by "Get Started" or by the 3-second success timer).
  onClose?: () => void;
  // Called with true/false every time the dialog opens or closes, so the parent can react (e.g. hide things behind it).
  onOpenChange?: (isOpen: boolean) => void;
  // Called with the signed-in user once a sign-in, sign-up or saved-session check succeeds.
  onArtCraftAuthSuccess?: (userInfo: any) => void;
  // Which form the dialog starts on: true = "Create your account" (the default), false = "Welcome back".
  isSignUp?: boolean;
  /** Optional direct media URL for the right-pane showcase video. */
  videoUrl?: string;
  // Accepted for backwards compatibility with existing call sites (MainApp
  // passes these); no longer used now that the showcase is a single video.
  videoSrc2D?: string;
  videoSrc3D?: string;
}

// The login / sign-up dialog. It is drawn once near the top of the app and shows or hides itself from the shared store.
export function LoginModal({
  onClose,
  onOpenChange,
  onArtCraftAuthSuccess,
  // `isSignUp: initialIsSignUp = true` renames the prop and defaults it to true; the live value is the `isSignUp` state below.
  isSignUp: initialIsSignUp = true,
  videoUrl = DEFAULT_SHOWCASE_VIDEO,
}: LoginModalProps) {
  // From the shared store: whether the dialog is open, the counter that asks for a session re-check, and the function that closes it.
  const { isOpen, recheckTrigger, closeModal } = useLoginModalStore();
  // True while a sign-up/log-in request is running (the form disables its button and shows a spinner).
  const [isLoading, setIsLoading] = useState(false);
  // Remembers that someone is signed in. Only the setter is used; the leading underscore marks the value as intentionally unread.
  const [_isLoggedInArtCraft, setIsLoggedInArtCraft] = useState(false);
  // Which form is showing: true = sign-up, false = log-in. Starts from the prop.
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  // The message from the last failed request, shown in the form's red banner ("" means none).
  const [errorMessage, setErrorMessage] = useState("");
  // The two post-sign-up screens: the "Join our community" Discord invite, then the "Thank you for signing in!" screen.
  const [showDiscord, setShowDiscord] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // True while the "log in through the website" attempt is waiting for the browser (the password form is hidden meanwhile).
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  // The name shown on the 3-second welcome card after a log-in. null means that card is not showing.
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);

  // A counter bumped whenever a newer sign-in activity starts. A slower, older request compares the number it started with to
  // this one and drops its result if they differ.
  const authGeneration = useRef(0);
  // Always-current copies of the two parent callbacks. Keeping them in refs lets the effects below call the latest version
  // without having to re-run whenever the parent passes a new function.
  const authSuccess = useRef(onArtCraftAuthSuccess);
  authSuccess.current = onArtCraftAuthSuccess;
  const afterClose = useRef(onClose);
  afterClose.current = onClose;

  // A stale startup/recheck response must never reopen the modal after login.
  // Runs on first draw and again every time someone asks for a re-check (`recheckTrigger` changes): asks Rust whether a
  // session is already saved, then either closes the dialog (someone is signed in) or opens it with everything reset.
  useEffect(() => {
    // Take a ticket number for this check. If anything newer starts before the answer arrives, the numbers differ.
    const generation = ++authGeneration.current;
    // Set to false when this effect is cleaned up, so a late answer from an old run is ignored.
    let active = true;
    getNativeLoginSession().then((user) => {
      // Ignore the answer if a newer check or a sign-in has started since.
      if (!active || generation !== authGeneration.current) return;
      if (user) {
        // A saved session exists: tell the app who is signed in and make sure the dialog is closed.
        setIsLoggedInArtCraft(true);
        authSuccess.current?.(user);
        closeModal();
      } else {
        // Nobody is signed in: put every piece of dialog state back to its starting value, then open the dialog.
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
      // Same stale check for a failed check.
      if (!active || generation !== authGeneration.current) return;
      // The session check itself failed: show why (the Rust message when there is one) and open the dialog so the person can sign in.
      setErrorMessage(isDesktopLoginError(error) ? error.message : "Unable to check your account. Please sign in again.");
      useLoginModalStore.getState().openModal();
    });
    // Cleanup: mark this run as finished so its late answer is dropped.
    return () => { active = false; };
  }, [recheckTrigger, closeModal, initialIsSignUp]);

  // Tells the parent whenever the dialog opens or closes (including once on first draw).
  useEffect(() => {
    if (onOpenChange) onOpenChange(isOpen);
  }, [isOpen, onOpenChange]);

  // The sign-up onboarding screens ("Join our community", "Thank you for signing in!") are left on by "Get Started", which only
  // closes the dialog. The recheck effect above resets them, but not every caller goes through it (the moodboard library picker's
  // "Log in" button calls openModal() directly), so a later opening would show the old thank-you screen with no way to sign in.
  // Start the screens over whenever the dialog goes from closed to open; staying open (e.g. during the sign-up) changes nothing.
  // `wasOpen` remembers the previous value of `isOpen` between draws (a ref, so updating it does not cause another draw).
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    // Closed last time and open now: this is a new visit, so start both onboarding screens over.
    if (isOpen && !wasOpen.current) {
      setShowDiscord(false);
      setShowSuccess(false);
    }
    // Remember the current value for the next time `isOpen` changes.
    wasOpen.current = isOpen;
  }, [isOpen]);

  // After a log-in, show the welcome card for 3 seconds and then close the dialog by itself.
  useEffect(() => {
    // Nothing to time while the welcome card is not showing or the dialog is already closed.
    if (loggedInUsername === null || !isOpen) return;
    const timer = window.setTimeout(() => {
      closeModal();
      afterClose.current?.();
    }, LOGIN_SUCCESS_DURATION_MS);
    // Cancel the timer if the dialog closes (or the name changes) before it fires.
    return () => window.clearTimeout(timer);
  }, [loggedInUsername, isOpen, closeModal]);

  // "Get Started": close the dialog and let the parent know.
  const handleClose = () => {
    closeModal();
    onClose?.();
  };

  // "Join Discord": open the invite and move on to the thank-you screen.
  const handleDiscordJoin = () => {
    // window.open does nothing in the desktop webview (the main window has no new-window handler), so go through the
    // opener plugin. A failed open is ignored: the invite is optional and the modal moves on either way.
    OpenUrl("https://discord.gg/75svZP2Vje").catch(() => undefined);
    setShowDiscord(false);
    setShowSuccess(true);
  };

  // A log-in worked (password or website): show the welcome card and tell the app who signed in.
  const handleLoginSuccess = (user: UserInfo) => {
    // Make any request or check still in flight count as stale so it cannot undo this.
    authGeneration.current += 1;
    setIsLoading(false);
    setIsLoggedInArtCraft(true);
    setIsChallengeActive(false);
    // Setting the name is what switches the card to the welcome view and starts the 3-second close timer above.
    setLoggedInUsername(user.username);
    authSuccess.current?.(user);
  };

  // The form's submit handler for both modes. For a log-in the first slot holds the "email or username" text and the
  // email/confirmation slots are empty strings.
  const handleAuthSubmit = async (
    username: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    // Start of a request: show the spinner and clear the previous error.
    setIsLoading(true);
    setErrorMessage("");
    // Take a ticket number so a slower earlier request cannot overwrite this one's result.
    const generation = ++authGeneration.current;
    try {
      // Ask Rust to sign up or log in (Rust makes the actual network call).
      const user = isSignUp
        ? await passwordSignup(username, email, password, passwordConfirmation)
        : await passwordLogin(username || email, password);
      // A newer sign-in activity started while this one ran: drop this result.
      if (generation !== authGeneration.current) return;
      if (isSignUp) {
        // New account: the app learns who signed in now, and the Discord invite screen comes next.
        setIsLoggedInArtCraft(true);
        authSuccess.current?.(user);
        setShowDiscord(true);
      } else {
        // Existing account: straight to the welcome card.
        handleLoginSuccess(user);
      }
    } catch (error) {
      // Show Rust's message when there is one; otherwise a generic line. Only the newest request may write the banner.
      if (generation === authGeneration.current) setErrorMessage(isDesktopLoginError(error) ? error.message : "An unexpected error occurred. Please try again.");
    } finally {
      // Whether it worked or failed, stop the spinner (again only for the newest request).
      if (generation === authGeneration.current) setIsLoading(false);
    }
  };

  // ── Post-auth onboarding screens (full-width inside the same card) ────────
  // Draws whichever onboarding screen is current: "Thank you for signing in!" when `showSuccess` is on, otherwise the Discord invite.
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
          {/* The only way off this screen: it closes the dialog (there is no dismiss control and no click-outside). */}
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
          {/* "Skip for now" moves straight to the thank-you screen without opening Discord. */}
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
          {/* "Join Discord" opens the invite in the real browser, then moves to the thank-you screen. */}
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

  // True while either onboarding screen should replace the form.
  const inOnboarding = showDiscord || showSuccess;

  return (
    // `show` opens/closes the whole dialog with its animation; `appear` also animates the very first opening. `afterLeave` runs when the
    // closing animation has finished and clears the welcome-card name so the next opening does not start on the welcome card.
    <Transition appear show={isOpen} afterLeave={() => setLoggedInUsername(null)}>
      {/* Full-screen layer above the rest of the app (z-[100]). */}
      <div className="fixed inset-0 z-[100]">
        {/* The dark backdrop, faded in and out. It has no click handler: login is required, so clicking outside does not close the dialog. */}
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
        {/* Centres the card on screen. */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {/* The card, faded and scaled in and out. */}
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            {/* Outer card box: narrow while the welcome card shows, wide (form + video) otherwise. The click handler stops clicks inside the card from reaching anything behind it. */}
            <div
              className={`relative w-full ${loggedInUsername !== null ? "max-w-md" : "max-w-lg lg:max-w-5xl"}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* The bordered card itself; the tall minimum height applies only to the wide layout. */}
              <div
                className={`relative flex w-full overflow-hidden border border-white/20 bg-[#1e1f22] text-white ${loggedInUsername !== null ? "" : "lg:min-h-[560px]"}`}
              >
                {/* Three states, in priority order: the welcome card after a log-in, then an onboarding screen after a sign-up, otherwise the form and video. */}
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
                            {/* The ArtCraft logo (served from the app's own resources folder); not selectable or draggable. */}
                            <img
                              src="/resources/logo/artcraft-icon.png"
                              alt="ArtCraft"
                              className="pointer-events-none mb-8 h-8 w-auto select-none"
                              draggable={false}
                            />
                            {/* The heading and the line under it change with the mode. */}
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

                          {/* Log-in mode only: the "continue on the website" panel. Starting it counts as newer sign-in activity, so any older request's result is dropped. */}
                          {!isSignUp && <DesktopLoginBridge onActiveChange={setIsChallengeActive} onStart={() => { authGeneration.current += 1; }} onSuccess={handleLoginSuccess} />}
                          {/* The "or" divider between the website option and the password form (log-in mode, and not while the website attempt is waiting). */}
                          {!isSignUp && !isChallengeActive && (
                            <div className="mb-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/15 after:h-px after:flex-1 after:bg-white/15">
                              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                                or
                              </span>
                            </div>
                          )}
                          {/* The password form, hidden while the website log-in is waiting. Switching modes clears the server's message and flips between sign-up and log-in. */}
                          {!isChallengeActive && <ArtCraftSignUp
                            onSubmit={handleAuthSubmit}
                            isSignUp={isSignUp}
                            onToggleMode={() => {
                              // Forget the server's message too, so it cannot come back when the form is shown again (e.g. after "Back" from a website log-in).
                              setErrorMessage("");
                              setIsSignUp((prev) => !prev);
                            }}
                            errorMessage={errorMessage}
                            isLoading={isLoading}
                          />}
                        </div>
                      </div>

                      {/* The copyright line at the bottom of the form pane; the year is read from the clock when the dialog is drawn. */}
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
              {/* The four decorative corner marks on the frame. `aria-hidden` keeps screen readers from announcing them. */}
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
    // The pane: fills its parent, clips the video to the pane's edges, and uses the card's dark colour behind the video.
    <div className="absolute inset-0 overflow-hidden bg-[#1e1f22]">
      {/* The looping, silent video. It starts by itself (browsers allow that only when muted), loads ahead of time, and is non-interactive. */}
      <video
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      {/* A dark gradient over the video (strongest at the bottom) so the white caption stays readable. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/25"
      />

      {/* The caption pinned to the bottom of the pane. */}
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
