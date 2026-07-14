import { MediaUploadApi } from "@storyteller/api";
import { UploaderState, UploaderStates } from "@storyteller/common";

export type UploadMediaFn = (args: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => Promise<void>;

export const uploadVideo: UploadMediaFn = async ({
  title,
  assetFile,
  progressCallback,
}) => {
  const api = new MediaUploadApi();
  progressCallback({ status: UploaderStates.uploadingImage });

  try {
    const response = await api.UploadNewVideo({
      uuid: crypto.randomUUID(),
      blob: assetFile,
      fileName: assetFile.name || `reference-video-${Date.now()}`,
      maybe_title: `ref_video_${title}`,
    });

    if (!response?.success || !response.data) {
      progressCallback({
        status: UploaderStates.imageCreateError,
        errorMessage: response?.errorMessage ?? "Could not upload video",
      });
      return;
    }

    progressCallback({ status: UploaderStates.success, data: response.data });
  } catch (err) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: err instanceof Error ? err.message : "Could not upload video",
    });
  }
};

export const uploadAudio: UploadMediaFn = async ({
  title,
  assetFile,
  progressCallback,
}) => {
  const api = new MediaUploadApi();
  progressCallback({ status: UploaderStates.uploadingImage });

  try {
    const response = await api.UploadAudio({
      uuid: crypto.randomUUID(),
      blob: assetFile,
      fileName: assetFile.name || `reference-audio-${Date.now()}`,
      maybe_title: `ref_audio_${title}`,
    });

    if (!response?.success || !response.data) {
      progressCallback({
        status: UploaderStates.imageCreateError,
        errorMessage: response?.errorMessage ?? "Could not upload audio",
      });
      return;
    }

    progressCallback({ status: UploaderStates.success, data: response.data });
  } catch (err) {
    progressCallback({
      status: UploaderStates.imageCreateError,
      errorMessage: err instanceof Error ? err.message : "Could not upload audio",
    });
  }
};

// Resolves 0 when metadata can't be loaded.
export const getVideoDurationFromUrl = (url: string): Promise<number> =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve(Math.round(video.duration));
    video.onerror = () => resolve(0);
    video.src = url;
  });

// Resolves 0 when metadata can't be loaded.
export const getAudioDurationFromUrl = (url: string): Promise<number> =>
  new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve(Math.round(audio.duration));
    audio.onerror = () => resolve(0);
    audio.src = url;
  });

export const getVideoDuration = (file: File): Promise<number> => {
  const url = URL.createObjectURL(file);
  return getVideoDurationFromUrl(url).finally(() => URL.revokeObjectURL(url));
};

export const getAudioDuration = (file: File): Promise<number> =>
  new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(Math.round(audio.duration));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      resolve(0);
    };
    audio.src = URL.createObjectURL(file);
  });
