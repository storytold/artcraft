import { addCorsParam } from "@storyteller/common";
import { toast } from "../components/toast/toast";

const EXT_BY_MEDIA_CLASS: Record<string, string> = {
  image: "png",
  video: "mp4",
  dimensional: "glb",
};

function extensionForUrl(url: string, mediaClass?: string | null): string {
  try {
    const pathname = new URL(url, window.location.href).pathname;
    const match = pathname.match(/\.([a-z0-9]{2,5})$/i);
    if (match) return match[1].toLowerCase();
  } catch {
    // ignore — fall through to mediaClass default
  }
  if (mediaClass && EXT_BY_MEDIA_CLASS[mediaClass]) {
    return EXT_BY_MEDIA_CLASS[mediaClass];
  }
  return "bin";
}

export async function downloadMediaFile({
  url,
  filename,
  mediaClass,
}: {
  url: string;
  filename: string;
  mediaClass?: string | null;
}): Promise<void> {
  const corsUrl = addCorsParam(url) || url;
  let blobUrl: string | null = null;
  try {
    const response = await fetch(corsUrl, { credentials: "omit" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    blobUrl = window.URL.createObjectURL(blob);

    const ext = extensionForUrl(url, mediaClass);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    toast.error("Could not download file.");
  } finally {
    if (blobUrl) window.URL.revokeObjectURL(blobUrl);
  }
}
