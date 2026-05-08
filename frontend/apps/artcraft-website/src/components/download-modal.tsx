import {
  faTimes,
  faEnvelope,
  faArrowLeft,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@storyteller/ui-button";
import { useNavigate } from "react-router-dom";
import { SignupForm } from "./auth";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal = ({ isOpen, onClose }: DownloadModalProps) => {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [view, setView] = useState<"menu" | "signup">("menu");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      return;
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Reset state after animation
        setView("menu");
      }, 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isMounted) return null;

  if (!isVisible && !isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 backdrop-blur-lg"
          : "opacity-0 backdrop-blur-none pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-md bg-[#1C1C20] border border-white/10 rounded-3xl p-8 shadow-2xl transform transition-all duration-300 ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors z-20"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {view === "signup" && (
          <button
            onClick={() => setView("menu")}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors z-20"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Downloading ArtCraft...
          </h2>
          <p className="text-white/60 text-sm">
            Your download has started.
            <br />
            While you wait, create an account to store your creations.
          </p>
        </div>

        {view === "menu" ? (
          <div className="space-y-3">
            {/* <Button
              className="rounded-full w-full bg-white text-black hover:bg-gray-100 border-none justify-center gap-3 font-medium h-12"
              onClick={() => {}} // Dummy op
            >
              <FontAwesomeIcon icon={faGoogle} className="text-lg" />
              Continue with Google
            </Button> */}

            <Button
              className="rounded-full w-full bg-white/5 hover:bg-white/10 text-white border-white/10 justify-center gap-3 font-medium h-12"
              onClick={() => setView("signup")}
            >
              <FontAwesomeIcon icon={faEnvelope} className="text-lg" />
              Sign up with Email
            </Button>
          </div>
        ) : (
          <SignupForm
            onSuccess={() => {
              onClose();
              navigate("/welcome");
            }}
            signupSource="artcraft"
            showGoogleButton={false}
            autoFocus={true}
          />
        )}

        <div className="mt-8 text-center pt-6 border-t border-white/5">
          <button
            onClick={onClose}
            className="text-white/40 text-xs hover:text-white/60 transition-colors font-medium"
          >
            I already have an account
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
