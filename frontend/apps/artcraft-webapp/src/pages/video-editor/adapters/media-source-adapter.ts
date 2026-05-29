import type {
  MediaHandle,
  MediaKind,
  MediaSourceAdapter,
  ResolvedMedia,
} from "@storyteller/ui-video-editor";
import { kindFromMime } from "@storyteller/ui-video-editor";
import { MediaFilesApi } from "@storyteller/api";
import { uploadByKind } from "./upload-by-kind";

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

const filesApi = new MediaFilesApi();

function kindFromMediaClass(mediaClass: ApiMediaFileClass | null): MediaKind {
  if (mediaClass === "video") return "video";
  if (mediaClass === "audio") return "audio";
  return "image";
}

const EXT_TO_MIME: Record<string, string> = {
  // video
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  // audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
  // image
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  avif: "image/avif",
};

function extensionOf(path: string | null | undefined): string | null {
  if (!path) return null;
  // Trim querystring/hash before extracting the extension so URLs like
  // /file.webm?token=abc still produce "webm".
  const trimmed = path.split(/[?#]/)[0];
  const dot = trimmed.lastIndexOf(".");
  if (dot === -1 || dot === trimmed.length - 1) return null;
  return trimmed.slice(dot + 1).toLowerCase();
}

// Resolve mime by reading the real file extension (from
// maybe_original_filename, falling back to the CDN URL and then to the
// public bucket path). Drops back to a coarse class-based default only
// when none of those carry a recognised extension. The class default
// loses container-level info — playing a .webm video through a path
// that asserts video/mp4 made mediabunny pick the wrong demuxer.
function mimeForMediaFile({
  maybeOriginalFilename,
  cdnUrl,
  publicBucketPath,
  mediaClass,
}: {
  maybeOriginalFilename: string | null;
  cdnUrl: string;
  publicBucketPath: string;
  mediaClass: ApiMediaFileClass | null;
}): string {
  const candidates = [maybeOriginalFilename, cdnUrl, publicBucketPath];
  for (const candidate of candidates) {
    const ext = extensionOf(candidate);
    if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  }
  if (mediaClass === "video") return "video/mp4";
  if (mediaClass === "audio") return "audio/mpeg";
  if (mediaClass === "image") return "image/png";
  return "application/octet-stream";
}

export const webappMediaSourceAdapter: MediaSourceAdapter = {
  async uploadLocalFile(file: File): Promise<MediaHandle> {
    const kind = kindFromMime(file.type);
    const id = await uploadByKind({
      kind,
      blob: file,
      fileName: file.name,
    });
    return { id, kind };
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
      mime: mimeForMediaFile({
        maybeOriginalFilename: media.maybe_original_filename,
        cdnUrl: media.media_links.cdn_url,
        publicBucketPath: media.public_bucket_path,
        mediaClass: media.media_class,
      }),
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
