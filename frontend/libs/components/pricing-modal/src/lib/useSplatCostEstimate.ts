// useState keeps the loading flag; useEffect runs the price request whenever the page, model or provider changes.
import { useEffect, useState } from "react";
// ModelPage names the app's eight pages; this hook only acts on the pages listed in SPLAT_PAGES below.
import { ModelPage } from "@storyteller/ui-model-selector";
// Model is the base class every model extends.
import { Model } from "@storyteller/model-list";
// GenerationProvider is the list of services that can run a generation; Artcraft is the default one.
import { GenerationProvider } from "@storyteller/api-enums";
// EstimateSplatCost asks the desktop (Tauri) side for a splat ("world") price; isEstimateSplatCostSuccess is a type guard that tells a
// priced answer apart from an error answer; CommonSplatModel is the type of the model id the command expects (type-only import).
import {
  EstimateSplatCost,
  isEstimateSplatCostSuccess,
  type CommonSplatModel,
} from "@storyteller/tauri-api";
// The cost dialog's own store; this hook writes each finished quote into it.
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";

// The pages this hook prices: just Image-to-3D-World (the splat / "world" page). A Set so the effect can ask `.has(activePage)`.
const SPLAT_PAGES = new Set<ModelPage>([ModelPage.ImageTo3DWorld]);

// Quote hook for the Image-to-3D-World page. CostBreakdownModal calls it on every render of the dialog (even while the dialog is closed).
// It returns only { isLoading }; the price goes into the cost-breakdown store, keyed by page.
// Like the mesh hook, the request carries no page settings (only the model, the provider and a placeholder reference image),
// so the effect depends only on the page, the model and the provider.
export function useSplatCostEstimate(
  activePage: ModelPage,
  selectedModel: Model | null | undefined,
  selectedProvider: string | null | undefined,
): { isLoading: boolean } {
  // True from the moment a price request starts until it finishes (or is replaced by a newer one). Component-local, not in the store.
  const [isLoading, setIsLoading] = useState(false);
  // The store's write function; it merges one page's quote into estimatedCreditsByPage.
  const setEstimatedCreditsForPage = useCostBreakdownModalStore(
    (s) => s.setEstimatedCreditsForPage,
  );

  // Runs after render whenever the page, the model's id or the provider changes (see the dependency list at the bottom).
  useEffect(() => {
    // Not a splat page, or no model picked yet: nothing to price. Clear the spinner and stop.
    if (!SPLAT_PAGES.has(activePage) || !selectedModel) {
      setIsLoading(false);
      return;
    }

    // The model's id for the desktop command, cast to the command's model type.
    const commonModel = selectedModel.tauriId as CommonSplatModel;
    // A model without a desktop id cannot be priced: leave the quote empty and stop.
    if (!commonModel) {
      setEstimatedCreditsForPage(activePage, null);
      // WHY: the previous run's cleanup set cancelled, so its finally() will
      // never clear the spinner; without this it stays stuck when the user
      // switches from a priced model to one without a tauriId mid-request.
      setIsLoading(false);
      return;
    }

    // The service that will run the job; Artcraft when none is chosen.
    const provider =
      (selectedProvider as GenerationProvider | null | undefined) ??
      GenerationProvider.Artcraft;

    // Stale-answer guard: the cleanup function at the bottom flips this to true when the inputs change again (or the hook unmounts),
    // so an older request that finishes late cannot overwrite the newer one's quote.
    let cancelled = false;
    // Show the spinner while the request is in flight.
    setIsLoading(true);
    // Blank the old quote straight away so the dialog never shows a price that belongs to a different model.
    setEstimatedCreditsForPage(activePage, null);

    // Ask the desktop side for the price. The reference image is a fixed PLACEHOLDER token ("mf_estimate_reference"), not a real upload:
    // the quote only needs to know that one reference image will be supplied (has_reference_image: true).
    EstimateSplatCost({
      model: commonModel,
      provider,
      has_reference_image: true,
      reference_image_media_tokens: ["mf_estimate_reference"],
    })
      // Answer arrived (the command itself did not throw).
      .then((result) => {
        // Inputs changed while we waited: a newer request owns the quote now, so drop this answer.
        if (cancelled) return;
        // A priced answer: store it. A missing price stays null (shown as a dash) instead of turning into 0.
        if (isEstimateSplatCostSuccess(result)) {
          setEstimatedCreditsForPage(
            activePage,
            result.payload.cost_in_credits ?? null,
          );
        } else {
          // An error-shaped answer: leave the quote empty.
          setEstimatedCreditsForPage(activePage, null);
        }
      })
      // The command threw (the invoke call rejected): same outcome, an empty quote. This hook shows no message of its own.
      .catch(() => {
        if (cancelled) return;
        setEstimatedCreditsForPage(activePage, null);
      })
      // Runs after either outcome: stop the spinner, unless a newer request has taken over (it manages the flag itself).
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    // Cleanup: runs before the next effect run and on unmount. It marks this request as stale.
    return () => { cancelled = true; };
    // The list watches selectedModel?.id instead of the whole model object, so only a change of model id (not a new object for the same model) re-prices.
    // setEstimatedCreditsForPage is not in this list (the mesh hook does list its copy of the same setter).
  }, [activePage, selectedModel?.id, selectedProvider]);

  // Only the spinner flag leaves this hook; the price itself is in the store.
  return { isLoading };
}
