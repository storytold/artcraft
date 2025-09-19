import { ModelCreator } from "../classes/metadata/ModelCreator.js";
import { ModelInfo } from "./ModelInfo.js";
import { ModelTag } from "../classes/metadata/ModelTag.js";
import {
  ModelConfig,
  ModelCapabilities,
  ModelCategory,
} from "./ModelConfig.js";
import { Model } from "../classes/Model.js";

const mc = ModelCreator;

const DEFAULT_CAPABILITIES: ModelCapabilities = {
  maxGenerationCount: 1,
  defaultGenerationCount: 1,
};

const cfg = (
  m: Partial<ModelConfig> & {
    id: string;
    category: ModelCategory;
    info: ModelInfo;
  }
): ModelConfig => ({
  label: m.label ?? m.info.name,
  description: m.description,
  badges: m.badges,
  capabilities: m.capabilities ?? DEFAULT_CAPABILITIES,
  tags: m.tags ?? [],
  ...m,
});

const ALL_MODELS: ModelConfig[] = [
  //////////////////////////////
  // Image models
  //////////////////////////////
  cfg({
    id: "midjourney",
    category: "image",
    info: {
      name: "Midjourney",
      tauri_id: "midjourney",
      creator: mc.Midjourney,
    },
    description: "Incredible style and quality",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 },
  }),
  cfg({
    id: "flux_pro_1_1_ultra",
    category: "image",
    info: {
      name: "Flux Pro 1.1 Ultra",
      tauri_id: "flux_pro_11_ultra",
      creator: mc.BlackForestLabs,
    },
    description: "High quality model",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 },
  }),
  cfg({
    id: "flux_pro_1_1",
    category: "image",
    info: {
      name: "Flux Pro 1.1",
      tauri_id: "flux_pro_11",
      creator: mc.BlackForestLabs,
    },
    description: "High quality model",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 },
  }),
  cfg({
    id: "flux_1_dev",
    category: "image",
    info: {
      name: "Flux 1 Dev",
      tauri_id: "flux_1_dev",
      creator: mc.BlackForestLabs,
    },
    description: "High quality model",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 },
  }),
  cfg({
    id: "flux_1_schnell",
    category: "image",
    info: {
      name: "Flux 1 Schnell",
      tauri_id: "flux_1_schnell",
      creator: mc.BlackForestLabs,
    },
    description: "High quality model",
    badges: [{ label: "15 sec." }],
    capabilities: { maxGenerationCount: 4, defaultGenerationCount: 4 },
  }),
  cfg({
    id: "gpt_image_1",
    category: "image",
    info: {
      name: "GPT Image 1 (GPT-4o)",
      tauri_id: "gpt_image_1",
      creator: mc.OpenAi,
    },
    description: "Slow, ultra instructive model",
    badges: [{ label: "45 sec." }],
    capabilities: { maxGenerationCount: 1 },
    tags: ["instructiveEdit"],
  }),
  cfg({
    id: "flux_pro_kontext_max",
    category: "image",
    info: {
      name: "Flux Pro Kontext Max",
      tauri_id: "flux_pro_kontext_max",
      creator: mc.BlackForestLabs,
    },
    description: "Fast and high-quality model",
    badges: [{ label: "20 sec." }],
    capabilities: {
      maxGenerationCount: 4,
    },
    tags: [ModelTag.InstructiveEdit, ModelTag.NonMaskedInpainting],
  }),
  cfg({
    id: "flux_pro_inpaint",
    category: "image",
    info: {
      name: "Flux Pro 1 (Inpainting)",
      tauri_id: "flux_pro_1",
      creator: mc.BlackForestLabs,
    },
    description: "Fast and high-quality model",
    badges: [{ label: "20 sec." }],
    capabilities: {
      maxGenerationCount: 1, // NB: For some reason Fal only supports ONE image!
    },
    tags: [ModelTag.MaskedInpainting],
  }),
  cfg({
    id: "flux_dev_juggernaut_inpaint",
    category: "image",
    info: {
      name: "Flux Dev Juggernaut (Inpainting)",
      tauri_id: "flux_dev_juggernaut",
      creator: mc.BlackForestLabs,
    },
    description: "Fast and high-quality model",
    badges: [{ label: "20 sec." }],
    capabilities: {
      maxGenerationCount: 4,
    },
    tags: [ModelTag.MaskedInpainting],
  }),

  //////////////////////////////
  // Video models
  //////////////////////////////
  cfg({
    id: "kling_1_6_pro",
    category: "video",
    info: {
      name: "Kling 1.6 Pro",
      tauri_id: "kling_1.6_pro",
      creator: mc.Kling,
    },
    description: "Good quality model",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 },
  }),
  cfg({
    id: "kling_2_1_pro",
    category: "video",
    info: {
      name: "Kling 2.1 Pro",
      tauri_id: "kling_2.1_pro",
      creator: mc.Kling,
    },
    description: "High quality model",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 },
  }),
  cfg({
    id: "kling_2_1_master",
    category: "video",
    info: {
      name: "Kling 2.1 Master",
      tauri_id: "kling_2.1_master",
      creator: mc.Kling,
    },
    description: "Master quality model ($$)",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 },
  }),
  cfg({
    id: "seedance_1_0_lite",
    category: "video",
    info: {
      name: "Seedance 1.0 Lite",
      tauri_id: "seedance_1.0_lite",
      creator: mc.Bytedance,
    },
    description: "Fast and high-quality model",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 },
  }),
  cfg({
    id: "veo_2",
    category: "video",
    info: { name: "Google Veo 2", tauri_id: "veo_2", creator: mc.Google },
    description: "Fast and high-quality model",
    badges: [{ label: "2 min." }],
    capabilities: { maxGenerationCount: 1 },
  }),
];

// export const ALL_MODELS_BY_ID: Map<string, ModelConfig> = new Map(
//   ALL_MODELS.map((model) => [model.id, model])
// );

export const getAllModels = (): ModelConfig[] => ALL_MODELS;

export const getModelsByCategory = (category: ModelCategory): ModelConfig[] =>
  ALL_MODELS.filter((m) => m.category === category);

export const getInstructiveImageEditModels = (): ModelConfig[] =>
  ALL_MODELS.filter(
    (m) => m.category === "image" && m.tags?.includes("instructiveEdit")
  );

export const getMaskedInpaintModels = (): ModelConfig[] =>
  ALL_MODELS.filter(
    (m) => m.category === "image" && m.tags?.includes(ModelTag.MaskedInpainting)
  );

export const lookupModelByTauriId = (
  tauriId: string
): ModelConfig | undefined =>
  ALL_MODELS.find((m) => m.info.tauri_id === tauriId);

// Single exported capability resolver so callers never need to touch anything else
export const getCapabilitiesForModel = (
  model?: Model
): ModelCapabilities => {
  if (!model) return DEFAULT_CAPABILITIES;
  const cfg = lookupModelByTauriId(model.tauriId);
  return cfg?.capabilities ?? DEFAULT_CAPABILITIES;
};
