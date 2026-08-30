import { ModelCreator } from "./ModelCreator.js";

// Model-id-prefix → family display name, used to group the model picker into
// submenus ("Seedance", "Veo", ...). Matched in order against both canonical
// and tauri id forms (they share prefixes), so keep more specific prefixes
// before shorter ones.
const MODEL_ID_PREFIX_FAMILIES: Array<[string, string]> = [
  // ── Video ──
  ["seedance", "Seedance"],
  ["kling", "Kling"],
  ["veo", "Veo"],
  ["sora", "Sora"],
  ["minimax", "MiniMax"],
  ["hailuo", "MiniMax"],
  ["happy_horse", "Happy Horse"],
  ["vidu", "Vidu"],
  // ── Image ── (flux also covers the Flux 3 video model)
  ["flux", "Flux"],
  ["seedream", "Seedream"],
  ["seededit", "SeedEdit"],
  ["nano_banana", "Nano Banana"],
  // gemini_25_flash is surfaced to users as Nano Banana.
  ["gemini_25_flash", "Nano Banana"],
  ["gpt_image", "GPT Image"],
  ["midjourney", "Midjourney"],
  ["grok", "Grok"],
  ["qwen", "Qwen"],
  ["recraft", "Recraft"],
  ["imagen", "Imagen"],
  // ── 3D / world ──
  ["hunyuan", "Hunyuan 3D"],
  ["tripo", "Tripo"],
  ["meshy", "Meshy"],
  ["rodin", "Rodin"],
  ["marble", "Marble"],
  // ── Audio ──
  ["suno", "Suno"],
  ["seed_audio", "Seed Audio"],
];

// Popular-first ordering for family groups in the picker. Families not listed
// here sort alphabetically after these; the "Other" bucket always goes last.
export const FAMILY_ORDER: string[] = [
  // Video families first (longest picker lists today).
  "Seedance",
  "Veo",
  "Kling",
  "Sora",
  "MiniMax",
  "Grok",
  "Vidu",
  "Happy Horse",
  // Image families.
  "Nano Banana",
  "Seedream",
  "GPT Image",
  "Flux",
  "Midjourney",
  "Qwen",
  "SeedEdit",
  "Recraft",
  "Imagen",
];

// Creators whose enum name isn't already the right display form.
const CREATOR_DISPLAY_NAMES: Partial<Record<ModelCreator, string>> = {
  [ModelCreator.BlackForestLabs]: "Black Forest Labs",
  [ModelCreator.Bytedance]: "ByteDance",
  [ModelCreator.OpenAi]: "OpenAI",
  // Hailuo is MiniMax's product line; users know the MiniMax name.
  [ModelCreator.Hailuo]: "MiniMax",
  [ModelCreator.WorldLabs]: "World Labs",
};

export function getCreatorDisplayName(creator: ModelCreator): string {
  return CREATOR_DISPLAY_NAMES[creator] ?? creator;
}

/** Family name for a model id (canonical or tauri form), falling back to the
 *  creator's display name. Returns undefined when neither is known — callers
 *  bucket those under "Other". */
export function getModelFamilyName(
  modelId?: string,
  creator?: ModelCreator,
): string | undefined {
  if (modelId) {
    const normalized = modelId.toLowerCase();
    for (const [prefix, family] of MODEL_ID_PREFIX_FAMILIES) {
      if (normalized.startsWith(prefix)) return family;
    }
  }
  return creator ? getCreatorDisplayName(creator) : undefined;
}
