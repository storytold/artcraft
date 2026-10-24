// React's two basic hooks: useState keeps the loading flag, useEffect runs the price request whenever an input changes.
import { useEffect, useState } from "react";
// ModelPage is the enum naming the app's eight pages; this hook only acts on ModelPage.ImageToVideo.
import { ModelPage } from "@storyteller/ui-model-selector";
// Model is the base class every model extends; VideoModel is the video-specific subclass this hook casts to.
// The three resolve* helpers and videoResolutionValue turn the dialog's raw settings into the values the price request expects.
import { Model, VideoModel, resolveVideoDuration, resolveVideoGenerationCount, resolveVideoOutputFormat, videoResolutionValue } from "@storyteller/model-list";
// GenerationProvider is the list of services that can run a generation; Artcraft is the default one.
import { GenerationProvider } from "@storyteller/api-enums";
// The Image-to-Video page's settings store (duration, aspect ratio, reference media ...). This hook only READS it.
import { usePromptVideoStore } from "@storyteller/ui-promptbox";
// EstimateVideoCost asks the desktop (Tauri) side for a price through the "estimate_video_cost_command" command.
// isEstimateVideoCostSuccess is a type guard that tells a priced answer apart from an error answer.
import {
  EstimateVideoCost,
  isEstimateVideoCostSuccess,
} from "@storyteller/tauri-api";
// The cost dialog's own store; this hook writes each finished quote into it (see setEstimatedCreditsForPage below).
import { useCostBreakdownModalStore } from "./cost-breakdown-modal-store";
// Two small converters (in ./convert): the picked aspect-ratio label -> the API's value, and the box's input mode + images -> a generation-mode object.
import {
  videoAspectRatioToCommonAspectRatio,
  videoStoreToGenerationMode,
} from "./convert/index.js";

// Quote hook for the Image-to-Video page. CostBreakdownModal calls it on every render of the dialog (even while the dialog is closed).
// It returns only { isLoading }; the price itself goes into the cost-breakdown store, keyed by page.
// Its three siblings (useImageCostEstimate, useMeshCostEstimate, useSplatCostEstimate) each handle their own pages the same way.
export function useVideoCostEstimate(
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

  // The next twelve reads subscribe to the Image-to-Video settings. Each value is also listed in the effect's dependency list, so a change re-runs the effect.
  // Length of the clip in seconds (as the box stores it).
  const duration = usePromptVideoStore((s) => s.duration);
  // The aspect-ratio LABEL the user picked (e.g. the text on the button); converted to the API value inside the effect.
  const aspectRatio = usePromptVideoStore((s) => s.aspectRatio);
  // The resolution the user picked.
  const resolution = usePromptVideoStore((s) => s.resolution);
  // Which input mode the box is in: "reference" (several reference images) or "keyframe" (start/end frame).
  const inputMode = usePromptVideoStore((s) => s.inputMode);
  // The reference/start-frame images currently attached.
  const referenceImages = usePromptVideoStore((s) => s.referenceImages);
  // The optional end-frame image (keyframe mode).
  const endFrameImage = usePromptVideoStore((s) => s.endFrameImage);
  // Reference videos attached (reference mode only).
  const referenceVideos = usePromptVideoStore((s) => s.referenceVideos);
  // Reference audio clips attached (reference mode only).
  const referenceAudios = usePromptVideoStore((s) => s.referenceAudios);
  // Chosen bitrate, for models that offer a bitrate choice.
  const bitrate = usePromptVideoStore((s) => s.bitrate);
  // Chosen output format, for models that offer one.
  const outputFormat = usePromptVideoStore((s) => s.outputFormat);
  // How many videos one press of Generate makes; multiplied into the quote below.
  const generationCount = usePromptVideoStore((s) => s.generationCount);
  // Whether the "generate with sound" switch is on, for models that have it.
  const generateWithSound = usePromptVideoStore((s) => s.generateWithSound);

  // Runs after render whenever the page, model, provider or any setting listed at the bottom changes.
  useEffect(() => {
    // Not the Image-to-Video page, or no model picked yet: nothing to price. Clear the spinner and stop.
    // (The other quote hooks guard the same way on their own pages, and those page sets do not overlap, so for the current page only one hook starts a request.)
    if (activePage !== ModelPage.ImageToVideo || !selectedModel) {
      setIsLoading(false);
      return;
    }

    // The page guard above means this model is a video model, so the cast to VideoModel is how the video-only fields are reached.
    const videoModel = selectedModel as VideoModel;
    // Aspect ratio for the quote: only models that take the common aspect-ratio field get one.
    // Fallback order: the label the user picked -> the model's default -> the model's first size option.
    // sizeOptions is always an array (it defaults to []), so the [0] lookup cannot throw.
    const commonAspectRatio = videoModel.supportsCommonAspectRatio
      ? videoAspectRatioToCommonAspectRatio(aspectRatio, videoModel.sizeOptions)
        ?? videoModel.defaultAspectRatio ?? videoModel.sizeOptions[0]?.tauriValue
      : undefined;
    // Resolution for the quote: only models that list resolution options get one.
    const commonResolution = videoModel.resolutionOptions?.length ? videoResolutionValue(resolution) : undefined;
    // "Reference mode" only counts when the box is in reference mode AND the model supports it.
    const isReferenceMode = inputMode === "reference" && !!videoModel.supportsReferenceMode;
    // The generation-mode object (text-to-video, start frame, start+end frame, or reference images) built from the box's current attachments.
    const generationMode = videoStoreToGenerationMode(
      inputMode,
      referenceImages,
      endFrameImage,
      videoModel.supportsReferenceMode,
    );

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
    setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);

    // Ask the desktop side for a price with these settings. A field set to `undefined` is simply left out of the request (used for options this model or mode does not have).
    EstimateVideoCost({
      model: videoModel.tauriId,
      provider,
      generation_mode: generationMode,
      aspect_ratio: commonAspectRatio ?? undefined,
      resolution: commonResolution ?? undefined,
      duration_seconds: resolveVideoDuration(videoModel, duration, isReferenceMode) ?? undefined,
      generate_audio: videoModel.generateWithSound ? generateWithSound : undefined,
      bitrate: videoModel.bitrateOptions?.length ? bitrate ?? videoModel.defaultBitrate ?? videoModel.bitrateOptions[0] : undefined,
      output_format: resolveVideoOutputFormat(videoModel, outputFormat),
      // Frame images apply only outside reference mode; reference media apply only inside it.
      start_frame_image_media_token: !isReferenceMode ? referenceImages[0]?.mediaToken : undefined,
      end_frame_image_media_token: !isReferenceMode ? endFrameImage?.mediaToken : undefined,
      reference_image_media_tokens: isReferenceMode ? referenceImages.map((image) => image.mediaToken) : undefined,
      reference_video_media_tokens: isReferenceMode ? referenceVideos.map((video) => video.mediaToken) : undefined,
      reference_audio_media_tokens: isReferenceMode ? referenceAudios.map((audio) => audio.mediaToken) : undefined,
      // In reference mode the request also carries the total length of the attached videos and audio clips, in milliseconds (seconds x 1000, rounded).
      estimate_only: isReferenceMode ? {
        total_input_video_duration_millis: referenceVideos.length
          ? Math.round(referenceVideos.reduce((sum, video) => sum + video.duration, 0) * 1000) : undefined,
        total_input_audio_duration_millis: referenceAudios.length
          ? Math.round(referenceAudios.reduce((sum, audio) => sum + audio.duration, 0) * 1000) : undefined,
      } : undefined,
    })
      // Answer arrived (the command itself did not throw).
      .then((result) => {
        // The inputs changed while we waited: a newer request owns the quote now, so drop this answer.
        if (cancelled) return;
        // A priced answer. This code treats it as the price of ONE video, so it multiplies by how many videos the user asked for.
        if (isEstimateVideoCostSuccess(result)) {
          const unitCredits = result.payload.cost_in_credits;
          const count = resolveVideoGenerationCount(videoModel, generationCount);
          // A missing unit price stays null (shown as a dash) instead of turning into 0.
          const credits = unitCredits == null ? null : unitCredits * count;
          setEstimatedCreditsForPage(ModelPage.ImageToVideo, credits);
        } else {
          // An error-shaped answer: leave the quote empty.
          setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
        }
      })
      // The command threw (the invoke call rejected): same outcome, an empty quote. This hook shows no message of its own.
      .catch(() => {
        if (cancelled) return;
        setEstimatedCreditsForPage(ModelPage.ImageToVideo, null);
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
    duration,
    aspectRatio,
    resolution,
    inputMode,
    referenceImages,
    referenceVideos,
    referenceAudios,
    bitrate,
    outputFormat,
    generationCount,
    endFrameImage,
    generateWithSound,
  ]);

  // Only the spinner flag leaves this hook; the price itself is in the store.
  return { isLoading };
}
