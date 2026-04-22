import { CommonImageModel } from "@storyteller/api-enums";

// TODO(bt): This shouldn't exist. We need to standardize types throughout the frontend.

export function imageModelToCommonImageModel(
  tauriId: string,
): CommonImageModel | null {
  switch (tauriId) {
    case "flux_1_dev":
      return CommonImageModel.Flux1Dev;
    case "flux_1_schnell":
      return CommonImageModel.Flux1Schnell;
    case "flux_pro_11":
      return CommonImageModel.FluxPro11;
    case "flux_pro_11_ultra":
      return CommonImageModel.FluxPro11Ultra;
    case "gpt_image_1":
      return CommonImageModel.GptImage1;
    case "gpt_image_1p5":
      return CommonImageModel.GptImage1p5;
    case "gpt_image_2":
      return CommonImageModel.GptImage2;
    case "nano_banana":
      return CommonImageModel.NanaBanana;
    case "nano_banana_2":
      return CommonImageModel.NanaBanana2;
    case "nano_banana_pro":
      return CommonImageModel.NanaBananaPro;
    case "seedream_4":
      return CommonImageModel.Seedream4;
    case "seedream_4p5":
      return CommonImageModel.Seedream4p5;
    case "seedream_5_lite":
      return CommonImageModel.Seedream5Lite;
    case "qwen_edit_2511_angles":
      return CommonImageModel.QwenEdit2511Angles;
    case "flux_2_lora_angles":
      return CommonImageModel.Flux2LoraAngles;
    default:
      return null;
  }
}
