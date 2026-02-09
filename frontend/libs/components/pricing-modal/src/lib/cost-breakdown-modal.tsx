import { Modal } from "@storyteller/ui-modal";
import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoins } from "@fortawesome/pro-solid-svg-icons";
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
  const { isOpen, closeModal } = useCostBreakdownModalStore();
  const [currency, setCurrency] = useState<string | number>("USD");

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

  // Default credits per model - this should ideally come from the model
  // For now we use a default of 1 credit per generation
  const creditsPerGeneration = 1;
  const totalCredits = creditsPerGeneration * storeData.generationCount;

  const currencyOptions = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "JPY", label: "JPY (¥)" },
  ];

  const getCurrencySymbol = (curr: string | number) => {
    switch (curr) {
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "JPY":
        return "¥";
      default:
        return "$";
    }
  };

  const symbol = getCurrencySymbol(currency);
  const estimatedCost = (totalCredits * 0.01).toFixed(2);

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
        return "Image to Video";
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
      className="max-w-xs rounded-xl bg-ui-panel border border-ui-panel-border overflow-hidden shadow-2xl"
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

        {/* Generation Details */}
        <div className="space-y-1.5">
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
        <div className="bg-ui-controls/50 rounded-lg p-2.5 border border-ui-controls-border">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-base-fg/80">Total Cost</span>
            <span className="text-base font-bold text-base-fg">
              {totalCredits} Credits
            </span>
          </div>
          <div className="text-[10px] text-base-fg/60 text-right">
            ≈ {symbol}
            {estimatedCost} {currency}
          </div>
        </div>

        {/* Currency Selector */}
        <div className="space-y-0.5">
          <label className="text-[10px] font-medium text-base-fg/80">
            Currency
          </label>
          <Select
            options={currencyOptions}
            value={currency}
            onChange={setCurrency}
            className="w-full"
          />
        </div>

        <div className="pt-2 text-[9px] text-base-fg/40 text-center border-t border-ui-panel-border">
          1 Credit = $0.01 USD
        </div>
      </div>
    </Modal>
  );
}
