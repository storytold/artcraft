import type {
  MediaHandle,
  MediaKind,
  MediaSourceAdapter,
  ResolvedMedia,
} from "@storyteller/ui-video-editor";
import { MediaFilesApi, MediaUploadApi } from "@storyteller/api";

// MediaFileClass enum values from @storyteller/api as string literals.
// @storyteller/api doesn't re-export the enum from its main entry, so
// we compare against the string values directly. Keep in sync with
// libs/api/src/lib/enums/MediaFileClass.ts.
type ApiMediaFileClass = "video" | "audio" | "image" | "unknown" | string;

// Webapp MediaSourceAdapter — uploads files through MediaUploadApi
// (video / image / audio endpoints) and resolves stored media via
// MediaFilesApi.GetMediaFileByToken. The MediaHandle.id is the
// media_file_token returned by upload; resolveMedia maps the token to
// the CDN URL stored on the MediaFile model.

const uploadApi = new MediaUploadApi();
const filesApi = new MediaFilesApi();

function kindFromMime(mime: string): MediaKind {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "image";
}

function kindFromMediaClass(mediaClass: ApiMediaFileClass | null): MediaKind {
  if (mediaClass === "video") return "video";
  if (mediaClass === "audio") return "audio";
  return "image";
}

// Best-effort mime hint by media class. The CDN URL is what the editor
// actually consumes; mime is metadata used by mediabunny / probe code.
function mimeFromMediaClass(mediaClass: ApiMediaFileClass | null): string {
  if (mediaClass === "video") return "video/mp4";
  if (mediaClass === "audio") return "audio/mpeg";
  if (mediaClass === "image") return "image/png";
  return "application/octet-stream";
}

export const webappMediaSourceAdapter: MediaSourceAdapter = {
  async uploadLocalFile(file: File): Promise<MediaHandle> {
    const kind = kindFromMime(file.type);
    const uuid = crypto.randomUUID();
    const fileName = file.name;
    const maybe_title = file.name;

    const response =
      kind === "video"
        ? await uploadApi.UploadNewVideo({
            uuid,
            blob: file,
            fileName,
            maybe_title,
          })
        : kind === "audio"
          ? await uploadApi.UploadAudio({
              uuid,
              blob: file,
              fileName,
              maybe_title,
            })
          : await uploadApi.UploadImage({
              uuid,
              blob: file,
              fileName,
              maybe_title,
            });

    if (!response.success || !response.data) {
      throw new Error(response.errorMessage || "Upload failed");
    }

    return { id: response.data, kind };
  },

  async resolveMedia(handle: MediaHandle): Promise<ResolvedMedia> {
    const response = await filesApi.GetMediaFileByToken({
      mediaFileToken: handle.id,
    });
    if (!response.success || !response.data) {
      throw new Error(
        response.errorMessage || `Failed to resolve media ${handle.id}`,
      );
    }
    const media = response.data;
    return {
      url: media.media_links.cdn_url,
      mime: mimeFromMediaClass(media.media_class),
      durationMs: media.maybe_duration_millis ?? undefined,
    };
  },

  // HTTP CDN URLs don't need explicit release; the browser tears them
  // down on tab close. Override only if the host needs reference
  // counting (e.g. signed-URL TTL management).
  releaseResolved() {
    // no-op
  },

  // Called by processMediaAssets when a fresh upload made it to the
  // server but a later step failed (resolveMedia error, decode error)
  // and the asset never landed in a project. Delete the orphan so the
  // user's media library doesn't accumulate dangling entries.
  async deleteHandle(handle) {
    const response = await filesApi.DeleteMediaFileByToken({
      mediaFileToken: handle.id,
      asMod: false,
    });
    if (!response.success) {
      throw new Error(
        response.errorMessage || `Failed to delete media ${handle.id}`,
      );
    }
  },
};

// Re-exported so other adapters in this folder (e.g. asset gallery)
// can map MediaFile.media_class → MediaKind without re-importing the
// enum.
export { kindFromMediaClass };
