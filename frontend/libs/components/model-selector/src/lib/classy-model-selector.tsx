import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import {
  useClassyModelSelectorStore,
  useSelectedProviderForModel,
} from "./classy-model-selector-store";
import { useEffect, useMemo } from "react";
import { ModelPage } from "./model-pages";
import { Provider } from "@storyteller/tauri-api";
import { getProviderDisplayName, getProviderIcon } from "./provider-icons";
import { Model } from "@storyteller/model-list";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/pro-solid-svg-icons";
import { PROVIDER_LOOKUP_BY_PAGE } from "./provider-lookup";

interface ClassyModelSelectorProps {
  items: Omit<PopoverItem, "selected">[];
  page: ModelPage;
  mode?: "hoverSelect" | "default" | "toggle" | "button";
  panelTitle?: string;
  buttonClassName?: string;
  panelClassName?: string;
  showIconsInList?: boolean;
  triggerLabel?: string;
  providersByModel?: Partial<Record<string, Provider[]>>;
  providerTooltipDelayMs?: number;
}

const DEFAULT_PROVIDER_OPTIONS: Provider[] = [
  Provider.ArtCraft,
  Provider.Fal,
  Provider.Sora,
];

function ProviderTooltipContent({
  page,
  modelId,
  model,
  modelLabel,
  allowedProviders,
  onFinished,
}: {
  page: ModelPage;
  modelId?: string;
  model?: Model;
  modelLabel?: string;
  allowedProviders: Provider[];
  onFinished?: () => void;
}) {
  const { setSelectedModel, setSelectedProvider } =
    useClassyModelSelectorStore();
  const selectedProvider = useSelectedProviderForModel(page, modelId);

  // Initialize provider for this model if missing
  useEffect(() => {
    if (!modelId) return;
    if (!selectedProvider && allowedProviders.length > 0) {
      setSelectedProvider(page, modelId, allowedProviders[0]);
    }
  }, [page, modelId, selectedProvider, allowedProviders, setSelectedProvider]);

  if (!modelId) return null as any;

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-1 mt-0.5 px-1.5 text-sm font-normal text-base-fg opacity-70">
        Select Provider
      </div>
      {allowedProviders.map((p) => (
        <button
          key={p}
          onClick={() => {
            if (model) {
              setSelectedModel(page, model);
            }
            setSelectedProvider(page, modelId, p);
            onFinished?.();
          }}
          type="button"
          className={`group flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-all ${
            selectedProvider === p
              ? "bg-ui-controls/70 border-l-4 border-primary"
              : "hover:bg-ui-controls/50"
          }`}
        >
          <span className="flex items-center gap-2 text-sm text-base-fg">
            <span className="text-lg">{getProviderIcon(p)}</span>
            {getProviderDisplayName(p)}
          </span>
          {selectedProvider === p && (
            <span className="text-primary text-xl font-bold bg-white rounded-full p-0 h-4 w-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faCircleCheck} />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function ClassyModelSelector({
  items,
  page,
  providersByModel,
  providerTooltipDelayMs = 300,
  ...popoverProps
}: ClassyModelSelectorProps) {
  const { selectedModels, setSelectedModel, setSelectedProvider } =
    useClassyModelSelectorStore();
  const selectedModel = selectedModels[page] || items[0]?.model;
  const selectedProvider = useSelectedProviderForModel(page, selectedModel?.id);
  const selectedProvidersByModel = useClassyModelSelectorStore(
    (s) => s.selectedProviders[page] ?? {}
  );

  // For the first mount, make sure the selected model is set for other components to listen
  useEffect(() => {
    // Initialize selected model if not set
    if (!selectedModels[page] && items[0]) {
      setSelectedModel(page, items[0].model!);
    }
  }, []);

  // Initialize a default provider for each model so we can render icons even when not selected
  useEffect(() => {
    for (const item of items) {
      const modelId = item.model?.id;
      if (!modelId) continue;
      if (selectedProvidersByModel[modelId]) continue;
      const allowed =
        providersByModel?.[modelId] ??
        PROVIDER_LOOKUP_BY_PAGE[page]?.[modelId] ??
        DEFAULT_PROVIDER_OPTIONS;
      if (allowed.length > 0) {
        setSelectedProvider(page, modelId, allowed[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, providersByModel, page, selectedProvidersByModel]);

  const handleModelSelect = (item: PopoverItem) => {
    console.log(`Model selector changed on page "${page}": `, item.model);
    setSelectedModel(page, item.model!);
  };

  const modelList = useMemo(
    () =>
      items.map((item) => {
        const modelId = item.model?.id;
        const allowedProviders: Provider[] = modelId
          ? providersByModel?.[modelId] ??
            PROVIDER_LOOKUP_BY_PAGE[page]?.[modelId] ??
            DEFAULT_PROVIDER_OPTIONS
          : DEFAULT_PROVIDER_OPTIONS;

        return {
          ...item,
          selected: item.model === selectedModel,
          hoverTooltip: (close: () => void) => (
            <ProviderTooltipContent
              page={page}
              modelId={modelId}
              model={item.model as Model | undefined}
              modelLabel={item.label}
              allowedProviders={allowedProviders}
              onFinished={close}
            />
          ),
          tooltipDelayMs: providerTooltipDelayMs,
          trailing:
            item.model !== selectedModel
              ? (() => {
                  const prov = modelId
                    ? selectedProvidersByModel[modelId]
                    : undefined;
                  const iconProvider = prov ?? allowedProviders[0];
                  return iconProvider ? (
                    <div className="mr-1 rounded-md p-1.5 bg-ui-controls/60 group-hover:bg-ui-controls/80 transition-colors">
                      <span className="text-base-fg/70 group-hover:text-base-fg/90 text-lg">
                        {getProviderIcon(iconProvider)}
                      </span>
                    </div>
                  ) : undefined;
                })()
              : undefined,
          selectedRight:
            item.model === selectedModel && selectedProvider ? (
              <div className="mr-1 rounded-md p-1.5 bg-primary/60 group-hover:bg-primary/80 transition-colors">
                <span className="text-base-fg/70 group-hover:text-base-fg/90 text-lg">
                  {getProviderIcon(selectedProvider)}
                </span>
              </div>
            ) : undefined,
        } as PopoverItem;
      }),
    [
      items,
      selectedModel,
      selectedProvider,
      selectedProvidersByModel,
      page,
      providersByModel,
      providerTooltipDelayMs,
    ]
  );

  return (
    <PopoverMenu
      items={modelList}
      onSelect={handleModelSelect}
      mode="hoverSelect"
      {...popoverProps}
      buttonClassName="border-0 bg-transparent p-0 hover:bg-transparent text-lg hover:opacity-80 shadow-none"
    />
  );
}

export default ClassyModelSelector;
