import { useEffect, useState } from "react";
import { ModelPage } from "@storyteller/ui-model-selector";
import type { Model } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";
import { EstimateMeshCost } from "@storyteller/tauri-api";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";

export function useMeshCostEstimate(
  activePage: ModelPage,
  selectedModel: Model | null | undefined,
  selectedProvider: string | null | undefined,
): { isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(false);
  const setCredits = useCostBreakdownModalStore(
    (s) => s.setEstimatedCreditsForPage,
  );

  useEffect(() => {
    if (activePage !== ModelPage.ImageTo3DObject || !selectedModel) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setCredits(activePage, null);
    EstimateMeshCost({
      model: selectedModel.tauriId,
      provider:
        (selectedProvider as GenerationProvider) ?? GenerationProvider.Artcraft,
      reference_image_media_tokens: ["mf_estimate_reference"],
    })
      .then((result) => {
        if (!cancelled)
          setCredits(activePage, result.payload.cost_in_credits ?? null);
      })
      .catch(() => {
        if (!cancelled) setCredits(activePage, null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activePage, selectedModel, selectedProvider, setCredits]);

  return { isLoading };
}
