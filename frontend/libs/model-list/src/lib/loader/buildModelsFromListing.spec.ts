// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import {
  buildImageModelsFromListing,
  buildVideoModelsFromListing,
} from "./buildModelsFromListing.js";
import {
  resolveVideoDuration,
  resolveVideoGenerationCount,
  resolveVideoOutputFormat,
  videoGenerationCounts,
  videoDurationRange,
  videoResolutionValue,
} from "../classes/videoOptions.js";
import { IMAGE_MODELS } from "../lists/ImageModels.js";
import { CommonQuality } from "../classes/properties/CommonQuality.js";
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
      "wan_3p0",
      "wan_3p0_prime",
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
  it.each(["wan_3p0", "wan_3p0_prime"])("hydrates %s with Wan's reference and duration capabilities", (id) => {
    const [model] = buildVideoModelsFromListing([], [{
      model: id,
      model_creator: "alibaba",
      text_to_video_supported: true,
      text_prompt_max_length: 20000,
      starting_keyframe_supported: true,
      ending_keyframe_supported: true,
      image_references_supported: true,
      image_references_max: 10,
      video_references_max: 5,
      video_references_max_total_duration_seconds: 15,
      audio_references_max: 5,
      audio_references_max_total_duration_seconds: 15,
      show_generate_with_sound_toggle: true,
      resolution_options: ["four_eighty_p", "seven_twenty_p", "ten_eighty_p"],
      resolution_default: "seven_twenty_p",
      duration_seconds_min: 2,
      duration_seconds_max: 30,
      duration_seconds_default: 5,
      batch_size_options: [1],
      batch_size_default: 1,
    }]);
    expect(model.getProviders()).toEqual([GenerationProvider.Artcraft]);
    expect(model).toMatchObject({
      startFrame: true, endFrame: true, textToVideoSupported: true,
      supportsReferenceMode: true, maxReferenceImages: 10,
      maxReferenceVideos: 5, maxVideoRefDuration: 15,
      maxReferenceAudios: 5, maxAudioRefDuration: 15,
      generateWithSound: true, maxPromptLength: 20000,
      resolutionOptions: ["480p", "720p", "1080p"], defaultResolution: "720p",
    });
    expect(videoDurationRange(model, true)).toEqual({ min: 2, max: 30 });
    expect(resolveVideoDuration(model, null, false)).toBe(5);
    expect(videoGenerationCounts(model)).toEqual([1]);
    expect(resolveVideoGenerationCount(model, 4)).toBe(1);
  });

  it.each(["seedance_2p5", "seedance_2p5_u"])("preserves %s output formats and batch choices", (id) => {
    const [model] = buildVideoModelsFromListing([], [{
      model: id,
      output_format_options: ["mp4", "mov", "future_format"],
      output_format_default: "mp4",
      batch_size_options: [1, 2, 3, 4],
      batch_size_default: 1,
    }]);
    expect(model.outputFormatOptions).toEqual(["mp4", "mov", "future_format"]);
    expect(model.defaultOutputFormat).toBe("mp4");
    expect(resolveVideoOutputFormat(model, "mov")).toBe("mov");
    expect(resolveVideoOutputFormat(model, "unsupported")).toBe("mp4");
    expect(videoGenerationCounts(model)).toEqual([1, 2, 3, 4]);
    expect(resolveVideoGenerationCount(model, 3)).toBe(3);
    expect(resolveVideoGenerationCount(model, 5)).toBe(1);
  });

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

it.each(["gpt_image_2p5_flare", "gpt_image_2p5_sunburst"])("preserves every %s quality and resolution option", (id) => {
  const qualities = ["auto", "max", "xhigh", "high", "medium", "low"];
  const resolutions = ["one_k", "two_k", "three_k", "four_k"];
  const model = buildImageModelsFromListing(IMAGE_MODELS, [{
    model: id,
    quality_options: qualities,
    default_quality: "high",
    resolution_options: resolutions,
    resolution_default: "one_k",
    image_refs_supported: true,
  }]).find((m) => m.tauriId === id)!;
  expect(model.qualityOptions).toEqual(qualities);
  expect(model.defaultQuality).toBe("high");
  expect(model.resolutions).toEqual(resolutions);
  expect(model.defaultResolution).toBe("one_k");
  expect(model.canEditImages).toBe(true);
  expect(model.resolveQuality(CommonQuality.Max)).toBe("max");
  expect(model.resolveQuality(CommonQuality.Auto)).toBe("auto");
});

it("uses the new model's default when a saved quality tier is unsupported", () => {
  const [model] = buildImageModelsFromListing([], [{
    model: "gpt_image_2",
    quality_options: ["high", "medium", "low"],
    default_quality: "high",
  }]);
  expect(model.resolveQuality(CommonQuality.Max)).toBe("high");
  expect(model.resolveQuality(CommonQuality.XHigh)).toBe("high");
  expect(model.resolveQuality(CommonQuality.Low)).toBe("low");
});

it("offers ArtCraft and direct Midjourney only for supported Midjourney models", () => {
  const models = buildImageModelsFromListing([], [
    { model: "midjourney_7" }, { model: "midjourney_7_niji" },
    { model: "midjourney_8" }, { model: "future_image" },
  ]);
  for (const model of models.slice(0, 3)) {
    expect(model.getProviders()).toEqual([GenerationProvider.Artcraft, GenerationProvider.Midjourney]);
  }
  expect(models[3].getProviders()).toEqual([GenerationProvider.Artcraft]);
});
