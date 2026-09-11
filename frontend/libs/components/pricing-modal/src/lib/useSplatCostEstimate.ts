import { useEffect, useState } from "react";
import { ModelPage } from "@storyteller/ui-model-selector";
import { Model } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";
import {
  EstimateSplatCost,
  isEstimateSplatCostSuccess,
  type CommonSplatModel,
} from "@storyteller/tauri-api";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";

const SPLAT_PAGES = new Set<ModelPage>([ModelPage.ImageTo3DWorld]);

export function useSplatCostEstimate(
  activePage: ModelPage,
  selectedModel: Model | null | undefined,
  selectedProvider: string | null | undefined,
): { isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(false);
  const setEstimatedCreditsForPage = useCostBreakdownModalStore(
    (s) => s.setEstimatedCreditsForPage,
  );

  useEffect(() => {
    if (!SPLAT_PAGES.has(activePage) || !selectedModel) {
      setIsLoading(false);
      return;
    }

    const commonModel = selectedModel.tauriId as CommonSplatModel;
    if (!commonModel) {
      setEstimatedCreditsForPage(activePage, null);
      return;
    }

    const provider =
      (selectedProvider as GenerationProvider | null | undefined) ??
      GenerationProvider.Artcraft;

    let cancelled = false;
    setIsLoading(true);
    setEstimatedCreditsForPage(activePage, null);

    EstimateSplatCost({
      model: commonModel,
      provider,
      has_reference_image: true,
      reference_image_media_tokens: ["mf_estimate_reference"],
    })
      .then((result) => {
        if (cancelled) return;
        if (isEstimateSplatCostSuccess(result)) {
          setEstimatedCreditsForPage(
            activePage,
            result.payload.cost_in_credits ?? null,
          );
        } else {
          setEstimatedCreditsForPage(activePage, null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setEstimatedCreditsForPage(activePage, null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [activePage, selectedModel?.id, selectedProvider]);

  return { isLoading };
}
