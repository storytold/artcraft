import { Modal } from "@storyteller/ui-modal";
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins, faSpinner } from "@fortawesome/pro-solid-svg-icons";
import { Select } from "@storyteller/ui-select";
import {
  useCostBreakdownModalStore,
  TAB_TO_MODEL_PAGE,
} from "./cost-breakdown-modal-store";
import {
  ModelPage,
  useSelectedModel,
  useSelectedProviderForModel,
  defaultModelForPage,
  TEXT_TO_IMAGE_PAGE_MODEL_LIST,
  IMAGE_TO_VIDEO_PAGE_MODEL_LIST,
  CANVAS_2D_PAGE_MODEL_LIST,
  STAGE_3D_PAGE_MODEL_LIST,
  IMAGE_EDITOR_PAGE_MODEL_LIST,
} from "@storyteller/ui-model-selector";
import {
  usePrompt2DStore,
  usePrompt3DStore,
  usePromptImageStore,
  usePromptVideoStore,
  usePromptEditStore,
} from "@storyteller/ui-promptbox";
import { Model } from "@storyteller/model-list";
import { useCurrency } from "./use-currency";
import { useVideoCostEstimate } from "./useVideoCostEstimate";

// Drag handle subcomponent that Modal looks for
const DragHandle = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
DragHandle.displayName = "ModalDragHandle";

// Provider display name mapping
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  artcraft: "ArtCraft",
  fal: "FAL",
  grok: "Grok",
  midjourney: "Midjourney",
  sora: "Sora",
  worldlabs: "World Labs",
};

// Get models list for a page
const getModelsForPage = (page: ModelPage | null): Model[] => {
  switch (page) {
    case ModelPage.TextToImage:
      return TEXT_TO_IMAGE_PAGE_MODEL_LIST.map((item) => item.model).filter(
        (m): m is Model => m !== undefined,
      );
    case ModelPage.ImageToVideo:
      return IMAGE_TO_VIDEO_PAGE_MODEL_LIST.map((item) => item.model).filter(
        (m): m is Model => m !== undefined,
      );
    case ModelPage.Canvas2D:
      return CANVAS_2D_PAGE_MODEL_LIST.map((item) => item.model).filter(
        (m): m is Model => m !== undefined,
      );
    case ModelPage.Stage3D:
      return STAGE_3D_PAGE_MODEL_LIST.map((item) => item.model).filter(
        (m): m is Model => m !== undefined,
      );
    case ModelPage.ImageEditor:
      return IMAGE_EDITOR_PAGE_MODEL_LIST.map((item) => item.model).filter(
        (m): m is Model => m !== undefined,
      );
    default:
      return [];
  }
};

export interface CostBreakdownModalProps {
  /** The current active tab ID from the app (e.g. "IMAGE", "VIDEO", "2D", "3D") */
  activeTabId?: string;
}

export function CostBreakdownModal({ activeTabId }: CostBreakdownModalProps) {
  const { isOpen, closeModal, estimatedCreditsByPage } =
    useCostBreakdownModalStore();
  const {
    currency,
    setCurrency,
    currencyOption,
    formatPrice,
    currencyOptions,
  } = useCurrency();

  // Map TabId to ModelPage, default to TextToImage
  const activePage = useMemo(() => {
    if (!activeTabId) return ModelPage.TextToImage;
    return TAB_TO_MODEL_PAGE[activeTabId] ?? ModelPage.TextToImage;
  }, [activeTabId]);

  // Get the selected model for the active page
  const selectedModelFromStore = useSelectedModel(activePage);

  // If no model selected in store, use the default for this page
  const modelsForPage = getModelsForPage(activePage);
  const selectedModel =
    selectedModelFromStore ?? defaultModelForPage(modelsForPage, activePage);

  const selectedProvider = useSelectedProviderForModel(
    activePage,
    selectedModel?.id,
  );

  const { isLoading: isVideoEstimateLoading } = useVideoCostEstimate(
    activePage,
    selectedModel,
    selectedProvider,
  );

  // Get generation settings from the appropriate stores based on active page
  const prompt2D = usePrompt2DStore();
  const prompt3D = usePrompt3DStore();
  const promptImage = usePromptImageStore();
  const promptVideo = usePromptVideoStore();
  const promptEdit = usePromptEditStore();

  // Determine which store to use based on active page
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
          generationCount: 1, // Video doesn't have generation count
          label: "Videos",
        };
      case ModelPage.ImageEditor:
        return {
          resolution: promptEdit.resolution,
          generationCount: 1, // Edit doesn't have generation count in store
          label: "Images",
        };
      default:
        return {
          resolution: "1k",
          generationCount: 1,
          label: "Items",
        };
    }
  };

  const storeData = getStoreData();

  // For video, use the live estimate from the backend; for others use a default
  const videoCredits =
    activePage === ModelPage.ImageToVideo
      ? (estimatedCreditsByPage[ModelPage.ImageToVideo] ?? null)
      : null;

  const creditsPerGeneration = 1;
  const totalCredits =
    activePage === ModelPage.ImageToVideo
      ? (videoCredits ?? null)
      : creditsPerGeneration * storeData.generationCount;

  // Convert credits to USD first (1 credit = $0.01), then to selected currency
  const usdAmount = (totalCredits ?? 0) * 0.01;
  const formattedPrice = formatPrice(usdAmount);

  // Select options formatted for the Select component
  const selectOptions = currencyOptions.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  // Format provider name
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
      default:
        return null;
    }
  };

  const pageName = getPageName();

  // Models that have credit cost data available
  const MODELS_WITH_COST_DATA = new Set(["seedance_2p0", "nano_banana_pro"]);
  const hasCostData =
    selectedModel != null && MODELS_WITH_COST_DATA.has(selectedModel.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      draggable={true}
      allowBackgroundInteraction={true}
      showClose={true}
      closeOnOutsideClick={false}
      closeOnEsc={true}
      resizable={false}
      backdropClassName="pointer-events-none !bg-transparent"
      className="max-w-xs rounded-xl bg-ui-panel border border-ui-panel-border overflow-visible shadow-2xl"
    >
      {/* Drag Handle - Modal component will recognize this and make it draggable */}
      <DragHandle>
        <div className="flex items-center gap-2 pb-3 bg-ui-panel-header border-b border-ui-panel-border select-none">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-fg">
            <FontAwesomeIcon icon={faCoins} className="text-white" />
            Cost Breakdown
          </div>
        </div>
      </DragHandle>

      <div className="space-y-3 font-sans text-base-fg text-xs mt-3">
        {/* Page indicator */}
        {pageName && (
          <div className="text-[10px] text-base-fg/75 uppercase tracking-wide text-start font-bold">
            {pageName}
          </div>
        )}

        {/* Model row — always shown */}
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

        {hasCostData ? (
          <>
            {/* Generation Details */}
            <div className="space-y-1.5">
              {storeData.resolution && (
                <div className="flex justify-between items-center">
                  <span className="text-base-fg/60">Resolution</span>
                  <span className="text-base-fg font-medium uppercase">
                    {storeData.resolution}
                  </span>
                </div>
              )}
              {storeData.generationCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-base-fg/60">{storeData.label}</span>
                  <span className="text-base-fg font-medium">
                    {storeData.generationCount}
                  </span>
                </div>
              )}
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
            <div className="bg-ui-controls/50 rounded-lg p-3 border border-ui-controls-border space-y-2.5">
              {/* Credits row */}
              <div>
                <div className="text-[10px] text-base-fg/50 uppercase tracking-wider font-medium mb-0.5">
                  Credits
                </div>
                <div className="text-lg font-bold text-base-fg flex items-center gap-1.5">
                  {isVideoEstimateLoading &&
                  activePage === ModelPage.ImageToVideo ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin text-base"
                      />
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

              <div className="border-t border-ui-controls-border" />

              {/* Converted price row */}
              <div>
                <div className="text-[10px] text-base-fg/50 uppercase tracking-wider font-medium mb-0.5">
                  Estimated Price
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-base-fg tracking-tight">
                    {formattedPrice}
                  </span>
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
          <div className="bg-ui-controls/50 rounded-lg p-2.5 border border-ui-controls-border text-center text-base-fg/60 text-[11px]">
            Credit Costs not yet available for this model
          </div>
        )}
      </div>
    </Modal>
  );
}
