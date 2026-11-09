import { ImageModel } from "@storyteller/model-list";

export const generationCountForModel = (
  model: ImageModel | undefined,
  count: number,
): number => {
  if (!model || model.isValidGenerationCount(count)) {
    return count;
  }
  return model.defaultGenerationCount;
};
