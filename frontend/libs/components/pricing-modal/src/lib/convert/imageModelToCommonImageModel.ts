// CommonImageModel is the list of image-model ids the desktop (Tauri) side understands.
import { CommonImageModel } from "@storyteller/api-enums";

// MIGRATION (2026-07): model `tauriId`s are now the storyteller-web omni
// identifiers, which are exactly the CommonImageModel values — so the common
// case is a direct pass-through. The switch below only remains to translate
// LEGACY tauri ids (old bookmarks/state); do not add new cases.

// Every id the enum knows, as a Set so the check below is a quick yes/no lookup. Built once, when the file is first loaded.
const COMMON_IMAGE_MODEL_VALUES: Set<string> = new Set(
  Object.values(CommonImageModel),
);

// Turns a model's Tauri id into the enum value, or null when it is unknown. Not called anywhere in the app today: useImageCostEstimate
// sends `selectedModel.tauriId` directly. The function is only re-exported by ./index.
export function imageModelToCommonImageModel(
  tauriId: string,
): CommonImageModel | null {
  // The normal case: the id already is an enum value, so hand it back unchanged.
  if (COMMON_IMAGE_MODEL_VALUES.has(tauriId)) {
    return tauriId as CommonImageModel;
  }

  // Not a current id: translate the two old spellings, and give null for anything else.
  switch (tauriId) {
    case "flux_pro_11":
      return CommonImageModel.FluxPro11;
    case "flux_pro_11_ultra":
      return CommonImageModel.FluxPro11Ultra;
    default:
      return null;
  }
}
