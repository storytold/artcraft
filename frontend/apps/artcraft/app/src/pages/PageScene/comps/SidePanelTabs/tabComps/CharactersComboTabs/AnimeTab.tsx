import { useState } from "react";
import { faPerson, faRabbitRunning } from "@fortawesome/pro-solid-svg-icons";

import { MediaFileAnimationType, TabTitles } from "~/enums";
import { TabTitle } from "../../sharedComps";
import { AnimationsTab } from "./subtabAnimations";
import { CharactersTab } from "./subtabCharacters";
import { SubTabButtons } from "../../sharedComps/SubTabButtons";

export const AnimeTab = () => {
  const [currSubpage, setCurrSubpage] = useState<TabTitles>(
    TabTitles.CHARACTERS,
  );

  return (
    <>
      <TabTitle title={TabTitles.GROUP_ANIME} />
      <SubTabButtons
        currSubpage={currSubpage}
        setSubpage={(newPage) => {
          setCurrSubpage(newPage);
        }}
        subPageTitles={[TabTitles.CHARACTERS]} // , TabTitles.ANIMATION
        subPageTitleIcons={[faPerson]} // faRabbitRunning
      />
      {currSubpage === TabTitles.CHARACTERS && (
        <CharactersTab animationType={MediaFileAnimationType.MikuMikuDance} />
      )}
      {/* {currSubpage === TabTitles.ANIMATION && (
        <AnimationsTab animationType={MediaFileAnimationType.MikuMikuDance} />
      )} */}
    </>
  );
};
