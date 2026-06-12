import { ModelCreator } from "./ModelCreator.js";
import {
  getCreatorIconPath,
  getServicesBasePath,
} from "./ModelCreatorIcons.js";
import { ALL_MODELS_LIST } from "../../lists/AllModels.js";

// Fallback prefix → creator map for model ids that aren't in ALL_MODELS_LIST
// (legacy / API-only ids). Mirrors the webapp's omni-gen icon mapping.
const MODEL_ID_PREFIX_CREATORS: Array<[string, ModelCreator]> = [
  ["flux", ModelCreator.BlackForestLabs],
  ["nano_banana", ModelCreator.Google],
  ["gpt_image", ModelCreator.OpenAi],
  ["midjourney", ModelCreator.Midjourney],
  ["seedream", ModelCreator.Bytedance],
  ["seedance", ModelCreator.Bytedance],
  ["kling", ModelCreator.Kling],
  ["sora", ModelCreator.OpenAi],
  ["veo", ModelCreator.Google],
  ["grok", ModelCreator.Grok],
  ["happy_horse", ModelCreator.Alibaba],
  // Beeble SwitchX (background change) has no provider icon — use the ArtCraft
  // mark since it's surfaced as an ArtCraft feature.
  ["switch_x", ModelCreator.ArtCraft],
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
  for (const [prefix, creator] of MODEL_ID_PREFIX_CREATORS) {
    if (modelId.startsWith(prefix)) return getCreatorIconPath(creator);
  }
  return `${getServicesBasePath()}/generic.svg`;
};
