import { useMemo } from "react";
import type { PopoverItem } from "@storyteller/ui-popover";
import { faCube, faFilm, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getCreatorIcon,
  Model,
  ImageModel,
  VideoModel,
  VIDEO_MODELS,
  IMAGE_MODELS,
  SPLAT_MODELS,
  OBJECT_3D_MODELS,
} from "@storyteller/model-list";
import { ModelTag } from "@storyteller/model-list";
import { useImageModels, useVideoModels } from "@storyteller/tauri-api";

export type ModelList = Omit<PopoverItem, "selected">[];

const withIcon = (creatorIcon: any, fallback: any) => creatorIcon || fallback;

const buildItems = (models: Model[], fallbackIcon: any) =>
  models.map((model: Model) => ({
    label: model.selectorName,
    icon: withIcon(getCreatorIcon(model.creator), fallbackIcon),
    description: model.selectorDescription,
    modelConfig: model.toLegacyModelConfig(), // Access to full object.
    model: model,
  }));

const sortedBySelectorName = <T extends Model>(models: T[]): T[] => {
  // De-dupe while preserving instances, then sort by selector name.
  const list = Array.from(new Set(models));
  list.sort((a, b) => a.selectorName?.localeCompare(b.selectorName));
  return list;
};

const imageIcon = <FontAwesomeIcon icon={faImage} className="h-4 w-4" />;
const filmIcon = <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />;
const cubeIcon = <FontAwesomeIcon icon={faCube} className="h-4 w-4" />;

/**
 * Per-page model subsetting. These pages show a slice of the full model set
 * based on model CAPABILITY FLAGS (canTextToImage, canEditImages, canEditAngles,
 * the InstructiveEdit tag, etc.). Those flags do not exist in the storyteller-web
 * omni backend, so this subsetting is maintained here in the frontend overlay.
 *
 * Each builder is a pure function over a model list, so it can run against either
 * the static overlay (the `*_PAGE_MODEL_LIST` constants below) or the live,
 * backend-reconciled list from `useModelsStore` (the `use*PageModelList` hooks).
 */

export const buildTextToImagePageList = (imageModels: ImageModel[]): ModelList =>
  buildItems(
    sortedBySelectorName(imageModels.filter((m) => m.canTextToImage)),
    imageIcon,
  );

export const buildCanvas2dPageList = (imageModels: ImageModel[]): ModelList =>
  buildItems(
    sortedBySelectorName(
      imageModels.filter(
        (m) => m.canEditImages || m.tags?.includes(ModelTag.InstructiveEdit),
      ),
    ),
    imageIcon,
  );

export const buildStage3dPageList = (imageModels: ImageModel[]): ModelList =>
  buildItems(
    sortedBySelectorName(
      imageModels.filter((m) => m.tags?.includes(ModelTag.InstructiveEdit)),
    ),
    imageIcon,
  );

export const buildImageEditorPageList = (imageModels: ImageModel[]): ModelList =>
  buildItems(
    sortedBySelectorName(imageModels.filter((m) => m.canEditImages)),
    imageIcon,
  );

export const buildAnglesPageList = (imageModels: ImageModel[]): ModelList =>
  buildItems(
    sortedBySelectorName(imageModels.filter((m) => m.canEditAngles)),
    imageIcon,
  );

export const buildImageToVideoPageList = (videoModels: VideoModel[]): ModelList =>
  buildItems(
    // SwitchX is a VFX/background-change model with its own page; keep it
    // out of the general video selector.
    sortedBySelectorName(videoModels.filter((m) => m.id !== "switch_x")),
    filmIcon,
  );

// ---------------------------------------------------------------------------
// Backward-compatible static constants (computed from the frontend overlay).
// Prefer the `use*PageModelList` hooks in React components so the dropdowns
// reflect the backend-reconciled model set.
// ---------------------------------------------------------------------------

export const TEXT_TO_IMAGE_PAGE_MODEL_LIST: ModelList =
  buildTextToImagePageList(IMAGE_MODELS);

export const CANVAS_2D_PAGE_MODEL_LIST: ModelList =
  buildCanvas2dPageList(IMAGE_MODELS);

export const STAGE_3D_PAGE_MODEL_LIST: ModelList =
  buildStage3dPageList(IMAGE_MODELS);

export const IMAGE_EDITOR_PAGE_MODEL_LIST: ModelList =
  buildImageEditorPageList(IMAGE_MODELS);

export const IMAGE_TO_VIDEO_PAGE_MODEL_LIST: ModelList =
  buildImageToVideoPageList(VIDEO_MODELS);

export const ANGLES_PAGE_MODEL_LIST: ModelList =
  buildAnglesPageList(IMAGE_MODELS);

export const IMAGE_TO_3D_WORLD_PAGE_MODEL_LIST: ModelList = buildItems(
  SPLAT_MODELS as Model[],
  cubeIcon,
);

export const IMAGE_TO_3D_OBJECT_PAGE_MODEL_LIST: ModelList = buildItems(
  OBJECT_3D_MODELS as Model[],
  cubeIcon,
);

// ---------------------------------------------------------------------------
// Live, backend-reconciled hooks. Use these in React components; they fall back
// to the overlay until `loadModelsFromBackend()` completes at app startup.
// ---------------------------------------------------------------------------

export const useTextToImagePageModelList = (): ModelList => {
  const imageModels = useImageModels();
  return useMemo(() => buildTextToImagePageList(imageModels), [imageModels]);
};

export const useCanvas2dPageModelList = (): ModelList => {
  const imageModels = useImageModels();
  return useMemo(() => buildCanvas2dPageList(imageModels), [imageModels]);
};

export const useStage3dPageModelList = (): ModelList => {
  const imageModels = useImageModels();
  return useMemo(() => buildStage3dPageList(imageModels), [imageModels]);
};

export const useImageEditorPageModelList = (): ModelList => {
  const imageModels = useImageModels();
  return useMemo(() => buildImageEditorPageList(imageModels), [imageModels]);
};

export const useAnglesPageModelList = (): ModelList => {
  const imageModels = useImageModels();
  return useMemo(() => buildAnglesPageList(imageModels), [imageModels]);
};

export const useImageToVideoPageModelList = (): ModelList => {
  const videoModels = useVideoModels();
  return useMemo(() => buildImageToVideoPageList(videoModels), [videoModels]);
};
