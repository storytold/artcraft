import { ComponentType, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";
import { LoadingDots } from "@storyteller/ui-loading";
import { authentication, persistLogin } from "~/signals";
import { AUTH_STATUS } from "~/enums";
import { TWO_SECONDS } from "~/constants";

export const withProtectionRoute = <P extends object>(
  Component: ComponentType<P>,
) =>
  function ProtectionRoute(rest: P) {
    useSignals();
    useSignalEffect(() => {
      persistLogin();
    });

    // const { status, userInfo } = authentication;
    // //render according to auth status
    // if (
    //   status.value === AUTH_STATUS.INIT ||
    //   status.value === AUTH_STATUS.LOGGING ||
    //   status.value === AUTH_STATUS.GET_USER_INFO
    // ) {
    //   return (
    //     <div className="fixed flex h-full w-full flex-col  items-center justify-center">
    //       <LoadingDots type="bricks" message="Authentication in Process..." />
    //     </div>
    //   );
    // }

    // if (
    //   status.value === AUTH_STATUS.LOGGED_IN &&
    //   userInfo.value &&
    //   userInfo.value.can_access_studio
    // ) {
    return <Component {...rest} />; // uncomment everything else this gives the component to render.
    // }

    // return <RedirectToLogin />;
  };

const RedirectToLogin = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const timeoutTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!timeoutTimer.current) {
      timeoutTimer.current = setTimeout(
        () => navigate(`/login?redirect=${pathname}`),
        TWO_SECONDS,
      );
    }
  }, [navigate, pathname]);
  return (
    <div className="fixed flex h-full w-full flex-col  items-center justify-center">
      <LoadingDots type="bricks" message="Redirecting to Login..." />
    </div>
  );
};
