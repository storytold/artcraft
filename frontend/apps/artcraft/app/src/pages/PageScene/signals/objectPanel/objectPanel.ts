import { signal } from "@preact/signals-core";
import { SceneObject } from "./types";

export const objectPanel = {
  isShowing: signal<boolean>(false),
  currentObject: signal<SceneObject | undefined>(undefined),
};

export const showObjectPanel = (showObject?: SceneObject) => {
  if (showObject) {
    objectPanel.currentObject.value = showObject;
  }
  objectPanel.isShowing.value = true;
};

export const hideObjectPanel = () => {
  objectPanel.isShowing.value = false;
};

export const updateObjectPanel = (updateObject: SceneObject) => {
  objectPanel.currentObject.value = updateObject;
};
