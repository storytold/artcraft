import { useSignals } from "@preact/signals-react/runtime";
import { AUTH_STATUS } from "~/enums";
import { authentication } from "~/signals";
// import ProfileDropdown from "./ProfileDropdown";

export const AuthButtons = ({
  loginSignUpPressed,
}: {
  loginSignUpPressed: () => void;
}) => {
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
