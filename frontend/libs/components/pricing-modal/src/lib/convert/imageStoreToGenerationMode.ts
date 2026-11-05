// ImageGenerationMode is the type describing what kind of image job it is: plain text-to-image, or an edit of N reference images.
import { ImageGenerationMode } from "@storyteller/api-enums";
// RefImage is the shape of one reference image attached in a prompt box.
import { RefImage } from "@storyteller/ui-promptbox";

// Picks the image job type from the attached reference images: any images -> "image_edit" with their count, none -> "text_to_image".
// Not called anywhere in the app today: useImageCostEstimate builds the same two shapes inline (from a plain count, because it
// sends placeholder tokens). The function is only re-exported by ./index.
export function imageStoreToGenerationMode(
  referenceImages: RefImage[],
): ImageGenerationMode {
  // At least one reference image: it is an edit, and the request carries how many.
  if (referenceImages.length > 0) {
    return { type: "image_edit", count: referenceImages.length };
  }
  // No reference images: plain text-to-image.
  return { type: "text_to_image" };
}
