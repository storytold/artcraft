// @vitest-environment jsdom
import { expect, it } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { buildImageModelsFromListing } from "../loader/buildModelsFromListing.js";
import { IMAGE_MODELS } from "../lists/ImageModels.js";
import { imageModelForProvider, OPENROUTER_MAX_REFERENCES } from "./imageModelForProvider.js";

// Every model artcraft_router runs on OpenRouter, with its `max_reference_images`
// (crates/api_clients/artcraft/artcraft_router/src/generate/generate_image/providers/openrouter/models.rs).
// Update this when that table changes.
const ROUTER_OPENROUTER_MAX_REFERENCES: Record<string, number> = {
  nano_banana: 3,
  nano_banana_2: 14,
  nano_banana_pro: 14,
  gpt_image_1: 16,
  gpt_image_2: 16,
  gpt_image_2p5_flare: 16,
  gpt_image_2p5_sunburst: 16,
  seedream_4p5: 14,
  seedream_5_lite: 14,
  seedream_5p0_pro: 14,
};

// The router runs these on OpenRouter, but the desktop app has no model for them
// (crates/desktop/artcraft/.../generate_image/tauri_image_model.rs).
const NOT_IN_DESKTOP_APP = ["seedream_5p0_pro"];

const DESKTOP_OPENROUTER_MAX_REFERENCES = Object.fromEntries(
  Object.entries(ROUTER_OPENROUTER_MAX_REFERENCES).filter(([id]) => !NOT_IN_DESKTOP_APP.includes(id)),
);

it("matches the router's OpenRouter model table for the desktop app's models", () => {
  expect(OPENROUTER_MAX_REFERENCES).toEqual(DESKTOP_OPENROUTER_MAX_REFERENCES);
});

it("offers OpenRouter on exactly those models", () => {
  const offered = IMAGE_MODELS
    .filter((model) => model.getProviders().includes(GenerationProvider.OpenRouter))
    .map((model) => model.tauriId);
  expect(offered.sort()).toEqual(Object.keys(DESKTOP_OPENROUTER_MAX_REFERENCES).sort());
});

it("switches Midjourney capabilities without changing the ArtCraft catalog model", () => {
  const [model] = buildImageModelsFromListing([], [{
    model: "midjourney_8", batch_size_options: [1, 2, 4], batch_size_default: 1,
    image_refs_supported: true, image_refs_max: 4,
    resolution_options: ["two_k"], quality_options: ["high"],
  }]);
  const direct = imageModelForProvider(model, GenerationProvider.Midjourney)!;
  expect(direct.getProviders()).toEqual([GenerationProvider.Artcraft, GenerationProvider.Midjourney]);
  expect(direct.predefinedGenerationCounts).toEqual([4]);
  expect(direct.defaultGenerationCount).toBe(4);
  expect(direct.isValidGenerationCount(1)).toBe(false);
  expect(direct.canUseImagePrompt).toBe(false);
  expect(direct.supportsNewResolution()).toBe(false);
  expect(direct.supportsQuality()).toBe(false);
  expect(imageModelForProvider(model, GenerationProvider.Artcraft)).toBe(model);
  expect(model.canUseImagePrompt).toBe(true);
  expect(model.predefinedGenerationCounts).toEqual([1, 2, 4]);
});

it("caps references at what OpenRouter's version of the model takes", () => {
  const [nanoBanana, gptImage2] = buildImageModelsFromListing([], [
    { model: "nano_banana", image_refs_supported: true, image_refs_max: 6 },
    { model: "gpt_image_2", image_refs_supported: true, image_refs_max: 4 },
  ]);
  const viaOpenRouter = imageModelForProvider(nanoBanana, GenerationProvider.OpenRouter);
  expect(viaOpenRouter?.maxImagePromptCount).toBe(3);
  expect(viaOpenRouter?.canUseImagePrompt).toBe(true);
  expect(nanoBanana.maxImagePromptCount).toBe(6);
  expect(imageModelForProvider(gptImage2, GenerationProvider.OpenRouter)?.maxImagePromptCount).toBe(4);
});
