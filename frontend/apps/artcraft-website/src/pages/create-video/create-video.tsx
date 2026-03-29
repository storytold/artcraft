import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faFilm,
  faTriangleExclamation,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import { FilterMediaClasses } from "@storyteller/api";
import type { OmniGenVideoModelInfo } from "@storyteller/api";
import { ToggleButton } from "@storyteller/ui-button";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  PromptBox,
  ImagePickerModal,
  MediaReferenceRow,
  type RefImage,
  type RefVideo,
  type RefAudio,
  type MentionItem,
} from "../../components/prompt-box";
import {
  GenerationGalleryGrid,
  useGalleryData,
  useGenerationJobs,
  useAuthCheck,
  usePromptHeight,
  useLightboxNav,
  CreateMediaPageShell,
} from "../../components/generation-gallery";
import { Lightbox } from "../../components/lightbox/lightbox";
import { useCreateVideoStore } from "./create-video-store";
import {
  enqueueVideoGeneration,
  startVideoPolling,
} from "./generate-video-api";
import { AspectRatioIcon, AutoIcon } from "../create-image/components/AspectRatioIcon";
import { useVideoCostEstimate } from "../../lib/cost-estimate-api";
import {
  useOmniGenVideoModels,
  getModelCreatorIconPath,
  getModelDisplayName,
} from "../../lib/omni-gen-hooks";

// ── Constants ────────────────────────────────────────────────────────────

const DEFAULT_MODEL_ID = "seedance_2p0";

const VIDEO_FILTER = [FilterMediaClasses.VIDEO];

const AUTO_RATIOS = new Set(["auto", "auto_2k", "auto_4k"]);

// ── Aspect ratio labels (shared with image page) ─────────────────────────

const AR_LABELS: Record<string, string> = {
  auto: "Auto",
  square: "Square",
  wide_five_by_four: "5:4 (Wide)",
  wide_four_by_three: "4:3 (Wide)",
  wide_three_by_two: "3:2 (Wide)",
  wide_sixteen_by_nine: "16:9 (Wide)",
  wide_twenty_one_by_nine: "21:9 (Wide)",
  tall_four_by_five: "4:5 (Tall)",
  tall_three_by_four: "3:4 (Tall)",
  tall_two_by_three: "2:3 (Tall)",
  tall_nine_by_sixteen: "9:16 (Tall)",
  tall_nine_by_twenty_one: "9:21 (Tall)",
  auto_2k: "Auto (2K)",
  auto_4k: "Auto (4K)",
  square_hd: "Square (HD)",
  wide: "Wide",
  tall: "Tall",
};

// ── Model lookup ─────────────────────────────────────────────────────────

let _modelLookup = new Map<string, OmniGenVideoModelInfo>();

function buildModelPopoverItems(
  models: OmniGenVideoModelInfo[],
  selectedId: string,
): PopoverItem[] {
  _modelLookup = new Map(models.map((m) => [m.model, m]));
  return models.map((model) => ({
    label: getModelDisplayName(model.model, model.full_name),
    selected: model.model === selectedId,
    icon: (
      <img
        src={getModelCreatorIconPath(model.model)}
        alt={`${model.model} logo`}
        className="h-4 w-4 icon-auto-contrast"
      />
    ),
    action: model.model,
  }));
}

function buildSizePopoverItems(
  aspectRatioOptions: string[],
  selectedValue: string,
): PopoverItem[] {
  return aspectRatioOptions.map((ar) => ({
    label: AR_LABELS[ar] ?? ar,
    selected: ar === selectedValue,
    icon: AUTO_RATIOS.has(ar) ? (
      <AutoIcon />
    ) : (
      <AspectRatioIcon commonAspectRatio={ar} />
    ),
    action: ar,
  }));
}

// ── Component ────────────────────────────────────────────────────────────

export default function CreateVideo() {
  const { user, authChecked } = useAuthCheck();
  const { promptBoxRef, promptHeight } = usePromptHeight();

  // Fetch models from API
  const { models: apiModels } = useOmniGenVideoModels();

  // UI state
  const ui = useCreateVideoStore((s) => s.ui);
  const setUi = useCreateVideoStore((s) => s.setUi);

  const selectedModel = useMemo((): OmniGenVideoModelInfo | undefined => {
    if (!apiModels.length) return undefined;
    if (ui.selectedModelId) {
      return apiModels.find((m) => m.model === ui.selectedModelId) ??
        apiModels.find((m) => m.model === DEFAULT_MODEL_ID) ??
        apiModels[0];
    }
    return apiModels.find((m) => m.model === DEFAULT_MODEL_ID) ?? apiModels[0];
  }, [apiModels, ui.selectedModelId]);

  const prompt = ui.prompt;
  const setPrompt = useCallback((v: string) => setUi({ prompt: v }), [setUi]);
  const selectedSize = ui.selectedSize;
  const setSelectedSize = useCallback(
    (v: string) => setUi({ selectedSize: v }),
    [setUi],
  );
  const duration = ui.duration;
  const setDuration = useCallback(
    (v: number | null) => setUi({ duration: v }),
    [setUi],
  );
  const resolution = ui.resolution ?? selectedModel?.resolution_default ?? null;
  const setResolution = useCallback(
    (v: string | null) => setUi({ resolution: v }),
    [setUi],
  );
  const generateWithSound = ui.generateWithSound;
  const [isGenerating, setIsGenerating] = useState(false);

  // Reference media
  const [referenceImages, setReferenceImages] = useState<RefImage[]>([]);
  const [endFrameImage, setEndFrameImage] = useState<RefImage | undefined>();
  const [referenceVideos, setReferenceVideos] = useState<RefVideo[]>([]);
  const [referenceAudios, setReferenceAudios] = useState<RefAudio[]>([]);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Batch store (enqueue flow only)
  const batches = useCreateVideoStore((s) => s.batches);
  const startBatch = useCreateVideoStore((s) => s.startBatch);
  const setBatchJobToken = useCreateVideoStore((s) => s.setBatchJobToken);
  const completeBatch = useCreateVideoStore((s) => s.completeBatch);
  const failBatch = useCreateVideoStore((s) => s.failBatch);
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());

  // Derived model capabilities
  const hasSizeOptions = (selectedModel?.aspect_ratio_options?.length ?? 0) > 0;
  const hasResolutionOptions = (selectedModel?.resolution_options?.length ?? 0) > 0;
  const hasSound = !!selectedModel?.show_generate_with_sound_toggle;
  const supportsImagePrompts =
    !!selectedModel?.starting_keyframe_supported ||
    !!selectedModel?.starting_keyframe_required ||
    !!selectedModel?.image_references_supported;
  const supportsRefMode =
    !!selectedModel?.image_references_supported ||
    !!selectedModel?.video_references_supported ||
    !!selectedModel?.audio_references_supported;
  const inputMode = ui.inputMode;
  const isReferenceMode = supportsRefMode && inputMode === "reference";
  const hasEndFrame = !!(selectedModel?.ending_keyframe_supported && !isReferenceMode);
  const needsImage = !!selectedModel?.starting_keyframe_required && referenceImages.length === 0;

  // Jobs + gallery
  const jobs = useGenerationJobs({ mediaType: "video" });
  const gallery = useGalleryData({
    username: user?.username ?? null,
    filterMediaClasses: VIDEO_FILTER,
  });

  const newlyCompletedTokens = useMemo(
    () => new Set(jobs.newlyCompleted.map((i) => i.id)),
    [jobs.newlyCompleted],
  );

  // Lightbox
  const flatItems = useMemo(() => {
    const filtered = gallery.items.filter((i) => !newlyCompletedTokens.has(i.id));
    return [...jobs.newlyCompleted, ...filtered];
  }, [jobs.newlyCompleted, gallery.items, newlyCompletedTokens]);

  const lightbox = useLightboxNav(flatItems);

  // Cost estimate
  const estimatedCredits = useVideoCostEstimate({
    model: selectedModel?.model ?? "",
    aspectRatio: selectedSize,
    resolution,
    duration: duration ?? selectedModel?.duration_seconds_default ?? null,
    hasStartFrame: !isReferenceMode && referenceImages.length > 0,
    hasEndFrame: !isReferenceMode && hasEndFrame && !!endFrameImage,
    isReferenceMode,
    referenceImageCount: isReferenceMode ? referenceImages.length : 0,
    generateAudio: hasSound ? generateWithSound : undefined,
  });

  // Popover items
  const mentionItems = useMemo((): MentionItem[] => {
    if (!isReferenceMode) return [];
    return [
      ...referenceImages.map((img, i) => ({
        label: `@Image${i + 1}`,
        type: "image" as const,
        preview: img.url,
      })),
      ...referenceVideos.map((vid, i) => ({
        label: `@Video${i + 1}`,
        type: "video" as const,
        preview: vid.url,
      })),
      ...referenceAudios.map((_aud, i) => ({
        label: `@Audio${i + 1}`,
        type: "audio" as const,
        preview: undefined,
      })),
    ];
  }, [isReferenceMode, referenceImages, referenceVideos, referenceAudios]);

  const modelItems = useMemo(
    () => buildModelPopoverItems(apiModels, selectedModel?.model ?? ""),
    [apiModels, selectedModel?.model],
  );
  const sizeItems = useMemo(
    () => buildSizePopoverItems(selectedModel?.aspect_ratio_options ?? [], selectedSize),
    [selectedModel?.aspect_ratio_options, selectedSize],
  );
  const durationItems = useMemo(
    (): PopoverItem[] | null =>
      selectedModel?.duration_seconds_options
        ? selectedModel.duration_seconds_options.map((d) => ({
            label: `${d}s`,
            selected: d === (duration ?? selectedModel.duration_seconds_default),
          }))
        : null,
    [selectedModel, duration],
  );
  const resolutionItems = useMemo(
    (): PopoverItem[] | null =>
      selectedModel?.resolution_options
        ? selectedModel.resolution_options.map((r) => ({
            label: r,
            selected: r === (resolution ?? selectedModel.resolution_default),
          }))
        : null,
    [selectedModel, resolution],
  );
  const inputModeItems = useMemo(
    (): PopoverItem[] | null =>
      supportsRefMode
        ? [
            {
              label: "Keyframe",
              description: "First/Last frame",
              selected: inputMode === "keyframe",
            },
            {
              label: "Reference",
              description: "Multi-media ref",
              selected: inputMode === "reference",
            },
          ]
        : null,
    [supportsRefMode, inputMode],
  );

  const hasContent =
    jobs.inProgress.length > 0 ||
    jobs.failed.length > 0 ||
    jobs.newlyCompleted.length > 0 ||
    gallery.items.length > 0 ||
    gallery.isInitialLoading;

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const cleanups = pollingCleanupsRef.current;
    const pendingBatches = useCreateVideoStore
      .getState()
      .batches.filter((b) => b.status === "pending" && b.jobToken);

    for (const batch of pendingBatches) {
      if (cleanups.has(batch.id)) continue;
      const stop = startVideoPolling(
        batch.jobToken!,
        (video) => {
          completeBatch(batch.id, video);
          cleanups.delete(batch.id);
          window.dispatchEvent(new Event("task-queue-update"));
        },
        (reason) => {
          failBatch(batch.id, reason);
          cleanups.delete(batch.id);
          window.dispatchEvent(new Event("task-queue-update"));
        },
      );
      cleanups.set(batch.id, stop);
    }

    return () => {
      cleanups.forEach((stop) => stop());
      cleanups.clear();
    };
  }, [completeBatch, failBatch]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleModelChange = useCallback(
    (item: PopoverItem) => {
      const model = item.action ? _modelLookup.get(item.action) : undefined;
      if (!model) return;
      setUi({
        selectedModelId: model.model,
        selectedSize: model.aspect_ratio_default ?? "wide_sixteen_by_nine",
        duration: model.duration_seconds_default ?? null,
        resolution: model.resolution_default ?? null,
        generateWithSound: false,
        inputMode: "keyframe",
      });
      setReferenceImages([]);
      setEndFrameImage(undefined);
      setReferenceVideos([]);
      setReferenceAudios([]);
    },
    [setUi],
  );

  const handleSizeChange = useCallback(
    (item: PopoverItem) => {
      if (item.action) setSelectedSize(item.action);
    },
    [setSelectedSize],
  );

  const handleDurationChange = useCallback(
    (item: PopoverItem) => {
      const seconds = parseInt(item.label, 10);
      if (!isNaN(seconds)) setDuration(seconds);
    },
    [setDuration],
  );

  const handleResolutionChange = useCallback(
    (item: PopoverItem) => setResolution(item.label),
    [setResolution],
  );

  const handleInputModeChange = useCallback(
    (item: PopoverItem) => {
      const mode = item.label === "Reference" ? "reference" : "keyframe";
      if (mode === inputMode) return;
      setUi({ inputMode: mode });
      if (mode === "reference") {
        setEndFrameImage(undefined);
      } else {
        setReferenceVideos([]);
        setReferenceAudios([]);
      }
    },
    [inputMode, setUi],
  );

  const handleLibraryImageSelect = useCallback(
    (images: { token: string; url: string; thumbnailUrl: string }[]) => {
      const maxImages = isReferenceMode ? (selectedModel?.image_references_max ?? 3) : 1;
      const availableSlots = Math.max(0, maxImages - referenceImages.length);
      const newImages: RefImage[] = images.slice(0, availableSlots).map((img) => ({
        id: Math.random().toString(36).substring(7),
        url: img.thumbnailUrl || img.url,
        file: new File([], "library-image"),
        mediaToken: img.token,
      }));
      setReferenceImages([...referenceImages, ...newImages]);
    },
    [referenceImages, isReferenceMode, selectedModel],
  );

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating || needsImage || !selectedModel) return;
    setIsGenerating(true);
    const batchId = startBatch(prompt, selectedModel.full_name ?? selectedModel.model);

    try {
      const startFrameToken =
        !isReferenceMode && supportsImagePrompts && referenceImages.length > 0
          ? referenceImages[0].mediaToken
          : undefined;
      const endFrameToken =
        !isReferenceMode && hasEndFrame && endFrameImage?.mediaToken
          ? endFrameImage.mediaToken
          : undefined;
      const referenceImageTokens =
        isReferenceMode && referenceImages.length > 0
          ? referenceImages.map((img) => img.mediaToken).filter((t) => t.length > 0)
          : undefined;
      const referenceVideoTokens =
        isReferenceMode && referenceVideos.length > 0
          ? referenceVideos.map((v) => v.mediaToken).filter((t) => t.length > 0)
          : undefined;
      const referenceAudioTokens =
        isReferenceMode && referenceAudios.length > 0
          ? referenceAudios.map((a) => a.mediaToken).filter((t) => t.length > 0)
          : undefined;

      const result = await enqueueVideoGeneration({
        prompt: prompt.trim(),
        model: selectedModel.model,
        aspectRatio: selectedSize,
        duration: duration ?? selectedModel.duration_seconds_default ?? undefined,
        resolution: hasResolutionOptions
          ? (resolution ?? selectedModel.resolution_default ?? undefined)
          : undefined,
        generateAudio: hasSound ? generateWithSound : undefined,
        startFrameImageMediaToken: startFrameToken?.length ? startFrameToken : undefined,
        endFrameImageMediaToken: endFrameToken?.length ? endFrameToken : undefined,
        referenceImageMediaTokens: referenceImageTokens?.length ? referenceImageTokens : undefined,
        referenceVideoMediaTokens: referenceVideoTokens?.length ? referenceVideoTokens : undefined,
        referenceAudioMediaTokens: referenceAudioTokens?.length ? referenceAudioTokens : undefined,
      });

      if (!result.success || !result.jobToken) {
        failBatch(batchId, result.error ?? "Failed to start generation");
        setIsGenerating(false);
        return;
      }

      setBatchJobToken(batchId, result.jobToken);
      window.dispatchEvent(new Event("credits-change"));
      window.dispatchEvent(new Event("task-queue-update"));

      const stopPolling = startVideoPolling(
        result.jobToken,
        (video) => {
          completeBatch(batchId, video);
          pollingCleanupsRef.current.delete(batchId);
          window.dispatchEvent(new Event("task-queue-update"));
        },
        (reason) => {
          failBatch(batchId, reason);
          pollingCleanupsRef.current.delete(batchId);
          window.dispatchEvent(new Event("task-queue-update"));
        },
      );
      pollingCleanupsRef.current.set(batchId, stopPolling);
    } catch {
      failBatch(batchId, "Network error - please try again");
    } finally {
      setIsGenerating(false);
    }
  }, [
    prompt, isGenerating, needsImage, isReferenceMode, selectedModel, selectedSize,
    duration, resolution, generateWithSound, hasResolutionOptions, hasSound,
    supportsImagePrompts, hasEndFrame, referenceImages, endFrameImage,
    referenceVideos, referenceAudios, startBatch, setBatchJobToken, completeBatch, failBatch,
  ]);

  // ── Render ────────────────────────────────────────────────────────────

  const videoGlowOrbs = (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-10%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-[0.12] blur-[120px] transform-gpu" />
      <div className="absolute bottom-[-15%] left-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-purple-600 opacity-[0.08] blur-[120px] transform-gpu" />
      <div className="absolute bottom-[10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-600 to-pink-500 opacity-[0.06] blur-[140px] transform-gpu" />
    </div>
  );

  return (
    <CreateMediaPageShell
      title="Create Video - ArtCraft"
      description="Generate stunning AI videos with ArtCraft"
      authChecked={authChecked}
      isLoggedIn={!!user}
      heroIcon={faFilm}
      heroTitle="Create Video"
      heroSubtitle="Sign in to generate stunning AI videos with multiple models"
      hasContent={hasContent}
      emptyStateTitle="Generate Video"
      emptyStateSubtitle="Add a prompt, then generate"
      bottomOffset={promptHeight + 24}
      modelItems={modelItems}
      onModelChange={handleModelChange}
      glowOrbs={videoGlowOrbs}
      gridContent={
        <GenerationGalleryGrid
          inProgressJobs={jobs.inProgress}
          failedJobs={jobs.failed}
          onDismissFailed={jobs.dismissFailed}
          newlyCompletedItems={jobs.newlyCompleted}
          galleryItems={gallery.items}
          newlyCompletedTokens={newlyCompletedTokens}
          hasMore={gallery.hasMore}
          isLoading={gallery.isLoading}
          onLoadMore={gallery.loadMore}
          onGalleryItemClick={lightbox.handleGalleryItemClick}
        />
      }
      promptBox={
        <div
          className="animate-fade-in-up fixed bottom-3 left-0 right-0 z-30 mx-auto w-full max-w-[730px] px-4"
          style={{ animationDelay: "150ms" }}
        >
          {selectedModel?.model === "seedance_2p0" && (
            <div className="mb-2 flex items-start gap-2.5 rounded-lg border border-yellow-500/40 px-3.5 py-2.5 text-xs text-yellow-200 shadow-lg backdrop-blur-xl bg-yellow-800/60">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-400" />
              <span>
                Seedance 2.0 is in Early Alpha. Generations may be slow and may experience outages.
                Seedance may reject safe inputs unexpectedly. Try several short generations before longer ones.
              </span>
            </div>
          )}
          <PromptBox
            ref={promptBoxRef}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleGenerate}
            isSubmitting={isGenerating || needsImage}
            credits={estimatedCredits}
            placeholder="Describe the video you want to generate..."
            supportsImagePrompts={supportsImagePrompts}
            maxImagePromptCount={isReferenceMode ? (selectedModel?.image_references_max ?? 3) : 1}
            referenceImages={referenceImages}
            onReferenceImagesChange={setReferenceImages}
            isVideo
            isReferenceMode={isReferenceMode}
            endFrameImage={endFrameImage}
            onEndFrameImageChange={setEndFrameImage}
            showEndFrameSection={hasEndFrame}
            onPickFromLibrary={supportsImagePrompts ? () => setIsImagePickerOpen(true) : undefined}
            onClearAllRefs={() => {
              setReferenceImages([]);
              setEndFrameImage(undefined);
              setReferenceVideos([]);
              setReferenceAudios([]);
            }}
            showClearSession={batches.length > 0}
            onClearSession={useCreateVideoStore.getState().reset}
            mentionItems={mentionItems.length > 0 ? mentionItems : undefined}
            mediaReferenceRow={
              isReferenceMode ? (
                <MediaReferenceRow
                  referenceVideos={referenceVideos}
                  onReferenceVideosChange={setReferenceVideos}
                  maxVideoCount={selectedModel?.video_references_max ?? 3}
                  maxVideoRefDuration={selectedModel?.video_references_max_total_duration_seconds ?? 30}
                  referenceAudios={referenceAudios}
                  onReferenceAudiosChange={setReferenceAudios}
                  maxAudioCount={selectedModel?.audio_references_max ?? 2}
                  maxAudioRefDuration={selectedModel?.audio_references_max_total_duration_seconds ?? 30}
                />
              ) : undefined
            }
            leftToolbar={
              <>
                {hasSizeOptions && (
                  <Tooltip content="Aspect Ratio" position="top" className="z-50" closeOnClick>
                    <PopoverMenu
                      items={sizeItems}
                      onSelect={handleSizeChange}
                      mode="toggle"
                      panelTitle="Aspect Ratio"
                      showIconsInList
                      triggerIcon={
                        AUTO_RATIOS.has(selectedSize) ? (
                          <AutoIcon />
                        ) : (
                          <AspectRatioIcon commonAspectRatio={selectedSize} />
                        )
                      }
                    />
                  </Tooltip>
                )}
                {resolutionItems && (
                  <Tooltip content="Resolution" position="top" className="z-50" closeOnClick>
                    <PopoverMenu items={resolutionItems} onSelect={handleResolutionChange} mode="toggle" panelTitle="Resolution" />
                  </Tooltip>
                )}
                {durationItems && (
                  <Tooltip content="Duration" position="top" className="z-50" closeOnClick>
                    <PopoverMenu
                      items={durationItems}
                      onSelect={handleDurationChange}
                      mode="toggle"
                      panelTitle="Duration"
                      triggerIcon={<FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />}
                    />
                  </Tooltip>
                )}
                {hasSound && (
                  <Tooltip content={generateWithSound ? "Sound: ON" : "Sound: OFF"} position="top" className="z-50" delay={200}>
                    <ToggleButton
                      isActive={generateWithSound}
                      icon={faWaveformLines}
                      activeIcon={faWaveformLines}
                      onClick={() => setUi({ generateWithSound: !generateWithSound })}
                      className={generateWithSound ? "bg-primary/40 hover:bg-primary/50 border-primary/30" : undefined}
                    />
                  </Tooltip>
                )}
                {inputModeItems && (
                  <Tooltip content="Input Mode" position="top" className="z-50" closeOnClick>
                    <PopoverMenu items={inputModeItems} onSelect={handleInputModeChange} mode="toggle" panelTitle="Input Mode" />
                  </Tooltip>
                )}
              </>
            }
          />
        </div>
      }
      modals={
        <>
          <ImagePickerModal
            isOpen={isImagePickerOpen}
            onClose={() => setIsImagePickerOpen(false)}
            onSelect={handleLibraryImageSelect}
            maxSelect={Math.max(
              1,
              (isReferenceMode ? (selectedModel?.image_references_max ?? 3) : 1) - referenceImages.length,
            )}
          />
          <Lightbox
            isOpen={lightbox.lightboxOpen}
            onClose={lightbox.closeLightbox}
            mediaToken={lightbox.lightboxItem?.id}
            cdnUrl={lightbox.lightboxItem?.fullImage}
            mediaClass={lightbox.lightboxItem?.mediaClass}
            batchImageToken={lightbox.lightboxItem?.batchImageToken}
            onNavigatePrev={lightbox.navigatePrev}
            onNavigateNext={lightbox.navigateNext}
            onDeleted={gallery.removeItem}
          />
        </>
      }
    />
  );
}
