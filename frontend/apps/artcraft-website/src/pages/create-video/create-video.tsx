import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faFilm,
  faTriangleExclamation,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import { FilterMediaClasses } from "@storyteller/api";
import { ToggleButton } from "@storyteller/ui-button";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  VIDEO_MODELS,
  VideoModel,
  type SizeOption,
  getCreatorIcon,
} from "@storyteller/model-list";
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
  videoModelHasWebEndpoint,
  startVideoPolling,
} from "./generate-video-api";
import { AspectRatioIcon } from "../create-image/components/AspectRatioIcon";
import { useVideoCostEstimate } from "../../lib/cost-estimate-api";

// ── Models available via REST ─────────────────────────────────────────────

const WEB_VIDEO_MODELS = VIDEO_MODELS.filter((m) =>
  videoModelHasWebEndpoint(m.tauriId),
).sort((a, b) => a.selectorName.localeCompare(b.selectorName));

const DEFAULT_MODEL_ID = "seedance_2p0";
const DEFAULT_MODEL =
  WEB_VIDEO_MODELS.find((m) => m.id === DEFAULT_MODEL_ID) ??
  WEB_VIDEO_MODELS[0];

const MODEL_FALLBACK_ICON = (
  <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />
);

const VIDEO_FILTER = [FilterMediaClasses.VIDEO];

function buildModelPopoverItems(
  models: VideoModel[],
  selectedId: string,
): PopoverItem[] {
  return models.map((model) => ({
    label: model.selectorName,
    selected: model.id === selectedId,
    icon: getCreatorIcon(model.creator) ?? MODEL_FALLBACK_ICON,
    description: model.selectorDescription,
    badges: model.toLegacyBadges()?.map((b) => ({
      label: b.label,
      icon: <FontAwesomeIcon icon={faClock} />,
    })),
    model: model,
  }));
}

function buildSizePopoverItems(
  sizeOptions: SizeOption[],
  selectedValue: string,
): PopoverItem[] {
  return sizeOptions.map((opt) => ({
    label: opt.textLabel,
    selected: opt.tauriValue === selectedValue,
    icon: <AspectRatioIcon sizeIcon={opt.icon} />,
    sizeOption: opt,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────

export default function CreateVideo() {
  const { user, authChecked } = useAuthCheck();
  const { promptBoxRef, promptHeight } = usePromptHeight();

  // UI state
  const ui = useCreateVideoStore((s) => s.ui);
  const setUi = useCreateVideoStore((s) => s.setUi);

  const selectedModel = useMemo(
    () =>
      ui.selectedModelId
        ? (WEB_VIDEO_MODELS.find((m) => m.id === ui.selectedModelId) ?? DEFAULT_MODEL)
        : DEFAULT_MODEL,
    [ui.selectedModelId],
  );

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
  const resolution = ui.resolution ?? selectedModel.defaultResolution ?? null;
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
  const hasSizeOptions = selectedModel.sizeOptions.length > 0;
  const hasResolutionOptions = (selectedModel.resolutionOptions?.length ?? 0) > 0;
  const hasSound = !!selectedModel.generateWithSound;
  const supportsImagePrompts =
    selectedModel.startFrame ||
    selectedModel.requiresImage ||
    !!selectedModel.supportsReferenceMode;
  const supportsRefMode = !!selectedModel.supportsReferenceMode;
  const inputMode = ui.inputMode;
  const isReferenceMode = supportsRefMode && inputMode === "reference";
  const hasEndFrame = !!(selectedModel.endFrame && !isReferenceMode);
  const needsImage = selectedModel.requiresImage && referenceImages.length === 0;

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
    modelTauriId: selectedModel.tauriId,
    aspectRatio: selectedSize,
    resolution,
    duration: duration ?? selectedModel.defaultDuration,
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
    () => buildModelPopoverItems(WEB_VIDEO_MODELS, selectedModel.id),
    [selectedModel.id],
  );
  const sizeItems = useMemo(
    () => buildSizePopoverItems(selectedModel.sizeOptions, selectedSize),
    [selectedModel.sizeOptions, selectedSize],
  );
  const durationItems = useMemo(
    (): PopoverItem[] | null =>
      selectedModel.durationOptions
        ? selectedModel.durationOptions.map((d) => ({
          label: `${d}s`,
          selected: d === (duration ?? selectedModel.defaultDuration),
        }))
        : null,
    [selectedModel, duration],
  );
  const resolutionItems = useMemo(
    (): PopoverItem[] | null =>
      selectedModel.resolutionOptions
        ? selectedModel.resolutionOptions.map((r) => ({
          label: r,
          selected: r === (resolution ?? selectedModel.defaultResolution),
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
      const model = (item as any).model as VideoModel | undefined;
      if (!model) return;
      setUi({
        selectedModelId: model.id,
        selectedSize: model.sizeOptions[0]?.tauriValue ?? "wide_sixteen_by_nine",
        duration: model.defaultDuration ?? null,
        resolution: model.defaultResolution ?? null,
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
      const opt = (item as any).sizeOption as SizeOption | undefined;
      if (opt) setSelectedSize(opt.tauriValue);
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
      const maxImages = isReferenceMode ? (selectedModel.maxReferenceImages ?? 3) : 1;
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
    if (!prompt.trim() || isGenerating || needsImage) return;
    setIsGenerating(true);
    const batchId = startBatch(prompt, selectedModel.fullName);

    try {
      const imageMediaToken =
        !isReferenceMode && supportsImagePrompts && referenceImages.length > 0
          ? referenceImages[0].mediaToken
          : undefined;
      const endFrameMediaToken =
        !isReferenceMode && hasEndFrame && endFrameImage?.mediaToken
          ? endFrameImage.mediaToken
          : undefined;
      const referenceImageMediaTokens =
        isReferenceMode && referenceImages.length > 0
          ? referenceImages
            .map((img) => img.mediaToken)
            .filter((t) => t.length > 0)
          : undefined;
      const referenceVideoMediaTokens =
        isReferenceMode && referenceVideos.length > 0
          ? referenceVideos.map((v) => v.mediaToken).filter((t) => t.length > 0)
          : undefined;
      const referenceAudioMediaTokens =
        isReferenceMode && referenceAudios.length > 0
          ? referenceAudios.map((a) => a.mediaToken).filter((t) => t.length > 0)
          : undefined;

      const result = await enqueueVideoGeneration({
        prompt: prompt.trim(),
        modelTauriId: selectedModel.tauriId,
        aspectRatio: selectedSize,
        duration: duration ?? selectedModel.defaultDuration,
        resolution: hasResolutionOptions
          ? (resolution ?? selectedModel.defaultResolution ?? undefined)
          : undefined,
        generateAudio: hasSound ? generateWithSound : undefined,
        imageMediaToken: imageMediaToken?.length ? imageMediaToken : undefined,
        endFrameImageMediaToken: endFrameMediaToken?.length ? endFrameMediaToken : undefined,
        referenceImageMediaTokens: referenceImageMediaTokens?.length ? referenceImageMediaTokens : undefined,
        referenceVideoMediaTokens: referenceVideoMediaTokens?.length ? referenceVideoMediaTokens : undefined,
        referenceAudioMediaTokens: referenceAudioMediaTokens?.length ? referenceAudioMediaTokens : undefined,
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
          {selectedModel.id === "seedance_2p0" && (
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
            maxImagePromptCount={isReferenceMode ? (selectedModel.maxReferenceImages ?? 3) : 1}
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
                  maxVideoCount={selectedModel.maxReferenceVideos ?? 3}
                  maxVideoRefDuration={selectedModel.maxVideoRefDuration ?? 30}
                  referenceAudios={referenceAudios}
                  onReferenceAudiosChange={setReferenceAudios}
                  maxAudioCount={selectedModel.maxReferenceAudios ?? 2}
                  maxAudioRefDuration={selectedModel.maxAudioRefDuration ?? 30}
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
                        <AspectRatioIcon
                          sizeIcon={selectedModel.sizeOptions.find((s) => s.tauriValue === selectedSize)?.icon}
                        />
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
              (isReferenceMode ? (selectedModel.maxReferenceImages ?? 3) : 1) - referenceImages.length,
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
