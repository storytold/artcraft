// useState keeps the loading flag; useEffect runs the price request whenever the page, model or provider changes.
import { useEffect, useState } from "react";
// ModelPage names the app's eight pages; this hook only acts on ModelPage.ImageTo3DObject (the "Image to 3D Object" page).
import { ModelPage } from "@storyteller/ui-model-selector";
// Model is the base class every model extends (type-only import: no runtime code is pulled in).
import type { Model } from "@storyteller/model-list";
// GenerationProvider is the list of services that can run a generation; Artcraft is the default one.
import { GenerationProvider } from "@storyteller/api-enums";
// EstimateMeshCost asks the desktop (Tauri) side for a mesh price through the "estimate_mesh_cost_command" command.
import { EstimateMeshCost } from "@storyteller/tauri-api";
// The cost dialog's own store; this hook writes each finished quote into it.
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";

// Quote hook for the Image-to-3D-Object page. CostBreakdownModal calls it on every render of the dialog (even while the dialog is closed).
// It returns only { isLoading }; the price goes into the cost-breakdown store, keyed by page.
// Same shape as useVideoCostEstimate / useImageCostEstimate / useSplatCostEstimate, but the request here carries no page settings
// (only the model, the provider and a placeholder reference image), so the effect depends only on the page, the model and the provider.
export function useMeshCostEstimate(
  activePage: ModelPage,
  selectedModel: Model | null | undefined,
  selectedProvider: string | null | undefined,
): { isLoading: boolean } {
  // True from the moment a price request starts until it finishes (or is replaced by a newer one). Component-local, not in the store.
  const [isLoading, setIsLoading] = useState(false);
  // The store's write function (named setCredits here); it merges one page's quote into estimatedCreditsByPage.
  const setCredits = useCostBreakdownModalStore(
    (s) => s.setEstimatedCreditsForPage,
  );

  // Runs after render whenever the page, model, provider or setter changes.
  useEffect(() => {
    // Not the 3D-object page, or no model picked yet: nothing to price. Clear the spinner and stop.
    if (activePage !== ModelPage.ImageTo3DObject || !selectedModel) {
      setIsLoading(false);
      return;
    }
    // Stale-answer guard: the cleanup function at the bottom flips this to true when the inputs change again (or the hook unmounts),
    // so an older request that finishes late cannot overwrite the newer one's quote.
    let cancelled = false;
    // Show the spinner while the request is in flight.
    setIsLoading(true);
    // Blank the old quote straight away so the dialog never shows a price that belongs to a different model.
    setCredits(activePage, null);
    // Ask the desktop side for the price of one mesh. The reference image is a fixed PLACEHOLDER token ("mf_estimate_reference"),
    // not a real upload: the quote only needs to know that one reference image will be supplied.
    EstimateMeshCost({
      model: selectedModel.tauriId,
      provider:
        (selectedProvider as GenerationProvider) ?? GenerationProvider.Artcraft,
      reference_image_media_tokens: ["mf_estimate_reference"],
    })
      // Answer arrived. Unlike the video, image and splat hooks there is no isEstimate...Success check here: EstimateMeshCost is typed
      // as always returning a success shape (OmniCommandSuccess), and a failure reaches the .catch below as a rejected invoke instead.
      .then((result) => {
        // Inputs changed while we waited: a newer request owns the quote now, so drop this answer.
        if (!cancelled)
          // A missing price stays null (shown as a dash) instead of turning into 0.
          setCredits(activePage, result.payload.cost_in_credits ?? null);
      })
      // The command threw (the invoke call rejected): leave the quote empty. This hook shows no message of its own.
      .catch(() => {
        if (!cancelled) setCredits(activePage, null);
      })
      // Runs after either outcome: stop the spinner, unless a newer request has taken over (it manages the flag itself).
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    // Cleanup: runs before the next effect run and on unmount. It marks this request as stale.
    return () => {
      cancelled = true;
    };
  }, [activePage, selectedModel, selectedProvider, setCredits]);

  // Only the spinner flag leaves this hook; the price itself is in the store.
  return { isLoading };
}
