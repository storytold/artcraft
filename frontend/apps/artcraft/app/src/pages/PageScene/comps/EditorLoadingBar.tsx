import { useSignals } from "@preact/signals-react/runtime";
import { loadingBarData, loadingBarIsShowing } from "~/signals";

import { LoadingBar } from "@storyteller/ui-loading";
export const EditorLoadingBar = () => {
  useSignals();
  return (
    <LoadingBar
      id="editor-loading-bar"
      show={loadingBarIsShowing.value}
      wrapperClassName="absolute top-0 left-0 z-[80]"
      innerWrapperClassName="max-w-screen-sm"
      hasSpinner
      progressData={loadingBarData.value}
    />
  );
};
