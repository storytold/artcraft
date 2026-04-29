//dummy types - change as needed

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type SceneObject = {
  id: string;
  icon: IconDefinition;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
};
