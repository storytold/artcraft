import type { ToastAdapter } from "../adapters/toast";
import type { MediaSourceAdapter } from "../adapters/media-source";
import type { MediaHandle, ResolvedMedia } from "../adapters/types";
import { getMediaTypeFromFile } from "./media-utils";
import type { MediaAsset } from "./types";
import { readVideoFile } from "./mediabunny";
import type { VideoFileData } from "./mediabunny";
import { renderThumbnailDataUrl } from "./thumbnail";

// Media file → MediaAsset processor. OpenCut's original wrapped each
// file in a quota check via storageService.canStoreFile — the lib's
// adapter contract gives that responsibility to the host's
// ProjectStorageAdapter / MediaSourceAdapter, so we no longer gate
// uploads on browser storage availability here.
//
// Each file goes through MediaSourceAdapter.uploadLocalFile to get a
// stable handle (in the default impl, that's a blob URL keyed in an
// in-memory map; for Artcraft hosts, an upload returns a media token).
// The asset's `id` is the handle's id so the editor can re-resolve the
// URL via MediaSourceAdapter.resolveMedia on a subsequent session.

export interface ProcessedMediaAsset extends MediaAsset {}

const getUnsupportedVideoDescription = ({
  codec,
}: {
  codec: VideoFileData["codec"];
}): string => {
  const codecLabel = codec ? codec.toUpperCase() : "this video codec";

  return codec === "hevc"
    ? `${codecLabel} cannot be decoded in this browser, so this clip may not preview correctly. Convert it to H.264 MP4 or try importing it in Safari.`
    : `${codecLabel} cannot be decoded in this browser, so this clip may not preview correctly. Convert it to H.264 MP4 and reimport it.`;
};

async function generateImageThumbnail({
  imageFile,
}: {
  imageFile: File;
}): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const objectUrl = URL.createObjectURL(imageFile);

    image.addEventListener("load", () => {
      try {
        const thumbnailUrl = renderThumbnailDataUrl({
          width: image.naturalWidth,
          height: image.naturalHeight,
          draw: ({ context, width, height }) => {
            context.drawImage(image, 0, 0, width, height);
          },
        });
        resolve({
          thumbnailUrl,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      } catch (error) {
        reject(
          error instanceof Error ? error : new Error("Could not render image"),
        );
      } finally {
        URL.revokeObjectURL(objectUrl);
        image.remove();
      }
    });

    image.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      image.remove();
      reject(new Error("Could not load image"));
    });

    image.src = objectUrl;
  });
}

export async function processMediaAssets({
  files,
  toast,
  mediaSource,
  onProgress,
  existingHandles,
  existingResolved,
}: {
  files: FileList | File[];
  toast: ToastAdapter;
  mediaSource: MediaSourceAdapter;
  onProgress?: ({ progress }: { progress: number }) => void;
  // Optional: skip upload for files whose handle is already known
  // (e.g. the gallery picker path, where the user is reimporting an
  // asset already stored in the host's media library). Aligned by
  // index with `files`.
  existingHandles?: ReadonlyArray<MediaHandle | undefined>;
  // Optional: skip resolveMedia too when the caller already resolved
  // the handle (gallery picker fetches the URL before constructing the
  // File, so resolving again would double the network roundtrips).
  // Aligned by index with `files`. Ignored unless the entry at the
  // same index of `existingHandles` is also set.
  existingResolved?: ReadonlyArray<ResolvedMedia | undefined>;
}): Promise<ProcessedMediaAsset[]> {
  const fileArray = Array.from(files);
  const processedAssets: ProcessedMediaAsset[] = [];

  const total = fileArray.length;
  let completed = 0;

  for (let index = 0; index < fileArray.length; index++) {
    const file = fileArray[index];
    const fileType = getMediaTypeFromFile({ file });

    if (!fileType) {
      toast.error(`Unsupported file type: ${file.name}`);
      continue;
    }

    let thumbnailUrl: string | undefined;
    let duration: number | undefined;
    let width: number | undefined;
    let height: number | undefined;
    let fps: number | undefined;
    let hasAudio: boolean | undefined;
    let handle: MediaHandle | undefined;
    let resolved: ResolvedMedia | undefined;
    // True only for handles we obtained via uploadLocalFile in this
    // call — host-provided handles in `existingHandles` must not be
    // deleted on failure (the host owns them).
    let ownsHandle = false;

    try {
      if (fileType === "image") {
        const result = await generateImageThumbnail({ imageFile: file });
        thumbnailUrl = result.thumbnailUrl;
        width = result.width;
        height = result.height;
      } else if (fileType === "video") {
        try {
          const videoData = await readVideoFile({ file });
          duration = videoData.duration;
          width = videoData.width;
          height = videoData.height;
          fps = Number.isFinite(videoData.fps)
            ? Math.round(videoData.fps)
            : undefined;
          hasAudio = videoData.hasAudio;
          thumbnailUrl = videoData.thumbnailUrl ?? undefined;

          if (!videoData.canDecode) {
            toast.error(`Can't preview ${file.name}`, {
              description: getUnsupportedVideoDescription({
                codec: videoData.codec,
              }),
            });
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not process video";

          toast.error(`Couldn't process ${file.name}`, {
            description: message,
          });
        }
      } else if (fileType === "audio") {
        duration = await getMediaDuration({ file });
      }

      const existing = existingHandles?.[index];
      if (existing) {
        handle = existing;
      } else {
        handle = await mediaSource.uploadLocalFile(file);
        ownsHandle = true;
      }
      const existingResolvedItem = existing ? existingResolved?.[index] : undefined;
      resolved = existingResolvedItem ?? (await mediaSource.resolveMedia(handle));

      processedAssets.push({
        id: handle.id,
        name: file.name,
        type: fileType,
        file,
        url: resolved.url,
        thumbnailUrl,
        duration,
        width,
        height,
        fps,
        hasAudio,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      completed += 1;
      if (onProgress) {
        const percent = Math.round((completed / total) * 100);
        onProgress({ progress: percent });
      }
    } catch (error) {
      console.error("Error processing file:", file.name, error);
      toast.error(`Failed to process ${file.name}`);
      if (resolved && mediaSource.releaseResolved) {
        mediaSource.releaseResolved(resolved);
      }
      // If we minted this handle (uploadLocalFile succeeded but a later
      // step in the try block threw — typically resolveMedia), ask the
      // adapter to delete it so the user's media library doesn't grow
      // a dangling entry for an asset that never made it into a project.
      if (handle && ownsHandle && mediaSource.deleteHandle) {
        try {
          await mediaSource.deleteHandle(handle);
        } catch (deleteError) {
          console.error(
            "deleteHandle failed during rollback:",
            handle.id,
            deleteError,
          );
        }
      }
    }
  }

  return processedAssets;
}

const getMediaDuration = ({ file }: { file: File }): Promise<number> => {
  return new Promise((resolve, reject) => {
    const element = document.createElement(
      file.type.startsWith("video/") ? "video" : "audio",
    ) as HTMLVideoElement;
    const objectUrl = URL.createObjectURL(file);

    element.addEventListener("loadedmetadata", () => {
      resolve(element.duration);
      URL.revokeObjectURL(objectUrl);
      element.remove();
    });

    element.addEventListener("error", () => {
      reject(new Error("Could not load media"));
      URL.revokeObjectURL(objectUrl);
      element.remove();
    });

    element.src = objectUrl;
    element.load();
  });
};
