import { useState } from "react";
import { useShallow } from "zustand/shallow";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";

import { SidePanelTabs } from "~/pages/PageScene/comps/SidePanelTabs";
import { SidePanelMenu } from "~/pages/PageScene/comps/SidePanelMenu";
import { TabItem, tabList } from "./tabList";

export const SidePanel = () => {
  const { sidePanelVisible, dndSidePanelWidth, sidePanelWidth } =
    usePageSceneStore(
      useShallow((s) => ({
        sidePanelVisible: s.sidePanelVisible,
        dndSidePanelWidth: s.dndSidePanelWidth,
        sidePanelWidth: s.sidePanelWidth,
      })),
    );

  const initialTabIdx = 0;
  const [selectedTab, setSelectedTab] = useState<TabItem>(
    tabList[initialTabIdx],
  );

  const displayWidth =
    dndSidePanelWidth > -1 ? dndSidePanelWidth : sidePanelWidth;

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
