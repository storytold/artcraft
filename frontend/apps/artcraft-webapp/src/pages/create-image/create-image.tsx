import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterMediaClasses } from "@storyteller/api";
import type { OmniGenImageModelInfo } from "@storyteller/api";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button } from "@storyteller/ui-button";
import { GalleryModal, type GalleryItem } from "@storyteller/ui-gallery-modal";
import {
  PromptBox,
  ImagePromptRow,
  MobilePromptForm,
  MobileSelectField,
  MobileFieldButton,
  MobileCountStepper,
  SettingsDrawer,
  DrawerOptionList,
  DrawerSection,
  type RefImage,
} from "../../components/prompt-box";
import {
  GenerationGallery,
  useGalleryData,
  useGenerationJobs,
  useAuthCheck,
  usePromptHeight,
  useLightboxNav,
  CreateMediaPageShell,
} from "../../components/generation-gallery";
import { Lightbox } from "../../components/lightbox/lightbox";
import { useCreateImageStore } from "./create-image-store";
import { enqueueImageGeneration, startPolling } from "./generate-image-api";
import {
  AspectRatioPicker,
  buildAspectRatioItems,
  aspectRatioFromLabel,
} from "./components/AspectRatioPicker";
import { GenerationCountPicker } from "./components/GenerationCountPicker";
import {
  ResolutionPicker,
  buildResolutionItems,
  resolutionFromLabel,
} from "./components/ResolutionPicker";
import {
  QualityPicker,
  buildQualityItems,
  qualityFromLabel,
} from "./components/QualityPicker";
import { useImageCostEstimate } from "../../lib/cost-estimate-api";
import {
  resolveModelOption,
  resolveModelCount,
} from "../../lib/resolve-model-setting";
import {
  useOmniGenImageModels,
  getModelCreatorIconPath,
  getModelDescription,
  getModelInfo,
  OMNI_GENERATE_OUTAGE_MESSAGE,
} from "../../lib/omni-gen-hooks";
import { toast } from "../../components/toast/toast";
import { useSignupCta } from "../../components/signup-cta-modal";
import { useInsufficientCredits } from "../../components/insufficient-credits-modal";
import { faSparkles } from "@fortawesome/pro-solid-svg-icons";

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
    label: model.full_name || model.model,
    selected: model.model === selectedId,
    description: getModelDescription(model.model, model.extra_info_short),
    info: getModelInfo(model.model, model.extra_info) || undefined,
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
  const { loggedIn, openSignupCta } = useSignupCta();
  const openInsufficientCredits = useInsufficientCredits();
  const { promptBoxRef, promptHeight } = usePromptHeight();

  // Fetch models from API
  const { models: apiModels } = useOmniGenImageModels();

  // UI state
  const ui = useCreateImageStore((s) => s.ui);
  const setUi = useCreateImageStore((s) => s.setUi);

  const selectedModel = useMemo((): OmniGenImageModelInfo | undefined => {
    if (!apiModels.length) return undefined;
    if (ui.selectedModelId) {
      return (
        apiModels.find((m) => m.model === ui.selectedModelId) ??
        apiModels.find((m) => m.model === DEFAULT_MODEL_ID) ??
        apiModels[0]
      );
    }
    return apiModels.find((m) => m.model === DEFAULT_MODEL_ID) ?? apiModels[0];
  }, [apiModels, ui.selectedModelId]);

  const prompt = ui.prompt;
  const setPrompt = useCallback((v: string) => setUi({ prompt: v }), [setUi]);

  // Settings are sticky across model switches: the store holds the user's
  // chosen value (set by the setters below) untouched, and we resolve an
  // *effective* value against the current model here — keeping the choice when
  // supported, otherwise falling back to the model's default for display +
  // generation only. See lib/resolve-model-setting.
  const aspectRatio =
    resolveModelOption(
      ui.aspectRatio,
      selectedModel?.aspect_ratio_options,
      selectedModel?.aspect_ratio_default,
    ) ?? ui.aspectRatio;
  const setAspectRatio = useCallback(
    (v: string) => setUi({ aspectRatio: v }),
    [setUi],
  );
  const numImages = resolveModelCount(
    ui.numImages,
    selectedModel?.batch_size_options,
    selectedModel?.batch_size_max,
    selectedModel?.batch_size_default,
  );
  const setNumImages = useCallback(
    (v: number) => setUi({ numImages: v }),
    [setUi],
  );
  const resolution = resolveModelOption(
    ui.resolution,
    selectedModel?.resolution_options,
    selectedModel?.resolution_default,
  );
  const setResolution = useCallback(
    (v: string | undefined) => setUi({ resolution: v }),
    [setUi],
  );
  const quality = resolveModelOption(
    ui.quality,
    selectedModel?.quality_options,
    selectedModel?.default_quality,
  );
  const setQuality = useCallback(
    (v: string | undefined) => setUi({ quality: v }),
    [setUi],
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const referenceImages = useCreateImageStore((s) => s.referenceImages);
  const setReferenceImages = useCreateImageStore((s) => s.setReferenceImages);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isOutputDrawerOpen, setIsOutputDrawerOpen] = useState(false);
  const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);
  const maxImageRefs = selectedModel?.image_refs_max ?? 6;
  const imagePickerMax = Math.max(1, maxImageRefs - referenceImages.length);

  useEffect(() => {
    if (isImagePickerOpen) setPickerSelectedIds([]);
  }, [isImagePickerOpen]);

  const handlePickerSelect = useCallback(
    (id: string) => {
      setPickerSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= imagePickerMax) {
          return imagePickerMax === 1 ? [id] : prev;
        }
        return [...prev, id];
      });
    },
    [imagePickerMax],
  );

  // Batch store (enqueue flow only)
  const startBatch = useCreateImageStore((s) => s.startBatch);
  const setBatchJobToken = useCreateImageStore((s) => s.setBatchJobToken);
  const completeBatch = useCreateImageStore((s) => s.completeBatch);
  const failBatch = useCreateImageStore((s) => s.failBatch);
  const dismissBatch = useCreateImageStore((s) => s.dismissBatch);
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());

  // Jobs + gallery
  const jobs = useGenerationJobs({ mediaType: "image", enabled: !!user });
  const gallery = useGalleryData({
    username: user?.username ?? null,
    filterMediaClasses: IMAGE_FILTER,
    excludeUploads: true,
  });

  // Map job token → batch count so the pending card/row can show
  // "Generating N images" — the batch runs as a single job chip.
  const batches = useCreateImageStore((s) => s.batches);
  const jobTokenToBatchCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const batch of batches) {
      if (batch.jobToken && batch.requestedCount > 1) {
        map.set(batch.jobToken, batch.requestedCount);
      }
    }
    return map;
  }, [batches]);

  const enrichedInProgress = useMemo(
    () =>
      jobs.inProgress.map((job) => {
        const batchCount = jobTokenToBatchCount.get(job.id);
        return batchCount ? { ...job, batchCount } : job;
      }),
    [jobs.inProgress, jobTokenToBatchCount],
  );

  const newlyCompletedTokens = useMemo(
    () => new Set(jobs.newlyCompleted.map((i) => i.id)),
    [jobs.newlyCompleted],
  );

  // Lightbox
  const flatItems = useMemo(() => {
    const filtered = gallery.items.filter(
      (i) => !newlyCompletedTokens.has(i.id),
    );
    return [...jobs.newlyCompleted, ...filtered];
  }, [jobs.newlyCompleted, gallery.items, newlyCompletedTokens]);

  const lightbox = useLightboxNav(flatItems);

  // Derived
  const hasAspectRatios =
    (selectedModel?.aspect_ratio_options?.length ?? 0) > 0;
  const hasResolutions = (selectedModel?.resolution_options?.length ?? 0) > 0;
  const hasQualityOptions = (selectedModel?.quality_options?.length ?? 0) > 0;

  const estimatedCredits = useImageCostEstimate({
    model: selectedModel?.model ?? "",
    aspectRatio: aspectRatio,
    resolution: hasResolutions ? resolution : undefined,
    quality: hasQualityOptions ? quality : undefined,
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

  // Consume a pending recreate payload (set by the lightbox Recreate button)
  // and populate the promptbox fields. Does NOT trigger generation. Subscribes
  // to the store so it fires even when the user is already on this route.
  const pendingRecreate = useCreateImageStore((s) => s.pendingRecreate);
  useEffect(() => {
    if (!pendingRecreate) return;
    const payload = useCreateImageStore.getState().consumePendingRecreate();
    if (!payload) return;
    setReferenceImages(payload.referenceImages);
    setUi({
      prompt: payload.prompt,
      ...(payload.aspectRatio ? { aspectRatio: payload.aspectRatio } : {}),
      ...(payload.resolution ? { resolution: payload.resolution } : {}),
      ...(payload.modelId ? { selectedModelId: payload.modelId } : {}),
    });
  }, [pendingRecreate, setUi]);

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
      // Only switch the model — aspect ratio / count / resolution / quality are
      // preserved and resolved against the new model at read time, so the user's
      // choices survive model switches instead of resetting to defaults.
      setUi({ selectedModelId: model.model });
    },
    [setUi],
  );

  const handleLibraryImageSelect = useCallback(
    (items: GalleryItem[]) => {
      const availableSlots = Math.max(0, maxImageRefs - referenceImages.length);
      const newImages: RefImage[] = items
        .slice(0, availableSlots)
        .map((item) => ({
          id: Math.random().toString(36).substring(7),
          url: item.thumbnail || item.fullImage || "",
          fullUrl: item.fullImage || undefined,
          file: new File([], "library-image"),
          mediaToken: item.id,
        }));
      setReferenceImages([...referenceImages, ...newImages]);
      setIsImagePickerOpen(false);
    },
    [maxImageRefs, referenceImages, setReferenceImages],
  );

  const handleGenerate = useCallback(async () => {
    if (!loggedIn) {
      openSignupCta();
      return;
    }
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
            .filter((t): t is string => typeof t === "string" && t.length > 0)
        : undefined;

      const result = await enqueueImageGeneration({
        prompt: prompt.trim(),
        model: selectedModel.model,
        numImages,
        aspectRatio: aspectRatio,
        resolution: hasResolutions ? resolution : undefined,
        quality: hasQualityOptions ? quality : undefined,
        imageMediaTokens: imageMediaTokens?.length
          ? imageMediaTokens
          : undefined,
      });

      if (!result.success || !result.jobToken) {
        // 402 Payment Required: the user is out of credits. Drop the pending
        // card and surface the upgrade modal instead of a failed-card error.
        if (result.errorCode === 402) {
          dismissBatch(batchId);
          openInsufficientCredits();
        } else {
          if (result.errorCode != null && result.errorCode >= 500) {
            toast.error(OMNI_GENERATE_OUTAGE_MESSAGE);
          }
          failBatch(batchId, result.error ?? "Failed to start generation");
        }
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
    loggedIn,
    openSignupCta,
    openInsufficientCredits,
    prompt,
    isGenerating,
    selectedModel,
    numImages,
    aspectRatio,
    resolution,
    hasResolutions,
    quality,
    hasQualityOptions,
    referenceImages,
    startBatch,
    setBatchJobToken,
    completeBatch,
    failBatch,
    dismissBatch,
  ]);

  // ── Mobile form ───────────────────────────────────────────────────────

  const supportsImagePrompts = !!selectedModel?.image_refs_supported;

  const resolutionItems = buildResolutionItems(
    selectedModel?.resolution_options ?? [],
    resolution ?? selectedModel?.resolution_default ?? undefined,
  );
  const qualityItems = buildQualityItems(
    selectedModel?.quality_options ?? [],
    quality ?? selectedModel?.default_quality ?? undefined,
  );
  const outputSummary =
    [
      resolutionItems.find((i) => i.selected)?.label,
      qualityItems.find((i) => i.selected)?.label,
    ]
      .filter(Boolean)
      .join(" · ") || "Default";

  const mobileForm = (
    <MobilePromptForm
      prompt={prompt}
      onPromptChange={setPrompt}
      onSubmit={handleGenerate}
      isSubmitting={isGenerating}
      credits={estimatedCredits}
      placeholder="Describe what you want in the image..."
      autoAdvance={loggedIn && !!prompt.trim() && !isGenerating}
      modelField={
        <MobileSelectField
          label="Model"
          title="Select Model"
          items={modelItems}
          onSelect={handleModelChange}
        />
      }
      frames={
        supportsImagePrompts ? (
          <ImagePromptRow
            maxImagePromptCount={maxImageRefs}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            onPickFromLibrary={() => setIsImagePickerOpen(true)}
          />
        ) : undefined
      }
      settingsFields={
        <>
          {hasAspectRatios && (
            <MobileSelectField
              label="Aspect ratio"
              items={buildAspectRatioItems(
                selectedModel?.aspect_ratio_options ?? [],
                aspectRatio ?? selectedModel?.aspect_ratio_default ?? undefined,
              )}
              onSelect={(item) => {
                const r = aspectRatioFromLabel(item.label);
                if (r) setAspectRatio(r);
              }}
            />
          )}
          {(hasResolutions || hasQualityOptions) && (
            <>
              <MobileFieldButton
                label="Output"
                value={outputSummary}
                onClick={() => setIsOutputDrawerOpen(true)}
              />
              <SettingsDrawer
                open={isOutputDrawerOpen}
                onOpenChange={setIsOutputDrawerOpen}
                title="Output"
              >
                {hasResolutions && (
                  <DrawerSection label="Resolution">
                    <DrawerOptionList
                      items={resolutionItems}
                      onSelect={(item) => {
                        const r = resolutionFromLabel(item.label);
                        if (r) setResolution(r);
                      }}
                    />
                  </DrawerSection>
                )}
                {hasQualityOptions && (
                  <DrawerSection label="Quality">
                    <DrawerOptionList
                      items={qualityItems}
                      onSelect={(item) => {
                        const q = qualityFromLabel(item.label);
                        if (q) setQuality(q);
                      }}
                    />
                  </DrawerSection>
                )}
              </SettingsDrawer>
            </>
          )}
        </>
      }
      countField={
        <MobileCountStepper
          value={numImages}
          onChange={setNumImages}
          max={selectedModel?.batch_size_max ?? 4}
          options={selectedModel?.batch_size_options}
        />
      }
    />
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <CreateMediaPageShell
      title="Create Image - ArtCraft"
      description="Generate stunning AI images with ArtCraft"
      authChecked={authChecked}
      hasContent={hasContent}
      emptyStateTitle="Create Image"
      emptyStateSubtitle="Describe anything. See it in seconds."
      emptyStateCta={
        loggedIn ? undefined : (
          <Button
            variant="primary"
            onClick={openSignupCta}
            icon={faSparkles}
            className="h-12 px-6 text-base font-semibold rounded-full"
          >
            Sign up to create
          </Button>
        )
      }
      bottomOffset={promptHeight + 24}
      modelItems={modelItems}
      onModelChange={handleModelChange}
      promptForm={mobileForm}
      gridContent={
        <GenerationGallery
          inProgressJobs={enrichedInProgress}
          failedJobs={jobs.failed}
          onDismissFailed={jobs.dismissFailed}
          newlyCompletedItems={jobs.newlyCompleted}
          galleryItems={gallery.items}
          newlyCompletedTokens={newlyCompletedTokens}
          hasMore={gallery.hasMore}
          isLoading={gallery.isLoading}
          isInitialLoading={gallery.isInitialLoading}
          onLoadMore={gallery.loadMore}
          onGalleryItemClick={lightbox.handleGalleryItemClick}
          enableMakeVideo
        />
      }
      promptBox={
        <div
          ref={promptBoxRef}
          className="animate-fade-in-up fixed bottom-2 sm:bottom-3 right-0 z-30 mx-auto max-w-5xl px-2 sm:px-4 transition-[left] duration-200 ease-linear"
          style={{
            animationDelay: "150ms",
            left: "var(--ac-sidebar-offset, 0px)",
          }}
        >
          <PromptBox
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleGenerate}
            isSubmitting={isGenerating}
            credits={estimatedCredits}
            placeholder="Describe what you want in the image..."
            supportsImagePrompts={!!selectedModel?.image_refs_supported}
            maxImagePromptCount={maxImageRefs}
            referenceImages={referenceImages}
            onReferenceImagesChange={setReferenceImages}
            onPickFromLibrary={() => setIsImagePickerOpen(true)}
            modelSelector={
              <Tooltip
                content="Model"
                position="top"
                className="z-50"
                closeOnClick
              >
                <PopoverMenu
                  items={modelItems}
                  onSelect={handleModelChange}
                  mode="toggle"
                  panelTitle="Select Model"
                  panelClassName="w-[360px]"
                  richList
                  triggerIcon={
                    <img
                      src={getModelCreatorIconPath(selectedModel?.model ?? "")}
                      alt=""
                      className="h-4 w-4 icon-auto-contrast"
                    />
                  }
                />
              </Tooltip>
            }
            leftToolbar={
              <>
                {hasAspectRatios && selectedModel && (
                  <AspectRatioPicker
                    aspectRatioOptions={
                      selectedModel.aspect_ratio_options ?? []
                    }
                    defaultAspectRatio={
                      selectedModel.aspect_ratio_default ?? undefined
                    }
                    currentAspectRatio={aspectRatio}
                    handleAspectRatioSelect={setAspectRatio}
                  />
                )}
                {hasResolutions && selectedModel && (
                  <ResolutionPicker
                    resolutionOptions={selectedModel.resolution_options ?? []}
                    defaultResolution={
                      selectedModel.resolution_default ?? undefined
                    }
                    currentResolution={resolution}
                    handleResolutionSelect={setResolution}
                  />
                )}
                {hasQualityOptions && selectedModel && (
                  <QualityPicker
                    qualityOptions={selectedModel.quality_options ?? []}
                    defaultQuality={selectedModel.default_quality ?? undefined}
                    currentQuality={quality}
                    handleQualitySelect={setQuality}
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
          <GalleryModal
            mode="select"
            isOpen={isImagePickerOpen}
            onClose={() => setIsImagePickerOpen(false)}
            selectedItemIds={pickerSelectedIds}
            onSelectItem={handlePickerSelect}
            maxSelections={imagePickerMax}
            onUseSelected={handleLibraryImageSelect}
            forceFilter="image"
            hideFilter
          />
          <Lightbox
            isOpen={lightbox.lightboxOpen}
            onClose={lightbox.closeLightbox}
            mediaToken={lightbox.lightboxItem?.id}
            cdnUrl={lightbox.lightboxItem?.fullImage}
            mediaClass={lightbox.lightboxItem?.mediaClass}
            batchImageToken={lightbox.lightboxItem?.batchImageToken}
            showBatchCarousel={false}
            onNavigatePrev={lightbox.navigatePrev}
            onNavigateNext={lightbox.navigateNext}
            onDeleted={gallery.removeItem}
          />
        </>
      }
    />
  );
}
