import { Provider } from "@storyteller/tauri-api";

export interface ProviderItem {
  id: Provider;
  name: string;
}

const PROVIDER_ITEM_MAP: Partial<Record<Provider, ProviderItem>> = {
  [Provider.ArtCraft]: { id: Provider.ArtCraft, name: "ArtCraft" },
  [Provider.Fal]: { id: Provider.Fal, name: "Fal" },
  [Provider.Sora]: { id: Provider.Sora, name: "Sora / ChatGPT" },
};

/**
 * Keeps the backend's supported-provider order and appends any supported
 * providers that an older backend omitted. Frontend-only enum variants are
 * ignored because the desktop command cannot persist them.
 */
export const buildProviderPriorityItems = (
  providers: readonly Provider[],
): ProviderItem[] => {
  const items: ProviderItem[] = [];
  const seen = new Set<Provider>();

  const append = (provider: Provider) => {
    const item = PROVIDER_ITEM_MAP[provider];
    if (!item || seen.has(provider)) return;

    items.push(item);
    seen.add(provider);
  };

  providers.forEach(append);
  Object.values(PROVIDER_ITEM_MAP).forEach((item) => {
    if (item) append(item.id);
  });

  return items;
};
