import { useSignals } from "@preact/signals-react/runtime";
import { twMerge } from "tailwind-merge";
import { usePosthogFeatureFlag } from "~/hooks/usePosthogFeatureFlag";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { FeatureFlags, TabTitles } from "~/enums";
import { EditorStates } from "~/pages/PageEnigma/enums";
import { editorState, setEditorState } from "~/pages/PageEnigma/signals/engine";
import { sidePanelVisible } from "~/pages/PageEnigma/signals/sidePanel";

import { TabItem } from "../SidePanel/tabList";
import { currentPage, pageHeight } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";

export const SidePanelMenu = ({
  tabs,
  selectTab,
  selectedTab,
}: {
  tabs: TabItem[];
  selectTab: (newSelectedTab: TabItem) => void;
  selectedTab: TabItem;
}) => {
  useSignals();
  const showStylePage = usePosthogFeatureFlag(FeatureFlags.SHOW_STYLE_PAGE);
  return (
    <div
      className={twMerge(
        "fixed bg-assets-background",
        "right-0 top-[64px] w-[84px] overflow-auto border-l px-2 py-2",
        sidePanelVisible.value ? "border-transparent" : "border-[#363636]",
      )}
      style={{
        height: pageHeight.value - 56,
      }}
    >
      <div className="flex w-full flex-col gap-2">
        {(tabs ?? []).map((tab) => {
          return (
            <button
              key={tab.title}
              className={twMerge([
                "flex flex-col items-center rounded-lg border border-transparent px-2 py-3 transition-all duration-200 hover:bg-brand-secondary-900/75",
                tab.title === selectedTab.title && sidePanelVisible.value
                  ? "border-[#363636] bg-brand-secondary-900/60 opacity-100 hover:bg-brand-secondary-900/60"
                  : "opacity-60",
                tab.title === TabTitles.STYLIZE &&
                  "bg-brand-primary font-medium opacity-90 hover:border-white/25 hover:bg-brand-primary hover:opacity-100",
                tab.title === selectedTab.title &&
                tab.title === TabTitles.STYLIZE
                  ? "border-white/50 opacity-100 hover:border-white/50"
                  : "",
              ])}
              onClick={() => {
                if (tab.title === TabTitles.RENDER) {
                  currentPage.value = Pages.STYLE;
                  return;
                }
                selectTab(tab);
                if (!sidePanelVisible.value) {
                  sidePanelVisible.value = true;
                }
                if (editorState.value === EditorStates.PREVIEW) {
                  setEditorState(EditorStates.EDIT);
                }
              }}
            >
              <div>
                <FontAwesomeIcon icon={tab.icon} size="lg" />
              </div>
              <div
                className="-mb-1 mt-1 leading-[14px]"
                style={{ fontSize: 11 }}
              >
                {tab.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
