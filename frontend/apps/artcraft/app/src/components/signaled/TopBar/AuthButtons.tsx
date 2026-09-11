import { useSignals } from "@preact/signals-react/runtime";
import { AUTH_STATUS } from "~/enums";
import { authentication } from "~/signals";
import { Button } from "@storyteller/ui-button";
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
          <span className="text-white/20">|</span>
          <Button
            className="h-[38px]"
            onClick={() => {
              loginSignUpPressed();
            }}
          >
            Login / Sign Up
          </Button>
        </div>
      </>
    );
  }
};
