import { useSignals } from "@preact/signals-react/runtime";
import { pageHeight } from "~/signals";

import { TabItem } from "../SidePanel/tabList";

export const SidePanelTabs = ({
  selectedTab,
  tabs,
}: {
  selectedTab: TabItem;
  tabs: TabItem[];
}) => {
  useSignals();

  return (
    <>
      <div style={{ height: pageHeight.value - 64, width: "100%" }}>
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={
              tab.title === selectedTab.title
                ? "flex h-full flex-col gap-3.5 overflow-y-auto"
                : "hidden"
            }
          >
            {tab.component}
          </div>
        ))}
      </div>
      {/* TODO: side-panel resize handle previously used a hook from a
          long-deleted comps/Timeline path. Rewire when the React event
          hooks land in Phase 6. */}
    </>
  );
};
