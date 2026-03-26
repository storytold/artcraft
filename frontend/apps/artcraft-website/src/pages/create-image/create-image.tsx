import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faImage } from "@fortawesome/pro-solid-svg-icons";
import { FilterMediaClasses } from "@storyteller/api";
import { type PopoverItem } from "@storyteller/ui-popover";
import {
  IMAGE_MODELS,
  ImageModel,
  getCreatorIcon,
  CommonAspectRatio,
  CommonResolution,
} from "@storyteller/model-list";
import {
  PromptBox,
  ImagePickerModal,
  type RefImage,
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
import { useCreateImageStore } from "./create-image-store";
import {
  enqueueImageGeneration,
  modelHasWebEndpoint,
  startPolling,
} from "./generate-image-api";
import { AspectRatioPicker } from "./components/AspectRatioPicker";
import { GenerationCountPicker } from "./components/GenerationCountPicker";
import { ResolutionPicker } from "./components/ResolutionPicker";
import { useImageCostEstimate } from "../../lib/cost-estimate-api";

// ── Models available via REST ─────────────────────────────────────────────

const WEB_IMAGE_MODELS = IMAGE_MODELS.filter(
  (m) => m.canTextToImage && modelHasWebEndpoint(m.tauriId),
).sort((a, b) => a.selectorName.localeCompare(b.selectorName));

const DEFAULT_MODEL_ID = "nano_banana_2";
const DEFAULT_MODEL =
  WEB_IMAGE_MODELS.find((m) => m.id === DEFAULT_MODEL_ID) ??
  WEB_IMAGE_MODELS[0];

const MODEL_FALLBACK_ICON = (
  <FontAwesomeIcon icon={faImage} className="h-4 w-4" />
);

const IMAGE_FILTER = [FilterMediaClasses.IMAGE];

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
  const { user, authChecked } = useAuthCheck();
  const { promptBoxRef, promptHeight } = usePromptHeight();

  // UI state
  const ui = useCreateImageStore((s) => s.ui);
  const setUi = useCreateImageStore((s) => s.setUi);

  const selectedModel = useMemo(
    () =>
      ui.selectedModelId
        ? (WEB_IMAGE_MODELS.find((m) => m.id === ui.selectedModelId) ?? DEFAULT_MODEL)
        : DEFAULT_MODEL,
    [ui.selectedModelId],
  );

  const prompt = ui.prompt;
  const setPrompt = useCallback((v: string) => setUi({ prompt: v }), [setUi]);
  const aspectRatio = ui.aspectRatio as CommonAspectRatio;
  const setAspectRatio = useCallback(
    (v: CommonAspectRatio) => setUi({ aspectRatio: v }),
    [setUi],
  );
  const numImages = ui.numImages;
  const setNumImages = useCallback(
    (v: number) => setUi({ numImages: v }),
    [setUi],
  );
  const resolution = ui.resolution as CommonResolution | undefined;
  const setResolution = useCallback(
    (v: CommonResolution | undefined) => setUi({ resolution: v }),
    [setUi],
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImages, setReferenceImages] = useState<RefImage[]>([]);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Batch store (enqueue flow only)
  const batches = useCreateImageStore((s) => s.batches);
  const startBatch = useCreateImageStore((s) => s.startBatch);
  const setBatchJobToken = useCreateImageStore((s) => s.setBatchJobToken);
  const completeBatch = useCreateImageStore((s) => s.completeBatch);
  const failBatch = useCreateImageStore((s) => s.failBatch);
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());

  // Jobs + gallery
  const jobs = useGenerationJobs({ mediaType: "image" });
  const gallery = useGalleryData({
    username: user?.username ?? null,
    filterMediaClasses: IMAGE_FILTER,
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

  // Derived
  const hasAspectRatios =
    (selectedModel.aspectRatios?.length ?? 0) > 0 &&
    selectedModel.supportsNewAspectRatio();
  const hasResolutions = selectedModel.supportsNewResolution();

  const estimatedCredits = useImageCostEstimate({
    modelTauriId: selectedModel.tauriId,
    aspectRatio: aspectRatio as string,
    resolution: hasResolutions ? resolution : undefined,
    numImages,
    hasReferenceImages: referenceImages.length > 0,
  });

  const modelItems = useMemo(
    () => buildModelPopoverItems(WEB_IMAGE_MODELS, selectedModel.id),
    [selectedModel.id],
  );

  const hasContent =
    jobs.inProgress.length > 0 ||
    jobs.failed.length > 0 ||
    jobs.newlyCompleted.length > 0 ||
    gallery.items.length > 0 ||
    gallery.isInitialLoading;

  // ── Effects ──────────────────────────────────────────────────────────────

  // Resume polling for pending batches
  useEffect(() => {
    const cleanups = pollingCleanupsRef.current;
    const pendingBatches = useCreateImageStore
      .getState()
      .batches.filter((b) => b.status === "pending" && b.jobToken);

    for (const batch of pendingBatches) {
      if (cleanups.has(batch.id)) continue;
      const stop = startPolling(
        batch.jobToken!,
        (images) => {
          completeBatch(batch.id, images);
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
      const model = (item as any).model as ImageModel | undefined;
      if (!model) return;
      setUi({
        selectedModelId: model.id,
        aspectRatio:
          (model.defaultAspectRatio as CommonAspectRatio) ?? CommonAspectRatio.Square,
        numImages: Math.min(
          model.maxGenerationCount ?? 4,
          model.defaultGenerationCount ?? 1,
        ),
        resolution: model.defaultResolution ?? undefined,
      });
    },
    [setUi],
  );

  const handleLibraryImageSelect = useCallback(
    (images: { token: string; url: string; thumbnailUrl: string }[]) => {
      const availableSlots = Math.max(
        0,
        (selectedModel.maxImagePromptCount ?? 1) - referenceImages.length,
      );
      const newImages: RefImage[] = images.slice(0, availableSlots).map((img) => ({
        id: Math.random().toString(36).substring(7),
        url: img.thumbnailUrl || img.url,
        file: new File([], "library-image"),
        mediaToken: img.token,
      }));
      setReferenceImages([...referenceImages, ...newImages]);
    },
    [referenceImages, selectedModel],
  );

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    const batchId = startBatch(prompt, numImages, selectedModel.fullName);

    try {
      const imageMediaTokens = selectedModel.canUseImagePrompt
        ? referenceImages
          .map((img) => img.mediaToken)
          .filter((t) => t.length > 0)
        : undefined;

      const result = await enqueueImageGeneration({
        prompt: prompt.trim(),
        modelTauriId: selectedModel.tauriId,
        numImages,
        aspectRatio: aspectRatio as string,
        resolution: hasResolutions ? resolution : undefined,
        imageMediaTokens: imageMediaTokens?.length ? imageMediaTokens : undefined,
      });

      if (!result.success || !result.jobToken) {
        failBatch(batchId, result.error ?? "Failed to start generation");
        setIsGenerating(false);
        return;
      }

      setBatchJobToken(batchId, result.jobToken);
      window.dispatchEvent(new Event("credits-change"));
      window.dispatchEvent(new Event("task-queue-update"));

      const stopPolling = startPolling(
        result.jobToken,
        (images) => {
          completeBatch(batchId, images);
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
    prompt, isGenerating, selectedModel, numImages, aspectRatio, resolution,
    hasResolutions, referenceImages, startBatch, setBatchJobToken, completeBatch, failBatch,
  ]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <CreateMediaPageShell
      title="Create Image - ArtCraft"
      description="Generate stunning AI images with ArtCraft"
      authChecked={authChecked}
      isLoggedIn={!!user}
      heroIcon={faImage}
      heroTitle="Create Image"
      heroSubtitle="Sign in to generate stunning AI images with multiple models"
      hasContent={hasContent}
      emptyStateTitle="Generate Image"
      emptyStateSubtitle="Add a prompt, then generate"
      bottomOffset={promptHeight + 24}
      modelItems={modelItems}
      onModelChange={handleModelChange}
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
          <PromptBox
            ref={promptBoxRef}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleGenerate}
            isSubmitting={isGenerating}
            credits={estimatedCredits}
            placeholder="Describe what you want in the image..."
            supportsImagePrompts={selectedModel.canUseImagePrompt}
            maxImagePromptCount={selectedModel.maxImagePromptCount}
            referenceImages={referenceImages}
            onReferenceImagesChange={setReferenceImages}
            onPickFromLibrary={() => setIsImagePickerOpen(true)}
            showClearSession={batches.length > 0}
            onClearSession={useCreateImageStore.getState().reset}
            leftToolbar={
              <>
                {hasAspectRatios && (
                  <AspectRatioPicker
                    model={selectedModel}
                    currentAspectRatio={aspectRatio}
                    handleCommonAspectRatioSelect={setAspectRatio}
                  />
                )}
                {hasResolutions && (
                  <ResolutionPicker
                    model={selectedModel}
                    currentResolution={resolution}
                    handleCommonResolutionSelect={setResolution}
                  />
                )}
              </>
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
      }
      modals={
        <>
          <ImagePickerModal
            isOpen={isImagePickerOpen}
            onClose={() => setIsImagePickerOpen(false)}
            onSelect={handleLibraryImageSelect}
            maxSelect={Math.max(
              1,
              (selectedModel.maxImagePromptCount ?? 1) - referenceImages.length,
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
