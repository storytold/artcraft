import { useState } from "react";

import { TabTitles } from "~/enums";
import { TabTitle } from "../../sharedComps";
import { ImagePlanesTab } from "./subTabImagePlanes";
import { SubTabButtons } from "../../sharedComps/SubTabButtons";
import { VideoPlanesTab } from "./subTabVideoPlanes";

export const PlanesTab = () => {
  const [currSubpage, setCurrSubpage] = useState<TabTitles>(
    TabTitles.PLANES_IMAGE,
  );

  return (
    <>
      <TabTitle title={TabTitles.PLANES} />

      <SubTabButtons
        currSubpage={currSubpage}
        setSubpage={(newPage) => {
          setCurrSubpage(newPage);
        }}
        subPageTitles={[TabTitles.PLANES_IMAGE, TabTitles.PLANES_VIDEO]}
      />
      {currSubpage === TabTitles.PLANES_IMAGE && <ImagePlanesTab />}
      {currSubpage === TabTitles.PLANES_VIDEO && <VideoPlanesTab />}
    </>
  );
};
