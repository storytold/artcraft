import { CommonVideoModel } from "@storyteller/api-enums";

// TODO(bt): This shouldn't exist. We need to standardize types throughout the frontend.

export function videoModelToCommonVideoModel(
  tauriId: string,
): CommonVideoModel | null {
  switch (tauriId) {
    case "grok_video":
      return CommonVideoModel.GrokVideo;
    case "kling_1.6_pro":
      return CommonVideoModel.Kling16Pro;
    case "kling_2.1_pro":
      return CommonVideoModel.Kling21Pro;
    case "kling_2.1_master":
      return CommonVideoModel.Kling21Master;
    case "kling_2p5_turbo_pro":
      return CommonVideoModel.Kling2p5TurboPro;
    case "kling_2p6_pro":
      return CommonVideoModel.Kling2p6Pro;
    case "seedance_1.0_lite":
      return CommonVideoModel.Seedance10Lite;
    case "seedance_2p0":
      return CommonVideoModel.Seedance2p0;
    case "sora_2":
      return CommonVideoModel.Sora2;
    case "sora_2_pro":
      return CommonVideoModel.Sora2Pro;
    case "veo_2":
      return CommonVideoModel.Veo2;
    case "veo_3":
      return CommonVideoModel.Veo3;
    case "veo_3_fast":
      return CommonVideoModel.Veo3Fast;
    case "veo_3p1":
      return CommonVideoModel.Veo3p1;
    case "veo_3p1_fast":
      return CommonVideoModel.Veo3p1Fast;
    default:
      return null;
  }
}
