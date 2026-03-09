import type { PopoverItem } from "@storyteller/ui-popover";
import { faClock, faCube, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getCreatorIcon,
  Model,
  VIDEO_MODELS,
  IMAGE_MODELS,
  IMAGE_MODELS_BY_ID,
  SPLAT_MODELS,
} from "@storyteller/model-list";
import { ModelTag } from "@storyteller/model-list";

export type ModelList = Omit<PopoverItem, "selected">[];

const withIcon = (creatorIcon: any, fallback: any) => creatorIcon || fallback;

const buildItems = (
  models: Model[],
  fallbackIcon: any
) =>
  models.map((model: Model) => ({
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

export const TEXT_TO_IMAGE_PAGE_MODEL_LIST: ModelList =
  buildItems(
    (function (): Model[] {
      const set: Set<Model> = new Set();
      IMAGE_MODELS
        .filter((model) => model.canTextToImage)
        .forEach((m) => set.add(m));
      const list = Array.from(set);
      list.sort((a, b) => a.selectorName?.localeCompare(b.selectorName));
      return list;
    })(),
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  );

export const CANVAS_2D_PAGE_MODEL_LIST: ModelList =
  buildItems(
    (function (): Model[] {
      const set: Set<Model> = new Set();
      IMAGE_MODELS
        .filter((m) => m.canEditImages || m.tags?.includes(ModelTag.InstructiveEdit))
        .forEach((m) => set.add(m));
      const list = Array.from(set);
      list.sort((a, b) => a.selectorName?.localeCompare(b.selectorName));
      return list;
    })(),
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  );

export const STAGE_3D_PAGE_MODEL_LIST: ModelList =
  buildItems(
    (function (): Model[] {
      const set: Set<Model> = new Set();
      IMAGE_MODELS
        .filter((m) => m.tags?.includes(ModelTag.InstructiveEdit))
        .forEach((m) => set.add(m));
      const list = Array.from(set);
      list.sort((a, b) => a.selectorName?.localeCompare(b.selectorName));
      return list;
    })(),
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  );

export const IMAGE_EDITOR_PAGE_MODEL_LIST: ModelList =
  buildItems(
    //[
    //  ALL_MODELS_BY_ID.get("flux_pro_inpaint")!,
    //  ALL_MODELS_BY_ID.get("flux_dev_juggernaut_inpaint")!,
    //  ALL_MODELS_BY_ID.get("flux_pro_kontext_max")!,
    //],
    (function (): Model[] {
      const set: Set<Model> = new Set();
      //set.add(IMAGE_MODELS_BY_ID.get("gpt_image_1")!); // Place gpt_image_1 first.
      IMAGE_MODELS
        .filter((m) => m.canEditImages)
        .forEach((m) => set.add(m));
      const list = Array.from(set);
      list.sort((a, b) => a.selectorName?.localeCompare(b.selectorName));
      return list;
    })(),
    <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
  );

export const IMAGE_TO_VIDEO_PAGE_MODEL_LIST: ModelList =
  buildItems(
    (function (): Model[] {
      const set: Set<Model> = new Set();
      VIDEO_MODELS.forEach((m) => set.add(m));
      const list = Array.from(set);
      list.sort((a, b) => a.selectorName?.localeCompare(b.selectorName));
      return list;
    })(),
    <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
  );

export const IMAGE_TO_3D_WORLD_PAGE_MODEL_LIST: ModelList =
  buildItems(
    SPLAT_MODELS as Model[],
    <FontAwesomeIcon icon={faCube} className="h-4 w-4" />
  );
