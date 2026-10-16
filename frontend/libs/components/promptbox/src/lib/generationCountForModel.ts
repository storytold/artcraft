import { ImageModel } from "@storyteller/model-list";

// The count to generate with: the remembered one when the model supports it,
// otherwise the model's default. While the model is still resolving the
// remembered count is kept, so it isn't reset before it can be checked.
export const generationCountForModel = (
  model: ImageModel | undefined,
  count: number,
): number => {
  if (!model || model.isValidGenerationCount(count)) {
    return count;
  }
  return model.defaultGenerationCount;
};
