import { ReactNode } from "react";
import { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import {
  faAlienMonster,
  faCloud,
  faCube,
  faMountainCity,
  faPresentationScreen,
  faUserAstronaut,
} from "@fortawesome/pro-solid-svg-icons";

import { TabTitles } from "~/enums";
import { CartoonsTab } from "../SidePanelTabs/tabComps/CharactersComboTabs";
import { ObjectsTab } from "../SidePanelTabs/tabComps/ObjectsTab";
import { SkyboxesTab } from "../SidePanelTabs/tabComps/SkyboxesTab";
import { CreaturesTab } from "../SidePanelTabs/tabComps/CreaturesTab";
import { PlanesTab } from "~/pages/PageScene/comps/SidePanelTabs/tabComps/PlanesTab";
import { SetsTab } from "~/pages/PageScene/comps/SidePanelTabs/tabComps/SetsTab";


export interface TabItem {
  icon: FontAwesomeIconProps["icon"];
  title: string;
  component: ReactNode;
}

export const tabList: TabItem[] = [
  {
    icon: faMountainCity,
    title: TabTitles.OBJECTS_SETS,
    component: <SetsTab />,
  },
  {
    icon: faUserAstronaut,
    title: TabTitles.GROUP_CARTOONS,
    component: <CartoonsTab />,
  },
  {
    icon: faCube,
    title: TabTitles.OBJECTS,
    component: <ObjectsTab />,
  },
  {
    icon: faAlienMonster,
    title: TabTitles.OBJECTS_CREATURES,
    component: <CreaturesTab />,
  },
  {
    icon: faPresentationScreen,
    title: TabTitles.PLANES,
    component: <PlanesTab />,
  },
  {
    icon: faCloud,
    title: TabTitles.SKYBOXES,
    component: <SkyboxesTab />,
  },
];
