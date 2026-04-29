import { signal } from "@preact/signals-core";
import { SceneObject } from "./types";
import { SceneManager } from "../../Editor/scene_manager_api";

export const outlinerState = {
  selectedItem: signal<SceneObject | null>(null),
  items: signal<SceneObject[]>([]),
};

// {
//   id: "1",
//   icon: faCamera,
//   name: "Camera",
//   type: "camera",
//   visible: true,
//   locked: false,
// },
// {
//   id: "2",
//   icon: faPerson,
//   name: "Story Girl",
//   type: "character",
//   visible: true,
//   locked: false,
// },
// {
//   id: "3",
//   icon: faCube,
//   name: "Car",
//   type: "object",
//   visible: true,
//   locked: false,
// },
// {
//   id: "4",
//   icon: faCube,
//   name: "Tree",
//   type: "object",
//   visible: true,
//   locked: false,
// },

export const outlinerIsShowing = signal(false);

export const selectItem = (
  id: string,
  sceneManager: SceneManager | undefined,
) => {
  const item = outlinerState.items.value.find((item) => item.id === id);
  if (item) {
    outlinerState.selectedItem.value = item;
  }

  if (sceneManager) {
    sceneManager.select_object(id);
  }
};

export const toggleVisibility = (id: string, hideFn: Function | undefined) => {
  const items = outlinerState.items.value;
  const index = items.findIndex((item) => item.id === id);
  if (index !== -1) {
    items[index].visible = !items[index].visible;
    outlinerState.items.value = [...items];
  }

  if (hideFn) {
    hideFn(id);
  }
};

export const toggleLock = (id: string, lockFn: Function | undefined) => {
  const items = outlinerState.items.value;
  const index = items.findIndex((item) => item.id === id);
  if (index !== -1) {
    items[index].locked = !items[index].locked;
    outlinerState.items.value = [...items];
  }

  if (lockFn) {
    lockFn(id);
  }
};
