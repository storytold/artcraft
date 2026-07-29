import { useCallback, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderOpen,
  faImage,
  faMusic,
  faPlay,
  faPlus,
  faStop,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { toast } from "@storyteller/ui-toaster";
import { UploaderStates } from "@storyteller/common";
import type { UploadMediaFn } from "@storyteller/api";
import type { RefAudio, RefImage } from "../promptStore";
import {
  AUDIO_FILE_ACCEPT,
  AUDIO_FILE_TYPE_ERROR,
  isAudioFile,
} from "./audioFiles";

export interface AudioReferenceRowProps {
  referenceAudios: RefAudio[];
  onReferenceAudiosChange: (audios: RefAudio[]) => void;
  maxAudioCount: number;
  maxAudioRefDuration: number;
  uploadAudio?: UploadMediaFn;
  // Opens the caller's audio library picker (adds a "From library" button).
  onPickAudioFromLibrary?: () => void;
  // Whether the audio reference is required (remix/sample source).
  audioRequired?: boolean;
  // Optional single-image reference section (Seed Audio).
  imageSupported?: boolean;
  referenceImages?: RefImage[];
  onReferenceImagesChange?: (images: RefImage[]) => void;
  uploadImage?: UploadMediaFn;
  className?: string;
}

// Reference row for the audio promptbox: upload an audio track (the
// remix/sample source or Seed Audio refs), plus an optional image reference
// for models that support one. Rendered inside the glass card, above the
// prompt textarea.
export function AudioReferenceRow({
  referenceAudios,
  onReferenceAudiosChange,
  maxAudioCount,
  maxAudioRefDuration,
  uploadAudio,
  onPickAudioFromLibrary,
  audioRequired = false,
  imageSupported = false,
  referenceImages = [],
  onReferenceImagesChange,
  uploadImage,
  className = "",
}: AudioReferenceRowProps) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Latest-value refs so async upload callbacks append to fresh state.
  const referenceAudiosRef = useRef(referenceAudios);
  referenceAudiosRef.current = referenceAudios;
  const referenceImagesRef = useRef(referenceImages);
  referenceImagesRef.current = referenceImages;

  const handleAudioFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const audioFiles = files.filter(isAudioFile);
    if (audioFiles.length < files.length) {
      toast.error(AUDIO_FILE_TYPE_ERROR);
    }

    const availableSlots = Math.max(0, maxAudioCount - referenceAudios.length);
    const filesToProcess = audioFiles.slice(0, availableSlots);

    for (const file of filesToProcess) {
      const duration = await getAudioFileDuration(file);
      const currentTotal = referenceAudiosRef.current.reduce(
        (sum, audio) => sum + audio.duration,
        0,
      );
      if (currentTotal + duration > maxAudioRefDuration) {
        toast.error(
          `Total audio duration cannot exceed ${maxAudioRefDuration}s`,
        );
        break;
      }

      if (uploadAudio) {
        setIsUploadingAudio(true);
        await uploadAudio({
          title: `reference-audio-${Math.random().toString(36).substring(2, 15)}`,
          assetFile: file,
          progressCallback: (newState) => {
            if (newState.status === UploaderStates.success && newState.data) {
              const refAudio: RefAudio = {
                id: Math.random().toString(36).substring(7),
                url: URL.createObjectURL(file),
                file,
                mediaToken: newState.data,
                duration,
              };
              setIsUploadingAudio(false);
              onReferenceAudiosChange([
                ...referenceAudiosRef.current,
                refAudio,
              ]);
            } else if (
              newState.status === UploaderStates.assetError ||
              newState.status === UploaderStates.imageCreateError
            ) {
              setIsUploadingAudio(false);
              toast.error("Audio upload failed. Please try again.");
            }
          },
        });
      }
    }

    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const handleImageFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = (event.target.files || [])[0];
    if (!file || !uploadImage) return;

    setIsUploadingImage(true);
    await uploadImage({
      title: `reference-image-${Math.random().toString(36).substring(2, 15)}`,
      assetFile: file,
      progressCallback: (newState) => {
        if (newState.status === UploaderStates.success && newState.data) {
          const refImage: RefImage = {
            id: Math.random().toString(36).substring(7),
            url: URL.createObjectURL(file),
            file,
            mediaToken: newState.data,
          };
          setIsUploadingImage(false);
          onReferenceImagesChange?.([refImage]);
        } else if (
          newState.status === UploaderStates.assetError ||
          newState.status === UploaderStates.imageCreateError
        ) {
          setIsUploadingImage(false);
          toast.error("Image upload failed. Please try again.");
        }
      },
    });

    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeAudio = (id: string) => {
    onReferenceAudiosChange(referenceAudios.filter((a) => a.id !== id));
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  return (
    <div className={`flex flex-col gap-2 pb-2.5 ${className}`}>
      <input
        ref={audioInputRef}
        type="file"
        accept={AUDIO_FILE_ACCEPT}
        className="hidden"
        multiple={maxAudioCount > 1}
        onChange={handleAudioFileUpload}
      />
      {imageSupported && (
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileUpload}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-base-fg opacity-90">
          <FontAwesomeIcon icon={faMusic} className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">
            Audio Track{" "}
            <span className="font-semibold text-base-fg/60">
              ({referenceAudios.length}/{maxAudioCount})
            </span>
            {audioRequired && referenceAudios.length === 0 && (
              <span className="ml-1.5 text-xs font-medium text-red-500">
                required
              </span>
            )}
          </span>
        </div>

        {referenceAudios.map((audio, index) => (
          <AudioRefTile
            key={audio.id}
            audio={audio}
            index={index}
            onRemove={removeAudio}
          />
        ))}

        {referenceAudios.length < maxAudioCount && (
          <>
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              disabled={isUploadingAudio}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-ui-controls-border bg-ui-controls/50 px-3 text-sm text-base-fg/70 transition-colors hover:bg-ui-controls hover:text-base-fg disabled:cursor-wait disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
              {isUploadingAudio ? "Uploading…" : "Add audio"}
            </button>
            {onPickAudioFromLibrary && (
              <button
                type="button"
                onClick={onPickAudioFromLibrary}
                disabled={isUploadingAudio}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-ui-controls-border bg-ui-controls/50 px-3 text-sm text-base-fg/70 transition-colors hover:bg-ui-controls hover:text-base-fg disabled:cursor-wait disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faFolderOpen} className="h-3 w-3" />
                From library
              </button>
            )}
          </>
        )}

        {imageSupported && (
          <>
            <div className="ms-2 flex items-center gap-2 text-base-fg opacity-90">
              <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">Image</span>
            </div>
            {referenceImages.map((image) => (
              <div
                key={image.id}
                className="group relative h-9 w-9 overflow-hidden rounded-lg border border-ui-controls-border"
              >
                <img
                  src={image.url}
                  alt="Reference"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => onReferenceImagesChange?.([])}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="h-3 w-3 text-white"
                  />
                </button>
              </div>
            ))}
            {referenceImages.length === 0 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-ui-controls-border bg-ui-controls/50 px-3 text-sm text-base-fg/70 transition-colors hover:bg-ui-controls hover:text-base-fg disabled:cursor-wait disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                {isUploadingImage ? "Uploading…" : "Add image"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AudioRefTile({
  audio,
  index,
  onRemove,
}: {
  audio: RefAudio;
  index: number;
  onRemove: (id: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }
    const element = new Audio(audio.url);
    element.onended = () => {
      audioRef.current = null;
      setIsPlaying(false);
    };
    audioRef.current = element;
    void element.play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }, [audio.url, isPlaying]);

  return (
    <div className="group flex h-9 items-center gap-2 rounded-lg border border-ui-controls-border bg-ui-controls px-2.5">
      <button
        type="button"
        aria-label={isPlaying ? "Stop" : "Play"}
        onClick={togglePlay}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-black transition-transform hover:scale-105"
      >
        <FontAwesomeIcon
          icon={isPlaying ? faStop : faPlay}
          className={`h-2 w-2 ${isPlaying ? "" : "ml-px"}`}
        />
      </button>
      <span className="text-xs font-medium text-base-fg/80">
        Audio {index + 1} · {audio.duration}s
      </span>
      <button
        type="button"
        aria-label="Remove audio"
        onClick={() => onRemove(audio.id)}
        className="flex h-4 w-4 items-center justify-center rounded text-base-fg/40 transition-colors hover:text-base-fg"
      >
        <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

function getAudioFileDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
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
}
