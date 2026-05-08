import { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";
import { Key, KeyGroup, Mouse, Plus } from "./ControlsTopButtons/Help/Help";
import { CloseButton } from "@storyteller/ui-close-button";

const STORAGE_KEY = "onboarding_helper_dismissed";
const EXPIRATION_DAYS = 3;

export const OnboardingHelper = () => {
  const [actionPerformed, setActionPerformed] = useState(false);
  const [keyPressed, setKeyPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if the helper was dismissed
    /*
    const dismissedData = localStorage.getItem(STORAGE_KEY);
    if (dismissedData) {
      const { timestamp } = JSON.parse(dismissedData);
      const expirationTime = timestamp + EXPIRATION_DAYS * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      if (Date.now() < expirationTime) {
        setIsVisible(false);
      } else {
        // Clear expired data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    */
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Store dismissal timestamp
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
      }),
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["W", "A", "S", "D"].includes(event.key.toUpperCase())) {
        setTimeout(() => setKeyPressed(true), 200);
      }
    };

    const handleAction = () => {
      setTimeout(() => setActionPerformed(true), 200);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleAction);
    window.addEventListener("dragstart", handleAction);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleAction);
      window.removeEventListener("dragstart", handleAction);
    };
  }, []);

  return (
    <Transition
      show={isVisible && !actionPerformed && !keyPressed}
      enter="transition-opacity duration-500"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-500"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="glass pointer-events-none absolute left-1/2 bottom-56 z-10 flex -translate-x-1/2 flex-col items-center justify-center gap-1 rounded-xl border border-brand-primary !bg-brand-primary/10 px-3 pr-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="scale-75 origin-center -mx-3">
              <KeyGroup>
                <Key button="W" />
                <Key button="A" />
                <Key button="S" />
                <Key button="D" />
              </KeyGroup>
            </div>
            <p className="text-sm font-semibold">Move</p>
          </div>
          <div className="h-4 w-[1px] bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="scale-75 origin-center -mx-1">
              <Mouse button="left" />
            </div>
            <p className="text-sm font-semibold">Look</p>
          </div>
        </div>
        <div className="pointer-events-auto absolute -top-2 -right-2">
          <CloseButton onClick={handleClose} className="h-5 w-5 bg-black/50 hover:bg-black/80 rounded-full border border-white/10" />
        </div>
      </div>
    </Transition>
  );
};

export default OnboardingHelper;
