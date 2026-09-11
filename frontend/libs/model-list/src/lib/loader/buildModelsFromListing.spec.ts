// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import {
  buildImageModelsFromListing,
  buildVideoModelsFromListing,
} from "./buildModelsFromListing.js";
import {
  resolveVideoDuration,
  videoDurationRange,
  videoResolutionValue,
} from "../classes/videoOptions.js";
import { IMAGE_MODELS } from "../lists/ImageModels.js";
import { VIDEO_MODELS } from "../lists/VideoModels.js";
import { SPLAT_MODELS } from "../lists/SplatModels.js";

describe("desktop catalog", () => {
  it("offers enabled models without compiled overlay or provider entries", () => {
    const ids = [
      "seedance_2p5",
      "seedance_2p5_u",
      "seedance_2p5_preview",
      "seedance_2p0_mini",
      "flux_3",
      "minimax_h3",
      "vidu_q3",
      "future_video_v99",
    ];
    const models = buildVideoModelsFromListing(
      [],
      ids.map((model) => ({ model })),
    );
    expect(models.map((model) => model.tauriId)).toEqual(ids);
  });

  it("retains offered disabled entries and excludes the MiniMax admin variants", () => {
    const ids = ["sora_2", "minimax_h3_turbo", "minimax_h3_ultra"];
    const models = buildVideoModelsFromListing(
      [],
      ids.map((model) => ({ model, is_disabled: true })),
      ids,
    );
    expect(models.map((model) => model.tauriId)).toEqual(["sora_2"]);
  });

  it("preserves future image options and leaves editor eligibility unchanged", () => {
    const [model] = buildImageModelsFromListing(
      [],
      [
        {
          model: "seedream_5p0_pro",
          image_refs_supported: true,
          resolution_options: ["eight_k"],
          resolution_default: "eight_k",
          aspect_ratio_options: ["future_aspect"],
          quality_options: ["ultra"],
        },
      ],
    );
    expect(model.resolutions).toEqual(["eight_k"]);
    expect(model.aspectRatios).toEqual(["future_aspect"]);
    expect(model.qualityOptions).toEqual(["ultra"]);
    expect(model.canUseImagePrompt).toBe(true);
    expect(model.canEditImages).toBe(false);
  });

  it("routes the generic Grok overlays through ArtCraft", () => {
    for (const model of [...IMAGE_MODELS, ...VIDEO_MODELS].filter((model) =>
      model.tauriId.startsWith("grok_"),
    )) {
      expect(model.getProviders()).toEqual([GenerationProvider.Artcraft]);
    }
  });

  it("keeps Sora and Marble models available through ArtCraft after hydration", () => {
    const images = buildImageModelsFromListing(IMAGE_MODELS, [
      { model: "gpt_image_1", image_refs_supported: true },
    ]);
    const videos = buildVideoModelsFromListing(VIDEO_MODELS, [
      { model: "sora_2", duration_seconds_options: [4, 8, 12] },
    ]);
    expect(images.find((model) => model.tauriId === "gpt_image_1")?.getProviders())
      .toEqual([GenerationProvider.Artcraft]);
    expect(videos.find((model) => model.tauriId === "sora_2")?.getProviders())
      .toEqual([GenerationProvider.Artcraft]);
    expect(SPLAT_MODELS.map((model) => model.tauriId)).toEqual([
      "marble_0p1_mini", "marble_0p1_plus",
    ]);
    for (const model of [...images, ...videos, ...SPLAT_MODELS]) {
      expect(model.getProviders()).not.toContain(GenerationProvider.Sora);
      expect(model.getProviders()).not.toContain(GenerationProvider.WorldLabs);
    }
    for (const model of SPLAT_MODELS) {
      expect(model.getProviders()).toEqual([GenerationProvider.Artcraft]);
    }
  });
});

describe("API video options", () => {
  it("uses range durations, reference-mode caps, bitrate, and future resolutions", () => {
    const [model] = buildVideoModelsFromListing(
      [],
      [
        {
          model: "future_video",
          duration_seconds_min: 4,
          duration_seconds_max: 30,
          duration_seconds_max_with_image_references: 10,
          duration_seconds_default: 5,
          bitrate_options: ["normal", "high"],
          bitrate_default: "normal",
          resolution_options: ["four_k", "eight_k"],
        },
      ],
    );
    expect(videoDurationRange(model, false)).toEqual({ min: 4, max: 30 });
    expect(resolveVideoDuration(model, 30, false)).toBe(30);
    expect(resolveVideoDuration(model, 30, true)).toBe(10);
    expect(model.bitrateOptions).toEqual(["normal", "high"]);
    expect(model.resolutionOptions?.map(videoResolutionValue)).toEqual([
      "four_k",
      "eight_k",
    ]);
  });

  it("snaps sparse duration lists to the nearest option, preferring longer ties", () => {
    const [model] = buildVideoModelsFromListing(
      [],
      [{ model: "sparse", duration_seconds_options: [12, 4, 8] }],
    );
    expect(videoDurationRange(model, false)).toEqual({ min: 4, max: 12 });
    expect(resolveVideoDuration(model, 6, false)).toBe(8);
    expect(resolveVideoDuration(model, 30, false)).toBe(12);
  });
});
