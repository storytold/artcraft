import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCircleExclamation,
  faFilm,
  faSpinnerThird,
  faTriangleExclamation,
  faWaveformLines,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { UsersApi, UserInfo } from "@storyteller/api";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Badge } from "@storyteller/ui-badge";
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
import Seo from "../../components/seo";
import Footer from "../../components/footer";
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

// ── Build PopoverMenu items ───────────────────────────────────────────────

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
  const [user, setUser] = useState<UserInfo | undefined>(undefined);
  const [authChecked, setAuthChecked] = useState(false);

  // Persisted UI state from Zustand store
  const ui = useCreateVideoStore((s) => s.ui);
  const setUi = useCreateVideoStore((s) => s.setUi);

  const selectedModel = useMemo(
    () =>
      ui.selectedModelId
        ? (WEB_VIDEO_MODELS.find((m) => m.id === ui.selectedModelId) ??
          DEFAULT_MODEL)
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

  // Prompt height for dynamic padding
  const promptBoxRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState(138);

  // Store
  const batches = useCreateVideoStore((s) => s.batches);
  const startBatch = useCreateVideoStore((s) => s.startBatch);
  const setBatchJobToken = useCreateVideoStore((s) => s.setBatchJobToken);
  const completeBatch = useCreateVideoStore((s) => s.completeBatch);
  const failBatch = useCreateVideoStore((s) => s.failBatch);
  const dismissBatch = useCreateVideoStore((s) => s.dismissBatch);
  const resetBatches = useCreateVideoStore((s) => s.reset);

  // Active polling cleanup refs
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());

  const hasAnyBatches = batches.length > 0;
  const inverseBatches = useMemo(() => [...batches].reverse(), [batches]);

  const hasSizeOptions = selectedModel.sizeOptions.length > 0;
  const hasResolutionOptions =
    (selectedModel.resolutionOptions?.length ?? 0) > 0;
  const hasSound = !!selectedModel.generateWithSound;
  const supportsImagePrompts =
    selectedModel.startFrame ||
    selectedModel.requiresImage ||
    !!selectedModel.supportsReferenceMode;
  const supportsRefMode = !!selectedModel.supportsReferenceMode;
  const inputMode = ui.inputMode;
  const isReferenceMode = supportsRefMode && inputMode === "reference";
  const hasEndFrame = !!(selectedModel.endFrame && !isReferenceMode);
  const needsImage =
    selectedModel.requiresImage && referenceImages.length === 0;

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

  // Build @-mention items from all references
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

  // Model popover items
  const modelItems = useMemo(
    () => buildModelPopoverItems(WEB_VIDEO_MODELS, selectedModel.id),
    [selectedModel.id],
  );

  // Size popover items
  const sizeItems = useMemo(
    () => buildSizePopoverItems(selectedModel.sizeOptions, selectedSize),
    [selectedModel.sizeOptions, selectedSize],
  );

  // Duration popover items
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

  // Resolution popover items
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

  // Input mode toggle items (keyframe vs reference)
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

  const handleInputModeChange = useCallback(
    (item: PopoverItem) => {
      const mode = item.label === "Reference" ? "reference" : "keyframe";
      if (mode === inputMode) return;
      setUi({ inputMode: mode });
      // Clear incompatible media when switching modes
      if (mode === "reference") {
        setEndFrameImage(undefined);
      } else {
        setReferenceVideos([]);
        setReferenceAudios([]);
      }
    },
    [inputMode, setUi],
  );

  // ── Effects ──────────────────────────────────────────────────────────────

  // Check auth
  useEffect(() => {
    const checkSession = async () => {
      const api = new UsersApi();
      const response = await api.GetSession();
      if (response.success && response.data?.loggedIn && response.data.user) {
        setUser(response.data.user);
      }
      setAuthChecked(true);
    };
    checkSession();

    const handleAuthChange = () => checkSession();
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  // Resume polling for pending batches on mount, cleanup on unmount
  useEffect(() => {
    const cleanups = pollingCleanupsRef.current;

    // Resume polling for any pending batches that have a jobToken
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

  // Measure prompt box height for batch area padding
  useEffect(() => {
    const el = promptBoxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setPromptHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleModelChange = useCallback(
    (item: PopoverItem) => {
      const model = (item as any).model as VideoModel | undefined;
      if (!model) return;
      setUi({
        selectedModelId: model.id,
        selectedSize:
          model.sizeOptions[0]?.tauriValue ?? "wide_sixteen_by_nine",
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
    (item: PopoverItem) => {
      setResolution(item.label);
    },
    [setResolution],
  );

  const handleLibraryImageSelect = useCallback(
    (images: { token: string; url: string; thumbnailUrl: string }[]) => {
      const maxImages = isReferenceMode
        ? (selectedModel.maxReferenceImages ?? 3)
        : 1;
      const availableSlots = Math.max(0, maxImages - referenceImages.length);
      const newImages: RefImage[] = images
        .slice(0, availableSlots)
        .map((img) => ({
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
      // Get the first reference image token for start frame (non-reference mode)
      const imageMediaToken =
        !isReferenceMode && supportsImagePrompts && referenceImages.length > 0
          ? referenceImages[0].mediaToken
          : undefined;

      // End frame token (non-reference mode only)
      const endFrameMediaToken =
        !isReferenceMode && hasEndFrame && endFrameImage?.mediaToken
          ? endFrameImage.mediaToken
          : undefined;

      // Get reference media tokens (reference mode)
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
        endFrameImageMediaToken: endFrameMediaToken?.length
          ? endFrameMediaToken
          : undefined,
        referenceImageMediaTokens: referenceImageMediaTokens?.length
          ? referenceImageMediaTokens
          : undefined,
        referenceVideoMediaTokens: referenceVideoMediaTokens?.length
          ? referenceVideoMediaTokens
          : undefined,
        referenceAudioMediaTokens: referenceAudioMediaTokens?.length
          ? referenceAudioMediaTokens
          : undefined,
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
    prompt,
    isGenerating,
    needsImage,
    isReferenceMode,
    selectedModel,
    selectedSize,
    duration,
    resolution,
    generateWithSound,
    hasResolutionOptions,
    hasSound,
    supportsImagePrompts,
    hasEndFrame,
    referenceImages,
    endFrameImage,
    referenceVideos,
    referenceAudios,
    startBatch,
    setBatchJobToken,
    completeBatch,
    failBatch,
  ]);

  // ── Render ────────────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#101014]">
        <FontAwesomeIcon
          icon={faSpinnerThird}
          className="animate-spin text-4xl text-primary/80"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-[#101014] text-white">
        <Seo
          title="Create Video - ArtCraft"
          description="Generate stunning AI videos with ArtCraft"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-teal-400/10 opacity-40 blur-[120px]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20">
          <FontAwesomeIcon
            icon={faFilm}
            className="mb-6 text-5xl text-white/20"
          />
          <h1 className="mb-3 text-4xl font-bold">Create Video</h1>
          <p className="mb-8 max-w-md text-center text-lg text-white/60">
            Sign in to generate stunning AI videos with multiple models
          </p>
          <div className="flex gap-3">
            <Link to="/login">
              <Button
                variant="primary"
                className="bg-white px-6 py-2.5 font-semibold text-black shadow-md hover:bg-white/90"
              >
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                variant="primary"
                className="px-6 py-2.5 font-semibold shadow-md"
              >
                Sign up
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const bottomOffsetPx = promptHeight + 48;

  return (
    <div className="flex h-screen w-full bg-[#101014] text-white">
      <Seo
        title="Create Video - ArtCraft"
        description="Generate stunning AI videos with ArtCraft"
      />

      {/* Subtle glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-[#00AABA] opacity-[0.12] blur-[120px] transform-gpu" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#00AABA] via-blue-500 to-purple-600 opacity-[0.08] blur-[120px] transform-gpu" />
        <div className="absolute bottom-[10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-600 to-pink-500 opacity-[0.06] blur-[140px] transform-gpu" />
      </div>

      <div className="relative z-[1] h-full w-full p-4 lg:p-16">
        <div className="flex h-full w-full flex-col items-center justify-center">
          {/* ── Empty state ─────────────────────────────────────────── */}
          {!hasAnyBatches && (
            <div className="animate-fade-in-up relative z-20 mb-32 flex flex-col items-center justify-center text-center drop-shadow-xl">
              <h1 className="text-5xl font-bold text-white md:text-7xl">
                Generate Video
              </h1>
              <span className="pt-2 text-lg text-white/80 md:text-xl">
                Add a prompt, then generate
              </span>
            </div>
          )}

          {/* ── Batch results ───────────────────────────────────────── */}
          {hasAnyBatches && (
            <div
              className="h-full w-full overflow-y-auto pt-20"
              style={{ paddingBottom: bottomOffsetPx }}
            >
              <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 lg:px-16">
                {inverseBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="relative flex items-stretch gap-4"
                  >
                    {/* Video area */}
                    <div className="flex-1">
                      {batch.status === "failed" ? (
                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg bg-red-500/10 text-red-400">
                          <FontAwesomeIcon
                            icon={faCircleExclamation}
                            size="2x"
                          />
                          <span className="px-4 text-center text-sm font-medium">
                            {batch.failureReason || "Generation failed"}
                          </span>
                          <button
                            onClick={() => dismissBatch(batch.id)}
                            className="mt-1 flex items-center gap-1.5 rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
                          >
                            <FontAwesomeIcon icon={faXmark} />
                            Dismiss
                          </button>
                        </div>
                      ) : batch.status === "pending" ? (
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-white/[0.03]">
                          <div className="flex h-full w-full items-center justify-center">
                            <FontAwesomeIcon
                              icon={faSpinnerThird}
                              className="animate-spin text-3xl text-white/20"
                            />
                          </div>
                        </div>
                      ) : batch.video ? (
                        <video
                          className="aspect-video w-full rounded-lg bg-black/10 object-contain"
                          src={batch.video.cdn_url}
                          controls
                          autoPlay
                          loop
                          muted
                        />
                      ) : null}
                    </div>

                    {/* Sidebar spacer (desktop) */}
                    <div
                      className="hidden w-[320px] shrink-0 lg:flex"
                      aria-hidden="true"
                    />

                    {/* Sidebar with prompt + badge (desktop) */}
                    <div className="absolute bottom-0 right-0 top-0 hidden w-[320px] flex-col lg:flex">
                      <div className="glass min-h-0 overflow-y-auto rounded-xl px-4 py-3 text-left text-sm text-white/90">
                        {batch.prompt}
                      </div>
                      <div className="flex justify-end pt-2">
                        <Badge
                          label={batch.modelLabel}
                          className="px-2 py-1 text-xs opacity-70"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Prompt box (fixed bottom center) ───────────────────── */}
          <div
            className="animate-fade-in-up fixed bottom-6 left-0 right-0 z-30 mx-auto w-full max-w-[730px] px-4"
            style={{ animationDelay: "150ms" }}
          >
            <PromptBox
              ref={promptBoxRef}
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleGenerate}
              isSubmitting={isGenerating || needsImage}
              credits={estimatedCredits}
              placeholder="Describe the video you want to generate..."
              supportsImagePrompts={supportsImagePrompts}
              maxImagePromptCount={
                isReferenceMode ? (selectedModel.maxReferenceImages ?? 3) : 1
              }
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
              isVideo
              isReferenceMode={isReferenceMode}
              endFrameImage={endFrameImage}
              onEndFrameImageChange={setEndFrameImage}
              showEndFrameSection={hasEndFrame}
              onPickFromLibrary={
                supportsImagePrompts
                  ? () => setIsImagePickerOpen(true)
                  : undefined
              }
              onClearAllRefs={() => {
                setReferenceImages([]);
                setEndFrameImage(undefined);
                setReferenceVideos([]);
                setReferenceAudios([]);
              }}
              showClearSession={hasAnyBatches}
              onClearSession={resetBatches}
              mentionItems={mentionItems.length > 0 ? mentionItems : undefined}
              mediaReferenceRow={
                isReferenceMode ? (
                  <MediaReferenceRow
                    referenceVideos={referenceVideos}
                    onReferenceVideosChange={setReferenceVideos}
                    maxVideoCount={selectedModel.maxReferenceVideos ?? 3}
                    maxVideoRefDuration={
                      selectedModel.maxVideoRefDuration ?? 30
                    }
                    referenceAudios={referenceAudios}
                    onReferenceAudiosChange={setReferenceAudios}
                    maxAudioCount={selectedModel.maxReferenceAudios ?? 2}
                    maxAudioRefDuration={
                      selectedModel.maxAudioRefDuration ?? 30
                    }
                  />
                ) : undefined
              }
              leftToolbar={
                <>
                  {hasSizeOptions && (
                    <Tooltip
                      content="Aspect Ratio"
                      position="top"
                      className="z-50"
                      closeOnClick
                    >
                      <PopoverMenu
                        items={sizeItems}
                        onSelect={handleSizeChange}
                        mode="toggle"
                        panelTitle="Aspect Ratio"
                        showIconsInList
                        triggerIcon={
                          <AspectRatioIcon
                            sizeIcon={
                              selectedModel.sizeOptions.find(
                                (s) => s.tauriValue === selectedSize,
                              )?.icon
                            }
                          />
                        }
                      />
                    </Tooltip>
                  )}
                  {resolutionItems && (
                    <Tooltip
                      content="Resolution"
                      position="top"
                      className="z-50"
                      closeOnClick
                    >
                      <PopoverMenu
                        items={resolutionItems}
                        onSelect={handleResolutionChange}
                        mode="toggle"
                        panelTitle="Resolution"
                      />
                    </Tooltip>
                  )}
                  {durationItems && (
                    <Tooltip
                      content="Duration"
                      position="top"
                      className="z-50"
                      closeOnClick
                    >
                      <PopoverMenu
                        items={durationItems}
                        onSelect={handleDurationChange}
                        mode="toggle"
                        panelTitle="Duration"
                        triggerIcon={
                          <FontAwesomeIcon
                            icon={faClock}
                            className="h-3.5 w-3.5"
                          />
                        }
                      />
                    </Tooltip>
                  )}
                  {hasSound && (
                    <Tooltip
                      content={generateWithSound ? "Sound: ON" : "Sound: OFF"}
                      position="top"
                      className="z-50"
                      delay={200}
                    >
                      <ToggleButton
                        isActive={generateWithSound}
                        icon={faWaveformLines}
                        activeIcon={faWaveformLines}
                        onClick={() =>
                          setUi({ generateWithSound: !generateWithSound })
                        }
                        className={
                          generateWithSound
                            ? "bg-primary/40 hover:bg-primary/50 border-primary/30"
                            : undefined
                        }
                      />
                    </Tooltip>
                  )}
                  {inputModeItems && (
                    <Tooltip
                      content="Input Mode"
                      position="top"
                      className="z-50"
                      closeOnClick
                    >
                      <PopoverMenu
                        items={inputModeItems}
                        onSelect={handleInputModeChange}
                        mode="toggle"
                        panelTitle="Input Mode"
                      />
                    </Tooltip>
                  )}
                </>
              }
            />
            {/* Seedance 2.0 warning */}
            {selectedModel.id === "seedance_2p0" && (
              <div className="mt-2 flex items-start gap-2.5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3.5 py-2.5 text-xs text-yellow-200">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-400"
                />
                <span>
                  Seedance 2.0 is in Early Alpha. Generations may be slow and
                  may experience outages. Seedance may reject safe inputs
                  unexpectedly. Try several short generations before longer
                  ones.
                </span>
              </div>
            )}
          </div>

          {/* ── Model selector (bottom left) ───────────────────────── */}
          <div
            className="animate-fade-in-up fixed bottom-6 left-6 z-20 hidden items-center gap-5 lg:flex"
            style={{ animationDelay: "300ms" }}
          >
            <PopoverMenu
              items={modelItems}
              onSelect={handleModelChange}
              mode="hoverSelect"
              panelTitle="Select Model"
              panelClassName="min-w-[300px]"
              buttonClassName="bg-transparent border-0 shadow-none p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
              showIconsInList
              triggerLabel="Model"
              maxListHeight={400}
            />
          </div>
        </div>
      </div>

      {/* ── Image Picker Modal ───────────────────────────────────── */}
      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={handleLibraryImageSelect}
        maxSelect={Math.max(
          1,
          (isReferenceMode ? (selectedModel.maxReferenceImages ?? 3) : 1) -
            referenceImages.length,
        )}
      />
    </div>
  );
}
