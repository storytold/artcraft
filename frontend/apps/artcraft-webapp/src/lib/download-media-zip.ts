import JSZip from "jszip";
import { addCorsParam } from "@storyteller/common";
import { extensionForUrl } from "./download-media";

// How many media fetches run at once while filling the zip.
const FETCH_CONCURRENCY = 3;

export interface ZipDownloadItem {
  id: string;
  url: string;
  mediaClass?: string | null;
}

export interface ZipDownloadResult {
  succeeded: number;
  failed: number;
}

// Fetches each item (same CORS/dl params as downloadMediaFile) and saves them
// all as a single zip. Items that fail to fetch are skipped — the zip is still
// produced as long as at least one item succeeded. Callers surface the counts.
export async function downloadItemsAsZip(
  items: ZipDownloadItem[],
  opts?: { onProgress?: (done: number, total: number) => void },
): Promise<ZipDownloadResult> {
  const zip = new JSZip();
  let succeeded = 0;
  let failed = 0;
  let done = 0;
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      try {
        const corsUrl = addCorsParam(item.url) || item.url;
        const response = await fetch(`${corsUrl}&dl=1`, {
          credentials: "omit",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const ext = extensionForUrl(item.url, item.mediaClass);
        zip.file(`artcraft-${item.id}.${ext}`, blob);
        succeeded += 1;
      } catch {
        failed += 1;
      }
      done += 1;
      opts?.onProgress?.(done, items.length);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(FETCH_CONCURRENCY, items.length) }, worker),
  );

  if (succeeded > 0) {
    // Media files are already compressed — STORE skips pointless deflate work.
    const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
    const blobUrl = window.URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = `artcraft-videos-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      window.URL.revokeObjectURL(blobUrl);
    }
  }

  return { succeeded, failed };
}
