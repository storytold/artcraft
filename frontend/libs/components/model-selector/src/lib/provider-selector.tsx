///////////////////////////////////////////
// DEPRECATED: Use ClassyModelSelector only
///////////////////////////////////////////

import { useEffect, useMemo } from "react";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { ModelPage } from "./model-pages";
import { Model } from "@storyteller/model-list";
import { Provider } from "@storyteller/tauri-api";
import { getProviderDisplayName, getProviderIcon } from "./provider-icons";
import {
  useClassyModelSelectorStore,
  useSelectedProviderForModel,
} from "./classy-model-selector-store";

interface ProviderSelectorProps {
  page: ModelPage;
  model: Model | undefined;
  providersByModel?: Partial<Record<string, Provider[]>>;
  panelTitle?: string;
  buttonClassName?: string;
  panelClassName?: string;
  triggerLabel?: string;
}

const DEFAULT_PROVIDER_OPTIONS: Provider[] = [
  Provider.ArtCraft,
  Provider.Fal,
  Provider.Sora,
];

export function ProviderSelector({
  page,
  model,
  providersByModel,
  ...popoverProps
}: ProviderSelectorProps) {
  const { setSelectedProvider } = useClassyModelSelectorStore();

  const modelId = model?.id;
  const allowedProviders: Provider[] = useMemo(() => {
    if (!modelId) return DEFAULT_PROVIDER_OPTIONS;
    return providersByModel?.[modelId] ?? DEFAULT_PROVIDER_OPTIONS;
  }, [providersByModel, modelId]);

  const selectedProvider = useSelectedProviderForModel(page, modelId);

  useEffect(() => {
    if (!modelId) return;
    if (!selectedProvider && allowedProviders.length > 0) {
      setSelectedProvider(page, modelId, allowedProviders[0]);
    }
  }, [page, modelId, selectedProvider, allowedProviders, setSelectedProvider]);

  const items: Omit<PopoverItem, "selected">[] = useMemo(
    () =>
      allowedProviders.map((p) => ({
        label: getProviderDisplayName(p),
        icon: getProviderIcon(p),
        model: undefined,
        provider: p,
      })),
    [allowedProviders]
  );

  const list = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        selected: (item as any).provider === selectedProvider,
      })),
    [items, selectedProvider]
  );

  const handleSelect = (item: PopoverItem) => {
    if (!modelId) return;
    const prov: Provider | undefined = (item as any).provider as
      | Provider
      | undefined;
    if (!prov) return;
    setSelectedProvider(page, modelId, prov);
  };

  return (
    <PopoverMenu
      items={list}
      onSelect={handleSelect}
      mode="hoverSelect"
      showIconsInList
      {...popoverProps}
      buttonClassName="border-0 bg-transparent p-0 hover:bg-transparent text-lg hover:opacity-80 shadow-none"
    />
  );
}

export default ProviderSelector;
