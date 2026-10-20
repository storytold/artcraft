import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { FolderOpenIcon, ImageIcon, MusicIcon, PlayIcon, PlusIcon, SquareIcon, XIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { toast } from "@storyteller/ui-toaster";
import { UploaderStates } from "@storyteller/common";
import type { UploadMediaFn } from "@storyteller/api";
import type { RefAudio, RefImage } from "../promptStore";
import {
  AUDIO_FILE_ACCEPT,
  AUDIO_FILE_TYPE_ERROR,
  isAudioFile,
} from "./audioFiles";

/** Lets the prompt box push dropped/pasted files through the same upload
 *  path the row's own file inputs use. */
export interface AudioReferenceRowHandle {
  addAudioFiles: (files: File[]) => Promise<void>;
  addImageFile: (file: File) => Promise<void>;
}

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
export const AudioReferenceRow = forwardRef<
  AudioReferenceRowHandle,
  AudioReferenceRowProps
>(function AudioReferenceRow(
  {
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
  },
  ref,
) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // How many audio drops/picks are queued or running. The "Uploading…" state is derived from this (not from one
  // on/off flag), so the first track finishing does not switch it off while a second one is still on its way.
  const [pendingAudioBatches, setPendingAudioBatches] = useState(0);
  const isUploadingAudio = pendingAudioBatches > 0;
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Latest-value refs so async upload callbacks append to fresh state.
  const referenceAudiosRef = useRef(referenceAudios);
  referenceAudiosRef.current = referenceAudios;
  const referenceImagesRef = useRef(referenceImages);
  referenceImagesRef.current = referenceImages;

  // The props a queued audio batch reads when its turn comes (not the ones from the render that queued it), so a
  // batch that waited behind another one still checks the current limits and commits through the current callback.
  const latestAudioPropsRef = useRef({
    onReferenceAudiosChange,
    maxAudioCount,
    maxAudioRefDuration,
    uploadAudio,
  });
  latestAudioPropsRef.current = {
    onReferenceAudiosChange,
    maxAudioCount,
    maxAudioRefDuration,
    uploadAudio,
  };

  // Tail of the chain of audio batches. The prompt box starts a batch for every drop and does not wait for it, so two
  // drops can arrive while the first is still uploading. Each batch measures itself against the row, so batches that
  // ran side by side would each see the row as it was before the other one landed and could together go over the
  // track limit or the duration cap. Chaining them makes each batch see what the earlier ones added.
  const audioQueueRef = useRef<Promise<void>>(Promise.resolve());

  // One batch of audio files, run when its turn comes. Slots and the running duration total come from the ref, which
  // every commit below updates straight away, so they include tracks the earlier batches just added.
  const runAudioBatch = async (audioFiles: File[]) => {
    const { maxAudioCount, maxAudioRefDuration, uploadAudio } =
      latestAudioPropsRef.current;
    const availableSlots = Math.max(
      0,
      maxAudioCount - referenceAudiosRef.current.length,
    );
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
              // Record the new list in the ref right away (React only re-renders later), so the next batch in the
              // queue sees this track, then hand it to the parent.
              const next = [...referenceAudiosRef.current, refAudio];
              referenceAudiosRef.current = next;
              latestAudioPropsRef.current.onReferenceAudiosChange(next);
            } else if (
              newState.status === UploaderStates.assetError ||
              newState.status === UploaderStates.imageCreateError
            ) {
              toast.error("Audio upload failed. Please try again.");
            }
          },
        });
      }
    }
  };

  const processAudioFiles = (files: File[]): Promise<void> => {
    if (files.length === 0) return Promise.resolve();

    const audioFiles = files.filter(isAudioFile);
    if (audioFiles.length < files.length) {
      toast.error(AUDIO_FILE_TYPE_ERROR);
    }
    // Nothing usable in the drop, or no room left in the row: do nothing, as before.
    if (
      audioFiles.length === 0 ||
      referenceAudiosRef.current.length >= maxAudioCount
    ) {
      return Promise.resolve();
    }

    // Queue behind any earlier batch; the "Uploading…" count covers the wait as well as the upload.
    setPendingAudioBatches((n) => n + 1);
    const turn = audioQueueRef.current
      .then(() => runAudioBatch(audioFiles))
      .finally(() => setPendingAudioBatches((n) => n - 1));
    // A batch that throws must not break the chain for the drops behind it.
    audioQueueRef.current = turn.catch(() => undefined);
    return turn;
  };

  const handleAudioFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    await processAudioFiles(Array.from(event.target.files || []));
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const processImageFile = async (file: File) => {
    if (!uploadImage) return;

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
  };

  const handleImageFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = (event.target.files || [])[0];
    if (file) await processImageFile(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  useImperativeHandle(
    ref,
    () => ({
      addAudioFiles: processAudioFiles,
      addImageFile: processImageFile,
    }),
    // Recreated each render so the handle always closes over fresh props
    // (slot counts, current refs) rather than mount-time values.
  );

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
          <MusicIcon  className="h-3.5 w-3.5" />
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
              className="flex h-9 items-center gap-1.5 rounded-[3px] border border-dashed border-ui-controls-border bg-ui-controls/50 px-3 text-sm text-base-fg/70 transition-colors hover:bg-ui-controls hover:text-base-fg disabled:cursor-wait disabled:opacity-60"
            >
              <PlusIcon  className="h-3 w-3" />
              {isUploadingAudio ? "Uploading…" : "Add audio"}
            </button>
            {onPickAudioFromLibrary && (
              <button
                type="button"
                onClick={onPickAudioFromLibrary}
                disabled={isUploadingAudio}
                className="flex h-9 items-center gap-1.5 rounded-[3px] border border-dashed border-ui-controls-border bg-ui-controls/50 px-3 text-sm text-base-fg/70 transition-colors hover:bg-ui-controls hover:text-base-fg disabled:cursor-wait disabled:opacity-60"
              >
                <FolderOpenIcon  className="h-3 w-3" />
                From library
              </button>
            )}
          </>
        )}

        {imageSupported && (
          <>
            <div className="ms-2 flex items-center gap-2 text-base-fg opacity-90">
              <ImageIcon  className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">Image</span>
            </div>
            {referenceImages.map((image) => (
              <div
                key={image.id}
                className="group relative h-9 w-9 overflow-hidden rounded-[3px] border border-ui-controls-border"
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
                  <XIcon
                    
                    className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
            {referenceImages.length === 0 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex h-9 items-center gap-1.5 rounded-[3px] border border-dashed border-ui-controls-border bg-ui-controls/50 px-3 text-sm text-base-fg/70 transition-colors hover:bg-ui-controls hover:text-base-fg disabled:cursor-wait disabled:opacity-60"
              >
                <PlusIcon  className="h-3 w-3" />
                {isUploadingImage ? "Uploading…" : "Add image"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

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

  // FIX: stop a clip that is still sounding when the tile goes away (the X
  // button, the row unmounting). Without this the audio kept playing with no
  // play/stop control left on screen. The other two audio tiles already do this.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <div className="group flex h-9 items-center gap-2 rounded-[3px] border border-ui-controls-border bg-ui-controls px-2.5">
      <button
        type="button"
        aria-label={isPlaying ? "Stop" : "Play"}
        onClick={togglePlay}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-black transition-transform hover:scale-105"
      >
        <DynamicIcon
          icon={isPlaying ? SquareIcon : PlayIcon}
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
        className="flex h-4 w-4 items-center justify-center rounded-[3px] text-base-fg/40 transition-colors hover:text-base-fg"
      >
        <XIcon  className="h-2.5 w-2.5" />
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
