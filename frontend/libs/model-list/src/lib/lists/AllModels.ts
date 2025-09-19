import { IMAGE_MODELS } from "./ImageModels.js";
import { VIDEO_MODELS } from "./VideoModels.js";
import { Model } from "../classes/Model.js";

export const ALL_MODELS_LIST: Model[] = [...IMAGE_MODELS, ...VIDEO_MODELS];
