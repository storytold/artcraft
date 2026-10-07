// @vitest-environment jsdom
import { expect, it } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { buildImageModelsFromListing } from "../loader/buildModelsFromListing.js";
import { imageModelForProvider } from "./imageModelForProvider.js";

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

it("offers BytePlus for Seedream with ModelArk's input limits", () => {
  const [lite, pro] = buildImageModelsFromListing([], [
    { model: "seedream_5_lite", batch_size_options: [1, 2], image_refs_supported: true, image_refs_max: 6 },
    { model: "seedream_5p0_pro", batch_size_options: [1, 2], image_refs_supported: true, image_refs_max: 6 },
  ]);
  expect(lite.getProviders()).toEqual([GenerationProvider.Artcraft, GenerationProvider.Byteplus]);

  const directLite = imageModelForProvider(lite, GenerationProvider.Byteplus)!;
  expect(directLite.maxImagePromptCount).toBe(14);
  expect(directLite.isValidGenerationCount(4)).toBe(true);
  expect(imageModelForProvider(pro, GenerationProvider.Byteplus)!.maxImagePromptCount).toBe(10);

  expect(imageModelForProvider(lite, GenerationProvider.Artcraft)).toBe(lite);
  expect(lite.maxImagePromptCount).toBe(6);
});
