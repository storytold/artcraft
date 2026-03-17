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
};

export const uploadAudio: UploadMediaFn = async ({
  title,
  assetFile,
  progressCallback,
}) => {
  const api = new MediaUploadApi();
  progressCallback({ status: UploaderStates.uploadingImage });

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
};

export const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });

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
