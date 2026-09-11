import { useEffect, useState } from "react";
import { ModelPage } from "@storyteller/ui-model-selector";
import { Model, VideoModel, resolveVideoDuration, videoResolutionValue } from "@storyteller/model-list";
import { GenerationProvider } from "@storyteller/api-enums";
import { usePromptVideoStore } from "@storyteller/ui-promptbox";
import {
  EstimateVideoCost,
  isEstimateVideoCostSuccess,
} from "@storyteller/tauri-api";
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";
import {
  videoAspectRatioToCommonAspectRatio,
  videoStoreToGenerationMode,
} from "./convert/index.js";

export function useVideoCostEstimate(
  activePage: ModelPage,
  selectedModel: Model | null | undefined,
  selectedProvider: string | null | undefined,
): { isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(false);
  const setEstimatedCreditsForPage = useCostBreakdownModalStore(
    (s) => s.setEstimatedCreditsForPage,
  );

  const duration = usePromptVideoStore((s) => s.duration);
  const aspectRatio = usePromptVideoStore((s) => s.aspectRatio);
  const resolution = usePromptVideoStore((s) => s.resolution);
  const inputMode = usePromptVideoStore((s) => s.inputMode);
  const referenceImages = usePromptVideoStore((s) => s.referenceImages);
  const endFrameImage = usePromptVideoStore((s) => s.endFrameImage);
  const referenceVideos = usePromptVideoStore((s) => s.referenceVideos);
  const referenceAudios = usePromptVideoStore((s) => s.referenceAudios);
  const bitrate = usePromptVideoStore((s) => s.bitrate);
  const generationCount = usePromptVideoStore((s) => s.generationCount);
  const generateWithSound = usePromptVideoStore((s) => s.generateWithSound);

  useEffect(() => {
    if (activePage !== ModelPage.ImageToVideo || !selectedModel) {
      setIsLoading(false);
      return;
    }

    const videoModel = selectedModel as VideoModel;
    const commonAspectRatio = videoModel.supportsCommonAspectRatio
      ? videoAspectRatioToCommonAspectRatio(aspectRatio, videoModel.sizeOptions)
        ?? videoModel.defaultAspectRatio ?? videoModel.sizeOptions[0]?.tauriValue
      : undefined;
    const commonResolution = videoModel.resolutionOptions?.length ? videoResolutionValue(resolution) : undefined;
    const isReferenceMode = inputMode === "reference" && !!videoModel.supportsReferenceMode;
    const generationMode = videoStoreToGenerationMode(
      inputMode,
      referenceImages,
      endFrameImage,
      videoModel.supportsReferenceMode,
    );

    const provider =
      (selectedProvider as GenerationProvider | null | undefined) ??
      GenerationProvider.Artcraft;

    let cancelled = false;
    setIsLoading(true);
    setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);

    EstimateVideoCost({
      model: videoModel.tauriId,
      provider,
      generation_mode: generationMode,
      aspect_ratio: commonAspectRatio ?? undefined,
      resolution: commonResolution ?? undefined,
      duration_seconds: resolveVideoDuration(videoModel, duration, isReferenceMode) ?? undefined,
      generate_audio: videoModel.generateWithSound ? generateWithSound : undefined,
      bitrate: videoModel.bitrateOptions?.length ? bitrate ?? videoModel.defaultBitrate ?? videoModel.bitrateOptions[0] : undefined,
      start_frame_image_media_token: !isReferenceMode ? referenceImages[0]?.mediaToken : undefined,
      end_frame_image_media_token: !isReferenceMode ? endFrameImage?.mediaToken : undefined,
      reference_image_media_tokens: isReferenceMode ? referenceImages.map((image) => image.mediaToken) : undefined,
      reference_video_media_tokens: isReferenceMode ? referenceVideos.map((video) => video.mediaToken) : undefined,
      reference_audio_media_tokens: isReferenceMode ? referenceAudios.map((audio) => audio.mediaToken) : undefined,
      estimate_only: isReferenceMode ? {
        total_input_video_duration_millis: referenceVideos.length
          ? Math.round(referenceVideos.reduce((sum, video) => sum + video.duration, 0) * 1000) : undefined,
        total_input_audio_duration_millis: referenceAudios.length
          ? Math.round(referenceAudios.reduce((sum, audio) => sum + audio.duration, 0) * 1000) : undefined,
      } : undefined,
    })
      .then((result) => {
        if (cancelled) return;
        if (isEstimateVideoCostSuccess(result)) {
          const unitCredits = result.payload.cost_in_credits;
          const count = videoModel.id === "seedance_2p0" ? generationCount : 1;
          const credits = unitCredits == null ? null : unitCredits * count;
          setEstimatedCreditsForPage(ModelPage.ImageToVideo, credits);
        } else {
          setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [
    activePage,
    selectedModel,
    selectedProvider,
    duration,
    aspectRatio,
    resolution,
    inputMode,
    referenceImages,
    referenceVideos,
    referenceAudios,
    bitrate,
    generationCount,
    endFrameImage,
    generateWithSound,
  ]);

  return { isLoading };
}
