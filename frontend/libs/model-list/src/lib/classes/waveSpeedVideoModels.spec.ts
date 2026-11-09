// @vitest-environment jsdom
import { expect, it } from "vitest";
import { GenerationProvider } from "@storyteller/api-enums";
import { buildVideoModelsFromListing } from "../loader/buildModelsFromListing.js";
import { VIDEO_MODELS } from "../lists/VideoModels.js";
import { resolveVideoDuration, resolveVideoGenerationCount } from "./videoOptions.js";
import { videoModelForProvider, WAVESPEED_VIDEO_MODELS } from "./waveSpeedVideoModels.js";

it.each(["veo_3", "veo_3_fast", "veo_3p1", "veo_3p1_fast"])("limits %s to eight seconds at high WaveSpeed resolutions", (id) => {
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === id)!;
  for (const resolution of ["1080p", "4K", "ten_eighty_p", "four_k"]) {
    const direct = videoModelForProvider(model, GenerationProvider.WaveSpeed, false, resolution)!;
    expect(direct.durationOptions).toEqual([8]);
    expect(resolveVideoDuration(direct, 6, false)).toBe(8);
  }
  expect(videoModelForProvider(model, GenerationProvider.WaveSpeed, false, "720p")?.durationOptions).toEqual([4, 6, 8]);
  expect(videoModelForProvider(model, GenerationProvider.Artcraft, false, "1080p")).toBe(model);
});

it("disables WaveSpeed Kling 2.6 sound controls only while an ending frame is selected", () => {
  const model = VIDEO_MODELS.find((entry) => entry.tauriId === "kling_2p6_pro")!;
  expect(videoModelForProvider(model, GenerationProvider.WaveSpeed)?.generateWithSound).toBe(true);
  expect(videoModelForProvider(model, GenerationProvider.WaveSpeed, true)?.generateWithSound).toBe(false);
  expect(videoModelForProvider(model, GenerationProvider.Artcraft, true)).toBe(model);
  const seedance = VIDEO_MODELS.find((entry) => entry.tauriId === "seedance_2p0")!;
  expect(videoModelForProvider(seedance, GenerationProvider.WaveSpeed, true)?.generateWithSound).toBe(true);
});

it.each(Object.keys(WAVESPEED_VIDEO_MODELS))("keeps %s selectable and applies WaveSpeed capabilities after hydration", (id) => {
  const [model] = buildVideoModelsFromListing([], [{
    model: id, duration_seconds_max: 100, duration_seconds_default: 90,
    duration_seconds_options: [30, 90], batch_size_options: [1, 4], batch_size_default: 4,
    resolution_options: ["eight_k"], image_references_supported: true,
    image_references_max: 50, video_references_max: 10, bitrate_options: ["high"],
  }]);
  expect(model.getProviders()).toContain(GenerationProvider.WaveSpeed);
  const direct = videoModelForProvider(model, GenerationProvider.WaveSpeed)!;
  const caps = WAVESPEED_VIDEO_MODELS[id];
  expect(direct.durationOptions).toEqual(caps.durations);
  expect(resolveVideoDuration(direct, 90, false)).toBeLessThanOrEqual(Math.max(...caps.durations));
  expect(resolveVideoGenerationCount(direct, 4)).toBe(1);
  expect(direct.resolutionOptions).toEqual(caps.resolutions);
  expect(direct.endFrame).toBe(caps.endFrame);
  expect(direct.requiresImage).toBe(caps.imageRequired);
  expect(direct.supportsReferenceMode).toBe(id === "seedance_2p0");
  expect(direct.bitrateOptions).toEqual([]);
  expect(videoModelForProvider(model, GenerationProvider.Artcraft)).toBe(model);
  expect(model.maxReferenceImages).toBe(50);
});

it("includes MiniMax H3 and Seedance 2.5 before a backend catalog loads", () => {
  const h3 = VIDEO_MODELS.find((model) => model.tauriId === "minimax_h3")!;
  const seedance = VIDEO_MODELS.find((model) => model.tauriId === "seedance_2p5")!;
  expect(h3.getProviders()).toContain(GenerationProvider.WaveSpeed);
  expect(seedance.getProviders()).toContain(GenerationProvider.WaveSpeed);
  expect(videoModelForProvider(h3, GenerationProvider.WaveSpeed)?.resolutionOptions).toEqual(["2K"]);
  expect(videoModelForProvider(seedance, GenerationProvider.WaveSpeed)?.durationOptions).toContain(30);
});
