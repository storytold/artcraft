import { IMAGE_MODELS } from "./ImageModels.js";
import { VIDEO_MODELS } from "./VideoModels.js";
import { Model } from "../classes/Model.js";
import { SPLAT_MODELS } from "./SplatModels.js";
import { OBJECT_3D_MODELS } from "./Object3DModels.js";

export const ALL_MODELS_LIST: Model[] = [
  ...IMAGE_MODELS,
  ...VIDEO_MODELS,
  ...SPLAT_MODELS,
  ...OBJECT_3D_MODELS,
];
