import { ImageGenerationMode } from "@storyteller/api-enums";
import { RefImage } from "@storyteller/ui-promptbox";

export function imageStoreToGenerationMode(
  referenceImages: RefImage[],
): ImageGenerationMode {
  if (referenceImages.length > 0) {
    return { type: "image_edit", count: referenceImages.length };
  }
  return { type: "text_to_image" };
}
