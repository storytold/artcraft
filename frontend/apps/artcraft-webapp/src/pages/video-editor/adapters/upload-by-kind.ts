import type { MediaKind } from "@storyteller/ui-video-editor";
import { MediaUploadApi } from "@storyteller/api";

// Single dispatch from MediaKind to the right MediaUploadApi endpoint.
// Both the media-source adapter (uploadLocalFile) and the export-sink
// adapter (uploadToLibrary) need this. Factoring it here means a future
// upload-API change (e.g. a new required field) lands in one place.

const api = new MediaUploadApi();

export async function uploadByKind({
  kind,
  blob,
  fileName,
  title,
}: {
  kind: MediaKind;
  blob: Blob;
  fileName: string;
  title?: string;
}): Promise<string> {
  const uuid = crypto.randomUUID();
  const maybe_title = title ?? fileName;

  const response =
    kind === "video"
      ? await api.UploadNewVideo({ uuid, blob, fileName, maybe_title })
      : kind === "audio"
        ? await api.UploadAudio({ uuid, blob, fileName, maybe_title })
        : await api.UploadImage({ uuid, blob, fileName, maybe_title });

  if (!response.success || !response.data) {
    throw new Error(response.errorMessage || "Upload failed");
  }
  return response.data;
}
