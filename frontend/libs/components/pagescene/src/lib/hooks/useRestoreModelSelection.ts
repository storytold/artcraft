import { useEffect } from "react";
import {
  ModelPage,
  useClassyModelSelectorStore,
  type ModelList,
} from "@storyteller/ui-model-selector";

// Seeds the page's model selection (the remembered model, else the page
// default) for pickers that don't render ClassyModelSelector, which does this
// itself. Re-runs as the listing hydrates so a remembered backend-only model
// is selected once it appears; seeding never overwrites the remembered id.
export const useRestoreModelSelection = (
  page: ModelPage,
  items: ModelList,
  enabled: boolean,
) => {
  const selectedModel = useClassyModelSelectorStore((s) => s.selectedModels[page]);
  const rememberedModelId = useClassyModelSelectorStore((s) => s.selectedModelIds[page]);
  const restoreSelectedModel = useClassyModelSelectorStore((s) => s.restoreSelectedModel);
  useEffect(() => {
    if (!enabled) return;
    const models = items.map((i) => i.model).filter(
      (m): m is NonNullable<typeof m> => m !== undefined,
    );
    restoreSelectedModel(page, models);
  }, [enabled, items, page, selectedModel, rememberedModelId, restoreSelectedModel]);
};
