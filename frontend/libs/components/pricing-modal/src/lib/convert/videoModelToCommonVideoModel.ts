import { CommonVideoModel } from "@storyteller/api-enums";

// MIGRATION (2026-07): model `tauriId`s are now the storyteller-web omni
// identifiers, which are exactly the CommonVideoModel values — so the common
// case is a direct pass-through. The switch below only remains to translate
// LEGACY tauri ids (old bookmarks/state); do not add new cases.

const COMMON_VIDEO_MODEL_VALUES: Set<string> = new Set(
  Object.values(CommonVideoModel),
);

export function videoModelToCommonVideoModel(
  tauriId: string,
): CommonVideoModel | null {
  if (COMMON_VIDEO_MODEL_VALUES.has(tauriId)) {
    return tauriId as CommonVideoModel;
  }

  switch (tauriId) {
    case "kling_1.6_pro":
      return CommonVideoModel.Kling16Pro;
    case "kling_2.1_pro":
      return CommonVideoModel.Kling21Pro;
    case "kling_2.1_master":
      return CommonVideoModel.Kling21Master;
    case "seedance_1.0_lite":
      return CommonVideoModel.Seedance10Lite;
    case "grok_imagine_video":
      // The frontend id for the generic Grok video experience; the (stale)
      // CommonVideoModel enum still spells it "grok_video".
      return CommonVideoModel.GrokVideo;
    default:
      return null;
  }
}
