import { getArtStyle } from "~/enums/ArtStyle";
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
    negativePrompt: editorEngine.negative_prompt,
    artisticStyle: getArtStyle(editorEngine.art_style.toString()),
    cameraAspectRatio: s.cameraAspectRatio,
    globalIPAMediaToken: s.globalIPAMediaToken || undefined,
    upscale: s.upscale,
    faceDetail: s.faceDetail,
    styleStrength: s.styleStrength,
    lipSync: s.lipSync,
    cinematic: s.cinematic,
    enginePreProcessing: s.enginePreProcessing,
  };
};
