// AuthButtons: the "Login / Sign Up" button for the top bar. It draws nothing once the user is logged in.
// Reads the login state from the authentication signal in ~/signals. At the time of writing TopBar.tsx does not use it
// (and the ProfileDropdown import is commented out).

import { useSignals } from "@preact/signals-react/runtime";
import { AUTH_STATUS } from "~/enums";
import { authentication } from "~/signals";
// import ProfileDropdown from "./ProfileDropdown";

/**
 * loginSignUpPressed: called when the button is clicked (the parent opens the login flow). Returns null when logged in.
 */
export const AuthButtons = ({
  loginSignUpPressed,
}: {
  loginSignUpPressed: () => void;
}) => {
  // Subscribes this component to the signals it reads so it re-renders when the login status changes.
  useSignals();

  const { status } = authentication;

  if (status.value === AUTH_STATUS.LOGGED_IN) {
    return null;
  } else {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            className="flex h-8 items-center gap-1.5 rounded-[3px] bg-white px-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-white/80"
            onClick={() => {
              loginSignUpPressed();
            }}
          >
            Login / Sign Up
          </button>
        </div>
      </>
    );
  }
};
