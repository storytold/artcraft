import { useSignals } from "@preact/signals-react/runtime";
import { authentication } from "~/signals";
import { usePosthogFeatureFlag } from "~/hooks/usePosthogFeatureFlag";
import { FeatureFlags } from "~/enums";

export const useFeatureFlags = () => {
  useSignals();

  const showSearchObjectComponent = usePosthogFeatureFlag(
    FeatureFlags.SHOW_SEARCH_OBJECTS,
  );
  const showUploadButton =
    usePosthogFeatureFlag(FeatureFlags.DEV_ONLY) || authentication.canUpload3D;

  return {
    showSearchObjectComponent,
    showUploadButton,
  };
};
