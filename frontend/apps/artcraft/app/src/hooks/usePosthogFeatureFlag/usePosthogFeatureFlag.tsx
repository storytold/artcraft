import { FeatureFlags } from "~/enums/FeatureFlags";
import environmentVariables from "~/Classes/EnvironmentVariables";

// PostHog removed (privacy). Remote feature flags are no longer fetched;
// every flag reads as "off" except in development builds, as before.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const usePosthogFeatureFlag = (_flag: FeatureFlags): boolean => {
  if (
    environmentVariables.values.DEPLOY_CONTEXT &&
    environmentVariables.values.DEPLOY_CONTEXT === "DEVELOPMENT"
  ) {
    return true;
  }
  return false;
};
