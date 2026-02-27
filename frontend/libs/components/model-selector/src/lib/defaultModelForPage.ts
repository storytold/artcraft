import { IMAGE_MODELS_BY_ID, Model, VIDEO_MODELS_BY_ID } from "@storyteller/model-list";
import { ModelPage } from "./model-pages";

export const defaultModelForPage = (models: Model[], page: ModelPage): Model => {
  let imageModel: Model | undefined;

  switch (page) {
    case ModelPage.TextToImage:
      imageModel = IMAGE_MODELS_BY_ID.get("nano_banana_pro");
      break;
    case ModelPage.ImageToVideo:
      imageModel = VIDEO_MODELS_BY_ID.get("seedance_2p0");
      break;
    case ModelPage.Canvas2D:
      imageModel = IMAGE_MODELS_BY_ID.get("gpt_image_1p5");
      break;
    case ModelPage.Stage3D:
      imageModel = IMAGE_MODELS_BY_ID.get("gpt_image_1p5");
      break;
    case ModelPage.ImageEditor:
      imageModel = IMAGE_MODELS_BY_ID.get("nano_banana_pro");
      break;
  }

  return imageModel || models[0];
}
