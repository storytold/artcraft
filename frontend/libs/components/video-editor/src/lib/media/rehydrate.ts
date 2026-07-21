import type { MediaSourceAdapter } from "../adapters/media-source";
import type { ToastAdapter } from "../adapters/toast";
import type { MediaHandle, ResolvedMedia } from "../adapters/types";
import type { MediaAssetData } from "../services/storage/types";
import { processMediaAssets, type ProcessedMediaAsset } from "./processing";

// Rebuilds the in-memory media bin from a persisted document's media
// manifest. Each manifest entry's id is a MediaHandle id (in Artcraft
// hosts, a media_file_token): resolve it to a URL, download the bytes
// into a File, then run the normal import pipeline with the handle and
// resolution pre-supplied so nothing re-uploads. Entries that fail to
// resolve or download are skipped (their timeline elements render as
// missing media) rather than failing the whole project load.

interface FetchedEntry {
  file: File;
  handle: MediaHandle;
  resolved: ResolvedMedia;
}

// Cap on simultaneous asset downloads. An unbounded Promise.all over a
// media-heavy project would open one connection (and buffer one Blob) per
// asset at once — slow to first-usable and a real memory spike.
const MAX_CONCURRENT_FETCHES = 4;

export async function rehydrateProjectMedia({
  manifest,
  mediaSource,
  toast,
}: {
  manifest: MediaAssetData[];
  mediaSource: MediaSourceAdapter;
  toast: ToastAdapter;
}): Promise<ProcessedMediaAsset[]> {
  const fetched = await mapWithConcurrency({
    items: manifest,
    limit: MAX_CONCURRENT_FETCHES,
    run: (entry) => fetchEntry({ entry, mediaSource, toast }),
  });
  const entries = fetched.filter((entry): entry is FetchedEntry => !!entry);
  if (entries.length === 0) return [];

  return processMediaAssets({
    files: entries.map((entry) => entry.file),
    toast,
    mediaSource,
    existingHandles: entries.map((entry) => entry.handle),
    existingResolved: entries.map((entry) => entry.resolved),
  });
}

// Order-preserving concurrent map: at most `limit` `run` calls in flight.
async function mapWithConcurrency<T, R>({
  items,
  limit,
  run,
}: {
  items: T[];
  limit: number;
  run: (item: T) => Promise<R>;
}): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        results[index] = await run(items[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

async function fetchEntry({
  entry,
  mediaSource,
  toast,
}: {
  entry: MediaAssetData;
  mediaSource: MediaSourceAdapter;
  toast: ToastAdapter;
}): Promise<FetchedEntry | null> {
  try {
    const handle: MediaHandle = { id: entry.id, kind: entry.type };
    const resolved = await mediaSource.resolveMedia(handle);
    const response = await fetch(resolved.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${resolved.url}`);
    }
    const blob = await response.blob();
    const file = new File([blob], entry.name, {
      type: resolved.mime || blob.type,
      lastModified: entry.lastModified || undefined,
    });
    return { file, handle, resolved };
  } catch (error) {
    console.error("Failed to rehydrate media asset:", entry.id, error);
    toast.error(`Couldn't restore ${entry.name}`, {
      description: error instanceof Error ? error.message : undefined,
    });
    return null;
  }
}
