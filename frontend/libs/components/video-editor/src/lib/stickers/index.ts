import { STICKER_CATEGORIES } from "./categories";
import { STICKER_INTRINSIC_SIZE_FALLBACK } from "./intrinsic-size";
import type { StickerCategory } from "./types";
import { stickersRegistry } from "./registry";
import { resolveStickerId } from "./resolver";
import { registerDefaultStickerProviders } from "./providers";
import { parseStickerId } from "./sticker-id";
import type {
  StickerBrowseResult,
  StickerItem,
  StickerProvider,
  StickerSearchResult,
} from "./types";

const DEFAULT_BROWSE_LIMIT = 12;
const DEFAULT_SEARCH_LIMIT = 100;

function mergeSearchResults({
  results,
}: {
  results: StickerSearchResult[];
}): StickerSearchResult {
  const deduplicatedItems = new Map<
    string,
    StickerSearchResult["items"][number]
  >();
  let total = 0;
  let hasMore = false;

  for (const result of results) {
    total += result.total;
    hasMore = hasMore || result.hasMore;
    for (const item of result.items) {
      if (!deduplicatedItems.has(item.id)) {
        deduplicatedItems.set(item.id, item);
      }
    }
  }

  return {
    items: Array.from(deduplicatedItems.values()),
    total,
    hasMore,
  };
}

function getProviderByCategory({
  category,
}: {
  category: StickerCategory;
}): StickerProvider | null {
  if (category === "all") {
    return null;
  }

  try {
    return stickersRegistry.get(category);
  } catch {
    return null;
  }
}

function getEmptyBrowseResult(): StickerBrowseResult {
  return {
    sections: [],
  };
}

function getStickerNameFromId({ stickerId }: { stickerId: string }): string {
  const stickerIdParts = stickerId.split(":");
  if (stickerIdParts.length <= 1) {
    return stickerId;
  }
  return (
    stickerIdParts.slice(1).join(":").split(":").pop()?.replaceAll("-", " ") ??
    stickerId
  );
}

function toRecentStickerItem({
  stickerId,
}: {
  stickerId: string;
}): StickerItem | null {
  try {
    const { providerId } = parseStickerId({ stickerId });
    return {
      id: stickerId,
      provider: providerId,
      name: getStickerNameFromId({ stickerId }),
      previewUrl: resolveStickerId({
        stickerId,
        options: { width: 64, height: 64 },
      }),
      metadata: {},
    };
  } catch {
    return null;
  }
}

export async function searchStickers({
  query,
  category,
  limit = DEFAULT_SEARCH_LIMIT,
}: {
  query: string;
  category: StickerCategory;
  limit?: number;
}): Promise<StickerSearchResult> {
  registerDefaultStickerProviders({});

  const effectiveCategory = category in STICKER_CATEGORIES ? category : "all";
  if (effectiveCategory !== "all") {
    const provider = getProviderByCategory({ category: effectiveCategory });
    if (!provider) {
      return {
        items: [],
        total: 0,
        hasMore: false,
      };
    }
    return provider.search({
      query,
      options: { limit },
    });
  }

  const providers = stickersRegistry.getAll();
  if (providers.length === 0) {
    return {
      items: [],
      total: 0,
      hasMore: false,
    };
  }

  const perProviderLimit = Math.max(1, Math.ceil(limit / providers.length));
  const settledResults = await Promise.allSettled(
    providers.map((provider) =>
      provider.search({
        query,
        options: { limit: perProviderLimit },
      }),
    ),
  );

  const fulfilledResults = settledResults
    .filter(
      (result): result is PromiseFulfilledResult<StickerSearchResult> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  return mergeSearchResults({
    results: fulfilledResults,
  });
}

export async function searchAll({
  query,
  limit = DEFAULT_SEARCH_LIMIT,
}: {
  query: string;
  limit?: number;
}): Promise<StickerBrowseResult> {
  registerDefaultStickerProviders({});

  const providers = stickersRegistry.getAll();
  if (providers.length === 0) {
    return { sections: [] };
  }

  const perProviderLimit = Math.max(1, Math.ceil(limit / providers.length));
  const settledResults = await Promise.allSettled(
    providers.map(async (provider) => {
      const result = await provider.search({
        query,
        options: { limit: perProviderLimit },
      });
      return { provider, result };
    }),
  );

  const sections: StickerBrowseResult["sections"] = [];
  for (const settled of settledResults) {
    if (settled.status !== "fulfilled") {
      continue;
    }
    const { provider, result } = settled.value;
    if (result.items.length === 0) {
      continue;
    }
    const category = provider.id as StickerCategory;
    sections.push({
      id: category,
      title: STICKER_CATEGORIES[category] ?? provider.id,
      items: result.items,
      hasMore: result.hasMore,
      layout: "grid",
    });
  }

  return { sections };
}

export async function browseCategory({
  category,
}: {
  category: StickerCategory;
}): Promise<StickerBrowseResult> {
  registerDefaultStickerProviders({});

  const effectiveCategory = category in STICKER_CATEGORIES ? category : "all";
  if (effectiveCategory === "all") {
    return getEmptyBrowseResult();
  }

  const provider = getProviderByCategory({ category: effectiveCategory });
  if (!provider) {
    return getEmptyBrowseResult();
  }

  return provider.browse({ options: {} });
}

export async function browseAll({
  recentStickers,
  limit = DEFAULT_BROWSE_LIMIT,
}: {
  recentStickers: string[];
  limit?: number;
}): Promise<StickerBrowseResult> {
  registerDefaultStickerProviders({});

  const sections: StickerBrowseResult["sections"] = [];
  const recentItems = recentStickers
    .map((stickerId) => toRecentStickerItem({ stickerId }))
    .filter((item): item is StickerItem => item !== null);

  if (recentItems.length > 0) {
    sections.push({
      id: "recent",
      title: "Recently used",
      items: recentItems.slice(0, limit),
      hasMore: recentItems.length > limit,
      layout: "row",
    });
  }

  const settledResults = await Promise.allSettled(
    stickersRegistry.getAll().map(async (provider) => {
      const browseResult = await provider.browse({
        options: { limit },
      });
      const firstSection = browseResult.sections[0];

      if (!firstSection || firstSection.items.length === 0) {
        return null;
      }

      const category = provider.id as StickerCategory;
      return {
        ...firstSection,
        id: category,
        title: STICKER_CATEGORIES[category] ?? firstSection.title,
        layout: "row" as const,
        action: {
          type: "see-all" as const,
          category,
          sectionId: firstSection.id,
        },
      };
    }),
  );

  for (const result of settledResults) {
    if (result.status === "fulfilled" && result.value) {
      sections.push(result.value);
    }
  }

  return { sections };
}

export async function resolveStickerIntrinsicSize({
  stickerId,
}: {
  stickerId: string;
}): Promise<{ width: number; height: number }> {
  const url = resolveStickerId({ stickerId });
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () =>
      resolve({
        width: STICKER_INTRINSIC_SIZE_FALLBACK,
        height: STICKER_INTRINSIC_SIZE_FALLBACK,
      });
    img.src = url;
  });
}

export { STICKER_INTRINSIC_SIZE_FALLBACK } from "./intrinsic-size";
export { stickersRegistry, StickersRegistry } from "./registry";
export { resolveStickerId };
export { parseStickerId, buildStickerId } from "./sticker-id";
export { registerDefaultStickerProviders } from "./providers";
export type {
  StickerBrowseResult,
  StickerBrowseSection,
  StickerCategory,
  StickerItem,
  StickerProvider,
  StickerProviderBrowseOptions,
  StickerProviderSearchOptions,
  StickerResolveOptions,
  StickerSearchResult,
} from "./types";
