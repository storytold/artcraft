import { Button } from "@storyteller/ui-button";
import { Transition, TransitionChild } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import {
  CheckSoraSession,
  SoraSessionState,
  useSoraLoginListener,
} from "@storyteller/tauri-api";
import { ArtCraftSignUp } from "./artcraft-signup";
import { UsersApi } from "@storyteller/api";
import { useLoginModalStore } from "./useLoginModalStore";

const SIGNUP_SOURCE_ARTCRAFT = "artcraft";

interface LoginModalProps {
  onClose?: () => void;
  videoSrc2D?: string;
  videoSrc3D?: string;
  onOpenChange?: (isOpen: boolean) => void;
  onArtCraftAuthSuccess?: (userInfo: any) => void;
  isSignUp?: boolean;
}

export function LoginModal({
  onClose,
  videoSrc2D,
  videoSrc3D,
  onOpenChange,
  onArtCraftAuthSuccess,
  isSignUp: initialIsSignUp = true,
}: LoginModalProps) {
  const { isOpen, recheckTrigger, closeModal } = useLoginModalStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedInArtCraft, setIsLoggedInArtCraft] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [errorMessage, setErrorMessage] = useState("");
  const artCraftFormRef = useRef<HTMLFormElement>(null);
  const [showDiscord, setShowDiscord] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Now we have 3 steps: Welcome, Sign up/Login, and Success
  const uiTotalSteps = 3;
  const uiCurrentStep = showSuccess ? 3 : showDiscord ? 2 : step;

  const initSession = async () => {
    const result = await CheckSoraSession();
    const sessionExists = result.state === SoraSessionState.Valid;
    return sessionExists;
  };

  const checkArtCraftLogin = async () => {
    const usersApi = new UsersApi();
    const session = await usersApi.GetSession();
    const loggedIn = session.data?.loggedIn;
    return loggedIn;
  };

  useSoraLoginListener((payload: any) => {
    console.log("Login success!", payload);
    setStep(4); // Always go to the final step after Sora login
  });

  // Check session on component mount and when recheckTrigger changes
  useEffect(() => {
    checkArtCraftLogin().then((loggedIn) => {
      if (loggedIn) {
        setIsLoggedInArtCraft(true);
        closeModal();
      } else {
        // Reset all modal state to initial values
        setStep(1);
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

  const handleNext = async () => {
    if (step === 2) {
      // Trigger the form submit in ArtCraftSignUp
      if (artCraftFormRef.current) {
        artCraftFormRef.current.requestSubmit();
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Progress bar rendering
  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-2">
      {[...Array(uiTotalSteps)].map((_, idx) => (
        <div
          key={idx}
          className={`h-1.5 rounded transition-all duration-300 w-16 ${
            idx < uiCurrentStep ? "bg-primary" : "bg-white/30"
          }`}
        />
      ))}
    </div>
  );

  const handleDiscordJoin = () => {
    window.open("https://discord.gg/75svZP2Vje", "_blank");
    setShowDiscord(false);
    setShowSuccess(true);
  };

  // Step content rendering
  const renderStepContent = () => {
    if (showSuccess) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-3xl font-bold mb-2 text-center">
            Thank you for signing in!
          </h2>
          <p className="text-white/70 mb-6 text-center">
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

    if (showDiscord) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-3xl font-bold mb-2 text-center">
            Join Our Community
          </h2>
          <p className="text-white/70 mb-6 text-center px-24">
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
    }

    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold mb-2 text-center">
              Welcome to ArtCraft
            </h2>
            <p className="text-white/70 mb-6 text-center">
              Here's what you can do...
            </p>
            <div className="grid grid-cols-2 gap-6 h-full grow">
              <div className="h-full">
                <div className="aspect-[4/3] w-full overflow-hidden bg-black/20 rounded-t-lg">
                  <video
                    className="object-cover w-full h-full"
                    autoPlay
                    muted
                    loop
                    controls={false}
                  >
                    <source src={videoSrc2D} type="video/mp4" />
                  </video>
                </div>
                <p className="text-center px-1.5 py-2 text-white/90 bg-black/20 rounded-b-lg font-medium text-sm">
                  2D Canvas
                </p>
              </div>
              <div>
                <div className="aspect-[4/3] w-full overflow-hidden bg-black/20 rounded-t-lg">
                  <video
                    className="object-cover w-full h-full"
                    autoPlay
                    muted
                    loop
                    controls={false}
                  >
                    <source src={videoSrc3D} type="video/mp4" />
                  </video>
                </div>
                <p className="text-center px-1.5 py-2 text-white/90 bg-black/20 rounded-b-lg font-medium text-sm">
                  3D Scene Editor
                </p>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <ArtCraftSignUp
            onSubmit={async (
              username,
              email,
              password,
              passwordConfirmation
            ) => {
              setIsLoading(true);
              const usersApi = new UsersApi();
              try {
                let signupResponse, loginResponse;
                if (isSignUp) {
                  console.log("Sign up!");
                  signupResponse = await usersApi.Signup({
                    username,
                    email,
                    password,
                    passwordConfirmation,
                    signupSource: SIGNUP_SOURCE_ARTCRAFT,
                  });
                  console.log(signupResponse);

                  if (!signupResponse.success) {
                    setErrorMessage(
                      signupResponse.errorMessage ||
                        "Signup failed, please try again."
                    );
                    setIsLoading(false);
                    return;
                  }
                  console.log("Path 1");
                  loginResponse = await usersApi.Login({
                    usernameOrEmail: username || email,
                    password,
                  });
                  console.log(loginResponse);
                } else {
                  console.log("Path 2");
                  loginResponse = await usersApi.Login({
                    usernameOrEmail: username || email,
                    password,
                  });
                  console.log(loginResponse);
                }

                if (!loginResponse.success) {
                  setErrorMessage(
                    loginResponse.errorMessage ||
                      "Login failed, please try again."
                  );
                  setIsLoading(false);
                  return;
                }

                setIsLoggedInArtCraft(true);
                console.log("ARTCRAFT LOGIN SUCCeSS");
                if (onArtCraftAuthSuccess) {
                  const session = await usersApi.GetSession();
                  const userInfo = session.data?.user;
                  console.log("USERINFO");
                  console.log(userInfo);
                  if (userInfo) onArtCraftAuthSuccess(userInfo);
                }
                setShowDiscord(true); // Show Discord step after successful login
              } catch (e) {
                console.error(e);
                setErrorMessage(
                  "An unexpected error occurred. Please try again."
                );
              } finally {
                setIsLoading(false);
              }
            }}
            isSignUp={isSignUp}
            onToggleMode={() => setIsSignUp((prev) => !prev)}
            formRef={artCraftFormRef}
            errorMessage={errorMessage}
          />
        );
      default:
        return null;
    }
  };

  const renderFooterButtons = () => {
    if (showSuccess || showDiscord) {
      return null; // No footer buttons needed in success or discord states
    }

    return (
      <div className="flex items-end justify-center gap-2.5 mt-10 grow">
        {step === 2 && (
          <Button variant="secondary" onClick={handleBack} disabled={isLoading}>
            Back
          </Button>
        )}
        <Button
          icon={faArrowRight}
          iconFlip={true}
          onClick={handleNext}
          loading={isLoading}
          disabled={isLoading}
        >
          {step === 1 ? "Continue" : isSignUp ? "Sign up" : "Login"}
        </Button>
      </div>
    );
  };

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
              className="relative h-[660px] max-w-4xl w-full rounded-xl bg-[#2C2C2C] text-white shadow-lg border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4 p-8 h-full">
                {!showSuccess && (
                  <>
                    <span className="text-sm text-center opacity-60 font-medium">
                      Step {uiCurrentStep} of {uiTotalSteps}
                    </span>
                    {renderProgress()}
                  </>
                )}
                {renderStepContent()}
                {renderFooterButtons()}
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Transition>
  );
}

export default LoginModal;
