import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterMediaClasses } from "@storyteller/api";
import type { OmniGenMeshModelInfo } from "@storyteller/api";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { GalleryModal, type GalleryItem } from "@storyteller/ui-gallery-modal";
import {
  faSparkles,
  faGem,
  faImage,
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
import { useCreateObjectStore } from "./create-object-store";
import { enqueueMeshGeneration, startPolling } from "./generate-object-api";
import {
  MeshOutputTypePicker,
  PolygonTypePicker,
  GeometryQualityPicker,
  TextureQualityPicker,
  FaceCountPicker,
  QUALITY_OPTIONS,
} from "./components/MeshOptionPickers";
import { MeshInputsRow } from "./components/MeshInputsRow";
import { useMeshCostEstimate } from "../../lib/cost-estimate-api";
import { resolveModelOption } from "../../lib/resolve-model-setting";
import {
  useOmniGenMeshModels,
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

const DEFAULT_MODEL_ID = "hunyuan_3d_3";
const DIMENSIONAL_FILTER = [FilterMediaClasses.DIMENSIONAL];

let _modelLookup = new Map<string, OmniGenMeshModelInfo>();

function buildModelPopoverItems(
  models: OmniGenMeshModelInfo[],
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

export default function CreateObject() {
  const { user, authChecked } = useAuthCheck();
  const { loggedIn, openSignupCta } = useSignupCta();
  const openInsufficientCredits = useInsufficientCredits();
  const { promptBoxRef, promptHeight } = usePromptHeight();

  const { models: apiModels } = useOmniGenMeshModels();

  const ui = useCreateObjectStore((s) => s.ui);
  const setUi = useCreateObjectStore((s) => s.setUi);

  const selectedModel = useMemo((): OmniGenMeshModelInfo | undefined => {
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

  // Capability flags for the selected model.
  const supportsText = !!selectedModel?.text_prompt_supported;
  const supportsImage =
    !!selectedModel?.image_input_supported ||
    !!selectedModel?.sketch_input_supported;
  const supportsMultiView = !!selectedModel?.multi_view_supported;
  const supportsMeshInput = !!selectedModel?.mesh_input_supported;
  const outputTypes = selectedModel?.mesh_output_types ?? [];
  const polygonTypes = selectedModel?.polygon_types ?? [];
  const supportsGeometryQuality = !!selectedModel?.geometry_quality_supported;
  const supportsTextureQuality = !!selectedModel?.texture_quality_supported;
  const supportsFaceCount = !!selectedModel?.face_count_supported;
  const supportsPbr = !!selectedModel?.pbr_supported;
  const supportsTextureToggle = !!selectedModel?.texture_toggle_supported;

  // Settings are sticky across model switches, resolved against the current
  // model's supported options at read time (see lib/resolve-model-setting).
  const meshOutputType = resolveModelOption(ui.meshOutputType, outputTypes, outputTypes[0]);
  const polygonType = resolveModelOption(ui.polygonType, polygonTypes, polygonTypes[0]);
  const geometryQuality = resolveModelOption(
    ui.geometryQuality,
    supportsGeometryQuality ? QUALITY_OPTIONS : [],
    "standard",
  );
  const textureQuality = resolveModelOption(
    ui.textureQuality,
    supportsTextureQuality ? QUALITY_OPTIONS : [],
    "standard",
  );
  // Toggles default on when supported unless the user turned them off.
  const enablePbr = supportsPbr ? (ui.enablePbr ?? false) : false;
  const enableTexture = supportsTextureToggle ? (ui.enableTexture ?? true) : true;

  const [isGenerating, setIsGenerating] = useState(false);
  const referenceImages = useCreateObjectStore((s) => s.referenceImages);
  const setReferenceImages = useCreateObjectStore((s) => s.setReferenceImages);
  const inputs = useCreateObjectStore((s) => s.inputs);
  const setInputs = useCreateObjectStore((s) => s.setInputs);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isImagePickerOpen) setPickerSelectedIds([]);
  }, [isImagePickerOpen]);

  // Batch store
  const startBatch = useCreateObjectStore((s) => s.startBatch);
  const setBatchJobToken = useCreateObjectStore((s) => s.setBatchJobToken);
  const completeBatch = useCreateObjectStore((s) => s.completeBatch);
  const failBatch = useCreateObjectStore((s) => s.failBatch);
  const dismissBatch = useCreateObjectStore((s) => s.dismissBatch);
  const pollingCleanupsRef = useRef<Map<string, () => void>>(new Map());

  // Jobs + gallery (only this page's own — mesh objects, not splats)
  const meshModelIds = useMemo(
    () => apiModels.map((m) => m.model),
    [apiModels],
  );
  const jobs = useGenerationJobs({ mediaType: "object", enabled: !!user });
  const gallery = useGalleryData({
    username: user?.username ?? null,
    filterMediaClasses: DIMENSIONAL_FILTER,
    filterModelIds: meshModelIds,
    excludeUploads: true,
  });

  const newlyCompletedTokens = useMemo(
    () => new Set(jobs.newlyCompleted.map((i) => i.id)),
    [jobs.newlyCompleted],
  );

  const flatItems = useMemo(() => {
    const filtered = gallery.items.filter(
      (i) => !newlyCompletedTokens.has(i.id),
    );
    return [...jobs.newlyCompleted, ...filtered];
  }, [jobs.newlyCompleted, gallery.items, newlyCompletedTokens]);

  const lightbox = useLightboxNav(flatItems);

  const estimatedCredits = useMeshCostEstimate({
    model: selectedModel?.model ?? "",
    referenceImageCount: referenceImages.length,
    hasInputMesh: !!inputs.inputMesh,
    meshOutputType: outputTypes.length ? meshOutputType : undefined,
    polygonType: polygonTypes.length ? polygonType : undefined,
    faceCount: supportsFaceCount ? ui.faceCount : undefined,
    enablePbr: supportsPbr ? enablePbr : undefined,
    enableTexture: supportsTextureToggle ? enableTexture : undefined,
    textureQuality: supportsTextureQuality ? textureQuality : undefined,
    geometryQuality: supportsGeometryQuality ? geometryQuality : undefined,
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

  const hasAnyImage =
    referenceImages.length > 0 ||
    !!inputs.frontImage ||
    !!inputs.backImage ||
    !!inputs.leftImage ||
    !!inputs.rightImage;

  const canGenerate =
    !!selectedModel &&
    !isGenerating &&
    (supportsMeshInput
      ? !!inputs.inputMesh
      : (supportsText && prompt.trim().length > 0) || hasAnyImage);

  // ── Effects ──────────────────────────────────────────────────────────────

  // Resume polling for pending batches (page revisit).
  useEffect(() => {
    const cleanups = pollingCleanupsRef.current;
    const pendingBatches = useCreateObjectStore
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
      const newImages: RefImage[] = items.slice(0, 1).map((item) => ({
        id: Math.random().toString(36).substring(7),
        url: item.thumbnail || item.fullImage || "",
        fullUrl: item.fullImage || undefined,
        file: new File([], "library-image"),
        mediaToken: item.id,
      }));
      setReferenceImages(newImages);
      setIsImagePickerOpen(false);
    },
    [setReferenceImages],
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

      const result = await enqueueMeshGeneration({
        model: selectedModel.model,
        prompt: supportsText && prompt.trim() ? prompt.trim() : undefined,
        referenceImageMediaTokens: referenceImageMediaTokens?.length
          ? referenceImageMediaTokens
          : undefined,
        frontImageMediaToken: supportsMultiView
          ? inputs.frontImage?.mediaToken
          : undefined,
        backImageMediaToken: supportsMultiView
          ? inputs.backImage?.mediaToken
          : undefined,
        leftImageMediaToken: supportsMultiView
          ? inputs.leftImage?.mediaToken
          : undefined,
        rightImageMediaToken: supportsMultiView
          ? inputs.rightImage?.mediaToken
          : undefined,
        inputMeshMediaToken: supportsMeshInput
          ? inputs.inputMesh?.mediaToken
          : undefined,
        meshOutputType: outputTypes.length ? meshOutputType : undefined,
        polygonType: polygonTypes.length ? polygonType : undefined,
        faceCount: supportsFaceCount ? ui.faceCount : undefined,
        enablePbr: supportsPbr ? enablePbr : undefined,
        enableTexture: supportsTextureToggle ? enableTexture : undefined,
        textureQuality: supportsTextureQuality ? textureQuality : undefined,
        geometryQuality: supportsGeometryQuality ? geometryQuality : undefined,
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
    supportsMultiView,
    supportsMeshInput,
    referenceImages,
    inputs,
    outputTypes,
    meshOutputType,
    polygonTypes,
    polygonType,
    supportsFaceCount,
    ui.faceCount,
    supportsPbr,
    enablePbr,
    supportsTextureToggle,
    enableTexture,
    supportsTextureQuality,
    textureQuality,
    supportsGeometryQuality,
    geometryQuality,
    startBatch,
    setBatchJobToken,
    completeBatch,
    failBatch,
    dismissBatch,
  ]);

  const placeholder = supportsText
    ? "Describe the 3D object you want..."
    : supportsMeshInput
      ? "Upload a mesh file below to process"
      : "Add a reference image below";

  // Only render the extra-inputs row when the model actually supports one of its
  // slots, otherwise it renders empty but still flags a "row above" the prompt
  // box (flat-top visual glitch).
  const meshInputsRow =
    supportsMultiView || supportsMeshInput ? (
      <MeshInputsRow
        showMultiView={supportsMultiView}
        showMeshInput={supportsMeshInput}
        frontImage={inputs.frontImage}
        backImage={inputs.backImage}
        leftImage={inputs.leftImage}
        rightImage={inputs.rightImage}
        inputMesh={inputs.inputMesh}
        onChange={setInputs}
      />
    ) : undefined;

  // ── Option controls (shared desktop + mobile) ──────────────────────────

  const optionControls = (
    <>
      {outputTypes.length > 0 && (
        <MeshOutputTypePicker
          options={outputTypes}
          current={meshOutputType}
          onSelect={(v) => setUi({ meshOutputType: v })}
        />
      )}
      {polygonTypes.length > 0 && (
        <PolygonTypePicker
          options={polygonTypes}
          current={polygonType}
          onSelect={(v) => setUi({ polygonType: v })}
        />
      )}
      {supportsGeometryQuality && (
        <GeometryQualityPicker
          options={QUALITY_OPTIONS}
          current={geometryQuality}
          onSelect={(v) => setUi({ geometryQuality: v })}
        />
      )}
      {supportsTextureQuality && (
        <TextureQualityPicker
          options={QUALITY_OPTIONS}
          current={textureQuality}
          onSelect={(v) => setUi({ textureQuality: v })}
        />
      )}
      {supportsFaceCount && (
        <FaceCountPicker
          current={ui.faceCount}
          onSelect={(v) => setUi({ faceCount: v })}
        />
      )}
      {supportsPbr && (
        <Tooltip content="PBR materials" position="top" closeOnClick>
          <ToggleButton
            isActive={enablePbr}
            icon={faGem}
            activeIcon={faGem}
            label={enablePbr ? "PBR" : "PBR off"}
            onClick={() => setUi({ enablePbr: !enablePbr })}
          />
        </Tooltip>
      )}
      {supportsTextureToggle && (
        <Tooltip content="Generate textures" position="top" closeOnClick>
          <ToggleButton
            isActive={enableTexture}
            icon={faImage}
            activeIcon={faImage}
            label={enableTexture ? "Texture" : "No texture"}
            onClick={() => setUi({ enableTexture: !enableTexture })}
          />
        </Tooltip>
      )}
    </>
  );

  // ── Mobile form ─────────────────────────────────────────────────────────

  const mobileForm = (
    <MobilePromptForm
      prompt={prompt}
      onPromptChange={setPrompt}
      onSubmit={handleGenerate}
      isSubmitting={isGenerating}
      credits={estimatedCredits}
      placeholder={placeholder}
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
            maxImagePromptCount={1}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            onPickFromLibrary={() => setIsImagePickerOpen(true)}
          />
        ) : undefined
      }
      settingsFields={meshInputsRow}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <CreateMediaPageShell
      title="3D Object - ArtCraft"
      description="Generate 3D objects with ArtCraft"
      authChecked={authChecked}
      hasContent={hasContent}
      emptyStateTitle="Create 3D Object"
      emptyStateSubtitle="Turn a prompt or image into a 3D model."
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
          newlyCompletedItems={jobs.newlyCompleted}
          galleryItems={gallery.items}
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
            placeholder={placeholder}
            supportsImagePrompts={supportsImage}
            maxImagePromptCount={1}
            referenceImages={referenceImages}
            onReferenceImagesChange={setReferenceImages}
            onPickFromLibrary={() => setIsImagePickerOpen(true)}
            mediaReferenceRow={meshInputsRow}
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
            onSelectItem={(id) => setPickerSelectedIds([id])}
            maxSelections={1}
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
