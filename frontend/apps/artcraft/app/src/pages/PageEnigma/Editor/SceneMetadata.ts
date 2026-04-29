import { getArtStyle } from "~/enums/ArtStyle";
import {
  cinematic,
  enginePreProcessing,
  faceDetail,
  globalIPAMediaToken,
  lipSync,
  styleStrength,
  upscale,
} from "~/pages/PageEnigma/signals";
import { SceneGenereationMetaData as SceneGenerationMetaData } from "~/pages/PageEnigma/models/sceneGenerationMetadata";
import Editor from "./editor";
import { usePageEnigmaStore } from "../PageEnigmaStore";

export const getSceneGenerationMetaData = (
  editorEngine: Editor,
): SceneGenerationMetaData => {
  // when this is called, editor engine is guarunteed by it's caller
  return {
    positivePrompt: editorEngine.positive_prompt,
    negativePrompt: editorEngine.negative_prompt,
    artisticStyle: getArtStyle(editorEngine.art_style.toString()),
    cameraAspectRatio: usePageEnigmaStore.getState().cameraAspectRatio,
    globalIPAMediaToken: globalIPAMediaToken.value || undefined,
    upscale: upscale.value,
    faceDetail: faceDetail.value,
    styleStrength: styleStrength.value,
    lipSync: lipSync.value,
    cinematic: cinematic.value,
    enginePreProcessing: enginePreProcessing.value,
  };
};
