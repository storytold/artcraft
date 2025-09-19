import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getCreatorIcon,
  Model,
  VIDEO_MODELS,
  IMAGE_MODELS,
  IMAGE_MODELS_BY_ID,
} from "@storyteller/model-list";
import { ModelTag } from "@storyteller/model-list";

export type ModelList = Omit<PopoverItem, "selected">[];

const withIcon = (creatorIcon: any, fallback: any) => creatorIcon || fallback;

const buildItems = (
  models: Model[],
  fallbackIcon: any
) =>
  models.map((model : Model) => ({
    label: model.selectorName,
    icon: withIcon(getCreatorIcon(model.creator), fallbackIcon),
    description: model.selectorDescription,
    badges: model.toLegacyBadges()?.map((b) => ({
      label: b.label,
      icon: <FontAwesomeIcon icon={faClock} />,
    })),
    modelConfig: model.toLegacyModelConfig(), // Access to full object.
    model: model,
  }));

/**
 * IN-PROGRESS MIGRATION (messy for now)
 * We're gradually going to phase out ModelList, ModelConfig, etc.
 * We won't index by name, but rather id, or simply will always have full 
 * access to the object directly.
 */ 

export const TEXT_TO_IMAGE_PAGE_MODEL_LIST : ModelList = 
  buildItems(
    (function() : Model[] {
      const set : Set<Model> = new Set();
      set.add(IMAGE_MODELS_BY_ID.get("flux_pro_1_1")!); // Don't put Midjourney first!
      IMAGE_MODELS
        .filter((model) => !model.usesInpaintingMask) // We can't use masked inpainting models here
        .filter((model) => model.id !== "flux_pro_kontext_max") // NB: Flux Pro Kontext Max requires an input image
        .forEach((m) => set.add(m));
      return Array.from(set);
    })(),
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  );

export const CANVAS_2D_PAGE_MODEL_LIST : ModelList = 
  buildItems(
    (function() : Model[] {
      const set : Set<Model> = new Set();
      set.add(IMAGE_MODELS_BY_ID.get("gpt_image_1")!); // Place gpt_image_1 first.
      IMAGE_MODELS
        .filter((m) => m.tags?.includes(ModelTag.InstructiveEdit))
        .forEach((m) => set.add(m));
      return Array.from(set);
    })(),
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  );

export const STAGE_3D_PAGE_MODEL_LIST : ModelList = 
  buildItems(
    (function() : Model[] {
      const set : Set<Model> = new Set();
      set.add(IMAGE_MODELS_BY_ID.get("gpt_image_1")!); // Place gpt_image_1 first.
      IMAGE_MODELS
        .filter((m) => m.tags?.includes(ModelTag.InstructiveEdit))
        .forEach((m) => set.add(m));
      return Array.from(set);
    })(),
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  );

export const IMAGE_EDITOR_PAGE_MODEL_LIST : ModelList = 
  buildItems(
    //[
    //  ALL_MODELS_BY_ID.get("flux_pro_inpaint")!,
    //  ALL_MODELS_BY_ID.get("flux_dev_juggernaut_inpaint")!,
    //  ALL_MODELS_BY_ID.get("flux_pro_kontext_max")!,
    //],
    (function() : Model[] {
      const set : Set<Model> = new Set();
      //set.add(IMAGE_MODELS_BY_ID.get("gpt_image_1")!); // Place gpt_image_1 first.
      IMAGE_MODELS
        .filter((m) => m.canEditImages)
        .forEach((m) => set.add(m));
      return Array.from(set);
    })(),
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  );

export const IMAGE_TO_VIDEO_PAGE_MODEL_LIST : ModelList = 
  buildItems(
    VIDEO_MODELS,
    <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
  );