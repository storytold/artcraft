import { signal } from "@preact/signals-core";
import { CameraAspectRatio, EditorStates } from "~/pages/PageScene/enums";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";

// These signals exist only to satisfy PromptBox3D's signal-typed props.
// Components inside PageScene read from the Zustand store; the setters
// below dual-write into the store so PromptBox3D's onChange callbacks
// keep the store authoritative.

export const cameraAspectRatio = signal<CameraAspectRatio>(
  CameraAspectRatio.HORIZONTAL_3_2,
);

export const setCameraAspectRatio = (newAspectRatio: CameraAspectRatio) => {
  cameraAspectRatio.value = newAspectRatio;
  usePageSceneStore.getState().setCameraAspectRatio(newAspectRatio);
};

export const gridVisibility = signal<boolean>(true);

export const setGridVisibility = (isVisible: boolean) => {
  gridVisibility.value = isVisible;
  usePageSceneStore.getState().setGridVisible(isVisible);
};
