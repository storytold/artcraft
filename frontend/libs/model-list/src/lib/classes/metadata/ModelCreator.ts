export enum ModelCreator {
  BlackForestLabs = "BlackForestLabs",
  Bytedance = "Bytedance",
  Google = "Google",
  Hailuo = "Hailuo",
  Kling = "Kling",
  Midjourney = "Midjourney",
  OpenAi = "OpenAi",
  Runway = "Runway",
  Stability = "Stability",
  Tencent = "Tencent", // hunyuan
  Recraft = "Recraft",
  Krea = "Krea",
  Fal = "Fal",
  Replicate = "Replicate",
  TensorArt = "TensorArt",
  OpenArt = "OpenArt",
  Higgsfield = "Higgsfield",
  Alibaba = "Alibaba", // qwen and wanvideo
  Vidu = "Vidu",
  ArtCraft = "ArtCraft",
  Grok = "Grok",
  WorldLabs = "WorldLabs",
  Beeble = "Beeble",
  Suno = "Suno",
}

/** Backend `model_creator` snake_case string -> frontend `ModelCreator` enum. */
export const modelCreatorFromBackend = (
  raw?: string | null,
): ModelCreator | undefined => {
  switch (raw) {
    case "alibaba": return ModelCreator.Alibaba;
    case "artcraft": return ModelCreator.ArtCraft;
    case "beeble": return ModelCreator.Beeble;
    case "black_forest_labs": return ModelCreator.BlackForestLabs;
    case "bytedance": return ModelCreator.Bytedance;
    case "fal": return ModelCreator.Fal;
    case "google": return ModelCreator.Google;
    case "grok": return ModelCreator.Grok;
    case "hailuo": return ModelCreator.Hailuo;
    case "higgsfield": return ModelCreator.Higgsfield;
    case "kling": return ModelCreator.Kling;
    case "krea": return ModelCreator.Krea;
    case "midjourney": return ModelCreator.Midjourney;
    case "open_ai": return ModelCreator.OpenAi;
    case "open_art": return ModelCreator.OpenArt;
    case "recraft": return ModelCreator.Recraft;
    case "replicate": return ModelCreator.Replicate;
    case "runway": return ModelCreator.Runway;
    case "stability": return ModelCreator.Stability;
    case "suno": return ModelCreator.Suno;
    case "tencent": return ModelCreator.Tencent;
    case "tensor_art": return ModelCreator.TensorArt;
    case "vidu": return ModelCreator.Vidu;
    case "world_labs": return ModelCreator.WorldLabs;
    default: return undefined;
  }
};
