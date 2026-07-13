import { useEffect, useRef, useState, type ReactNode } from "react";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { downloadFileFromUrl, type UploadMediaFn } from "@storyteller/api";
import { toast } from "@storyteller/ui-toaster";
import { UploaderStates } from "@storyteller/common";

/** Minimal structural shapes so both apps' ref types fit. */
export interface DeckRefLike {
  id: string;
  url: string;
}
export interface DeckMediaRefLike extends DeckRefLike {
  duration: number;
}

/** An in-flight upload; `previewUrl` is a memoized object URL. */
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
  const [galleryTarget, setGalleryTarget] = useState<"start" | "end" | "video">(
    "start",
  );
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

  // The hook only ever commits `{ id, url, file, mediaToken, duration? }`,
  // which is structurally assignable to both apps' ref types (desktop
  // promptStore refs match exactly; the webapp's extra fields are optional).
  const asImage = (img: {
    id: string;
    url: string;
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

  const openGallery = (target: "start" | "end" | "video") => {
    setGalleryTarget(target);
    setIsGalleryModalOpen(true);
  };

  const processImageFiles = (
    files: File[],
    uploadTarget: "start" | "end",
  ) => {
    const currentCount = referenceImages.length + uploadingImages.length;
    const availableSlots = Math.max(0, maxImages - currentCount);
    if (availableSlots <= 0 && uploadTarget !== "end") {
      return;
    }

    const filesToProcess =
      uploadTarget === "end"
        ? files.slice(0, 1)
        : files.slice(0, availableSlots);

    filesToProcess.forEach((file) => {
      const entry = makeEntry(file);
      if (uploadTarget === "end") {
        setUploadingEnd(entry);
      } else {
        setUploadingImages((prev) => [...prev, entry]);
      }

      const finishEntry = () => {
        URL.revokeObjectURL(entry.previewUrl);
        if (uploadTarget === "end") {
          setUploadingEnd(null);
        } else {
          setUploadingImages((prev) => prev.filter((e) => e.id !== entry.id));
        }
      };

      const commit = (url: string, mediaToken: string) => {
        const referenceImage = asImage({
          id: randomId(),
          url,
          file,
          mediaToken,
        });
        finishEntry();
        if (uploadTarget === "end") {
          setEndFrameImage?.(referenceImage);
        } else {
          setReferenceImages([...referenceImagesRef.current, referenceImage]);
        }
      };

      const reader = new FileReader();
      reader.onloadend = async () => {
        if (uploadImage) {
          await uploadImage({
            title: randomTitle("reference-image"),
            assetFile: file,
            progressCallback: (newState) => {
              if (newState.status === UploaderStates.success && newState.data) {
                commit(reader.result as string, newState.data);
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                finishEntry();
              }
            },
          });
        } else {
          commit(reader.result as string, "");
        }

      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;
    processImageFiles(files, imageTargetRef.current);
  };

  const processVideoFiles = async (files: File[]) => {
    // Snapshot the committed state at call time so removes that happened
    // before this call are respected (don't re-read a stale ref).
    const baseVideos = [...referenceVideos];
    const availableSlots = Math.max(0, maxVideos - baseVideos.length);
    if (availableSlots <= 0) {
      toast.error(`Max ${maxVideos} videos / ${maxVideoTotalSec}s total`, {
        id: "video-ref-limit",
      });
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    let committed = baseVideos;

    for (const file of filesToProcess) {
      const duration = await getVideoDuration(file);
      const currentTotal = committed.reduce((sum, v) => sum + v.duration, 0);

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
        // stays alive exactly as long as the ref does.
        const refVideo = asVideo({
          id: randomId(),
          url: entry.previewUrl,
          file,
          mediaToken,
          duration,
        });
        setUploadingVideo(null);
        committed = [...committed, refVideo];
        setReferenceVideos?.(committed);
      };

      if (uploadVideo) {
        await uploadVideo({
          title: randomTitle("reference-video"),
          assetFile: file,
          progressCallback: (newState) => {
            if (newState.status === UploaderStates.success && newState.data) {
              commit(newState.data);
            } else if (
              newState.status === UploaderStates.assetError ||
              newState.status === UploaderStates.imageCreateError
            ) {
              URL.revokeObjectURL(entry.previewUrl);
              setUploadingVideo(null);
              toast.error("Failed to upload video. Please upload an MP4 file.");
            }
          },
        });
      } else {
        commit("");
      }
    }
  };

  const handleVideoFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (videoFileInputRef.current) videoFileInputRef.current.value = "";
    if (files.length === 0) return;
    await processVideoFiles(files);
  };

  const processAudioFiles = async (files: File[]) => {
    const availableSlots = Math.max(0, maxAudios - referenceAudios.length);
    if (availableSlots <= 0) {
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);

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
          id: randomId(),
          url: entry.previewUrl,
          file,
          mediaToken,
          duration,
        });
        setUploadingAudio(null);
        setReferenceAudios?.([...referenceAudiosRef.current, refAudio]);
      };

      if (uploadAudio) {
        await uploadAudio({
          title: randomTitle("reference-audio"),
          assetFile: file,
          progressCallback: (newState) => {
            if (newState.status === UploaderStates.success && newState.data) {
              commit(newState.data);
            } else if (
              newState.status === UploaderStates.assetError ||
              newState.status === UploaderStates.imageCreateError
            ) {
              URL.revokeObjectURL(entry.previewUrl);
              setUploadingAudio(null);
            }
          },
        });
      } else {
        commit("");
      }
    }
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
    const videos = files.filter((f) => f.type.startsWith("video/"));
    const audios = files.filter((f) => f.type.startsWith("audio/"));

    if (images.length > 0) processImageFiles(images, "start");
    if (videos.length > 0 && setReferenceVideos) processVideoFiles(videos);
    if (audios.length > 0 && setReferenceAudios) processAudioFiles(audios);
  };

  const anyUploadAccept = [
    "image/*",
    ...(setReferenceVideos ? ["video/mp4", ".mp4"] : []),
    ...(setReferenceAudios ? ["audio/*"] : []),
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
      // Snapshot committed state at call time to avoid re-reading a stale
      // ref after removes.
      const baseVideos = [...referenceVideos];
      const availableSlots = Math.max(0, maxVideos - baseVideos.length);
      if (availableSlots <= 0) {
        toast.error(`Max ${maxVideos} videos / ${maxVideoTotalSec}s total`, {
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

        const newVideos: TVideo[] = [];
        let currentTotal = baseVideos.reduce((sum, v) => sum + v.duration, 0);
        let exceeded = false;
        for (let i = 0; i < itemsToProcess.length; i++) {
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
          setReferenceVideos?.([...baseVideos, ...newVideos]);
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
    maxImages - referenceImages.length - uploadingImages.length,
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
          accept="audio/*"
          onChange={handleAudioFileUpload}
          multiple={maxAudios > 1}
        />
      )}
    </>
  );

  const galleryModal: ReactNode = ownGalleryModal ? (
    <GalleryModal
      key={galleryTarget === "video" ? "video" : "image"}
      isOpen={!!isGalleryModalOpen}
      onClose={handleGalleryClose}
      mode="select"
      selectedItemIds={selectedGalleryImages}
      onSelectItem={handleImageSelect}
      maxSelections={
        galleryTarget === "end"
          ? 1
          : galleryTarget === "video"
            ? Math.max(1, maxVideos - referenceVideos.length)
            : Math.max(1, availableImageSlots)
      }
      onUseSelected={handleGalleryImages}
      onDownloadClicked={downloadFileFromUrl}
      useSelectedLoading={isProcessingGallery}
      forceFilter={galleryTarget === "video" ? "video" : "image"}
    />
  ) : null;

  return {
    uploadingImages,
    uploadingEnd,
    uploadingVideo,
    uploadingAudio,
    availableImageSlots,
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
