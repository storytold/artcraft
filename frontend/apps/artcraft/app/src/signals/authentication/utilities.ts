import { AUTH_STATUS } from "~/enums";
import { UserInfo, ActiveSubscriptions } from "~/models";
import { authentication, flushAllBackgroundLoadedMedia } from "~/signals";
import { useCreditsState } from "@storyteller/credits";
import { useSubscriptionState } from "@storyteller/subscription";
import { clearGalleryCache } from "@storyteller/ui-gallery-modal";

export const updateAuthStatus = (newStatus: AUTH_STATUS) => {
  console.log('updateAuthStatus()', newStatus)
  authentication.status.value = newStatus;
};

export const updateUserInfo = (
  newInfo: UserInfo | undefined,
  flush?: boolean,
) => {
  console.log('updateUserInfo()', newInfo)
  if (newInfo && !flush) {
    //case of updating UserInfo partly
    authentication.userInfo.value = {
      ...authentication.userInfo.value,
      ...newInfo,
    };
  } else {
    //case of setting a new User
    //case of deleting userInfo
    authentication.userInfo.value = newInfo;
  }
};
export const updateActiveSubscriptions = (
  activeSubs: ActiveSubscriptions | undefined,
) => {
  authentication.activeSubs.value = activeSubs;
};

// this function is not exposed, only the logout function is
export const setLogoutStates = () => {
  updateAuthStatus(AUTH_STATUS.LOGGED_OUT);
  updateUserInfo(undefined);
  updateActiveSubscriptions(undefined);
  flushAllBackgroundLoadedMedia();
  useCreditsState.getState().reset();
  useSubscriptionState.getState().reset();
  clearGalleryCache();
};
