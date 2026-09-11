import { computed, signal } from "@preact/signals-core";
import { ActiveSubscriptions, UserInfo } from "~/models";
import { AUTH_STATUS, LoyaltyProgram, USER_FEATURE_FLAGS } from "~/enums";

const status = signal<AUTH_STATUS>(AUTH_STATUS.INIT);
const userInfo = signal<UserInfo | undefined>(undefined);
const activeSubs = signal<ActiveSubscriptions | undefined>(undefined);

// Return all true for these inorder to remove the login.
const canUpload3D = computed(() => {
  // NB(bt,2025-07-06): This is legacy code. Everyone should be able to upload 3D
  // if (!userInfo.value || !userInfo.value.maybe_feature_flags) {
  //   return undefined;
  // }
  // return userInfo.value.maybe_feature_flags.includes(
  //   USER_FEATURE_FLAGS.UPLOAD_3D,
  // );
  return true;
});

const hasAccess = computed(() => {
  // NB(bt,2025-07-06): This is legacy code. Everyone should have access to the software.
  // if (
  //   userInfo.value === undefined ||
  //   userInfo.value.can_access_studio === undefined
  // ) {
  //   return undefined;
  // }
  // return userInfo.value.can_access_studio;
  return true;
});

const hasPremium = computed(() => {
  if (activeSubs.value === undefined) {
    return undefined;
  }
  if (
    activeSubs.value.active_subscriptions.length > 0 ||
    activeSubs.value.maybe_loyalty_program === LoyaltyProgram.CONTRIBUTOR
  ) {
    return true;
  }
  return false;
});

export const authentication = {
  status,
  userInfo,
  activeSubs,
  canUpload3D,
  hasAccess,
  hasPremium,
};
