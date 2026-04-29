import { useState } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  faFaceSmileWink,
  faPerson,
  faRabbitRunning,
} from "@fortawesome/pro-solid-svg-icons";

import { MediaFileAnimationType, TabTitles } from "~/enums";
import { TabTitle } from "../../sharedComps";
import { AnimationsTab } from "./subtabAnimations";
import { CharactersTab } from "./subtabCharacters";
import { ExpressionTab } from "./subtabExpressions";
import { SubTabButtons } from "../../sharedComps/SubTabButtons";

import {
  demoCharacterItems,
  demoAnimationItems,
} from "~/pages/PageScene/signals";

export const CartoonsTab = () => {
  useSignals();

  const [currSubpage, setCurrSubpage] = useState<TabTitles>(
    TabTitles.CHARACTERS,
  );

  return (
    <>
      <TabTitle title={TabTitles.GROUP_CARTOONS} />
      <SubTabButtons
        currSubpage={currSubpage}
        setSubpage={(newPage) => {
          setCurrSubpage(newPage);
        }}
        subPageTitles={[
          TabTitles.CHARACTERS,
          // TabTitles.ANIMATION,
          // TabTitles.EXPRESSIONS,
        ]}
        subPageTitleIcons={[faPerson, faRabbitRunning, faFaceSmileWink]}
      />

      {currSubpage === TabTitles.CHARACTERS && (
        <CharactersTab
          animationType={MediaFileAnimationType.Mixamo}
          demoCharacterItems={demoCharacterItems.value}
        />
      )}
    </>
  );
};
