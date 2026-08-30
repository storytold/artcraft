import { useMemo } from "react";
import type { PopoverItem } from "@storyteller/ui-popover";
import { BoxIcon, FilmIcon, ImageIcon } from "lucide-react";
import {
  getCreatorListIcon,
  Model,
  ImageModel,
  VideoModel,
  SPLAT_MODELS,
  OBJECT_3D_MODELS,
} from "@storyteller/model-list";
import { ModelTag } from "@storyteller/model-list";
import { useImageModels, useVideoModels } from "@storyteller/tauri-api";

export type ModelList = Omit<PopoverItem, "selected">[];

const withIcon = (creatorIcon: any, fallback: any) => creatorIcon || fallback;

// Capability tag pills shown under video model rows.
const videoCapabilityBadges = (model: Model) => {
  if (model.kind !== "video_model") return undefined;
  const video = model as VideoModel;
  const badges = [
    ...(video.generateWithSound ? [{ label: "Audio Support" }] : []),
    ...(video.endFrame ? [{ label: "Start/End" }] : []),
    ...(video.supportsReferenceMode ? [{ label: "Reference" }] : []),
  ];
  return badges.length > 0 ? badges : undefined;
};

const buildItems = (models: Model[], fallbackIcon: any) =>
  models.map((model: Model) => ({
    label: model.selectorName,
    icon: withIcon(getCreatorListIcon(model.creator), fallbackIcon),
    description: model.selectorDescription,
    badges: videoCapabilityBadges(model),
    modelConfig: model.toLegacyModelConfig(), // Access to full object.
    model: model,
  }));

const sortedBySelectorName = <T extends Model>(models: T[]): T[] => {
  // De-dupe while preserving instances, then sort by selector name.
  const list = Array.from(new Set(models));
  list.sort((a, b) => a.selectorName?.localeCompare(b.selectorName));
  return list;
};

const imageIcon = <ImageIcon  className="h-4 w-4" />;
const filmIcon = <FilmIcon  className="h-4 w-4" />;
const cubeIcon = <BoxIcon  className="h-4 w-4" />;

/**
 * Per-page model subsetting. These pages show a slice of the full model set
 * based on model CAPABILITY FLAGS (canTextToImage, canEditImages, canEditAngles,
 * the InstructiveEdit tag, etc.). Those flags do not exist in the storyteller-web
 * omni backend, so this subsetting is maintained here in the frontend overlay.
 *
 * Each builder is a pure function over a model list. React components consume
 * them through the `use*PageModelList` hooks, which run them against the live,
 * backend-reconciled list from `useModelsStore`.
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
// Static constants for the 3D pages. Splat/3D-object models are not served by
// the omni backend, so these stay overlay-driven (no hook counterparts).
// ---------------------------------------------------------------------------

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
