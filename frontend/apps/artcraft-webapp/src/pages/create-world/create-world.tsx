import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterMediaClasses } from "@storyteller/api";
import type { OmniGenSplatModelInfo } from "@storyteller/api";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { GalleryModal, type GalleryItem } from "@storyteller/ui-gallery-modal";
import {
  faSparkles,
  faPanorama,
  faWandMagicSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import {
  PromptBox,
  ImagePromptRow,
  MobilePromptForm,
  MobileSelectField,
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
import { is3DModelUrl } from "../../components/lightbox/shared";
import { useCreateWorldStore } from "./create-world-store";
import { enqueueSplatGeneration, startPolling } from "./generate-world-api";
import { ReferenceVideoSlot } from "./components/ReferenceVideoSlot";
import { useSplatCostEstimate } from "../../lib/cost-estimate-api";
import {
  useOmniGenSplatModels,
  OMNI_GENERATE_OUTAGE_MESSAGE,
} from "@storyteller/omni-gen";
import {
  getCreatorIconPathForModelId,
  getModelDescription,
  getModelInfo,
} from "@storyteller/model-list";
import { toast } from "../../components/toast/toast";
import { useSignupCta } from "../../components/signup-cta-modal";
import { useInsufficientCredits } from "../../components/insufficient-credits-modal";

// ── Constants ────────────────────────────────────────────────────────────

const DEFAULT_MODEL_ID = "marble_1p1";
const DIMENSIONAL_FILTER = [FilterMediaClasses.DIMENSIONAL];

let _modelLookup = new Map<string, OmniGenSplatModelInfo>();

function buildModelPopoverItems(
  models: OmniGenSplatModelInfo[],
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
        src={getCreatorIconPathForModelId(model.model)}
        alt={`${model.model} logo`}
        className="h-4 w-4 icon-auto-contrast"
      />
    ),
    action: model.model,
  }));
}

// ── Component ────────────────────────────────────────────────────────────

export default function CreateWorld() {
  const { user, authChecked } = useAuthCheck();
  const { loggedIn, openSignupCta } = useSignupCta();
  const openInsufficientCredits = useInsufficientCredits();
  const { promptBoxRef, promptHeight } = usePromptHeight();

  const { models: apiModels } = useOmniGenSplatModels();

  const ui = useCreateWorldStore((s) => s.ui);
  const setUi = useCreateWorldStore((s) => s.setUi);

  const selectedModel = useMemo((): OmniGenSplatModelInfo | undefined => {
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

  const supportsText = !!selectedModel?.text_prompt_supported;
  const supportsImage = !!selectedModel?.image_references_supported;
  const maxImageRefs = selectedModel?.image_references_max ?? 4;
  const supportsVideo = !!selectedModel?.video_reference_supported;
  const supportsPanorama = !!selectedModel?.panorama_supported;
  const supportsDisableRecaption = !!selectedModel?.disable_recaption_supported;

  const isPanoramic = supportsPanorama ? (ui.isPanoramic ?? false) : false;
  const disableRecaption = supportsDisableRecaption
    ? (ui.disableRecaption ?? false)
    : false;

  const [isGenerating, setIsGenerating] = useState(false);
  const referenceImages = useCreateWorldStore((s) => s.referenceImages);
  const setReferenceImages = useCreateWorldStore((s) => s.setReferenceImages);
  const referenceVideo = useCreateWorldStore((s) => s.referenceVideo);
  const setReferenceVideo = useCreateWorldStore((s) => s.setReferenceVideo);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isImagePickerOpen) setPickerSelectedIds([]);
  }, [isImagePickerOpen]);

  const imagePickerMax = Math.max(1, maxImageRefs - referenceImages.length);
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

  // Batch store
  const startBatch = useCreateWorldStore((s) => s.startBatch);
  const setBatchJobToken = useCreateWorldStore((s) => s.setBatchJobToken);
  const completeBatch = useCreateWorldStore((s) => s.completeBatch);
  const failBatch = useCreateWorldStore((s) => s.failBatch);
  const dismissBatch = useCreateWorldStore((s) => s.dismissBatch);
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());

  // Jobs + gallery (only splats, not mesh objects)
  const splatModelIds = useMemo(
    () => apiModels.map((m) => m.model),
    [apiModels],
  );
  const jobs = useGenerationJobs({ mediaType: "splat", enabled: !!user });
  const gallery = useGalleryData({
    username: user?.username ?? null,
    filterMediaClasses: DIMENSIONAL_FILTER,
    filterModelIds: splatModelIds,
    excludeUploads: true,
  });

  // A freshly-completed splat job has no cover screenshot in its payload (the
  // backend renders it a moment later), so its card would be blank. Once the
  // library re-fetch returns the same world with its cover, adopt that
  // thumbnail so the card stops showing the placeholder.
  // The library's dimensional feed can include a world's cover screenshot as
  // its own entry (surfaced as a "dimensional" media file even though its asset
  // is a .png). Keep only real 3D/splat files so that stray screenshot doesn't
  // show up as a separate card.
  const modelGalleryItems = useMemo(
    () => gallery.items.filter((i) => !!i.fullImage && is3DModelUrl(i.fullImage)),
    [gallery.items],
  );

  const galleryById = useMemo(
    () => new Map(modelGalleryItems.map((i) => [i.id, i])),
    [modelGalleryItems],
  );
  const enrichedNewlyCompleted = useMemo(
    () =>
      jobs.newlyCompleted.map((item) => {
        if (!item.thumbnail) {
          const g = galleryById.get(item.id);
          if (g?.thumbnail) return { ...item, thumbnail: g.thumbnail };
        }
        return item;
      }),
    [jobs.newlyCompleted, galleryById],
  );

  const newlyCompletedTokens = useMemo(
    () => new Set(enrichedNewlyCompleted.map((i) => i.id)),
    [enrichedNewlyCompleted],
  );

  const flatItems = useMemo(() => {
    const filtered = modelGalleryItems.filter(
      (i) => !newlyCompletedTokens.has(i.id),
    );
    return [...enrichedNewlyCompleted, ...filtered];
  }, [enrichedNewlyCompleted, modelGalleryItems, newlyCompletedTokens]);

  // Re-fetch the library shortly after a generation completes so blank
  // just-finished cards can pick up their cover screenshot once it's attached.
  const galleryRefreshRef = useRef(gallery.refresh);
  galleryRefreshRef.current = gallery.refresh;
  useEffect(() => {
    if (!jobs.newlyCompleted.some((i) => !i.thumbnail)) return;
    const t1 = setTimeout(() => galleryRefreshRef.current(), 4000);
    const t2 = setTimeout(() => galleryRefreshRef.current(), 10000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [jobs.newlyCompleted]);

  const lightbox = useLightboxNav(flatItems);

  const estimatedCredits = useSplatCostEstimate({
    model: selectedModel?.model ?? "",
    referenceImageCount: referenceImages.length,
    hasReferenceVideo: !!referenceVideo,
    isPanoramic: supportsPanorama ? isPanoramic : undefined,
    disableRecaption: supportsDisableRecaption ? disableRecaption : undefined,
  });

  const modelItems = useMemo(
    () => buildModelPopoverItems(apiModels, selectedModel?.model ?? ""),
    [apiModels, selectedModel?.model],
  );

  const hasContent =
    jobs.inProgress.length > 0 ||
    jobs.failed.length > 0 ||
    jobs.newlyCompleted.length > 0 ||
    modelGalleryItems.length > 0 ||
    gallery.isInitialLoading;

  const canGenerate =
    !!selectedModel &&
    !isGenerating &&
    (prompt.trim().length > 0 || referenceImages.length > 0 || !!referenceVideo);

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const cleanups = pollingCleanupsRef.current;
    const pendingBatches = useCreateWorldStore
      .getState()
      .batches.filter((b) => b.status === "pending" && b.jobToken);

    for (const batch of pendingBatches) {
      if (cleanups.has(batch.id)) continue;
      const stop = startPolling(
        batch.jobToken!,
        (assets) => {
          completeBatch(batch.id, assets);
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
    if (!canGenerate || !selectedModel) return;

    setIsGenerating(true);
    const batchId = startBatch(
      prompt || selectedModel.full_name || selectedModel.model,
      selectedModel.full_name ?? selectedModel.model,
    );

    try {
      const referenceImageMediaTokens = supportsImage
        ? referenceImages
            .map((img) => img.mediaToken)
            .filter((t): t is string => typeof t === "string" && t.length > 0)
        : undefined;

      const result = await enqueueSplatGeneration({
        model: selectedModel.model,
        prompt: supportsText && prompt.trim() ? prompt.trim() : undefined,
        referenceImageMediaTokens: referenceImageMediaTokens?.length
          ? referenceImageMediaTokens
          : undefined,
        referenceVideoMediaToken: supportsVideo
          ? referenceVideo?.mediaToken
          : undefined,
        isPanoramic: supportsPanorama ? isPanoramic : undefined,
        disableRecaption: supportsDisableRecaption ? disableRecaption : undefined,
      });

      if (!result.success || !result.jobToken) {
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
        (assets) => {
          completeBatch(batchId, assets);
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
    canGenerate,
    selectedModel,
    prompt,
    supportsText,
    supportsImage,
    supportsVideo,
    supportsPanorama,
    supportsDisableRecaption,
    referenceImages,
    referenceVideo,
    isPanoramic,
    disableRecaption,
    startBatch,
    setBatchJobToken,
    completeBatch,
    failBatch,
    dismissBatch,
  ]);

  // ── Option controls (shared desktop + mobile) ──────────────────────────

  const optionControls = (
    <>
      {supportsPanorama && (
        <Tooltip content="360° panorama input" position="top" closeOnClick>
          <ToggleButton
            isActive={isPanoramic}
            icon={faPanorama}
            activeIcon={faPanorama}
            label={isPanoramic ? "Panorama" : "Panorama off"}
            onClick={() => setUi({ isPanoramic: !isPanoramic })}
          />
        </Tooltip>
      )}
      {supportsDisableRecaption && (
        <Tooltip content="Use prompt exactly (skip recaption)" position="top" closeOnClick>
          <ToggleButton
            isActive={disableRecaption}
            icon={faWandMagicSparkles}
            activeIcon={faWandMagicSparkles}
            label={disableRecaption ? "No recaption" : "Recaption"}
            onClick={() => setUi({ disableRecaption: !disableRecaption })}
          />
        </Tooltip>
      )}
    </>
  );

  const videoRow = supportsVideo ? (
    <ReferenceVideoSlot video={referenceVideo} onChange={setReferenceVideo} />
  ) : undefined;

  // ── Mobile form ─────────────────────────────────────────────────────────

  const mobileForm = (
    <MobilePromptForm
      prompt={prompt}
      onPromptChange={setPrompt}
      onSubmit={handleGenerate}
      isSubmitting={isGenerating}
      credits={estimatedCredits}
      placeholder="Describe the 3D world you want..."
      autoAdvance={loggedIn && canGenerate}
      modelField={
        <MobileSelectField
          label="Model"
          title="Select Model"
          items={modelItems}
          onSelect={handleModelChange}
        />
      }
      frames={
        supportsImage ? (
          <ImagePromptRow
            maxImagePromptCount={maxImageRefs}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            onPickFromLibrary={() => setIsImagePickerOpen(true)}
          />
        ) : undefined
      }
      settingsFields={videoRow}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <CreateMediaPageShell
      title="3D World - ArtCraft"
      description="Generate explorable 3D worlds with ArtCraft"
      authChecked={authChecked}
      hasContent={hasContent}
      emptyStateTitle="Create 3D World"
      emptyStateSubtitle="Turn a prompt or image into an explorable world."
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
          inProgressJobs={jobs.inProgress}
          failedJobs={jobs.failed}
          onDismissFailed={jobs.dismissFailed}
          newlyCompletedItems={enrichedNewlyCompleted}
          galleryItems={modelGalleryItems}
          newlyCompletedTokens={newlyCompletedTokens}
          hasMore={gallery.hasMore}
          isLoading={gallery.isLoading}
          isInitialLoading={gallery.isInitialLoading}
          onLoadMore={gallery.loadMore}
          onGalleryItemClick={lightbox.handleGalleryItemClick}
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
            disabled={!canGenerate}
            credits={estimatedCredits}
            placeholder="Describe the 3D world you want..."
            supportsImagePrompts={supportsImage}
            maxImagePromptCount={maxImageRefs}
            referenceImages={referenceImages}
            onReferenceImagesChange={setReferenceImages}
            onPickFromLibrary={() => setIsImagePickerOpen(true)}
            mediaReferenceRow={videoRow}
            modelSelector={
              <Tooltip content="Model" position="top" className="z-50" closeOnClick>
                <PopoverMenu
                  items={modelItems}
                  onSelect={handleModelChange}
                  mode="toggle"
                  panelTitle="Select Model"
                  panelClassName="w-[360px]"
                  richList
                  triggerIcon={
                    <img
                      src={getCreatorIconPathForModelId(selectedModel?.model ?? "")}
                      alt=""
                      className="h-4 w-4 icon-auto-contrast"
                    />
                  }
                />
              </Tooltip>
            }
            leftToolbar={optionControls}
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
