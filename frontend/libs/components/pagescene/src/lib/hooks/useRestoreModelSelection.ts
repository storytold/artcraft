import { useEffect } from "react";
import {
  ModelPage,
  useClassyModelSelectorStore,
  type ModelList,
} from "@storyteller/ui-model-selector";

export const useRestoreModelSelection = (
  page: ModelPage,
  items: ModelList,
  enabled: boolean,
) => {
  const selectedModel = useClassyModelSelectorStore((state) => state.selectedModels[page]);
  const rememberedModelId = useClassyModelSelectorStore((state) => state.selectedModelIds[page]);
  const restoreSelectedModel = useClassyModelSelectorStore((state) => state.restoreSelectedModel);
  useEffect(() => {
    if (!enabled) return;
    const models = items.map((item) => item.model).filter(
      (model): model is NonNullable<typeof model> => model !== undefined,
    );
    restoreSelectedModel(page, models);
  }, [enabled, items, page, selectedModel, rememberedModelId, restoreSelectedModel]);
};
