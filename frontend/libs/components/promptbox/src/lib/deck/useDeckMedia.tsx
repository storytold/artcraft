import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { type UploadMediaFn } from "@storyteller/api";
import { downloadFileFromUrl } from "@storyteller/tauri-api";
import { toast } from "@storyteller/ui-toaster";
import { UploaderStates } from "@storyteller/common";
import {
  AUDIO_FILE_ACCEPT,
  AUDIO_FILE_TYPE_ERROR,
  isAudioFile,
} from "../common/audioFiles";
import { createImagePreviewUrl, revokeIfBlobUrl } from "../common/imagePreview";

/** Minimal structural shapes so both apps' ref types fit. */
export interface DeckRefLike {
  id: string;
  url: string;
  /** Full-resolution URL for the tap-preview modal. Uploads set it to an
   *  object URL of the original file; `url` is a downscaled thumbnail. */
  fullUrl?: string;
  /** Set once the media file exists server-side (uploads fill it in late). */
  mediaToken?: string;
}
export interface DeckMediaRefLike extends DeckRefLike {
  duration: number;
}

/** An in-flight upload. `previewUrl` is an object URL; for images it's a
 *  downscaled preview and stays empty until the downscale finishes. */
export interface DeckUploadEntry {
  id: string;
  file: File;
  previewUrl: string;
}

export interface UseDeckMediaOptions<
  TImage extends DeckRefLike,
  TVideo extends DeckMediaRefLike,
  TAudio extends DeckMediaRefLike,
> {
  referenceImages: TImage[];
  setReferenceImages: (images: TImage[]) => void;
  maxImages: number;
  /** Current end keyframe, when the host tracks one — its token is greyed out
   *  in the end-frame picker so it can't be re-picked into the same slot. */
  endFrameImage?: TImage;
  setEndFrameImage?: (image?: TImage) => void;
  referenceVideos?: TVideo[];
  setReferenceVideos?: (videos: TVideo[]) => void;
  maxVideos?: number;
  maxVideoTotalSec?: number;
  referenceAudios?: TAudio[];
  setReferenceAudios?: (audios: TAudio[]) => void;
  maxAudios?: number;
  maxAudioTotalSec?: number;
  uploadImage?: UploadMediaFn;
  uploadVideo?: UploadMediaFn;
  uploadAudio?: UploadMediaFn;
  /**
   * When true the hook owns a target-aware GalleryModal (desktop). When
   * false the caller keeps its own library pickers (webapp) and only the
   * upload paths are used.
   */
  ownGalleryModal?: boolean;
}

const randomId = () => Math.random().toString(36).substring(7);

// A non-finite duration cap means "no limit" — leave it out of the message.
const videoLimitMessage = (maxVideos: number, maxTotalSec: number) =>
  isFinite(maxTotalSec)
    ? `Max ${maxVideos} videos / ${maxTotalSec}s total`
    : `Max ${maxVideos} video${maxVideos === 1 ? "" : "s"}`;

const randomTitle = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).substring(2, 15)}`;

const getVideoDurationFromSrc = (src: string): Promise<number> =>
  new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve(Math.round(video.duration));
    video.onerror = () => resolve(0);
    video.src = src;
  });

const getVideoDuration = (file: File): Promise<number> => {
  const src = URL.createObjectURL(file);
  return getVideoDurationFromSrc(src).finally(() => URL.revokeObjectURL(src));
};

const getAudioDurationFromSrc = (src: string): Promise<number> =>
  new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve(Math.round(audio.duration));
    audio.onerror = () => resolve(0);
    audio.src = src;
  });

const getAudioDuration = (file: File): Promise<number> =>
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

/**
 * Headless upload/limits/library state machine for the reference deck.
 * Extracted from the legacy ImagePromptRow band so PromptBoxImage,
 * PromptBoxVideo, and the webapp PromptBox share one implementation.
 */
export function useDeckMedia<
  TImage extends DeckRefLike,
  TVideo extends DeckMediaRefLike,
  TAudio extends DeckMediaRefLike,
>({
  referenceImages,
  setReferenceImages,
  maxImages,
  endFrameImage,
  setEndFrameImage,
  referenceVideos = [],
  setReferenceVideos,
  maxVideos = 3,
  maxVideoTotalSec = 15,
  referenceAudios = [],
  setReferenceAudios,
  maxAudios = 2,
  maxAudioTotalSec = 15,
  uploadImage,
  uploadVideo,
  uploadAudio,
  ownGalleryModal,
}: UseDeckMediaOptions<TImage, TVideo, TAudio>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const anyFileInputRef = useRef<HTMLInputElement>(null);
  const imageTargetRef = useRef<"start" | "end">("start");

  const [uploadingImages, setUploadingImages] = useState<DeckUploadEntry[]>([]);
  const [uploadingEnd, setUploadingEnd] = useState<DeckUploadEntry | null>(
    null,
  );
  const [uploadingVideo, setUploadingVideo] = useState<DeckUploadEntry | null>(
    null,
  );
  const [uploadingAudio, setUploadingAudio] = useState<DeckUploadEntry | null>(
    null,
  );

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<
    "start" | "end" | "video" | "audio"
  >("start");
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const [isProcessingGallery, setIsProcessingGallery] = useState(false);

  // Async upload completions must append to the freshest committed arrays,
  // not the arrays captured when the upload started.
  const referenceImagesRef = useRef(referenceImages);
  useEffect(() => {
    referenceImagesRef.current = referenceImages;
  }, [referenceImages]);

  const referenceAudiosRef = useRef(referenceAudios);
  useEffect(() => {
    referenceAudiosRef.current = referenceAudios;
  }, [referenceAudios]);

  // Tail of the chain of audio batches, for the same reason as the video one
  // below: the deck has a single spinner slot (`uploadingAudio`), and the
  // track-count and duration limits are only right once the earlier batch has
  // committed or failed. `processAudioFiles` appends to it.
  const audioQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Same idea for videos. A video upload can take a long time, and the person
  // can drop another file, remove a card, or pick from the library meanwhile.
  // Every video commit and limit check reads this ref (kept in step with the
  // caller's store by the effect below) instead of the array that was in scope
  // when the batch started, which would overwrite whatever changed since.
  const referenceVideosRef = useRef(referenceVideos);
  useEffect(() => {
    referenceVideosRef.current = referenceVideos;
  }, [referenceVideos]);

  // Tail of the chain of video batches. `processVideoFiles` appends to it so
  // two drops/pastes never upload side by side: the deck has one spinner slot
  // (`uploadingVideo`), and the slot and duration limits are only correct once
  // the earlier batch has committed or failed.
  const videoQueueRef = useRef<Promise<void>>(Promise.resolve());

  // WHY: each committed upload owns a full-res object URL (`fullUrl`) that was
  // never revoked, leaking the whole original file per upload. Track them by
  // ref id; once a ref has been seen in the caller's store and later
  // disappears (removed/replaced), revoke its URL. `seen` guards against
  // revoking in the render before the store has committed the new ref.
  const fullUrlsRef = useRef(
    new Map<string, { url: string; seen: boolean }>(),
  );
  useEffect(() => {
    const present = new Set<string>(referenceImages.map((img) => img.id));
    if (endFrameImage) present.add(endFrameImage.id);
    for (const [id, entry] of fullUrlsRef.current) {
      if (present.has(id)) {
        entry.seen = true;
      } else if (entry.seen) {
        revokeIfBlobUrl(entry.url);
        fullUrlsRef.current.delete(id);
      }
    }
  }, [referenceImages, endFrameImage]);
  // Unmount: nothing can show these previews any more.
  useEffect(() => {
    const tracked = fullUrlsRef.current;
    return () => {
      for (const { url } of tracked.values()) revokeIfBlobUrl(url);
      tracked.clear();
    };
  }, []);

  // Committed refs live in the caller's store, whose update can render one
  // pass before this hook's entry-removal state lands — briefly showing the
  // committed card AND its spinner. Commits reuse their entry's id, so
  // hiding entries whose id is already committed removes that flicker (and
  // the deck's keyed card morphs from spinner to thumbnail in place).
  const visibleUploadingImages = useMemo(
    () =>
      uploadingImages.filter(
        (entry) => !referenceImages.some((img) => img.id === entry.id),
      ),
    [uploadingImages, referenceImages],
  );
  const visibleUploadingVideo =
    uploadingVideo && referenceVideos.some((v) => v.id === uploadingVideo.id)
      ? null
      : uploadingVideo;
  const visibleUploadingAudio =
    uploadingAudio && referenceAudios.some((a) => a.id === uploadingAudio.id)
      ? null
      : uploadingAudio;

  // The hook only ever commits `{ id, url, file, mediaToken, duration? }`,
  // which is structurally assignable to both apps' ref types (desktop
  // promptStore refs match exactly; the webapp's extra fields are optional).
  const asImage = (img: {
    id: string;
    url: string;
    fullUrl?: string;
    file: File;
    mediaToken: string;
  }) => img as unknown as TImage;
  const asVideo = (video: {
    id: string;
    url: string;
    file: File;
    mediaToken: string;
    duration: number;
  }) => video as unknown as TVideo;
  const asAudio = (audio: {
    id: string;
    url: string;
    file: File;
    mediaToken: string;
    duration: number;
  }) => audio as unknown as TAudio;

  const makeEntry = (file: File): DeckUploadEntry => ({
    id: randomId(),
    file,
    previewUrl: URL.createObjectURL(file),
  });

  const openImageUpload = () => {
    imageTargetRef.current = "start";
    fileInputRef.current?.click();
  };

  const openEndUpload = () => {
    imageTargetRef.current = "end";
    fileInputRef.current?.click();
  };

  const openVideoUpload = () => videoFileInputRef.current?.click();
  const openAudioUpload = () => audioFileInputRef.current?.click();
  const openAnyUpload = () => anyFileInputRef.current?.click();

  const openGallery = (target: "start" | "end" | "video" | "audio") => {
    setGalleryTarget(target);
    setIsGalleryModalOpen(true);
  };

  const processImageFiles = (
    files: File[],
    uploadTarget: "start" | "end",
  ) => {
    const currentCount = referenceImages.length + visibleUploadingImages.length;
    const availableSlots = Math.max(0, maxImages - currentCount);
    if (availableSlots <= 0 && uploadTarget !== "end") {
      return;
    }

    const filesToProcess =
      uploadTarget === "end"
        ? files.slice(0, 1)
        : files.slice(0, availableSlots);

    filesToProcess.forEach(async (file) => {
      // Register the slot synchronously (spinner card + slot accounting)…
      const entryId = randomId();
      if (uploadTarget === "end") {
        setUploadingEnd({ id: entryId, file, previewUrl: "" });
      } else {
        setUploadingImages((prev) => [
          ...prev,
          { id: entryId, file, previewUrl: "" },
        ]);
      }

      // …then fill in the thumbnail once the downscale finishes. Full-res
      // previews are what used to OOM-crash iOS tabs, so it's never the
      // original pixels here.
      const previewUrl = await createImagePreviewUrl(file);
      if (uploadTarget === "end") {
        setUploadingEnd((prev) =>
          prev && prev.id === entryId ? { ...prev, previewUrl } : prev,
        );
      } else {
        setUploadingImages((prev) =>
          prev.map((e) => (e.id === entryId ? { ...e, previewUrl } : e)),
        );
      }

      const removeEntry = () => {
        if (uploadTarget === "end") {
          setUploadingEnd(null);
        } else {
          setUploadingImages((prev) => prev.filter((e) => e.id !== entryId));
        }
      };

      // Set once the entry has either committed or failed, so a late
      // rejection from the upload can't revoke a preview that is now the
      // committed thumbnail.
      let settled = false;

      const fail = () => {
        settled = true;
        revokeIfBlobUrl(previewUrl);
        removeEntry();
      };

      const commit = (mediaToken: string) => {
        settled = true;
        // The downscaled preview lives on as the committed thumbnail; the
        // original file backs the full-res tap-preview via `fullUrl`. The
        // ref keeps the entry's id so the deck card swaps in place.
        const fullUrl = URL.createObjectURL(file);
        // Registered so the effect above can revoke it on removal/unmount.
        fullUrlsRef.current.set(entryId, { url: fullUrl, seen: false });
        const referenceImage = asImage({
          id: entryId,
          url: previewUrl,
          fullUrl,
          file,
          mediaToken,
        });
        removeEntry();
        if (uploadTarget === "end") {
          setEndFrameImage?.(referenceImage);
        } else {
          setReferenceImages([...referenceImagesRef.current, referenceImage]);
        }
      };

      if (uploadImage) {
        try {
          await uploadImage({
            title: randomTitle("reference-image"),
            assetFile: file,
            progressCallback: (newState) => {
              if (newState.status === UploaderStates.success && newState.data) {
                commit(newState.data);
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                fail();
              }
            },
          });
        } catch {
          // An upload that throws (network drop) used to leave the spinner
          // card on screen forever and surface as an unhandled rejection.
          if (!settled) fail();
        }
      } else {
        commit("");
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;
    processImageFiles(files, imageTargetRef.current);
  };

  // Uploads one batch of video files (one drop, paste or picker choice). Only
  // ever called through `processVideoFiles`, which makes batches take turns.
  const runVideoBatch = async (files: File[]) => {
    // Read the deck as it is NOW, at this batch's turn: earlier batches may
    // have committed, and cards may have been removed since the call.
    const availableSlots = Math.max(
      0,
      maxVideos - referenceVideosRef.current.length,
    );
    if (availableSlots <= 0) {
      toast.error(videoLimitMessage(maxVideos, maxVideoTotalSec), {
        id: "video-ref-limit",
      });
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);

    for (const file of filesToProcess) {
      const duration = await getVideoDuration(file);
      // Read the deck again after the wait: the measurement is async, and the
      // library picker can add cards in the meantime.
      const currentTotal = referenceVideosRef.current.reduce(
        (sum, v) => sum + v.duration,
        0,
      );

      if (currentTotal + duration > maxVideoTotalSec) {
        toast.error(`Total video duration cannot exceed ${maxVideoTotalSec}s`, {
          id: "video-ref-limit",
        });
        break;
      }

      const entry = makeEntry(file);
      setUploadingVideo(entry);

      const commit = (mediaToken: string) => {
        // Reuse the entry's object URL as the committed thumbnail so it
        // stays alive exactly as long as the ref does, and the entry's id
        // so the deck card swaps in place.
        const refVideo = asVideo({
          id: entry.id,
          url: entry.previewUrl,
          file,
          mediaToken,
          duration,
        });
        setUploadingVideo(null);
        // Append to the freshest deck, not the one this batch started from,
        // so a video removed or added while this one uploaded is respected.
        const next = [...referenceVideosRef.current, refVideo];
        // Update the ref right away: the caller's re-render (and the effect
        // that syncs the ref) only lands after this function returns.
        referenceVideosRef.current = next;
        setReferenceVideos?.(next);
      };

      if (uploadVideo) {
        let settled = false;
        const failVideo = () => {
          settled = true;
          URL.revokeObjectURL(entry.previewUrl);
          setUploadingVideo(null);
          toast.error("Failed to upload video. Please upload an MP4 file.");
        };
        try {
          await uploadVideo({
            title: randomTitle("reference-video"),
            assetFile: file,
            progressCallback: (newState) => {
              if (newState.status === UploaderStates.success && newState.data) {
                settled = true;
                commit(newState.data);
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                failVideo();
              }
            },
          });
        } catch {
          // A thrown upload must not leave the spinner up or abort the rest
          // of the batch with an unhandled rejection.
          if (!settled) failVideo();
        }
      } else {
        commit("");
      }
    }
  };

  // Entry point for every video file source (picker, drop, paste). Callers
  // fire it without waiting (`void processVideoFiles(...)`), so a second call
  // can arrive while the first batch is still uploading; the batches are
  // chained so they run one after another.
  const processVideoFiles = (files: File[]): Promise<void> => {
    // A deck that is already full says so immediately, not after the queue
    // drains. The ref counts cards that were just added or removed.
    if (referenceVideosRef.current.length >= maxVideos) {
      toast.error(videoLimitMessage(maxVideos, maxVideoTotalSec), {
        id: "video-ref-limit",
      });
      return Promise.resolve();
    }
    // Start this batch once the previous one has finished.
    const turn = videoQueueRef.current.then(() => runVideoBatch(files));
    // Keep the chain going even if this batch throws, so one failure cannot
    // block every later drop. The caller still gets `turn` and sees the error.
    videoQueueRef.current = turn.catch(() => undefined);
    return turn;
  };

  const handleVideoFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (videoFileInputRef.current) videoFileInputRef.current.value = "";
    if (files.length === 0) return;
    await processVideoFiles(files);
  };

  // One batch of audio files (already filtered to real audio). Runs on its
  // turn in the queue, so the deck it reads is the one the earlier batches
  // left behind.
  const runAudioBatch = async (audioFiles: File[]) => {
    // Count the deck as it is now (the ref follows the caller's store and is
    // also updated by every commit below), not as it was at the last render.
    const availableSlots = Math.max(
      0,
      maxAudios - referenceAudiosRef.current.length,
    );
    if (availableSlots <= 0) {
      return;
    }

    const filesToProcess = audioFiles.slice(0, availableSlots);

    for (const file of filesToProcess) {
      const duration = await getAudioDuration(file);
      const currentTotal = referenceAudiosRef.current.reduce(
        (sum, a) => sum + a.duration,
        0,
      );

      if (currentTotal + duration > maxAudioTotalSec) {
        toast.error(`Total audio duration cannot exceed ${maxAudioTotalSec}s`);
        break;
      }

      const entry = makeEntry(file);
      setUploadingAudio(entry);

      const commit = (mediaToken: string) => {
        const refAudio = asAudio({
          id: entry.id,
          url: entry.previewUrl,
          file,
          mediaToken,
          duration,
        });
        setUploadingAudio(null);
        // Update the ref right away as well: the caller's re-render (and the
        // effect that syncs the ref) comes later, and the next file of this
        // batch reads the ref first.
        const next = [...referenceAudiosRef.current, refAudio];
        referenceAudiosRef.current = next;
        setReferenceAudios?.(next);
      };

      if (uploadAudio) {
        let settled = false;
        const failAudio = () => {
          settled = true;
          URL.revokeObjectURL(entry.previewUrl);
          setUploadingAudio(null);
        };
        try {
          await uploadAudio({
            title: randomTitle("reference-audio"),
            assetFile: file,
            progressCallback: (newState) => {
              if (newState.status === UploaderStates.success && newState.data) {
                settled = true;
                commit(newState.data);
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                failAudio();
              }
            },
          });
        } catch {
          // Same as video: clear the spinner instead of sticking forever.
          if (!settled) failAudio();
        }
      } else {
        commit("");
      }
    }
  };

  // Entry point for every audio file source (picker, drop, paste). Callers
  // fire it without waiting (`void processAudioFiles(...)`), so a second call
  // can arrive while the first batch is still uploading; the batches are
  // chained so they run one after another.
  const processAudioFiles = (files: File[]): Promise<void> => {
    const audioFiles = files.filter(isAudioFile);
    if (audioFiles.length < files.length) {
      toast.error(AUDIO_FILE_TYPE_ERROR, { id: "audio-ref-type" });
    }
    if (audioFiles.length === 0) return Promise.resolve();

    // A deck that is already full does nothing, right away. The ref counts
    // cards that were just added or removed.
    if (referenceAudiosRef.current.length >= maxAudios) {
      return Promise.resolve();
    }
    // Start this batch once the previous one has finished.
    const turn = audioQueueRef.current.then(() => runAudioBatch(audioFiles));
    // Keep the chain going even if this batch throws, so one failure cannot
    // block every later drop. The caller still gets `turn` and sees the error.
    audioQueueRef.current = turn.catch(() => undefined);
    return turn;
  };

  const handleAudioFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (audioFileInputRef.current) audioFileInputRef.current.value = "";
    if (files.length === 0) return;
    await processAudioFiles(files);
  };

  // Combined picker for direct clicks on the reference card / circular "+":
  // accepts every supported media kind and routes each file by MIME type.
  const handleAnyFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (anyFileInputRef.current) anyFileInputRef.current.value = "";
    if (files.length === 0) return;

    const images = files.filter((f) => f.type.startsWith("image/"));
    // isAudioFile also claims .m4a files that platforms report as video/mp4,
    // so exclude them from the video bucket.
    const audios = files.filter(isAudioFile);
    const videos = files.filter(
      (f) => f.type.startsWith("video/") && !isAudioFile(f),
    );

    if (images.length > 0) processImageFiles(images, "start");
    if (videos.length > 0 && setReferenceVideos) processVideoFiles(videos);
    if (audios.length > 0 && setReferenceAudios) processAudioFiles(audios);
  };

  // maxImages of 0 means the page's model takes no image refs at all.
  const anyUploadAccept = [
    ...(maxImages > 0 ? ["image/*"] : []),
    ...(setReferenceVideos ? ["video/mp4", ".mp4"] : []),
    ...(setReferenceAudios ? [AUDIO_FILE_ACCEPT] : []),
  ].join(",");

  const handleGalleryClose = () => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const maxSelections =
        galleryTarget === "video"
          ? Math.max(1, maxVideos - referenceVideos.length)
          : galleryTarget === "audio"
            ? Math.max(1, maxAudios - referenceAudios.length)
            : galleryTarget === "end"
              ? 1
              : Math.max(1, maxImages);
      if (prev.length >= maxSelections) {
        return maxSelections === 1 ? [id] : prev;
      }
      return [...prev, id];
    });
  };

  const handleGalleryImages = async (selectedItems: GalleryItem[]) => {
    if (galleryTarget === "video") {
      // Quick check up front, so a full deck answers (and the modal closes)
      // without waiting for the length probes below.
      const availableSlots = Math.max(
        0,
        maxVideos - referenceVideosRef.current.length,
      );
      if (availableSlots <= 0) {
        toast.error(videoLimitMessage(maxVideos, maxVideoTotalSec), {
          id: "video-ref-limit",
        });
        handleGalleryClose();
        return;
      }
      const itemsToProcess = selectedItems
        .slice(0, availableSlots)
        .filter((item): item is GalleryItem & { fullImage: string } =>
          Boolean(item.fullImage),
        );

      setIsProcessingGallery(true);
      try {
        // Parallelize duration probes — sequential metadata loads was the
        // source of the perceived lag on the "Use selected" click.
        const durations = await Promise.all(
          itemsToProcess.map((item) => getVideoDurationFromSrc(item.fullImage)),
        );

        // The probes above are async: an upload may have landed (or a card
        // been removed) since the click. Count the deck as it is now, so the
        // limits hold and the videos added below go on top of it.
        const latestVideos = referenceVideosRef.current;
        const freeSlots = Math.max(0, maxVideos - latestVideos.length);
        const newVideos: TVideo[] = [];
        let currentTotal = latestVideos.reduce((sum, v) => sum + v.duration, 0);
        let exceeded = false;
        if (freeSlots < itemsToProcess.length) {
          toast.error(videoLimitMessage(maxVideos, maxVideoTotalSec), {
            id: "video-ref-limit",
          });
        }
        for (
          let i = 0;
          i < itemsToProcess.length && newVideos.length < freeSlots;
          i++
        ) {
          const item = itemsToProcess[i]!;
          const duration = durations[i]!;
          if (currentTotal + duration > maxVideoTotalSec) {
            exceeded = true;
            break;
          }
          currentTotal += duration;
          newVideos.push(
            asVideo({
              id: randomId(),
              url: item.fullImage,
              file: new File([], "library-video"),
              mediaToken: item.id,
              duration,
            }),
          );
        }
        if (exceeded) {
          toast.error(
            `Total video duration cannot exceed ${maxVideoTotalSec}s`,
            { id: "video-ref-limit" },
          );
        }
        if (newVideos.length > 0) {
          // Nothing awaits between the read of `latestVideos` and here, so it
          // is still the current deck. Update the ref right away too: the
          // caller's re-render (and the effect that syncs it) comes later.
          const next = [...latestVideos, ...newVideos];
          referenceVideosRef.current = next;
          setReferenceVideos?.(next);
        }
      } finally {
        setIsProcessingGallery(false);
      }
      handleGalleryClose();
      return;
    }
    if (galleryTarget === "audio") {
      // Quick check up front, same as the video path above.
      const availableSlots = Math.max(
        0,
        maxAudios - referenceAudiosRef.current.length,
      );
      if (availableSlots <= 0) {
        toast.error(`Max ${maxAudios} audio tracks / ${maxAudioTotalSec}s total`, {
          id: "audio-ref-limit",
        });
        handleGalleryClose();
        return;
      }
      const itemsToProcess = selectedItems
        .slice(0, availableSlots)
        .filter((item): item is GalleryItem & { fullImage: string } =>
          Boolean(item.fullImage),
        );

      setIsProcessingGallery(true);
      try {
        // Use the duration the list endpoint already knows; probe the file's
        // metadata only when it doesn't.
        const durations = await Promise.all(
          itemsToProcess.map((item) =>
            item.durationMillis != null
              ? Promise.resolve(Math.round(item.durationMillis / 1000))
              : getAudioDurationFromSrc(item.fullImage),
          ),
        );

        // The probes above are async: an upload may have landed (or a card
        // been removed) since the click. Count the deck as it is now, so the
        // limits hold and the tracks added below go on top of it.
        const latestAudios = referenceAudiosRef.current;
        const freeSlots = Math.max(0, maxAudios - latestAudios.length);
        const newAudios: TAudio[] = [];
        let currentTotal = latestAudios.reduce((sum, a) => sum + a.duration, 0);
        let exceeded = false;
        if (freeSlots < itemsToProcess.length) {
          toast.error(
            `Max ${maxAudios} audio tracks / ${maxAudioTotalSec}s total`,
            { id: "audio-ref-limit" },
          );
        }
        for (
          let i = 0;
          i < itemsToProcess.length && newAudios.length < freeSlots;
          i++
        ) {
          const item = itemsToProcess[i]!;
          const duration = durations[i]!;
          if (currentTotal + duration > maxAudioTotalSec) {
            exceeded = true;
            break;
          }
          currentTotal += duration;
          newAudios.push(
            asAudio({
              id: randomId(),
              url: item.fullImage,
              file: new File([], "library-audio"),
              mediaToken: item.id,
              duration,
            }),
          );
        }
        if (exceeded) {
          toast.error(
            `Total audio duration cannot exceed ${maxAudioTotalSec}s`,
            { id: "audio-ref-limit" },
          );
        }
        if (newAudios.length > 0) {
          // Nothing awaits between the read of `latestAudios` and here. Update
          // the ref right away too, as the video path does.
          const next = [...latestAudios, ...newAudios];
          referenceAudiosRef.current = next;
          setReferenceAudios?.(next);
        }
      } finally {
        setIsProcessingGallery(false);
      }
      handleGalleryClose();
      return;
    }
    if (galleryTarget === "end") {
      const item = selectedItems[0];
      if (item && item.fullImage) {
        setEndFrameImage?.(
          asImage({
            id: randomId(),
            url: item.fullImage,
            file: new File([], "library-image"),
            mediaToken: item.id,
          }),
        );
      }
      handleGalleryClose();
      return;
    }
    const availableSlots = Math.max(0, maxImages - referenceImages.length);
    if (availableSlots <= 0) {
      handleGalleryClose();
      return;
    }

    const newRefs = [...referenceImages];
    selectedItems.slice(0, availableSlots).forEach((item) => {
      if (!item.fullImage) return;
      newRefs.push(
        asImage({
          id: randomId(),
          url: item.fullImage,
          file: new File([], "library-image"),
          mediaToken: item.id,
        }),
      );
    });
    setReferenceImages(newRefs);
    handleGalleryClose();
  };

  const availableImageSlots = Math.max(
    0,
    maxImages - referenceImages.length - visibleUploadingImages.length,
  );

  const fileInputs: ReactNode = (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileUpload}
        multiple={maxImages > 1}
      />
      <input
        type="file"
        ref={anyFileInputRef}
        className="hidden"
        accept={anyUploadAccept}
        onChange={handleAnyFileUpload}
        multiple
      />
      {(uploadVideo || setReferenceVideos) && (
        <input
          type="file"
          ref={videoFileInputRef}
          className="hidden"
          accept="video/mp4,.mp4"
          onChange={handleVideoFileUpload}
          multiple={maxVideos > 1}
        />
      )}
      {(uploadAudio || setReferenceAudios) && (
        <input
          type="file"
          ref={audioFileInputRef}
          className="hidden"
          accept={AUDIO_FILE_ACCEPT}
          onChange={handleAudioFileUpload}
          multiple={maxAudios > 1}
        />
      )}
    </>
  );

  // Tokens already in the deck slot the picker targets, greyed out in the
  // gallery so one media file can't be added twice to the same field. Reusing
  // an image across slots (e.g. start AND end frame) stays allowed.
  const disabledGalleryIds = useMemo(() => {
    if (galleryTarget === "video") {
      return referenceVideos
        .map((video) => video.mediaToken)
        .filter((t): t is string => !!t);
    }
    if (galleryTarget === "audio") {
      return referenceAudios
        .map((audio) => audio.mediaToken)
        .filter((t): t is string => !!t);
    }
    if (galleryTarget === "end") {
      return endFrameImage?.mediaToken ? [endFrameImage.mediaToken] : [];
    }
    return referenceImages
      .map((img) => img.mediaToken)
      .filter((t): t is string => !!t);
  }, [
    galleryTarget,
    referenceImages,
    referenceVideos,
    referenceAudios,
    endFrameImage,
  ]);

  const galleryModal: ReactNode = ownGalleryModal ? (
    <GalleryModal
      key={
        galleryTarget === "video"
          ? "video"
          : galleryTarget === "audio"
            ? "audio"
            : "image"
      }
      isOpen={!!isGalleryModalOpen}
      onClose={handleGalleryClose}
      mode="select"
      selectedItemIds={selectedGalleryImages}
      disabledItemIds={disabledGalleryIds}
      onSelectItem={handleImageSelect}
      maxSelections={
        galleryTarget === "end"
          ? 1
          : galleryTarget === "video"
            ? Math.max(1, maxVideos - referenceVideos.length)
            : galleryTarget === "audio"
              ? Math.max(1, maxAudios - referenceAudios.length)
              : Math.max(1, availableImageSlots)
      }
      onUseSelected={handleGalleryImages}
      onDownloadClicked={downloadFileFromUrl}
      useSelectedLoading={isProcessingGallery}
      forceFilter={
        galleryTarget === "video"
          ? "video"
          : galleryTarget === "audio"
            ? "audio"
            : "image"
      }
    />
  ) : null;

  return {
    uploadingImages: visibleUploadingImages,
    uploadingEnd,
    uploadingVideo: visibleUploadingVideo,
    uploadingAudio: visibleUploadingAudio,
    availableImageSlots,
    processImageFiles,
    processVideoFiles,
    processAudioFiles,
    openImageUpload,
    openEndUpload,
    openVideoUpload,
    openAudioUpload,
    openAnyUpload,
    openGallery,
    fileInputs,
    galleryModal,
  };
}
