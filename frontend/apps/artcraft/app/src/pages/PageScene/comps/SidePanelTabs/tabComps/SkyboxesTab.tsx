import { demoSkyboxItems } from "~/pages/PageScene/signals";

import { TabTitle } from "~/pages/PageScene/comps/SidePanelTabs/sharedComps";
import { ItemElements } from "../sharedComps/ItemElements";
import { TabTitles } from "~/enums";

export const SkyboxesTab = () => {
  const displayedItems = demoSkyboxItems.value;

  return (
    <>
      <TabTitle title={TabTitles.SKYBOXES} />
      <div className="w-full grow overflow-y-auto rounded px-4 pb-4">
        <ItemElements
          busy={!displayedItems || displayedItems.length === 0}
          items={displayedItems}
        />
      </div>
    </>
  );
};
