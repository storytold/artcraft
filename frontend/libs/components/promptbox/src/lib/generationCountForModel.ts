import { ImageModel } from "@storyteller/model-list";

/** Preserve valid batch counts and replace unsupported saved counts with the selected model default. */
export const generationCountForModel = (
  model: ImageModel | undefined,
  count: number,
): number => {
  if (!model || model.isValidGenerationCount(count)) {
    return count;
  }
  return model.defaultGenerationCount;
};
