import { SceneGenereationMetaData as SceneGenerationMetaData } from "~/pages/PageScene/models/sceneGenerationMetadata";
import Editor from "./editor";
import { usePageSceneStore } from "../PageSceneStore";

export const getSceneGenerationMetaData = (
  editorEngine: Editor,
): SceneGenerationMetaData => {
  // when this is called, editor engine is guarunteed by it's caller
  const s = usePageSceneStore.getState();
  return {
    positivePrompt: editorEngine.positive_prompt,
    cameraAspectRatio: s.cameraAspectRatio,
  };
};
