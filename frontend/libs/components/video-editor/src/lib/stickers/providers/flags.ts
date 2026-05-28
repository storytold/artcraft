// Stub flags provider. The real OpenCut Classic flags provider depends
// on a ~1,800-line `countries-data` dataset; that dataset hasn't been
// ported into this lib yet. Until it lands, the provider registers with
// an empty result set so `providers/index.ts` and the stickers store
// can still reference it without crashing.

import type {
  StickerBrowseResult,
  StickerItem,
  StickerProvider,
  StickerSearchResult,
} from "../types";

const FLAGS_PROVIDER_ID = "flags";

const EMPTY_SEARCH_RESULT: StickerSearchResult = {
  items: [] as StickerItem[],
  total: 0,
  hasMore: false,
};

const EMPTY_BROWSE_RESULT: StickerBrowseResult = {
  sections: [],
};

// Mirrors the shape of the real OpenCut Classic helper so callers in
// `assets-view.tsx` and `index.ts` keep working. Returns `null`
// (no region matched) for every query in this stub.
export function resolveQueryToRegions({
  query: _query,
}: {
  query: string;
}): Set<string> | null {
  return null;
}

// Mirrors the shape of the real OpenCut Classic helper. Echoes the
// query back unchanged — the stub never matches a region.
export function getRegionLabel({ query }: { query: string }): string {
  return query;
}

export const flagsProvider: StickerProvider = {
  id: FLAGS_PROVIDER_ID,
  async search(): Promise<StickerSearchResult> {
    return EMPTY_SEARCH_RESULT;
  },
  async browse(): Promise<StickerBrowseResult> {
    return EMPTY_BROWSE_RESULT;
  },
  resolveUrl({ stickerId }: { stickerId: string }): string {
    return stickerId;
  },
};
