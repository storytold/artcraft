import { GenerationMode } from "@storyteller/api-enums";
import { VideoInputMode, RefImage } from "@storyteller/ui-promptbox";

export function videoStoreToGenerationMode(
  inputMode: VideoInputMode,
  referenceImages: RefImage[],
  endFrameImage: RefImage | undefined,
  supportsReferenceMode: boolean | undefined,
): GenerationMode {
  if (inputMode === "reference" && supportsReferenceMode) {
    return {
      type: "reference_image_to_video",
      count: referenceImages.length,
    };
  }
  if (inputMode === "keyframe") {
    if (referenceImages.length > 0 && endFrameImage) {
      return { type: "start_and_end_frame_to_video" };
    }
    if (referenceImages.length > 0) {
      return { type: "start_frame_to_video" };
    }
  }
  return { type: "text_to_video" };
}
