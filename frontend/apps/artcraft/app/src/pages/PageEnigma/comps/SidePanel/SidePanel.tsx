import { useState } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { useShallow } from "zustand/shallow";
import { sidePanelWidth } from "~/pages/PageEnigma/signals";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";

import { SidePanelTabs } from "~/pages/PageEnigma/comps/SidePanelTabs";
import { SidePanelMenu } from "~/pages/PageEnigma/comps/SidePanelMenu";
import { TabItem, tabList } from "./tabList";

export const SidePanel = () => {
  useSignals();
  const { sidePanelVisible, dndSidePanelWidth } = usePageEnigmaStore(
    useShallow((s) => ({
      sidePanelVisible: s.sidePanelVisible,
      dndSidePanelWidth: s.dndSidePanelWidth,
    })),
  );

  const initialTabIdx = 0;
  const [selectedTab, setSelectedTab] = useState<TabItem>(
    tabList[initialTabIdx],
  );

  const displayWidth =
    dndSidePanelWidth > -1 ? dndSidePanelWidth : sidePanelWidth.value;

  return (
    <>
      <div
        className={[
          "fixed flex border-l border-[#363636] bg-ui-panel transition-all duration-100",
        ].join(" ")}
        style={{
          top: 64,
          right: sidePanelVisible ? 84 : -400,
          width: displayWidth,
        }}
      >
        <div className="relative block h-full w-full bg-ui-panel">
          <SidePanelTabs tabs={tabList} selectedTab={selectedTab} />
        </div>
      </div>
      <SidePanelMenu
        tabs={tabList}
        selectedTab={selectedTab}
        selectTab={(newSelectedTab) => {
          setSelectedTab(newSelectedTab);
        }}
      />
    </>
  );
};
