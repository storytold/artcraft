import { signal } from "@preact/signals-core";
import { CameraAspectRatio, EditorStates } from "~/pages/PageEnigma/enums";

export const editorState = signal<EditorStates>(EditorStates.EDIT);

export const setEditorState = (newState: EditorStates) => {
  editorState.value = newState;
};

export const cameraAspectRatio = signal<CameraAspectRatio>(
  CameraAspectRatio.HORIZONTAL_3_2,
);

export const setCameraAspectRatio = (newAspectRatio: CameraAspectRatio) => {
  cameraAspectRatio.value = newAspectRatio;
};
export const previewSrc = signal("");

export const gridVisibility = signal<boolean>(true);

export const setGridVisibility = (isVisible: boolean) => {
  gridVisibility.value = isVisible;
};
