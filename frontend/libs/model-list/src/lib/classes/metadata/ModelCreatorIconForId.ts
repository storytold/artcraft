import { ModelCreator } from "./ModelCreator.js";
import {
  getCreatorIconPath,
  getServicesBasePath,
} from "./ModelCreatorIcons.js";
import { ALL_MODELS_LIST } from "../../lists/AllModels.js";

// Fallback prefix → creator map for model ids that aren't in ALL_MODELS_LIST
// (legacy / API-only ids). Shared with the model-list loader's creator guess.
export const MODEL_ID_PREFIX_CREATORS: Array<[string, ModelCreator]> = [
  ["flux", ModelCreator.BlackForestLabs],
  ["nano_banana", ModelCreator.Google],
  ["gpt_image", ModelCreator.OpenAi],
  ["midjourney", ModelCreator.Midjourney],
  ["seedream", ModelCreator.Bytedance],
  ["seedance", ModelCreator.Bytedance],
  ["seededit", ModelCreator.Bytedance],
  ["kling", ModelCreator.Kling],
  ["sora", ModelCreator.OpenAi],
  ["veo", ModelCreator.Google],
  ["grok", ModelCreator.Grok],
  ["vidu", ModelCreator.Vidu],
  ["recraft", ModelCreator.Recraft],
  ["happy_horse", ModelCreator.Alibaba],
  ["minimax", ModelCreator.Hailuo],
  ["qwen", ModelCreator.Alibaba],
  ["suno", ModelCreator.Suno],
  ["seed_audio", ModelCreator.Bytedance],
  // Beeble SwitchX (background change) has no provider icon — use the ArtCraft
  // mark since it's surfaced as an ArtCraft feature.
  ["switch_x", ModelCreator.ArtCraft],
  // 3D mesh / splat models (not in ALL_MODELS_LIST).
  ["hunyuan", ModelCreator.Tencent],
  ["marble", ModelCreator.WorldLabs],
];

// Direct model-id-prefix → services icon filename, for 3D brands that don't
// have a ModelCreator enum value yet. Drop the matching .svg into
// public/images/services/ (webapp) and resources/images/services/ (desktop).
const MODEL_ID_PREFIX_ICON_FILES: Array<[string, string]> = [
  ["tripo", "tripo.svg"],
  ["meshy", "meshy.svg"],
  // Rodin is Hyper3D's model.
  ["rodin", "hyper3d.svg"],
];

/**
 * Resolve a model id (canonical or tauri) to its creator's icon path.
 * Falls back to a prefix match, then to the generic icon.
 */
export const getCreatorIconPathForModelId = (modelId: string): string => {
  const model = ALL_MODELS_LIST.find(
    (m) => m.id === modelId || m.tauriId === modelId,
  );
  if (model) return getCreatorIconPath(model.creator);
  const base = getServicesBasePath();
  for (const [prefix, file] of MODEL_ID_PREFIX_ICON_FILES) {
    if (modelId.startsWith(prefix)) return `${base}/${file}`;
  }
  for (const [prefix, creator] of MODEL_ID_PREFIX_CREATORS) {
    if (modelId.startsWith(prefix)) return getCreatorIconPath(creator);
  }
  return `${base}/generic.svg`;
};
