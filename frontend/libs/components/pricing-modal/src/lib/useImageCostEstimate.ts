import { useEffect, useState } from "react";
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
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";
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
  const [isLoading, setIsLoading] = useState(false);
  const setEstimatedCreditsForPage = useCostBreakdownModalStore(
    (s) => s.setEstimatedCreditsForPage,
  );

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
    if (!IMAGE_PAGES.has(activePage) || !selectedModel) {
      return;
    }

    const commonModel = imageModelToCommonImageModel(selectedModel.tauriId);
    if (!commonModel) {
      setEstimatedCreditsForPage(activePage, null);
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

    setIsLoading(true);

    EstimateImageCost({
      model: commonModel,
      provider,
      generation_mode: generationMode,
      aspect_ratio: commonAspectRatio ?? undefined,
      resolution: commonResolution ?? undefined,
      quality: commonQuality ?? undefined,
    })
      .then((result) => {
        if (isEstimateImageCostSuccess(result)) {
          const creditsPerGeneration = result.payload.cost_in_credits ?? null;
          const totalCredits =
            creditsPerGeneration != null
              ? creditsPerGeneration * generationCount
              : null;
          setEstimatedCreditsForPage(activePage, totalCredits);
        } else {
          setEstimatedCreditsForPage(activePage, null);
        }
      })
      .catch(() => {
        setEstimatedCreditsForPage(activePage, null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    activePage,
    selectedModel?.id,
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
  ]);

  return { isLoading };
}
