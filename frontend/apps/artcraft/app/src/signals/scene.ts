import { signal } from "@preact/signals-core";
import { usePageSceneStore } from "@storyteller/ui-pagescene";

export interface SceneSignal {
  isInitializing?: boolean;
  title: string | undefined;
  token: string | undefined;
  ownerToken: string | undefined;
  isModified?: boolean | undefined;
}
export const scene = signal<SceneSignal>({
  isInitializing: true,
  title: undefined,
  token: undefined,
  ownerToken: undefined,
  isModified: undefined,
});

export const signalScene = (data: SceneSignal) => {
  const next = {
    ...data,
    isInitializing: false,
    isModified: true,
    //TODO: MILES: implement flagging of isModified
    // from editor side, and take this out after
  };
  scene.value = next;
  // Mirror into the lib's PageSceneStore so ControlsTopButtons (and
  // any other lib component) can read scene metadata reactively
  // without depending on the host's signal system.
  usePageSceneStore.getState().setSceneMeta({
    title: next.title,
    token: next.token,
    ownerToken: next.ownerToken,
    isModified: next.isModified,
    isInitializing: next.isInitializing,
  });
};

export const getSceneSignals = (): SceneSignal => {
  return scene.value;
};
