// @vitest-environment jsdom
import { expect, it } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { buildImageModelsFromListing } from "../loader/buildModelsFromListing.js";
import { imageModelForProvider } from "./imageModelForProvider.js";
import { WAVESPEED_IMAGE_MODELS } from "./waveSpeedImageModels.js";
import { IMAGE_MODELS } from "../lists/ImageModels.js";
import { CommonResolution } from "./properties/CommonResolution.js";
import { CommonAspectRatio } from "./properties/CommonAspectRatio.js";

it.each(["gpt_image_2", "gpt_image_2p5_flare", "gpt_image_2p5_sunburst"])("exposes the documented WaveSpeed aspect ratios for %s", (id) => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === id)!;
  const direct = imageModelForProvider(model, GenerationProvider.WaveSpeed)!;
  expect(direct.aspectRatios.includes(CommonAspectRatio.TallNineByTwentyOne)).toBe(id !== "gpt_image_2");
  expect(direct.aspectRatios).toContain(CommonAspectRatio.WideTwentyOneByNine);
});

it.each([
  ["nano_banana_pro", CommonResolution.HalfK, CommonResolution.OneK],
  ["gpt_image_2", CommonResolution.ThreeK, CommonResolution.OneK],
  ["seedream_4", CommonResolution.OneK, CommonResolution.TwoK],
] as const)("resolves stale resolution settings when switching to WaveSpeed %s", (id, stale, fallback) => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === id)!;
  const direct = imageModelForProvider(model, GenerationProvider.WaveSpeed)!;
  expect(direct.resolveResolution(stale)).toBe(fallback);
  expect(direct.resolveResolution(CommonResolution.FourK)).toBe(CommonResolution.FourK);
  expect(direct.resolveResolution()).toBe(fallback);
});

it.each(["nano_banana", "seedream_4", "gpt_image_1p5", "flux_1_dev"])("reserves the Draw canvas reference for %s without changing other providers", (id) => {
  const model = IMAGE_MODELS.find((entry) => entry.tauriId === id)!;
  const direct = imageModelForProvider(model, GenerationProvider.WaveSpeed)!;
  const editor = imageModelForProvider(model, GenerationProvider.WaveSpeed, 1)!;
  expect(editor.maxImagePromptCount).toBe(direct.maxImagePromptCount - 1);
  expect(editor.canUseImagePrompt).toBe(editor.maxImagePromptCount > 0);
  expect(editor.isValidGenerationCount(2)).toBe(id === "flux_1_dev");
  expect(imageModelForProvider(model, GenerationProvider.Artcraft, 1)).toBe(model);
});

it.each(Object.keys(WAVESPEED_IMAGE_MODELS))("exposes %s with WaveSpeed's own image capabilities", (id) => {
  const [model] = buildImageModelsFromListing([], [{ model: id, image_refs_supported: true, image_refs_max: 50 }]);
  expect(model.getProviders()).toContain(GenerationProvider.WaveSpeed);
  const capabilities = WAVESPEED_IMAGE_MODELS[id];
  const direct = imageModelForProvider(model, GenerationProvider.WaveSpeed)!;
  expect(direct.maxGenerationCount).toBe(capabilities.maxImages);
  expect(direct.maxImagePromptCount).toBe(capabilities.maxReferences);
  expect(direct.qualityOptions).toEqual(capabilities.qualityOptions);
  expect(direct.resolutions).toEqual(capabilities.resolutions);
  expect(model.maxImagePromptCount).toBe(50);
  expect(IMAGE_MODELS.find((entry) => entry.tauriId === id)?.getProviders()).toContain(GenerationProvider.WaveSpeed);
});

it.each(["flux_1_dev", "flux_1_schnell"])("keeps WaveSpeed capabilities within %s limits after catalog hydration", (id) => {
  const [model] = buildImageModelsFromListing([], [{
    model: id, batch_size_max: 8, batch_size_options: [1, 4, 8], batch_size_default: 8,
    image_refs_supported: true, image_refs_max: 6,
    resolution_options: ["two_k"], quality_options: ["high"],
  }]);
  expect(model.getProviders()).toContain(GenerationProvider.WaveSpeed);
  const direct = imageModelForProvider(model, GenerationProvider.WaveSpeed)!;
  expect(direct.maxImagePromptCount).toBe(1);
  expect(direct.predefinedGenerationCounts).toEqual([1, 2, 3, 4]);
  expect(direct.defaultGenerationCount).toBe(4);
  expect(direct.isValidGenerationCount(8)).toBe(false);
  expect(direct.supportsNewResolution()).toBe(false);
  expect(direct.supportsQuality()).toBe(false);
  expect(imageModelForProvider(model, GenerationProvider.Artcraft)).toBe(model);
  expect(model.maxImagePromptCount).toBe(6);
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
