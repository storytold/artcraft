import { CommonAspectRatio } from "./properties/CommonAspectRatio.js";
import { CommonResolution } from "./properties/CommonResolution.js";
import { CommonQuality } from "./properties/CommonQuality.js";

interface WaveSpeedImageCapabilities {
  maxImages: number;
  maxReferences: number;
  resolutions: CommonResolution[];
  qualityOptions: CommonQuality[];
  aspectRatios: CommonAspectRatio[];
}

const BASIC_RATIOS = [
  CommonAspectRatio.Square, CommonAspectRatio.WideFourByThree,
  CommonAspectRatio.WideSixteenByNine, CommonAspectRatio.TallThreeByFour,
  CommonAspectRatio.TallNineBySixteen,
];
const EXTENDED_RATIOS = [
  ...BASIC_RATIOS, CommonAspectRatio.WideThreeByTwo, CommonAspectRatio.TallTwoByThree,
  CommonAspectRatio.WideFiveByFour, CommonAspectRatio.TallFourByFive,
  CommonAspectRatio.WideTwentyOneByNine,
];
const RESOLUTIONS = [CommonResolution.OneK, CommonResolution.TwoK, CommonResolution.FourK];
const QUALITY = [CommonQuality.Low, CommonQuality.Medium, CommonQuality.High];
const BASE: WaveSpeedImageCapabilities = {
  maxImages: 1, maxReferences: 0, resolutions: [], qualityOptions: [], aspectRatios: BASIC_RATIOS,
};

export const WAVESPEED_IMAGE_MODELS: Readonly<Record<string, WaveSpeedImageCapabilities>> = {
  flux_1_dev: { ...BASE, maxImages: 4, maxReferences: 1 },
  flux_1_schnell: { ...BASE, maxImages: 4, maxReferences: 1 },
  flux_pro_1p1: BASE,
  flux_pro_1p1_ultra: BASE,
  nano_banana: { ...BASE, maxReferences: 10, aspectRatios: EXTENDED_RATIOS },
  nano_banana_2: { ...BASE, maxReferences: 14, aspectRatios: EXTENDED_RATIOS, resolutions: [CommonResolution.HalfK, ...RESOLUTIONS] },
  nano_banana_pro: { ...BASE, maxReferences: 14, aspectRatios: EXTENDED_RATIOS, resolutions: RESOLUTIONS },
  seedream_4: { ...BASE, maxReferences: 10, aspectRatios: EXTENDED_RATIOS, resolutions: [CommonResolution.TwoK, CommonResolution.ThreeK, CommonResolution.FourK] },
  seedream_4p5: { ...BASE, maxReferences: 10, aspectRatios: EXTENDED_RATIOS, resolutions: [CommonResolution.TwoK, CommonResolution.ThreeK, CommonResolution.FourK] },
  seedream_5_lite: { ...BASE, maxReferences: 10, aspectRatios: EXTENDED_RATIOS, resolutions: [CommonResolution.TwoK, CommonResolution.ThreeK, CommonResolution.FourK] },
  gpt_image_1p5: { ...BASE, maxReferences: 10, qualityOptions: QUALITY, aspectRatios: [CommonAspectRatio.Square, CommonAspectRatio.WideThreeByTwo, CommonAspectRatio.TallTwoByThree] },
  gpt_image_2: { ...BASE, maxReferences: 16, resolutions: RESOLUTIONS, qualityOptions: QUALITY, aspectRatios: EXTENDED_RATIOS },
  gpt_image_2p5_flare: { ...BASE, maxReferences: 16, resolutions: RESOLUTIONS, qualityOptions: [...QUALITY, CommonQuality.XHigh, CommonQuality.Max], aspectRatios: [...EXTENDED_RATIOS, CommonAspectRatio.TallNineByTwentyOne] },
  gpt_image_2p5_sunburst: { ...BASE, maxReferences: 16, resolutions: RESOLUTIONS, qualityOptions: [...QUALITY, CommonQuality.XHigh, CommonQuality.Max], aspectRatios: [...EXTENDED_RATIOS, CommonAspectRatio.TallNineByTwentyOne] },
};
