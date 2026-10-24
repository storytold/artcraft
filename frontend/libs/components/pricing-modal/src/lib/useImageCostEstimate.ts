// React's two basic hooks: useState keeps the loading flag, useEffect runs the price request whenever an input changes.
import { useEffect, useState } from "react";
// ModelPage is the enum naming the app's eight pages; this hook only acts on the five pages listed in IMAGE_PAGES below.
import { ModelPage } from "@storyteller/ui-model-selector";
// Model is the base class every model extends; ImageModel is the image-specific subclass this hook casts to.
import { Model, ImageModel } from "@storyteller/model-list";
// GenerationProvider is the list of services that can run a generation; Artcraft is the default one.
import { GenerationProvider } from "@storyteller/api-enums";
// The settings stores of the four prompt boxes this hook reads (it never writes to them):
// usePromptImageStore = Text to Image, usePrompt2DStore = Canvas 2D, usePrompt3DStore = Stage 3D, usePromptEditStore = Image Editor.
import {
  usePromptImageStore,
  usePrompt2DStore,
  usePrompt3DStore,
  usePromptEditStore,
} from "@storyteller/ui-promptbox";
// EstimateImageCost asks the desktop (Tauri) side for a price through the "estimate_image_cost_command" command.
// isEstimateImageCostSuccess is a type guard that tells a priced answer apart from an error answer.
import {
  EstimateImageCost,
  isEstimateImageCostSuccess,
} from "@storyteller/tauri-api";
// The cost dialog's own store; this hook writes each finished quote into it.
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";
// Converters (in ./convert): page settings text -> the API's aspect-ratio, quality and resolution values.
import {
  imageAspectRatioToCommonAspectRatio,
  stringToCommonQuality,
  stringToCommonVideoResolution,
} from "./convert/index.js";

// The pages this hook prices. A Set so the effect can ask `.has(activePage)`; the other three pages are handled by the video, mesh and splat hooks.
const IMAGE_PAGES = new Set<ModelPage>([
  ModelPage.TextToImage,
  ModelPage.Canvas2D,
  ModelPage.Stage3D,
  ModelPage.ImageEditor,
  ModelPage.Angles,
]);

// Quote hook for the five image pages. CostBreakdownModal calls it on every render of the dialog (even while the dialog is closed).
// It returns only { isLoading }; the price goes into the cost-breakdown store, keyed by the active page.
export function useImageCostEstimate(
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

  // TextToImage store
  // The next five reads subscribe to the Text to Image page's settings. Each is also in the dependency list at the bottom.
  // Aspect ratio chosen on the Text to Image page (new-style value).
  const imageAspectRatio = usePromptImageStore((s) => s.commonAspectRatio);
  // Resolution chosen on that page (new-style value).
  const imageResolution = usePromptImageStore((s) => s.commonResolution);
  // The reference images attached on that page.
  const imageReferenceImages = usePromptImageStore((s) => s.referenceImages);
  // How many images one press of Generate makes.
  const imageGenerationCount = usePromptImageStore((s) => s.generationCount);
  // Quality choice, for models that have one.
  const imageQuality = usePromptImageStore((s) => s.commonQuality);

  // Canvas2D store
  // Canvas 2D page: aspect ratio, resolution, reference images and image count (legacy-style values).
  const prompt2DAspectRatio = usePrompt2DStore((s) => s.aspectRatio);
  const prompt2DResolution = usePrompt2DStore((s) => s.resolution);
  const prompt2DReferenceImages = usePrompt2DStore((s) => s.referenceImages);
  const prompt2DGenerationCount = usePrompt2DStore((s) => s.generationCount);

  // Stage3D store
  // Stage 3D page: only resolution and reference images feed the quote (its result count is fixed at 1 in the effect below).
  const prompt3DResolution = usePrompt3DStore((s) => s.resolution);
  const prompt3DReferenceImages = usePrompt3DStore((s) => s.referenceImages);

  // ImageEditor store
  // Image Editor page: aspect ratio, resolution and reference images (its result count is also fixed at 1 in the effect below).
  const editAspectRatio = usePromptEditStore((s) => s.aspectRatio);
  const editResolution = usePromptEditStore((s) => s.resolution);
  const editReferenceImages = usePromptEditStore((s) => s.referenceImages);
  // The Angles page has no store read here: its quote uses fixed values (one reference image, one result).

  // Runs after render whenever the page, model, provider or any setting listed at the bottom changes.
  useEffect(() => {
    // Not one of the five image pages, or no model picked yet: nothing to price. Clear the spinner and stop.
    if (!IMAGE_PAGES.has(activePage) || !selectedModel) {
      setIsLoading(false);
      return;
    }

    // The page guard above means this model is an image model, so the cast to ImageModel is how the image-only fields are reached.
    const imageModel = selectedModel as ImageModel;
    // These six start empty and the switch below fills in whichever ones the active page uses.
    // New-style aspect-ratio value (Text to Image) and legacy-style aspect-ratio value (Canvas 2D, Image Editor); the converter below takes both.
    let aspectRatioStr: string | undefined;
    let legacyAspectRatioStr: string | undefined;
    let resolutionStr: string | undefined;
    let qualityStr: string | undefined;
    // How many reference images the real request will carry (decides text-to-image vs image-edit below).
    let referenceImageCount = 0;
    let generationCount = 1;

    // Read the active page's own store values into the six variables above.
    switch (activePage) {
      case ModelPage.TextToImage:
        // Match GenerateImage exactly; omitted values use the API defaults.
        // The aspect ratio and resolution are only sent when the model supports the new-style choices; quality goes through the model's own resolver.
        aspectRatioStr = imageModel.supportsNewAspectRatio() ? imageAspectRatio : undefined;
        resolutionStr = imageModel.supportsNewResolution() ? imageResolution : undefined;
        qualityStr = imageModel.resolveQuality(imageQuality);
        // Only reference images that already have a media token (a finished upload) are counted, and only when the model accepts image prompts.
        referenceImageCount = imageModel.canUseImagePrompt
          ? imageReferenceImages.filter((image) => image.mediaToken.length > 0).length : 0;
        generationCount = imageGenerationCount;
        break;
      case ModelPage.Canvas2D:
        legacyAspectRatioStr = prompt2DAspectRatio;
        resolutionStr = prompt2DResolution;
        // Listed references plus one: the arithmetic suggests one more image is always sent besides the list (read from the code, not checked against the real generate call).
        referenceImageCount = prompt2DReferenceImages.length + 1;
        generationCount = prompt2DGenerationCount;
        break;
      case ModelPage.Stage3D:
        resolutionStr = prompt3DResolution;
        // Same "listed references plus one" arithmetic as Canvas 2D; the result count is fixed at 1.
        referenceImageCount = prompt3DReferenceImages.length + 1;
        generationCount = 1;
        break;
      case ModelPage.ImageEditor:
        legacyAspectRatioStr = editAspectRatio;
        resolutionStr = editResolution;
        // Same "listed references plus one" arithmetic; the result count is fixed at 1.
        referenceImageCount = editReferenceImages.length + 1;
        generationCount = 1;
        break;
      case ModelPage.Angles:
        // Angles quotes a fixed one reference image and one result.
        referenceImageCount = 1;
        generationCount = 1;
        break;
    }

    // Turn the page's text values into the API's values; each converter may return nothing, and a missing value is left out of the request below.
    const commonAspectRatio = imageAspectRatioToCommonAspectRatio(
      aspectRatioStr,
      legacyAspectRatioStr,
    );
    const commonResolution =
      stringToCommonVideoResolution(resolutionStr);
    const commonQuality = stringToCommonQuality(qualityStr);
    // With at least one reference image the request is an image edit (and carries the count); with none it is plain text-to-image.
    const generationMode =
      referenceImageCount > 0
        ? { type: "image_edit" as const, count: referenceImageCount }
        : { type: "text_to_image" as const };

    // The service that will run the job; Artcraft when none is chosen.
    const provider =
      (selectedProvider as GenerationProvider | null | undefined) ??
      GenerationProvider.Artcraft;

    // Stale-answer guard: the cleanup function at the bottom flips this to true when the inputs change again (or the hook unmounts),
    // so an older request that finishes late cannot overwrite the newer one's quote.
    let cancelled = false;
    // Show the spinner while the request is in flight.
    setIsLoading(true);
    // Blank the old quote straight away so the dialog never shows a price that belongs to different settings.
    setEstimatedCreditsForPage(activePage, null);

    // Ask the desktop side for a price. The reference images are PLACEHOLDER tokens ("mf_estimate_0", "mf_estimate_1", ...), not real uploads:
    // the request only needs to know how many images will be supplied, which is why the dependency list below can watch just the lengths.
    EstimateImageCost({
      model: selectedModel.tauriId,
      image_media_tokens: referenceImageCount ? Array.from({ length: referenceImageCount }, (_, i) => `mf_estimate_${i}`) : undefined,
      image_batch_count: generationCount,
      provider,
      generation_mode: generationMode,
      aspect_ratio: commonAspectRatio ?? undefined,
      resolution: commonResolution ?? undefined,
      quality: commonQuality ?? undefined,
    })
      // Answer arrived (the command itself did not throw).
      .then((result) => {
        // Inputs changed while we waited: a newer request owns the quote now, so drop this answer.
        if (cancelled) return;
        // A priced answer: store it. A missing price stays null (shown as a dash) instead of turning into 0.
        if (isEstimateImageCostSuccess(result)) {
          setEstimatedCreditsForPage(activePage, result.payload.cost_in_credits ?? null);
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
  }, [
    // Everything the effect reads. A change in any of these re-prices.
    activePage,
    selectedModel,
    selectedProvider,
    imageAspectRatio,
    imageResolution,
    // The three reference lists are watched by LENGTH only (not by the array): the request sends placeholder tokens, so only the count
    // matters. (In ImagePromptRow a reference image is committed with its token already set once its upload succeeds, or with "" only when no uploader
    // is supplied, so no token fills in later under the same length. Other ways of adding references were not checked.)
    imageReferenceImages.length,
    imageGenerationCount,
    imageQuality,
    prompt2DAspectRatio,
    prompt2DResolution,
    prompt2DReferenceImages.length,
    prompt2DGenerationCount,
    prompt3DResolution,
    prompt3DReferenceImages.length,
    editAspectRatio,
    editResolution,
    editReferenceImages.length,
  ]);

  // Only the spinner flag leaves this hook; the price itself is in the store.
  return { isLoading };
}
