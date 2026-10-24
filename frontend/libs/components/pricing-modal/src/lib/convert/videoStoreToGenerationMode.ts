// GenerationMode is the type describing what kind of video job it is (text only, start frame, start and end frame, or reference images).
import { GenerationMode } from "@storyteller/api-enums";
// VideoInputMode is the prompt box's input choice ("keyframe", "reference", ...); RefImage is the shape of one attached image.
import { VideoInputMode, RefImage } from "@storyteller/ui-promptbox";

// Picks the video job type from what is attached in the prompt box. Only caller: useVideoCostEstimate. The price request uses this so the
// quote is for the right kind of job; whether it matches the mode the real Generate call ends up using was not compared.
export function videoStoreToGenerationMode(
  inputMode: VideoInputMode,
  referenceImages: RefImage[],
  endFrameImage: RefImage | undefined,
  supportsReferenceMode: boolean | undefined,
): GenerationMode {
  // Reference mode counts only when the chosen model supports it; the request carries how many reference images there are.
  if (inputMode === "reference" && supportsReferenceMode) {
    return {
      type: "reference_image_to_video",
      count: referenceImages.length,
    };
  }
  // Keyframe mode: the job depends on which frames are attached.
  if (inputMode === "keyframe") {
    // A start image and an end image: animate between the two.
    if (referenceImages.length > 0 && endFrameImage) {
      return { type: "start_and_end_frame_to_video" };
    }
    // A start image only.
    if (referenceImages.length > 0) {
      return { type: "start_frame_to_video" };
    }
  }
  // Everything else (no images in keyframe mode, reference mode on a model without it, any other input mode): text-to-video.
  return { type: "text_to_video" };
}
