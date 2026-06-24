import { useCallback, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMusic,
  faPlay,
  faPlus,
  faSpinnerThird,
  faStop,
  faVideo,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { UploaderStates } from "@storyteller/common";
import {
  useDropTarget,
  type DragPayload,
  type GalleryItemLike,
} from "@storyteller/ui-dnd";
import { toast } from "../toast/toast";
import type { RefVideo, RefAudio } from "./types";
import {
  uploadVideo,
  uploadAudio,
  getVideoDuration,
  getAudioDuration,
} from "./upload-media";

const dropHighlightClass = (s: { isOver: boolean; isRejecting: boolean }) =>
  s.isOver
    ? "ring-2 ring-primary/80 bg-primary/10"
    : s.isRejecting
      ? "ring-2 ring-red-500/80 bg-red-500/10 cursor-not-allowed"
      : "";

// Best-effort duration probe for a gallery item's URL (no File available).
// Returns 0 when the preview asset can't report metadata; the media token still
// drives generation, so a 0 here only affects the duration cap/label.
const durationFromUrl = (url: string, kind: "video" | "audio"): Promise<number> =>
  new Promise((resolve) => {
    const el = document.createElement(kind);
    el.preload = "metadata";
    el.onloadedmetadata = () => resolve(Math.round(el.duration) || 0);
    el.onerror = () => resolve(0);
    el.src = url;
  });

interface MediaReferenceRowProps {
  videoSupported: boolean;
  audioSupported: boolean;
  referenceVideos: RefVideo[];
  onReferenceVideosChange: (videos: RefVideo[]) => void;
  maxVideoCount: number;
  maxVideoRefDuration: number;
  referenceAudios: RefAudio[];
  onReferenceAudiosChange: (audios: RefAudio[]) => void;
  maxAudioCount: number;
  maxAudioRefDuration: number;
  className?: string;
}

export const MediaReferenceRow = ({
  videoSupported,
  audioSupported,
  referenceVideos,
  onReferenceVideosChange,
  maxVideoCount,
  maxVideoRefDuration,
  referenceAudios,
  onReferenceAudiosChange,
  maxAudioCount,
  maxAudioRefDuration,
  className,
}: MediaReferenceRowProps) => {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoDropRef = useRef<HTMLDivElement>(null);
  const audioDropRef = useRef<HTMLDivElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const totalVideoDuration = referenceVideos.reduce(
    (sum, v) => sum + v.duration,
    0,
  );
  const totalAudioDuration = referenceAudios.reduce(
    (sum, a) => sum + a.duration,
    0,
  );

  const canAddVideo =
    referenceVideos.length < maxVideoCount &&
    totalVideoDuration < maxVideoRefDuration &&
    !uploadingVideo;
  const canAddAudio =
    referenceAudios.length < maxAudioCount &&
    totalAudioDuration < maxAudioRefDuration &&
    !uploadingAudio;

  const processVideoFile = async (file: File) => {
    // Snapshot at call time so a stale read inside the async callback can't overwrite a remove.
    const baseVideos = [...referenceVideos];

    const duration = await getVideoDuration(file);

    if (duration <= 0) {
      toast.error("Could not read video file");
      return;
    }
    const currentTotal = baseVideos.reduce((sum, v) => sum + v.duration, 0);
    if (currentTotal + duration > maxVideoRefDuration) {
      toast.error(
        `Video too long — max ${maxVideoRefDuration}s total (${maxVideoRefDuration - currentTotal}s remaining)`,
      );
      return;
    }

    setUploadingVideo(true);
    try {
      await uploadVideo({
        title: `reference-video-${Math.random().toString(36).substring(2, 15)}`,
        assetFile: file,
        progressCallback: (newState) => {
          if (newState.status === UploaderStates.success && newState.data) {
            const refVideo: RefVideo = {
              id: Math.random().toString(36).substring(7),
              url: URL.createObjectURL(file),
              file,
              mediaToken: newState.data,
              duration,
            };
            onReferenceVideosChange([...baseVideos, refVideo]);
          } else if (
            newState.status === UploaderStates.assetError ||
            newState.status === UploaderStates.imageCreateError
          ) {
            toast.error(newState.errorMessage || "Could not upload video");
          }
        },
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not upload video",
      );
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (files[0]) await processVideoFile(files[0]);
  };

  const attachGalleryVideo = async (item: GalleryItemLike) => {
    if (!canAddVideo) return;
    const url = item.fullImage || item.thumbnail || "";
    const duration = url ? await durationFromUrl(url, "video") : 0;
    const currentTotal = referenceVideos.reduce((sum, v) => sum + v.duration, 0);
    if (duration > 0 && currentTotal + duration > maxVideoRefDuration) {
      toast.error(
        `Video too long — max ${maxVideoRefDuration}s total (${maxVideoRefDuration - currentTotal}s remaining)`,
      );
      return;
    }
    onReferenceVideosChange([
      ...referenceVideos,
      {
        id: Math.random().toString(36).substring(7),
        url,
        file: new File([], "library-video"),
        mediaToken: item.id,
        duration,
      },
    ]);
  };

  const handleVideoDrop = (payload: DragPayload) => {
    if (payload.source === "gallery") void attachGalleryVideo(payload.item);
    else payload.getFile().then((file) => processVideoFile(file));
  };

  const processAudioFile = async (file: File) => {
    const baseAudios = [...referenceAudios];

    const duration = await getAudioDuration(file);

    if (duration <= 0) {
      toast.error("Could not read audio file");
      return;
    }
    const currentTotal = baseAudios.reduce((sum, a) => sum + a.duration, 0);
    if (currentTotal + duration > maxAudioRefDuration) {
      toast.error(
        `Audio too long — max ${maxAudioRefDuration}s total (${maxAudioRefDuration - currentTotal}s remaining)`,
      );
      return;
    }

    setUploadingAudio(true);
    try {
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
            onReferenceAudiosChange([...baseAudios, refAudio]);
          } else if (
            newState.status === UploaderStates.assetError ||
            newState.status === UploaderStates.imageCreateError
          ) {
            toast.error(newState.errorMessage || "Could not upload audio");
          }
        },
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not upload audio",
      );
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (audioInputRef.current) audioInputRef.current.value = "";
    if (files[0]) await processAudioFile(files[0]);
  };

  const attachGalleryAudio = async (item: GalleryItemLike) => {
    if (!canAddAudio) return;
    const url = item.fullImage || item.thumbnail || "";
    const duration = url ? await durationFromUrl(url, "audio") : 0;
    const currentTotal = referenceAudios.reduce((sum, a) => sum + a.duration, 0);
    if (duration > 0 && currentTotal + duration > maxAudioRefDuration) {
      toast.error(
        `Audio too long — max ${maxAudioRefDuration}s total (${maxAudioRefDuration - currentTotal}s remaining)`,
      );
      return;
    }
    onReferenceAudiosChange([
      ...referenceAudios,
      {
        id: Math.random().toString(36).substring(7),
        url,
        file: new File([], "library-audio"),
        mediaToken: item.id,
        duration,
      },
    ]);
  };

  const handleAudioDrop = (payload: DragPayload) => {
    if (payload.source === "gallery") void attachGalleryAudio(payload.item);
    else payload.getFile().then((file) => processAudioFile(file));
  };

  const removeVideo = (id: string) => {
    const video = referenceVideos.find((v) => v.id === id);
    if (video) URL.revokeObjectURL(video.url);
    onReferenceVideosChange(referenceVideos.filter((v) => v.id !== id));
  };

  const removeAudio = (id: string) => {
    const audio = referenceAudios.find((a) => a.id === id);
    if (audio) URL.revokeObjectURL(audio.url);
    onReferenceAudiosChange(referenceAudios.filter((a) => a.id !== id));
  };

  const videoDrop = useDropTarget({
    ref: videoDropRef,
    accepts: ["video"],
    label: "Video Ref",
    onDrop: handleVideoDrop,
    disabled: !videoSupported,
  });
  const audioDrop = useDropTarget({
    ref: audioDropRef,
    accepts: ["audio"],
    label: "Audio Ref",
    onDrop: handleAudioDrop,
    disabled: !audioSupported,
  });

  return (
    <>
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/*"
        onChange={handleVideoUpload}
      />
      <input
        type="file"
        ref={audioInputRef}
        className="hidden"
        accept="audio/*"
        onChange={handleAudioUpload}
      />
      <div
        className={twMerge(
          "glass flex flex-col sm:flex-row rounded-2xl sm:rounded-none",
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Video section */}
        {videoSupported && (
          <div
            ref={videoDropRef}
            className={twMerge(
              "flex grow gap-2 px-3 py-2 rounded-2xl transition-shadow",
              dropHighlightClass(videoDrop),
            )}
          >
            <div className="flex grow flex-col gap-1">
              <div className="flex items-center gap-2 text-white/90">
                <FontAwesomeIcon icon={faVideo} className="h-3.5 w-3.5" />
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  Video Ref
                  <span className="font-semibold text-white/60">
                    ({referenceVideos.length}/{maxVideoCount})
                  </span>
                </span>
              </div>
              <span className="text-[13px] text-white/60">
                {totalVideoDuration}/{maxVideoRefDuration}s
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {referenceVideos.map((video) => (
                <VideoRefTile
                  key={video.id}
                  video={video}
                  onRemove={removeVideo}
                />
              ))}
              {uploadingVideo && (
                <div className="flex aspect-square w-10 sm:w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-white/30 bg-white/5">
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    spin
                    className="h-5 w-5 text-white/60"
                  />
                </div>
              )}
              {canAddVideo && (
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex aspect-square w-10 sm:w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="text-2xl text-white/80"
                  />
                </button>
              )}
            </div>
          </div>
        )}

        {videoSupported && audioSupported && (
          <div className="h-[1px] sm:h-auto sm:w-[1px] self-stretch bg-white/10 mx-3 sm:mx-0" />
        )}

        {/* Audio section */}
        {audioSupported && (
          <div
            ref={audioDropRef}
            className={twMerge(
              "flex grow gap-2 px-3 py-2 rounded-2xl transition-shadow",
              dropHighlightClass(audioDrop),
            )}
          >
            <div className="flex grow flex-col gap-1">
              <div className="flex items-center gap-2 text-white/90">
                <FontAwesomeIcon icon={faMusic} className="h-3.5 w-3.5" />
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  Audio Ref
                  <span className="font-semibold text-white/60">
                    ({referenceAudios.length}/{maxAudioCount})
                  </span>
                </span>
              </div>
              <span className="text-[13px] text-white/60">
                {totalAudioDuration}/{maxAudioRefDuration}s
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {referenceAudios.map((audio, i) => (
                <AudioRefTile
                  key={audio.id}
                  audio={audio}
                  index={i}
                  onRemove={removeAudio}
                />
              ))}
              {uploadingAudio && (
                <div className="flex aspect-square w-10 sm:w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-white/30 bg-white/5">
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    spin
                    className="h-5 w-5 text-white/60"
                  />
                </div>
              )}
              {canAddAudio && (
                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="flex aspect-square w-10 sm:w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="text-2xl text-white/80"
                  />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ── Sub-components ───────────────────────────────────────────────────────

const VideoRefTile = ({
  video,
  onRemove,
}: {
  video: RefVideo;
  onRemove: (id: string) => void;
}) => (
  <div className="group relative aspect-square w-10 sm:w-14 overflow-hidden rounded-lg border-2 border-white/30 transition-all hover:border-white/80">
    <video
      src={video.url}
      muted
      preload="metadata"
      className="h-full w-full object-cover"
    />
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/70 py-0.5 text-[10px] font-bold text-white">
      {video.duration}s
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove(video.id);
      }}
      className="absolute right-[2px] top-[2px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white sm:opacity-0 backdrop-blur-md transition-colors hover:bg-black sm:group-hover:opacity-100"
    >
      <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
    </button>
  </div>
);

const AudioRefTile = ({
  audio,
  index,
  onRemove,
}: {
  audio: RefAudio;
  index: number;
  onRemove: (id: string) => void;
}) => {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTogglePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPlaying) {
        audioElRef.current?.pause();
        if (audioElRef.current) audioElRef.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        const el = new Audio(audio.url);
        el.volume = 0.2;
        audioElRef.current = el;
        el.onended = () => setIsPlaying(false);
        el.play();
        setIsPlaying(true);
      }
    },
    [isPlaying, audio.url],
  );

  return (
    <div className="group relative flex aspect-square w-10 sm:w-14 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-white/30 transition-all hover:border-white/80">
      <button
        onClick={handleTogglePlay}
        className="flex h-full w-full items-center justify-center"
      >
        <FontAwesomeIcon
          icon={isPlaying ? faStop : faPlay}
          className={twMerge(
            "h-5 w-5 transition-colors",
            isPlaying ? "text-red-400" : "text-white/60 group-hover:text-white",
          )}
        />
      </button>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/70 py-0.5 text-[10px] font-bold text-white">
        #{index + 1} · {audio.duration}s
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(audio.id);
        }}
        className="absolute right-[2px] top-[2px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white sm:opacity-0 backdrop-blur-md transition-colors hover:bg-black sm:group-hover:opacity-100"
      >
        <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
      </button>
    </div>
  );
};
