import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCircleExclamation,
  faImage,
  faSpinnerThird,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { UsersApi, UserInfo } from "@storyteller/api";
import { Button } from "@storyteller/ui-button";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Badge } from "@storyteller/ui-badge";
import {
  IMAGE_MODELS,
  ImageModel,
  getCreatorIcon,
  CommonAspectRatio,
} from "@storyteller/model-list";
import { getThumbnailUrl, THUMBNAIL_SIZES } from "@storyteller/common";
import Seo from "../../components/seo";
import Footer from "../../components/footer";
import { PromptBox, type RefImage } from "../../components/prompt-box";
import {
  useCreateImageStore,
  type GeneratedImage,
} from "./create-image-store";
import {
  enqueueImageGeneration,
  modelHasWebEndpoint,
  startPolling,
} from "./generate-image-api";
import { AspectRatioPicker } from "./components/AspectRatioPicker";
import { GenerationCountPicker } from "./components/GenerationCountPicker";

// ── Models available via REST ─────────────────────────────────────────────

const WEB_IMAGE_MODELS = IMAGE_MODELS.filter(
  (m) => m.canTextToImage && modelHasWebEndpoint(m.tauriId),
).sort((a, b) => a.selectorName.localeCompare(b.selectorName));

const DEFAULT_MODEL =
  WEB_IMAGE_MODELS.find((m) => m.id === "nano_banana_2") ??
  WEB_IMAGE_MODELS[0];

const MODEL_FALLBACK_ICON = (
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);

// ── Build PopoverMenu items for model selector ─────────────────────────────

function buildModelPopoverItems(
  models: ImageModel[],
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

// ── Component ─────────────────────────────────────────────────────────────

export default function CreateImage() {
  const [user, setUser] = useState<UserInfo | undefined>(undefined);
  const [authChecked, setAuthChecked] = useState(false);

  // Generation state
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<ImageModel>(DEFAULT_MODEL);
  const [aspectRatio, setAspectRatio] = useState<CommonAspectRatio>(
    (DEFAULT_MODEL.defaultAspectRatio as CommonAspectRatio) ??
      CommonAspectRatio.Square,
  );
  const [numImages, setNumImages] = useState(
    DEFAULT_MODEL.defaultGenerationCount ?? 1,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImages, setReferenceImages] = useState<RefImage[]>([]);

  // Prompt height for dynamic padding
  const promptBoxRef = useRef<HTMLDivElement>(null);
  const [promptHeight, setPromptHeight] = useState(138);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    prompt: string;
  } | null>(null);

  // Store
  const batches = useCreateImageStore((s) => s.batches);
  const startBatch = useCreateImageStore((s) => s.startBatch);
  const setBatchJobToken = useCreateImageStore((s) => s.setBatchJobToken);
  const completeBatch = useCreateImageStore((s) => s.completeBatch);
  const failBatch = useCreateImageStore((s) => s.failBatch);
  const dismissBatch = useCreateImageStore((s) => s.dismissBatch);
  const resetBatches = useCreateImageStore((s) => s.reset);

  // Active polling cleanup refs
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());

  const hasAnyBatches = batches.length > 0;
  const inverseBatches = useMemo(() => [...batches].reverse(), [batches]);

  const hasAspectRatios =
    (selectedModel.aspectRatios?.length ?? 0) > 0 &&
    selectedModel.supportsNewAspectRatio();

  // Model popover items
  const modelItems = useMemo(
    () => buildModelPopoverItems(WEB_IMAGE_MODELS, selectedModel.id),
    [selectedModel.id],
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

  // Cleanup polling on unmount
  useEffect(() => {
    const cleanups = pollingCleanupsRef.current;
    return () => {
      cleanups.forEach((stop) => stop());
      cleanups.clear();
    };
  }, []);

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

  const handleModelChange = useCallback((item: PopoverItem) => {
    const model = (item as any).model as ImageModel | undefined;
    if (!model) return;
    setSelectedModel(model);
    setAspectRatio(
      (model.defaultAspectRatio as CommonAspectRatio) ??
        CommonAspectRatio.Square,
    );
    setNumImages(
      Math.min(
        model.maxGenerationCount ?? 4,
        model.defaultGenerationCount ?? 1,
      ),
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    const batchId = startBatch(prompt, numImages, selectedModel.fullName);

    try {
      const imageMediaTokens = selectedModel.canUseImagePrompt
        ? referenceImages.map((img) => img.mediaToken).filter((t) => t.length > 0)
        : undefined;

      const result = await enqueueImageGeneration({
        prompt: prompt.trim(),
        modelTauriId: selectedModel.tauriId,
        numImages,
        aspectRatio: aspectRatio as string,
        imageMediaTokens: imageMediaTokens?.length ? imageMediaTokens : undefined,
      });

      if (!result.success || !result.jobToken) {
        failBatch(batchId, result.error ?? "Failed to start generation");
        setIsGenerating(false);
        return;
      }

      setBatchJobToken(batchId, result.jobToken);

      const stopPolling = startPolling(
        result.jobToken,
        (images: GeneratedImage[]) => {
          completeBatch(batchId, images);
          pollingCleanupsRef.current.delete(batchId);
        },
        (reason: string) => {
          failBatch(batchId, reason);
          pollingCleanupsRef.current.delete(batchId);
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
    selectedModel,
    numImages,
    aspectRatio,
    referenceImages,
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
          className="animate-spin text-2xl text-white/40"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-[#101014] text-white">
        <Seo
          title="Create Image - ArtCraft"
          description="Generate stunning AI images with ArtCraft"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-teal-400/10 opacity-40 blur-[120px]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20">
          <FontAwesomeIcon
            icon={faImage}
            className="mb-6 text-5xl text-white/20"
          />
          <h1 className="mb-3 text-4xl font-bold">Create Image</h1>
          <p className="mb-8 max-w-md text-center text-lg text-white/60">
            Sign in to generate stunning AI images with multiple models
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
        title="Create Image - ArtCraft"
        description="Generate stunning AI images with ArtCraft"
      />

      <div className="relative h-full w-full p-4 lg:p-16">
        <div className="flex h-full w-full flex-col items-center justify-center">
          {/* ── Empty state ─────────────────────────────────────────── */}
          {!hasAnyBatches && (
            <div className="relative z-20 mb-52 flex flex-col items-center justify-center text-center drop-shadow-xl">
              <span className="text-5xl font-bold text-white md:text-7xl">
                Generate Image
              </span>
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
              <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-2">
                {inverseBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="relative flex items-stretch gap-4"
                  >
                    {/* Image grid */}
                    <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
                      {batch.status === "failed" ? (
                        <>
                          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg bg-red-500/10 text-red-400">
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
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={`empty-${batch.id}-${i}`}
                              className="aspect-square w-full rounded-lg bg-white/[0.02]"
                            />
                          ))}
                        </>
                      ) : batch.status === "pending" &&
                        batch.images.length === 0 ? (
                        <>
                          {Array.from({
                            length: Math.max(
                              1,
                              Math.min(4, batch.requestedCount),
                            ),
                          }).map((_, i) => (
                            <div
                              key={`sk-${batch.id}-${i}`}
                              className="aspect-square w-full overflow-hidden rounded-lg bg-white/[0.03]"
                            >
                              <div className="animate-shimmer h-full w-full" />
                            </div>
                          ))}
                          {Array.from({
                            length: Math.max(
                              0,
                              4 -
                                Math.max(
                                  1,
                                  Math.min(4, batch.requestedCount),
                                ),
                            ),
                          }).map((_, i) => (
                            <div
                              key={`filler-sk-${batch.id}-${i}`}
                              className="aspect-square w-full rounded-lg bg-white/[0.02]"
                            />
                          ))}
                        </>
                      ) : (
                        <>
                          {batch.images.slice(0, 4).map((img) => (
                            <button
                              key={img.media_token}
                              onClick={() =>
                                setLightboxImage({
                                  url:
                                    getThumbnailUrl(
                                      img.maybe_thumbnail_template,
                                      { width: 2048 },
                                    ) ?? img.cdn_url,
                                  prompt: batch.prompt,
                                })
                              }
                              className="aspect-square w-full overflow-hidden rounded-lg transition-opacity duration-200 hover:opacity-75"
                            >
                              <img
                                src={
                                  getThumbnailUrl(
                                    img.maybe_thumbnail_template,
                                    { width: THUMBNAIL_SIZES.LARGE },
                                  ) ?? img.cdn_url
                                }
                                alt="Generated"
                                loading="lazy"
                                className="h-full w-full bg-black/10 object-cover"
                              />
                            </button>
                          ))}
                          {Array.from({
                            length: Math.max(
                              0,
                              4 - batch.images.slice(0, 4).length,
                            ),
                          }).map((_, i) => (
                            <div
                              key={`filler-${batch.id}-${i}`}
                              className="aspect-square w-full rounded-lg bg-white/[0.02]"
                            />
                          ))}
                        </>
                      )}
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
          <div className="fixed bottom-6 left-1/2 z-30 w-full max-w-[730px] -translate-x-1/2 px-4">
            <PromptBox
              ref={promptBoxRef}
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleGenerate}
              isSubmitting={isGenerating}
              placeholder="Describe what you want in the image..."
              supportsImagePrompts={selectedModel.canUseImagePrompt}
              maxImagePromptCount={selectedModel.maxImagePromptCount}
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
              showClearSession={hasAnyBatches}
              onClearSession={resetBatches}
              leftToolbar={
                hasAspectRatios ? (
                  <AspectRatioPicker
                    model={selectedModel}
                    currentAspectRatio={aspectRatio}
                    handleCommonAspectRatioSelect={setAspectRatio}
                  />
                ) : undefined
              }
              rightToolbar={
                <GenerationCountPicker
                  currentModel={selectedModel}
                  currentCount={numImages}
                  handleCountChange={setNumImages}
                />
              }
            />
          </div>

          {/* ── Model selector (bottom left) ───────────────────────── */}
          <div className="fixed bottom-6 left-6 z-20 hidden items-center gap-5 lg:flex">
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

      {/* ── Lightbox ──────────────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
          </button>
          <div
            className="max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.prompt}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
