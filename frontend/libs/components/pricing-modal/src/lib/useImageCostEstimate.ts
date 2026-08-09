import { useEffect, useRef } from "react";
import { ModelPage } from "@storyteller/ui-model-selector";
import { Model } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";
import {
  usePromptImageStore,
  usePrompt2DStore,
  usePrompt3DStore,
  usePromptEditStore,
} from "@storyteller/ui-promptbox";
import {
  EstimateImageCost,
  isEstimateImageCostSuccess,
} from "@storyteller/tauri-api";
import { useCostEstimateLifecycle } from "./useCostEstimateLifecycle";
import {
  imageModelToCommonImageModel,
  imageAspectRatioToCommonAspectRatio,
  stringToCommonQuality,
  stringToCommonVideoResolution,
} from "./convert/index.js";

const IMAGE_PAGES = new Set<ModelPage>([
  ModelPage.TextToImage,
  ModelPage.Canvas2D,
  ModelPage.Stage3D,
  ModelPage.ImageEditor,
  ModelPage.Angles,
]);

export function useImageCostEstimate(
  activePage: ModelPage,
  selectedModel: Model | null | undefined,
  selectedProvider: string | null | undefined,
): { isLoading: boolean } {
  const { isLoading, begin, clear } = useCostEstimateLifecycle();
  const lastEstimatePage = useRef<ModelPage | null>(null);

  // TextToImage store
  const imageAspectRatio = usePromptImageStore((s) => s.commonAspectRatio);
  const imageLegacyAspectRatio = usePromptImageStore((s) => s.aspectRatio);
  const imageResolution = usePromptImageStore((s) => s.commonResolution);
  const imageLegacyResolution = usePromptImageStore((s) => s.resolution);
  const imageReferenceImages = usePromptImageStore((s) => s.referenceImages);
  const imageGenerationCount = usePromptImageStore((s) => s.generationCount);
  const imageQuality = usePromptImageStore((s) => s.commonQuality);

  // Canvas2D store
  const prompt2DAspectRatio = usePrompt2DStore((s) => s.aspectRatio);
  const prompt2DResolution = usePrompt2DStore((s) => s.resolution);
  const prompt2DReferenceImages = usePrompt2DStore((s) => s.referenceImages);
  const prompt2DGenerationCount = usePrompt2DStore((s) => s.generationCount);

  // Stage3D store
  const prompt3DResolution = usePrompt3DStore((s) => s.resolution);
  const prompt3DReferenceImages = usePrompt3DStore((s) => s.referenceImages);

  // ImageEditor store
  const editAspectRatio = usePromptEditStore((s) => s.aspectRatio);
  const editResolution = usePromptEditStore((s) => s.resolution);
  const editReferenceImages = usePromptEditStore((s) => s.referenceImages);

  useEffect(() => {
    if (!IMAGE_PAGES.has(activePage)) {
      for (const page of IMAGE_PAGES) {
        clear(page);
      }
      lastEstimatePage.current = null;
      return;
    }

    const previousPage = lastEstimatePage.current;
    if (previousPage !== null && previousPage !== activePage) {
      clear(previousPage);
    }

    if (!selectedModel) {
      clear(activePage);
      lastEstimatePage.current = activePage;
      return;
    }

    lastEstimatePage.current = activePage;

    const commonModel = imageModelToCommonImageModel(selectedModel.tauriId);
    if (!commonModel) {
      clear(activePage);
      return;
    }

    let aspectRatioStr: string | undefined;
    let legacyAspectRatioStr: string | undefined;
    let resolutionStr: string | undefined;
    let qualityStr: string | undefined;
    let referenceImageCount = 0;
    let generationCount = 1;

    switch (activePage) {
      case ModelPage.TextToImage:
        aspectRatioStr = imageAspectRatio;
        legacyAspectRatioStr = imageLegacyAspectRatio;
        resolutionStr = imageResolution ?? imageLegacyResolution;
        qualityStr = imageQuality;
        referenceImageCount = imageReferenceImages.length;
        generationCount = imageGenerationCount;
        break;
      case ModelPage.Canvas2D:
        legacyAspectRatioStr = prompt2DAspectRatio;
        resolutionStr = prompt2DResolution;
        referenceImageCount = prompt2DReferenceImages.length;
        generationCount = prompt2DGenerationCount;
        break;
      case ModelPage.Stage3D:
        resolutionStr = prompt3DResolution;
        referenceImageCount = prompt3DReferenceImages.length;
        generationCount = 1;
        break;
      case ModelPage.ImageEditor:
        legacyAspectRatioStr = editAspectRatio;
        resolutionStr = editResolution;
        referenceImageCount = editReferenceImages.length;
        generationCount = 1;
        break;
      case ModelPage.Angles:
        referenceImageCount = 1;
        generationCount = 1;
        break;
    }

    const commonAspectRatio = imageAspectRatioToCommonAspectRatio(
      aspectRatioStr,
      legacyAspectRatioStr,
    );
    const commonResolution =
      stringToCommonVideoResolution(resolutionStr);
    const commonQuality = stringToCommonQuality(qualityStr);
    const generationMode =
      referenceImageCount > 0
        ? { type: "image_edit" as const, count: referenceImageCount }
        : { type: "text_to_image" as const };

    const provider =
      (selectedProvider as GenerationProvider | null | undefined) ??
      GenerationProvider.Artcraft;

    const request = begin(activePage);
    void (async () => {
      try {
        const result = await EstimateImageCost({
          model: commonModel,
          provider,
          generation_mode: generationMode,
          aspect_ratio: commonAspectRatio ?? undefined,
          resolution: commonResolution ?? undefined,
          quality: commonQuality ?? undefined,
        });
        const creditsPerGeneration = isEstimateImageCostSuccess(result)
          ? (result.payload.cost_in_credits ?? null)
          : null;
        request.settle(
          creditsPerGeneration != null
            ? creditsPerGeneration * generationCount
            : null,
        );
      } catch {
        request.settle(null);
      }
    })();

    return request.cancel;
  }, [
    activePage,
    selectedModel,
    selectedProvider,
    imageAspectRatio,
    imageLegacyAspectRatio,
    imageResolution,
    imageLegacyResolution,
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
    begin,
    clear,
  ]);

  return { isLoading };
}
