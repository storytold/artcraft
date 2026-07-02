import { CommonImageModel } from "@storyteller/api-enums";

// MIGRATION (2026-07): model `tauriId`s are now the storyteller-web omni
// identifiers, which are exactly the CommonImageModel values — so the common
// case is a direct pass-through. The switch below only remains to translate
// LEGACY tauri ids (old bookmarks/state); do not add new cases.

const COMMON_IMAGE_MODEL_VALUES: Set<string> = new Set(
  Object.values(CommonImageModel),
);

export function imageModelToCommonImageModel(
  tauriId: string,
): CommonImageModel | null {
  if (COMMON_IMAGE_MODEL_VALUES.has(tauriId)) {
    return tauriId as CommonImageModel;
  }

  switch (tauriId) {
    case "flux_pro_11":
      return CommonImageModel.FluxPro11;
    case "flux_pro_11_ultra":
      return CommonImageModel.FluxPro11Ultra;
    default:
      return null;
  }
}
