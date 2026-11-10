import { GenerationProvider } from "@storyteller/api-enums";
import { VideoModel } from "./VideoModel.js";
import { SizeIconOption, SizeOption } from "./metadata/SizeOption.js";
import { videoResolutionValue } from "./videoOptions.js";

interface WaveSpeedVideoCapabilities {
  durations: number[];
  defaultDuration: number;
  resolutions: string[];
  endFrame: boolean;
  imageRequired: boolean;
  audioToggle: boolean;
  wideRatios: boolean;
}

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, index) => start + index);
const KLING: WaveSpeedVideoCapabilities = {
  durations: [5, 10], defaultDuration: 5, resolutions: [],
  endFrame: false, imageRequired: false, audioToggle: false, wideRatios: false,
};
const SEEDANCE: WaveSpeedVideoCapabilities = {
  ...KLING, durations: range(4, 15), resolutions: ["480p", "720p", "1080p", "4K"],
  endFrame: true, audioToggle: true, wideRatios: true,
};
const SORA: WaveSpeedVideoCapabilities = {
  ...KLING, durations: [4, 8, 12, 16, 20], defaultDuration: 4, resolutions: ["720p"],
};
const VEO: WaveSpeedVideoCapabilities = {
  ...KLING, durations: [4, 6, 8], defaultDuration: 8, resolutions: ["720p", "1080p"], audioToggle: true,
};

export const WAVESPEED_VIDEO_MODELS: Readonly<Record<string, WaveSpeedVideoCapabilities>> = {
  kling_1p6_pro: { ...KLING, imageRequired: true, endFrame: true },
  kling_2p1_pro: { ...KLING, imageRequired: true },
  kling_2p1_master: KLING,
  kling_2p5_turbo_pro: { ...KLING, endFrame: true },
  kling_2p6_pro: { ...KLING, endFrame: true, audioToggle: true },
  kling_3p0_standard: { ...KLING, durations: range(3, 15), imageRequired: true, endFrame: true, audioToggle: true },
  kling_3p0_pro: { ...KLING, durations: range(3, 15), imageRequired: true, endFrame: true, audioToggle: true },
  seedance_1p0_lite: { ...SEEDANCE, durations: range(2, 12), resolutions: ["720p"], audioToggle: false },
  seedance_1p5_pro: { ...SEEDANCE, durations: range(4, 12), resolutions: ["480p", "720p", "1080p"] },
  seedance_2p0: SEEDANCE,
  seedance_2p0_fast: SEEDANCE,
  seedance_2p5: { ...SEEDANCE, durations: range(4, 30) },
  minimax_h3: { ...SEEDANCE, resolutions: ["2K"], audioToggle: false },
  sora_2: SORA,
  sora_2_pro: { ...SORA, resolutions: ["720p", "1080p"] },
  veo_3: VEO,
  veo_3_fast: VEO,
  veo_3p1: { ...VEO, endFrame: true, resolutions: ["720p", "1080p", "4K"] },
  veo_3p1_fast: { ...VEO, endFrame: true, resolutions: ["720p", "1080p", "4K"] },
};

export function videoModelForProvider(
  model: VideoModel | undefined,
  provider: GenerationProvider | undefined,
  hasEndFrame = false,
  resolution?: string,
): VideoModel | undefined {
  const capabilities = model && provider === GenerationProvider.WaveSpeed ? WAVESPEED_VIDEO_MODELS[model.tauriId] : undefined;
  if (!model || !capabilities) return model;
  const sizeOptions: SizeOption[] = [
    { textLabel: "16:9", tauriValue: "wide_sixteen_by_nine", icon: SizeIconOption.Landscape16x9 },
    { textLabel: "9:16", tauriValue: "tall_nine_by_sixteen", icon: SizeIconOption.Portrait9x16 },
  ];
  if (!model.tauriId.startsWith("sora") && !model.tauriId.startsWith("veo")) {
    sizeOptions.push({ textLabel: "1:1", tauriValue: "square", icon: SizeIconOption.Square });
  }
  if (capabilities.wideRatios) {
    sizeOptions.push(
      { textLabel: "4:3", tauriValue: "wide_four_by_three", icon: SizeIconOption.Standard4x3 },
      { textLabel: "3:4", tauriValue: "tall_three_by_four", icon: SizeIconOption.Portrait3x4 },
      { textLabel: "21:9", tauriValue: "wide_twenty_one_by_nine", icon: SizeIconOption.Landscape },
    );
  }
  return new VideoModel({
    ...model,
    providers: model.getProviders(),
    startFrame: true,
    endFrame: capabilities.endFrame,
    requiresImage: capabilities.imageRequired,
    textToVideoSupported: !capabilities.imageRequired,
    durationOptions: model.tauriId.startsWith("veo_") && ["ten_eighty_p", "four_k"].includes(videoResolutionValue(resolution ?? ""))
      ? [8] : capabilities.durations,
    defaultDuration: capabilities.defaultDuration,
    minDuration: undefined,
    maxDuration: undefined,
    maxDurationWithImageReferences: undefined,
    generateWithSound: capabilities.audioToggle && !(model.tauriId === "kling_2p6_pro" && hasEndFrame),
    generationCountOptions: [1],
    defaultGenerationCount: 1,
    resolutionOptions: capabilities.resolutions.length ? capabilities.resolutions : undefined,
    defaultResolution: capabilities.resolutions.includes("720p") ? "720p" : capabilities.resolutions[0],
    supportsReferenceMode: model.tauriId === "seedance_2p0",
    maxReferenceImages: model.tauriId === "seedance_2p0" ? 9 : 0,
    maxReferenceVideos: model.tauriId === "seedance_2p0" ? 3 : 0,
    maxReferenceAudios: model.tauriId === "seedance_2p0" ? 3 : 0,
    maxVideoRefDuration: model.tauriId === "seedance_2p0" ? 15 : 0,
    maxAudioRefDuration: model.tauriId === "seedance_2p0" ? 15 : 0,
    supportsSystemPrompt: false,
    bitrateOptions: [],
    defaultBitrate: undefined,
    outputFormatOptions: [],
    defaultOutputFormat: undefined,
    sizeOptions,
    supportsCommonAspectRatio: true,
    defaultAspectRatio: "wide_sixteen_by_nine",
    maxPromptLength: model.tauriId.startsWith("kling_") ? 2500 : model.tauriId === "minimax_h3" ? 7000 : model.tauriId === "seedance_1p0_lite" ? 2000 : model.maxPromptLength,
  });
}
