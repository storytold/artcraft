import { EIntermediateFile, MediaFilesApi, MediaUploadApi } from "@storyteller/api";
import type { PageSceneAdapter } from "@storyteller/ui-pagescene";
import {
  type GalleryItem,
  galleryModalLightboxImage,
  galleryModalLightboxMediaId,
  galleryModalLightboxNavNext,
  galleryModalLightboxNavPrev,
  galleryModalLightboxVisible,
} from "@storyteller/ui-gallery-modal";

export const sceneOutputAdapter: Pick<
  PageSceneAdapter,
  "uploadMedia" | "openMediaLightbox"
> = {
  async uploadMedia({ kind, blob, fileName, title }) {
    const api = new MediaUploadApi();
    const request = {
      uuid: crypto.randomUUID(),
      blob,
      fileName,
      maybe_title: title ?? fileName,
      // Captures and recordings are library outputs, not temporary inputs.
      is_intermediate_system_file: EIntermediateFile.false,
    };
    const response = kind === "video"
      ? await api.UploadNewVideo(request)
      : await api.UploadImage(request);
    if (!response.success || !response.data) {
      throw new Error(response.errorMessage || "Could not upload the recording or capture.");
    }
    return response.data;
  },

  async openMediaLightbox(token, kind) {
    const response = await new MediaFilesApi().GetMediaFileByToken({
      mediaFileToken: token,
    });
    const file = response.data;
    if (!response.success || !file?.media_links?.cdn_url) {
      throw new Error("Upload succeeded, but the preview could not be loaded. Retry to open it.");
    }
    const item: GalleryItem = {
      id: token,
      label: file.maybe_title || (kind === "video" ? "Scene recording" : "Scene capture"),
      thumbnail: null,
      thumbnailUrlTemplate: file.media_links.thumbnail_template,
      fullImage: file.media_links.cdn_url,
      createdAt: file.created_at,
      mediaClass: kind,
      isUpload: true,
    };
    galleryModalLightboxNavPrev.value = null;
    galleryModalLightboxNavNext.value = null;
    galleryModalLightboxMediaId.value = token;
    galleryModalLightboxImage.value = item;
    galleryModalLightboxVisible.value = true;
  },
};
