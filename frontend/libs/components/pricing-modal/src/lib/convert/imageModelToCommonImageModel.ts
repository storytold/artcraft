import { CommonImageModel } from "@storyteller/api-enums";

// TODO(bt): This shouldn't exist. We need to standardize types throughout the frontend.

export function imageModelToCommonImageModel(
  tauriId: string,
): CommonImageModel | null {
  switch (tauriId) {
    case "nano_banana_pro":
      return CommonImageModel.NanaBananaPro;
    default:
      return null;
  }
}
