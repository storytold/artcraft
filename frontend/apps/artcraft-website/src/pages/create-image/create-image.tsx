import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { faImage } from "@fortawesome/pro-solid-svg-icons";
import { FilterMediaClasses } from "@storyteller/api";
import type { OmniGenImageModelInfo } from "@storyteller/api";
import { type PopoverItem } from "@storyteller/ui-popover";
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
  startPolling,
} from "./generate-image-api";
import { AspectRatioPicker } from "./components/AspectRatioPicker";
import { GenerationCountPicker } from "./components/GenerationCountPicker";
import { ResolutionPicker } from "./components/ResolutionPicker";
import { useImageCostEstimate } from "../../lib/cost-estimate-api";
import {
  useOmniGenImageModels,
  getModelCreatorIconPath,
  getModelDisplayName,
} from "../../lib/omni-gen-hooks";

// ── Constants ────────────────────────────────────────────────────────────

const DEFAULT_MODEL_ID = "nano_banana_2";

const IMAGE_FILTER = [FilterMediaClasses.IMAGE];

// Store API model data alongside popover items via a lookup map
let _modelLookup = new Map<string, OmniGenImageModelInfo>();

function buildModelPopoverItems(
  models: OmniGenImageModelInfo[],
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
    action: model.model, // use action to carry the model id
  }));
}

// ── Component ────────────────────────────────────────────────────────────

export default function CreateImage() {
  const { user, authChecked } = useAuthCheck();
  const { promptBoxRef, promptHeight } = usePromptHeight();

  // Fetch models from API
  const { models: apiModels } = useOmniGenImageModels();

  // UI state
  const ui = useCreateImageStore((s) => s.ui);
  const setUi = useCreateImageStore((s) => s.setUi);

  const selectedModel = useMemo((): OmniGenImageModelInfo | undefined => {
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
  const aspectRatio = ui.aspectRatio;
  const setAspectRatio = useCallback(
    (v: string) => setUi({ aspectRatio: v }),
    [setUi],
  );
  const numImages = ui.numImages;
  const setNumImages = useCallback(
    (v: number) => setUi({ numImages: v }),
    [setUi],
  );
  const resolution = ui.resolution;
  const setResolution = useCallback(
    (v: string | undefined) => setUi({ resolution: v }),
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
  const hasAspectRatios = (selectedModel?.aspect_ratio_options?.length ?? 0) > 0;
  const hasResolutions = (selectedModel?.resolution_options?.length ?? 0) > 0;

  const estimatedCredits = useImageCostEstimate({
    model: selectedModel?.model ?? "",
    aspectRatio: aspectRatio,
    resolution: hasResolutions ? resolution : undefined,
    numImages,
    hasReferenceImages: referenceImages.length > 0,
  });

  const modelItems = useMemo(
    () => buildModelPopoverItems(apiModels, selectedModel?.model ?? ""),
    [apiModels, selectedModel?.model],
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
      const model = item.action ? _modelLookup.get(item.action) : undefined;
      if (!model) return;
      setUi({
        selectedModelId: model.model,
        aspectRatio: model.aspect_ratio_default ?? "square",
        numImages: Math.min(
          model.batch_size_max ?? 4,
          model.batch_size_default ?? 1,
        ),
        resolution: model.resolution_default ?? undefined,
      });
    },
    [setUi],
  );

  const handleLibraryImageSelect = useCallback(
    (images: { token: string; url: string; thumbnailUrl: string }[]) => {
      const maxImages = selectedModel?.image_refs_max ?? 1;
      const availableSlots = Math.max(0, maxImages - referenceImages.length);
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
    if (!prompt.trim() || isGenerating || !selectedModel) return;

    setIsGenerating(true);
    const batchId = startBatch(
      prompt,
      numImages,
      selectedModel.full_name ?? selectedModel.model,
    );

    try {
      const imageMediaTokens = selectedModel.image_refs_supported
        ? referenceImages
            .map((img) => img.mediaToken)
            .filter((t) => t.length > 0)
        : undefined;

      const result = await enqueueImageGeneration({
        prompt: prompt.trim(),
        model: selectedModel.model,
        numImages,
        aspectRatio: aspectRatio,
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
            supportsImagePrompts={!!selectedModel?.image_refs_supported}
            maxImagePromptCount={selectedModel?.image_refs_max ?? 1}
            referenceImages={referenceImages}
            onReferenceImagesChange={setReferenceImages}
            onPickFromLibrary={() => setIsImagePickerOpen(true)}
            showClearSession={batches.length > 0}
            onClearSession={useCreateImageStore.getState().reset}
            leftToolbar={
              <>
                {hasAspectRatios && selectedModel && (
                  <AspectRatioPicker
                    aspectRatioOptions={selectedModel.aspect_ratio_options ?? []}
                    defaultAspectRatio={selectedModel.aspect_ratio_default ?? undefined}
                    currentAspectRatio={aspectRatio}
                    handleAspectRatioSelect={setAspectRatio}
                  />
                )}
                {hasResolutions && selectedModel && (
                  <ResolutionPicker
                    resolutionOptions={selectedModel.resolution_options ?? []}
                    defaultResolution={selectedModel.resolution_default ?? undefined}
                    currentResolution={resolution}
                    handleResolutionSelect={setResolution}
                  />
                )}
              </>
            }
            rightToolbar={
              <GenerationCountPicker
                batchSizeMax={selectedModel?.batch_size_max ?? 4}
                batchSizeOptions={selectedModel?.batch_size_options}
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
              (selectedModel?.image_refs_max ?? 1) - referenceImages.length,
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
