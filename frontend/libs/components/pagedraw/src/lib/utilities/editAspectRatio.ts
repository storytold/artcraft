import {
  matchSourceAspectRatio,
  type ImageModel,
} from "@storyteller/model-list";
import type { PageDrawEditRequest } from "../adapter";

/**
 * The aspect ratio fields of an edit request for the value picked in the
 * prompt box.
 *
 * "auto" means keep the base image's aspect ratio. Only the model's own
 * options can express that, so it is resolved here, where the base image size
 * is known, instead of being sent as the word "auto".
 */
export function editAspectRatioFields(
  picked: string | undefined,
  model: ImageModel | undefined,
  baseImage: { width: number; height: number },
): Pick<PageDrawEditRequest, "aspectRatio" | "commonAspectRatio"> {
  if (picked !== "auto") return { aspectRatio: picked };

  return {
    commonAspectRatio: matchSourceAspectRatio(
      model,
      baseImage.width,
      baseImage.height,
    ),
  };
}
