// Aggregates "meta" parameters from the live editor + the Zustand store
// for the save-scene flow. This lives outside engine/ because it reads
// from the store directly — engine code stays store-agnostic.

import { SceneGenereationMetaData as SceneGenerationMetaData } from "./models/sceneGenerationMetadata";
import Editor from "./engine/editor";
import { usePageSceneStore } from "./PageSceneStore";

export const getSceneGenerationMetaData = (
  editorEngine: Editor,
): SceneGenerationMetaData => {
  // when this is called, editor engine is guaranteed by its caller
  const s = usePageSceneStore.getState();
  return {
    positivePrompt: editorEngine.positive_prompt,
    cameraAspectRatio: s.cameraAspectRatio,
  };
};
