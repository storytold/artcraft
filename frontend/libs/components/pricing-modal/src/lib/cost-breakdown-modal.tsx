// Hook that fetches a live credit quote for the Image-to-3D-Object page and writes it into the cost store; this file only reads its loading flag.
import { useMeshCostEstimate } from "./useMeshCostEstimate";
// Modal is the shared popup shell (draggable frame, close button, Esc handling).
import { Modal } from "@storyteller/ui-modal";
// useMemo caches a computed value between renders until its listed inputs change.
import { useMemo } from "react";
// CoinsIcon decorates the header; LoaderIcon is the spinner shown while a quote is loading.
import { CoinsIcon, LoaderIcon } from "lucide-react";
// Select is the shared dropdown, used here for the currency picker.
import { Select } from "@storyteller/ui-select";
// The store holding this popup's open flag and the per-page credit quotes, and the table that maps a top-bar tab id to a model page.
import {
  useCostBreakdownModalStore,
  TAB_TO_MODEL_PAGE,
} from "./cost-breakdown-modal-store";
// From the model-selector library: the list of pages that have a model picker (ModelPage), the model the user picked on a page,
// the provider picked for that model, a fallback model for a page, and the per-page lists of selectable models.
import {
  ModelPage,
  useSelectedModel,
  useSelectedProviderForModel,
  defaultModelForPage,
  useTextToImagePageModelList,
  useImageToVideoPageModelList,
  useCanvas2dPageModelList,
  useStage3dPageModelList,
  useImageEditorPageModelList,
  useAnglesPageModelList,
  IMAGE_TO_3D_WORLD_PAGE_MODEL_LIST,
  IMAGE_TO_3D_OBJECT_PAGE_MODEL_LIST,
} from "@storyteller/ui-model-selector";
// The prompt boxes' settings stores (resolution, how many to generate); read below to show what the user is about to generate.
import {
  usePrompt2DStore,
  usePrompt3DStore,
  usePromptImageStore,
  usePromptVideoStore,
  usePromptEditStore,
} from "@storyteller/ui-promptbox";
// The shape of one model record (id, display name and so on); used as a type only.
import { Model } from "@storyteller/model-list";
// Hook that holds the user's chosen display currency and turns US dollars into a formatted price in it.
import { useCurrency } from "./use-currency";
// The three remaining quote hooks (video, image, splat); the fourth, mesh, is imported at the top of the file.
import { useVideoCostEstimate } from "./useVideoCostEstimate";
import { useImageCostEstimate } from "./useImageCostEstimate";
import { useSplatCostEstimate } from "./useSplatCostEstimate";

// Drag handle subcomponent that Modal looks for
// Modal scans its children for an element whose type has displayName "ModalDragHandle" (set on the next line) and lets the user
// drag the whole popup by that part. This local copy just renders its children; the name tag is what matters.
const DragHandle = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
// The name tag Modal checks for (see modal.tsx); without it the popup could not be dragged by the header.
DragHandle.displayName = "ModalDragHandle";

// Provider display name mapping
// Keys are the lowercase provider ids the app uses internally; values are the names shown to the user.
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  artcraft: "ArtCraft",
  fal: "FAL",
  grok: "Grok",
  midjourney: "Midjourney",
  sora: "Sora",
  worldlabs: "World Labs",
};

// Extract the concrete `Model` instances out of a page's selectable item list.
// Some list entries have no model (the "model" field is optional), so they are dropped; the type guard tells TypeScript the result has none left.
const modelsFromList = (
  list: { model?: Model }[],
): Model[] =>
  list.map((item) => item.model).filter((m): m is Model => m !== undefined);

// The only prop: which top-bar tab is active.
export interface CostBreakdownModalProps {
  /** The current active tab ID from the app (e.g. "IMAGE", "VIDEO", "2D", "3D") */
  activeTabId?: string;
}

// The "Cost Breakdown" popup. TopBar draws it (TopBar.tsx) and passes the current tab id; it is rendered whether or not
// the popup is open, so every hook below keeps running even when the popup is hidden.
export function CostBreakdownModal({ activeTabId }: CostBreakdownModalProps) {
  // isOpen / closeModal: the popup's visibility; estimatedCreditsByPage: the latest quote per page (a number, or null when unknown).
  const { isOpen, closeModal, estimatedCreditsByPage } =
    useCostBreakdownModalStore();
  // currency: the chosen code; setCurrency: change it; formatPrice: dollars in, formatted string out; currencyOptions: dropdown choices.
  const {
    currency,
    setCurrency,
    formatPrice,
    currencyOptions,
  } = useCurrency();

  // Map TabId to ModelPage, default to TextToImage
  // Recomputed only when the tab id changes. An unknown tab id (or none) falls back to Text to Image.
  const activePage = useMemo(() => {
    if (!activeTabId) return ModelPage.TextToImage;
    return TAB_TO_MODEL_PAGE[activeTabId] ?? ModelPage.TextToImage;
  }, [activeTabId]);

  // Backend-reconciled model lists per page (fall back to the overlay until the
  // startup fetch completes).
  // One hook per page that has a model picker; each returns the list of models the user can choose from on that page.
  const textToImageList = useTextToImagePageModelList();
  const imageToVideoList = useImageToVideoPageModelList();
  const canvas2dList = useCanvas2dPageModelList();
  const stage3dList = useStage3dPageModelList();
  const imageEditorList = useImageEditorPageModelList();
  const anglesList = useAnglesPageModelList();

  // Get the selected model for the active page
  // undefined until the user (or the page) has picked a model on this page.
  const selectedModelFromStore = useSelectedModel(activePage);

  // If no model selected in store, use the default for this page
  // Builds the list of models for the active page: the six pages with live lists use those lists, and the two Image-to-3D pages
  // use fixed lists; any other page gets an empty list. Recomputed when the page or any of the lists change.
  const modelsForPage = useMemo<Model[]>(() => {
    switch (activePage) {
      case ModelPage.TextToImage:
        return modelsFromList(textToImageList);
      case ModelPage.ImageToVideo:
        return modelsFromList(imageToVideoList);
      case ModelPage.Canvas2D:
        return modelsFromList(canvas2dList);
      case ModelPage.Stage3D:
        return modelsFromList(stage3dList);
      case ModelPage.ImageEditor:
        return modelsFromList(imageEditorList);
      case ModelPage.ImageTo3DWorld:
        return modelsFromList(IMAGE_TO_3D_WORLD_PAGE_MODEL_LIST);
      case ModelPage.ImageTo3DObject:
        return modelsFromList(IMAGE_TO_3D_OBJECT_PAGE_MODEL_LIST);
      case ModelPage.Angles:
        return modelsFromList(anglesList);
      default:
        return [];
    }
  }, [
    activePage,
    textToImageList,
    imageToVideoList,
    canvas2dList,
    stage3dList,
    imageEditorList,
    anglesList,
  ]);
  // The model whose cost is shown: the user's pick if there is one, otherwise the page's default from the list above.
  const selectedModel =
    selectedModelFromStore ?? defaultModelForPage(modelsForPage, activePage);

  // Which provider (ArtCraft, FAL, ...) the user chose for that model on this page; undefined when not chosen.
  const selectedProvider = useSelectedProviderForModel(
    activePage,
    selectedModel?.id,
  );

  // Four quote hooks, all called on every render (hooks cannot be skipped). Each one acts only for its own page(s) and does nothing for the rest:
  // video = Image to Video; image = Text to Image, Canvas 2D, Stage 3D, Image Editor, Angles; splat = Image to 3D World; mesh = Image to 3D Object.
  // When a quote arrives they write it into estimatedCreditsByPage; here only the isLoading flag of each is used.
  const { isLoading: isVideoEstimateLoading } = useVideoCostEstimate(
    activePage,
    selectedModel,
    selectedProvider,
  );
  const { isLoading: isImageEstimateLoading } = useImageCostEstimate(
    activePage,
    selectedModel,
    selectedProvider,
  );
  const { isLoading: isSplatEstimateLoading } = useSplatCostEstimate(
    activePage,
    selectedModel,
    selectedProvider,
  );
  const { isLoading: isMeshEstimateLoading } = useMeshCostEstimate(activePage, selectedModel, selectedProvider);
  // True while any one of the four is waiting for its quote.
  const isEstimateLoading =
    isVideoEstimateLoading || isImageEstimateLoading || isSplatEstimateLoading || isMeshEstimateLoading;

  // Get generation settings from the appropriate stores based on active page
  // Subscribing to all five prompt-box stores re-renders this popup whenever any of their settings change.
  const prompt2D = usePrompt2DStore();
  const prompt3D = usePrompt3DStore();
  const promptImage = usePromptImageStore();
  const promptVideo = usePromptVideoStore();
  const promptEdit = usePromptEditStore();

  // Determine which store to use based on active page
  // Returns the three facts the popup lists for the active page: the resolution setting (undefined when the page has none),
  // how many items one click generates, and the plural word to label that count with.
  const getStoreData = () => {
    switch (activePage) {
      case ModelPage.Canvas2D:
        return {
          resolution: prompt2D.resolution,
          generationCount: prompt2D.generationCount,
          label: "Images",
        };
      case ModelPage.Stage3D:
        return {
          resolution: prompt3D.resolution,
          generationCount: 1, // 3D doesn't have generation count
          label: "Images",
        };
      case ModelPage.TextToImage:
        return {
          resolution: promptImage.resolution,
          generationCount: promptImage.generationCount,
          label: "Images",
        };
      case ModelPage.ImageToVideo:
        return {
          resolution: promptVideo.resolution,
          generationCount: promptVideo.generationCount,
          label: "Videos",
        };
      case ModelPage.ImageEditor:
        return {
          resolution: promptEdit.resolution,
          generationCount: 1, // Edit doesn't have generation count in store
          label: "Images",
        };
      case ModelPage.ImageTo3DWorld:
        // A world has no pixel resolution either, so the Resolution row is left out for it.
        return {
          resolution: undefined,
          generationCount: 1,
          label: "Worlds",
        };
      case ModelPage.ImageTo3DObject:
        // A 3D object has no pixel resolution, and each generation makes one object. Without this case the
        // page fell into the default branch below and showed a made-up "Resolution 1K" and an "Items" label.
        return {
          resolution: undefined,
          generationCount: 1,
          label: "Objects",
        };
      case ModelPage.Angles:
        // The Angles page has no resolution setting here, so the Resolution row is left out; one click makes one image.
        return {
          resolution: undefined,
          generationCount: 1,
          label: "Images",
        };
      default:
        // Only reached for a page not listed above; all eight current pages have their own case, so today this is a safety net.
        return {
          resolution: "1k",
          generationCount: 1,
          label: "Items",
        };
    }
  };

  // The settings for the active page, read once per render.
  const storeData = getStoreData();

  // Pages that use a live backend estimate instead of a local calculation
  // Today that is every page getStoreData knows, and it matches the pages the four quote hooks handle.
  // (Recreated on every render; it is small and nothing depends on its identity.)
  const LIVE_ESTIMATE_PAGES = new Set<ModelPage>([
    ModelPage.TextToImage,
    ModelPage.Canvas2D,
    ModelPage.Stage3D,
    ModelPage.ImageEditor,
    ModelPage.ImageToVideo,
    ModelPage.ImageTo3DWorld,
    ModelPage.ImageTo3DObject,
    ModelPage.Angles,
  ]);

  // Whether the active page gets its price from a live quote (true for every current page).
  const isLiveEstimatePage = LIVE_ESTIMATE_PAGES.has(activePage);
  // The latest quote for this page: a number of credits, or null when there is none yet (or the quote failed).
  const liveCredits = isLiveEstimatePage
    ? (estimatedCreditsByPage[activePage] ?? null)
    : null;

  // Fallback price of one credit per generation, used only for a page without a live quote (none today).
  const creditsPerGeneration = 1;
  // Credits to show: the live quote (may be null), or the fallback arithmetic.
  const totalCredits = isLiveEstimatePage
    ? liveCredits
    : creditsPerGeneration * storeData.generationCount;

  // Convert credits to USD first (1 credit = $0.01), then to selected currency
  // A missing quote counts as 0 here, but the Credits row below shows a dash for it, not "0".
  const usdAmount = (totalCredits ?? 0) * 0.01;
  // The dollar amount as text in the user's chosen currency.
  const formattedPrice = formatPrice(usdAmount);

  // Select options formatted for the Select component
  // Pick just the value/label pair for each choice, the shape Select expects.
  const selectOptions = currencyOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  // Format provider name
  // Turns a provider id into display text: a known id uses the friendly name above; an unknown one is made readable; none gives null.
  const formatProvider = (provider: string | undefined) => {
    if (!provider) return null;
    const key = provider.toLowerCase();
    if (PROVIDER_DISPLAY_NAMES[key]) {
      return PROVIDER_DISPLAY_NAMES[key];
    }
    // Fallback: Convert snake_case to Title Case
    return provider
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Get page display name
  // The small uppercase line under the header; null (no line) for a page without a name.
  const getPageName = () => {
    switch (activePage) {
      case ModelPage.TextToImage:
        return "Text to Image";
      case ModelPage.ImageToVideo:
        return "Generate Video";
      case ModelPage.Canvas2D:
        return "Canvas 2D";
      case ModelPage.Stage3D:
        return "Stage 3D";
      case ModelPage.ImageEditor:
        return "Image Editor";
      case ModelPage.ImageTo3DWorld:
        return "Image to 3D World";
      case ModelPage.ImageTo3DObject:
        // Names the object tab like its World sibling; before this the page-name line was left out.
        return "Image to 3D Object";
      case ModelPage.Angles:
        return "Angles";
      default:
        return null;
    }
  };

  // The page name text, or null.
  const pageName = getPageName();

  // Models that have credit cost data available
  // A hand-kept list of model ids: a model not in it gets the "not yet available" box instead of numbers, even if a quote exists (see N-100 in BUGS.md).
  const MODELS_WITH_COST_DATA = new Set([
    "flux_1_dev",
    "flux_1_schnell",
    "flux_pro_11", // Legacy id
    "flux_pro_1p1",
    "flux_pro_11_ultra", // Legacy id
    "flux_pro_1p1_ultra",
    "gpt_image_1p5",
    "gpt_image_2",
    "gpt_image_2p5_flare",
    "gpt_image_2p5_sunburst",
    "nano_banana",
    "nano_banana_2",
    "nano_banana_pro",
    "seedream_4",
    "seedream_4p5",
    "seedream_5_lite",
    "kling_3p0_standard",
    "kling_3p0_pro",
    "seedance_1p5_pro",
    "seedance_2p0",
    "marble_0p1_mini",
    "marble_0p1_plus",
    // Image-to-3D object models. The object tab fetches a live quote for these (useMeshCostEstimate) and
    // shows it on the Generate button, so the modal must show it too instead of "not yet available".
    "hunyuan_3d_3",
    "hunyuan_3d_2_0",
    "flux_2_lora_angles",
    "qwen_edit_2511_angles",
  ]);
  // True when a model is selected and its id is in the list above.
  const hasCostData =
    selectedModel != null && MODELS_WITH_COST_DATA.has(selectedModel.id);

  // Draw the popup. It is a draggable, non-blocking floating panel: the app behind it stays clickable.
  return (
    // isOpen / onClose connect it to the store. The class string gives a narrow, square, panel-colored box that lets its content overflow.
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      // The header (the DragHandle below) can be dragged to move the popup.
      draggable={true}
      // Clicks reach the app behind the popup, so the user can keep working while it is open.
      allowBackgroundInteraction={true}
      // Show the X button.
      showClose={true}
      // A click outside does NOT close it, because outside clicks are meant for the app behind.
      closeOnOutsideClick={false}
      // The Esc key does close it.
      closeOnEsc={true}
      // The user cannot resize it.
      resizable={false}
      // No dimming and no click-catching backdrop, so the popup floats over the app like a tool window.
      backdropClassName="pointer-events-none !bg-transparent"
      className="max-w-xs rounded-none bg-ui-panel border border-ui-panel-border overflow-visible shadow-none"
    >
      {/* Drag Handle - Modal component will recognize this and make it draggable */}
      <DragHandle>
        {/* Header row: coins icon and the title; select-none stops text selection while dragging. */}
        <div className="flex items-center gap-2 pb-3 border-b border-ui-panel-border select-none">
          <div className="hud-label flex items-center gap-2 text-base-fg">
            <CoinsIcon className="text-base-fg" />
            Cost Breakdown
          </div>
        </div>
      </DragHandle>

      {/* Body: a vertical stack of the page name, the model row, and either the cost details or the "not available" box. */}
      <div className="space-y-3 font-sans text-base-fg text-xs mt-3">
        {/* Page indicator */}
        {pageName && (
          <div className="font-mono text-[10px] text-base-fg/55 uppercase tracking-[0.12em] text-start">
            {pageName}
          </div>
        )}

        {/* Model row — always shown */}
        {/* Hidden only when no model could be found at all; long names are cut off with an ellipsis and the full name shows on hover (title). */}
        {selectedModel && (
          <div className="flex justify-between items-center">
            <span className="text-base-fg/60">Model</span>
            <span
              className="text-base-fg font-medium truncate max-w-[140px]"
              title={selectedModel.selectorName}
            >
              {selectedModel.selectorName}
            </span>
          </div>
        )}

        {/* Two outcomes: models with cost data get the details and totals; every other model gets the grey notice at the bottom. */}
        {hasCostData ? (
          <>
            {/* Generation Details */}
            {/* Up to three label/value rows; each row is left out when its value is missing. */}
            <div className="space-y-1.5">
              {/* Resolution row: skipped for pages with no resolution (worlds, objects, angles). */}
              {storeData.resolution && (
                <div className="flex justify-between items-center">
                  <span className="text-base-fg/60">Resolution</span>
                  <span className="text-base-fg font-medium uppercase">
                    {storeData.resolution}
                  </span>
                </div>
              )}
              {/* Count row: labelled Images, Videos, Worlds or Objects depending on the page. */}
              {storeData.generationCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-base-fg/60">{storeData.label}</span>
                  <span className="text-base-fg font-medium">
                    {storeData.generationCount}
                  </span>
                </div>
              )}
              {/* Provider row: only when the user has picked a provider for this model. */}
              {selectedProvider && (
                <div className="flex justify-between items-center">
                  <span className="text-base-fg/60">Provider</span>
                  <span className="text-base-fg font-medium">
                    {formatProvider(selectedProvider)}
                  </span>
                </div>
              )}
            </div>

            {/* Total Cost */}
            {/* Sunken box holding the credits, a divider line, and the converted price. */}
            <div className="bg-ui-sunken rounded-none p-3 border border-ui-panel-border space-y-2.5">
              {/* Credits row */}
              <div>
                <div className="font-mono text-[10px] text-base-fg/50 uppercase tracking-[0.12em] mb-0.5">
                  Credits
                </div>
                {/* Three states: still loading (spinner and "Calculating…"), a number (singular or plural word), or no quote (a dash). */}
                <div className="font-display text-lg font-medium tracking-[-0.02em] text-base-fg flex items-center gap-1.5">
                  {isEstimateLoading && isLiveEstimatePage ? (
                    <>
                      <LoaderIcon className="animate-spin text-base" />
                      <span className="text-base-fg/50 text-sm">
                        Calculating…
                      </span>
                    </>
                  ) : totalCredits != null ? (
                    <>
                      {totalCredits} {totalCredits === 1 ? "Credit" : "Credits"}
                    </>
                  ) : (
                    <span className="text-base-fg/50">—</span>
                  )}
                </div>
              </div>

              {/* Thin divider line between the two rows. */}
              <div className="border-t border-ui-panel-border" />

              {/* Converted price row */}
              <div>
                <div className="font-mono text-[10px] text-base-fg/50 uppercase tracking-[0.12em] mb-0.5">
                  Estimated Price
                </div>
                {/* The price text on the left and the currency dropdown on the right. */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg font-medium text-base-fg tracking-[-0.02em]">
                    {formattedPrice}
                  </span>
                  {/* Changing the currency only changes how the dollar amount is shown; the credit count is unaffected. */}
                  <Select
                    options={selectOptions}
                    value={currency}
                    onChange={setCurrency}
                    className="w-[110px] text-xs"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          // Shown for any model that is not in MODELS_WITH_COST_DATA (or when no model is selected).
          <div className="bg-ui-sunken rounded-none p-2.5 border border-ui-panel-border text-center text-base-fg/60 text-[11px]">
            Credit Costs not yet available for this model
          </div>
        )}
      </div>
    </Modal>
  );
}
