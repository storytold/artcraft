import { useEffect } from "react";
import { ModelPage } from "@storyteller/ui-model-selector";
import { Model } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";
import {
  EstimateSplatCost,
  isEstimateSplatCostSuccess,
  type CommonSplatModel,
} from "@storyteller/tauri-api";
import { useCostEstimateLifecycle } from "./useCostEstimateLifecycle";

const SPLAT_PAGES = new Set<ModelPage>([ModelPage.ImageTo3DWorld]);

export function useSplatCostEstimate(
  activePage: ModelPage,
  selectedModel: Model | null | undefined,
  selectedProvider: string | null | undefined,
): { isLoading: boolean } {
  const { isLoading, begin, clear } = useCostEstimateLifecycle();

  useEffect(() => {
    if (!SPLAT_PAGES.has(activePage) || !selectedModel) {
      clear(ModelPage.ImageTo3DWorld);
      return;
    }

    const commonModel = selectedModel.tauriId as CommonSplatModel;
    if (!commonModel) {
      clear(ModelPage.ImageTo3DWorld);
      return;
    }

    const provider =
      (selectedProvider as GenerationProvider | null | undefined) ??
      GenerationProvider.Artcraft;

    const request = begin(ModelPage.ImageTo3DWorld);
    void (async () => {
      try {
        const result = await EstimateSplatCost({
          model: commonModel,
          provider,
          has_reference_image: true,
        });
        request.settle(
          isEstimateSplatCostSuccess(result)
            ? (result.payload.cost_in_credits ?? null)
            : null,
        );
      } catch {
        request.settle(null);
      }
    })();

    return request.cancel;
  }, [activePage, selectedModel, selectedProvider, begin, clear]);

  return { isLoading };
}
