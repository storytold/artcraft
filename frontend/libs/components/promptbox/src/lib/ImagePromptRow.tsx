import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { downloadFileFromUrl } from "@storyteller/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImages,
  faPlay,
  faPlus,
  faSpinnerThird,
  faStop,
  faTrashAlt,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { faImage, faVideo, faMusic } from "@fortawesome/pro-regular-svg-icons";
import { RefImage, RefVideo, RefAudio } from "./promptStore";
import { toast } from "@storyteller/ui-toaster";
import { twMerge } from "tailwind-merge";
import { UploaderStates } from "@storyteller/common";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { UploadMediaFn } from "@storyteller/api";
export type { UploadMediaFn as UploadImageFn } from "@storyteller/api";
type UploadImageFn = UploadMediaFn;

interface ImagePromptRowProps {
  visible: boolean;
  className?: string;
  maxImagePromptCount: number;
  allowUpload: boolean;
  referenceImages: RefImage[];
  setReferenceImages: (images: RefImage[]) => void;
  onVisibilityChange?: (visible: boolean) => void;
  uploadImage?: UploadImageFn;
  onImageClick?: (image: RefImage) => void;
  isVideo?: boolean;
  isReferenceMode?: boolean;
  endFrameImage?: RefImage;
  setEndFrameImage?: (image?: RefImage) => void;
  allowUploadEnd?: boolean;
  showEndFrameSection?: boolean;
  referenceVideos?: RefVideo[];
  setReferenceVideos?: (videos: RefVideo[]) => void;
  maxVideoCount?: number;
  maxVideoRefDuration?: number;
  showVideoReferenceSection?: boolean;
  uploadVideo?: UploadImageFn;
  referenceAudios?: RefAudio[];
  setReferenceAudios?: (audios: RefAudio[]) => void;
  maxAudioCount?: number;
  maxAudioRefDuration?: number;
  uploadAudio?: UploadImageFn;
}

const AudioRefTile = ({
  audio,
  index,
  onRemove,
}: {
  audio: RefAudio;
  index: number;
  onRemove: (id: string) => void;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTogglePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
      } else {
        const el = new Audio(audio.url);
        el.volume = 0.2;
        audioRef.current = el;
        el.onended = () => setIsPlaying(false);
        el.play();
        setIsPlaying(true);
      }
    },
    [isPlaying, audio.url],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30 hover:border-white/80 transition-all group cursor-pointer flex items-center justify-center">
      <button
        onClick={handleTogglePlay}
        className="flex items-center justify-center w-full h-full"
      >
        <FontAwesomeIcon
          icon={isPlaying ? faStop : faPlay}
          className={twMerge(
            "h-5 w-5 transition-colors",
            isPlaying
              ? "text-red-400"
              : "text-base-fg/60 group-hover:text-base-fg",
          )}
        />
      </button>
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/70 py-0.5 text-[10px] font-bold text-white pointer-events-none">
        #{index + 1} · {audio.duration}s
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          onRemove(audio.id);
        }}
        className="opacity-0 group-hover:opacity-100 absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 hover:bg-red/70 text-white backdrop-blur-md transition-colors hover:bg-black cursor-pointer"
      >
        <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
      </button>
    </div>
  );
};

export const ImagePromptRow = ({
  visible,
  className,
  maxImagePromptCount,
  allowUpload,
  referenceImages,
  setReferenceImages,
  onVisibilityChange,
  uploadImage,
  onImageClick,
  isVideo,
  isReferenceMode,
  endFrameImage,
  setEndFrameImage,
  allowUploadEnd,
  showEndFrameSection = true,
  referenceVideos = [],
  setReferenceVideos,
  maxVideoCount = 3,
  maxVideoRefDuration = 15,
  showVideoReferenceSection,
  uploadVideo,
  referenceAudios = [],
  setReferenceAudios,
  maxAudioCount = 2,
  maxAudioRefDuration = 15,
  uploadAudio,
}: ImagePromptRowProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<"start" | "end" | "video">(
    "start",
  );
  const [uploadTarget, setUploadTarget] = useState<"start" | "end" | "video">(
    "start",
  );
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const [uploadingEnd, setUploadingEnd] = useState<{
    id: string;
    file: File;
  } | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState<{
    id: string;
    file: File;
  } | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState<{
    id: string;
    file: File;
  } | null>(null);

  const referenceImagesRef = useRef(referenceImages);
  useEffect(() => {
    referenceImagesRef.current = referenceImages;
  }, [referenceImages]);

  const allowReorder = useMemo(
    () => maxImagePromptCount > 1 && referenceImages.length > 1,
    [maxImagePromptCount, referenceImages.length],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const SortableImage = ({
    image,
    index,
  }: {
    image: RefImage;
    index: number;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: image.id });

    const style: CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 9999 : undefined,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...(allowReorder ? { ...attributes, ...listeners } : {})}
        className={twMerge(
          "glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30 transition-opacity group",
          allowReorder
            ? "cursor-move hover:border-white/80"
            : "cursor-pointer hover:border-white/80",
          isDragging ? "opacity-50 shadow-lg" : "",
        )}
        onClick={() => onImageClick?.(image)}
      >
        <img
          src={image.url}
          alt="Reference"
          className="h-full w-full object-cover"
        />
        {isReferenceMode && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/60 py-0.5 text-[11px] font-bold text-white">
            {index + 1}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveReference(image.id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          className="opacity-0 group-hover:opacity-100 absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 hover:bg-red/70 text-white backdrop-blur-md transition-colors hover:bg-black cursor-pointer"
        >
          <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
        </button>
      </div>
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = referenceImages.findIndex((img) => img.id === active.id);
    const newIndex = referenceImages.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(referenceImages, oldIndex, newIndex);
    setReferenceImages(newOrder);
  };

  const usedSlotsRender = useMemo(
    () =>
      Math.min(
        maxImagePromptCount,
        referenceImages.length + uploadingImages.length,
      ),
    [maxImagePromptCount, referenceImages.length, uploadingImages.length],
  );
  const availableSlotsRender = useMemo(
    () =>
      Math.max(
        0,
        maxImagePromptCount - referenceImages.length - uploadingImages.length,
      ),
    [maxImagePromptCount, referenceImages.length, uploadingImages.length],
  );

  useEffect(() => {
    const anyVisible =
      visible &&
      (referenceImages.length > 0 || uploadingImages.length > 0 || allowUpload);
    onVisibilityChange?.(!!anyVisible);
  }, [
    visible,
    referenceImages.length,
    uploadingImages.length,
    allowUpload,
    onVisibilityChange,
  ]);

  const handleRemoveReference = (id: string) => {
    setReferenceImages(referenceImages.filter((img) => img.id !== id));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleUploadClickStart = () => {
    setUploadTarget("start");
    handleUploadClick();
  };
  const handleUploadClickEnd = () => {
    setUploadTarget("end");
    handleUploadClick();
  };
  const handleUploadClickVideo = () => {
    setUploadTarget("video");
    videoFileInputRef.current?.click();
  };

  const referenceVideosRef = useRef(referenceVideos);
  useEffect(() => {
    referenceVideosRef.current = referenceVideos;
  }, [referenceVideos]);

  const getVideoDuration = (file: File): Promise<number> =>
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

  const totalVideoDuration = useMemo(
    () => referenceVideos.reduce((sum, v) => sum + v.duration, 0),
    [referenceVideos],
  );

  const handleVideoFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const availableSlots = Math.max(0, maxVideoCount - referenceVideos.length);
    if (availableSlots <= 0) {
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);

    for (const file of filesToProcess) {
      const duration = await getVideoDuration(file);
      const currentTotal = referenceVideosRef.current.reduce(
        (sum, v) => sum + v.duration,
        0,
      );

      if (currentTotal + duration > maxVideoRefDuration) {
        toast.error(
          `Total video duration cannot exceed ${maxVideoRefDuration}s`,
        );
        break;
      }

      const uploadId = Math.random().toString(36).substring(7);
      setUploadingVideo({ id: uploadId, file });

      if (uploadVideo) {
        await uploadVideo({
          title: `reference-video-${Math.random()
            .toString(36)
            .substring(2, 15)}`,
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
              setUploadingVideo(null);
              setReferenceVideos?.([...referenceVideosRef.current, refVideo]);
            } else if (
              newState.status === UploaderStates.assetError ||
              newState.status === UploaderStates.imageCreateError
            ) {
              setUploadingVideo(null);
            }
          },
        });
      } else {
        const refVideo: RefVideo = {
          id: Math.random().toString(36).substring(7),
          url: URL.createObjectURL(file),
          file,
          mediaToken: "",
          duration,
        };
        setUploadingVideo(null);
        setReferenceVideos?.([...referenceVideosRef.current, refVideo]);
      }
    }

    if (videoFileInputRef.current) videoFileInputRef.current.value = "";
  };

  const handleRemoveVideo = (id: string) => {
    setReferenceVideos?.(referenceVideos.filter((v) => v.id !== id));
    if (videoFileInputRef.current) videoFileInputRef.current.value = "";
  };

  const handleUploadClickAudio = () => {
    audioFileInputRef.current?.click();
  };

  const referenceAudiosRef = useRef(referenceAudios);
  useEffect(() => {
    referenceAudiosRef.current = referenceAudios;
  }, [referenceAudios]);

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

  const totalAudioDuration = useMemo(
    () => referenceAudios.reduce((sum, a) => sum + a.duration, 0),
    [referenceAudios],
  );

  const handleAudioFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const availableSlots = Math.max(0, maxAudioCount - referenceAudios.length);
    if (availableSlots <= 0) {
      if (audioFileInputRef.current) audioFileInputRef.current.value = "";
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);

    for (const file of filesToProcess) {
      const duration = await getAudioDuration(file);
      const currentTotal = referenceAudiosRef.current.reduce(
        (sum, a) => sum + a.duration,
        0,
      );

      if (currentTotal + duration > maxAudioRefDuration) {
        toast.error(
          `Total audio duration cannot exceed ${maxAudioRefDuration}s`,
        );
        break;
      }

      const uploadId = Math.random().toString(36).substring(7);
      setUploadingAudio({ id: uploadId, file });

      if (uploadAudio) {
        await uploadAudio({
          title: `reference-audio-${Math.random()
            .toString(36)
            .substring(2, 15)}`,
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
              setUploadingAudio(null);
              setReferenceAudios?.([...referenceAudiosRef.current, refAudio]);
            } else if (
              newState.status === UploaderStates.assetError ||
              newState.status === UploaderStates.imageCreateError
            ) {
              setUploadingAudio(null);
            }
          },
        });
      } else {
        const refAudio: RefAudio = {
          id: Math.random().toString(36).substring(7),
          url: URL.createObjectURL(file),
          file,
          mediaToken: "",
          duration,
        };
        setUploadingAudio(null);
        setReferenceAudios?.([...referenceAudiosRef.current, refAudio]);
      }
    }

    if (audioFileInputRef.current) audioFileInputRef.current.value = "";
  };

  const handleRemoveAudio = (id: string) => {
    setReferenceAudios?.(referenceAudios.filter((a) => a.id !== id));
    if (audioFileInputRef.current) audioFileInputRef.current.value = "";
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentCount = referenceImages.length + uploadingImages.length;
    const availableSlots = Math.max(0, maxImagePromptCount - currentCount);
    if (availableSlots <= 0 && uploadTarget !== "end") {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess =
      uploadTarget === "end"
        ? files.slice(0, 1)
        : files.slice(0, availableSlots);

    filesToProcess.forEach((file) => {
      const uploadId = Math.random().toString(36).substring(7);
      if (uploadTarget === "end") {
        setUploadingEnd({ id: uploadId, file });
      } else {
        setUploadingImages((prev) => [...prev, { id: uploadId, file }]);
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        if (uploadImage) {
          await uploadImage({
            title: `reference-image-${Math.random()
              .toString(36)
              .substring(2, 15)}`,
            assetFile: file,
            progressCallback: (newState) => {
              if (newState.status === UploaderStates.success && newState.data) {
                const referenceImage: RefImage = {
                  id: Math.random().toString(36).substring(7),
                  url: reader.result as string,
                  file,
                  mediaToken: newState.data,
                };
                if (uploadTarget === "end") {
                  setUploadingEnd(null);
                } else {
                  setUploadingImages((prev) =>
                    prev.filter((img) => img.id !== uploadId),
                  );
                }
                if (uploadTarget === "end") {
                  setEndFrameImage?.(referenceImage);
                } else {
                  setReferenceImages([
                    ...referenceImagesRef.current,
                    referenceImage,
                  ]);
                }
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                if (uploadTarget === "end") {
                  setUploadingEnd(null);
                } else {
                  setUploadingImages((prev) =>
                    prev.filter((img) => img.id !== uploadId),
                  );
                }
              }
            },
          });
        } else {
          const referenceImage: RefImage = {
            id: Math.random().toString(36).substring(7),
            url: reader.result as string,
            file,
            mediaToken: "",
          };
          if (uploadTarget === "end") {
            setUploadingEnd(null);
          } else {
            setUploadingImages((prev) =>
              prev.filter((img) => img.id !== uploadId),
            );
          }
          if (uploadTarget === "end") {
            setEndFrameImage?.(referenceImage);
          } else {
            setReferenceImages([...referenceImagesRef.current, referenceImage]);
          }
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGalleryClose = () => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const maxSelections = Math.max(1, maxImagePromptCount);
      if (prev.length >= maxSelections) {
        return maxSelections === 1 ? [id] : prev;
      }
      return [...prev, id];
    });
  };

  const handleGalleryImages = (selectedItems: GalleryItem[]) => {
    if (galleryTarget === "end") {
      const item = selectedItems[0];
      if (item && item.fullImage) {
        setEndFrameImage?.({
          id: Math.random().toString(36).substring(7),
          url: item.fullImage,
          file: new File([], "library-image"),
          mediaToken: item.id,
        });
      }
      setIsGalleryModalOpen(false);
      setSelectedGalleryImages([]);
      return;
    }
    const availableSlots = Math.max(
      0,
      maxImagePromptCount - referenceImages.length,
    );
    if (availableSlots <= 0) {
      setIsGalleryModalOpen(false);
      setSelectedGalleryImages([]);
      return;
    }

    const newRefs = [...referenceImages];
    selectedItems.slice(0, availableSlots).forEach((item) => {
      if (!item.fullImage) return;
      newRefs.push({
        id: Math.random().toString(36).substring(7),
        url: item.fullImage,
        file: new File([], "library-image"),
        mediaToken: item.id,
      });
    });
    setReferenceImages(newRefs);
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileUpload}
        multiple={maxImagePromptCount > 1}
      />
      {showVideoReferenceSection && (
        <>
          <input
            type="file"
            ref={videoFileInputRef}
            className="hidden"
            accept="video/*"
            onChange={handleVideoFileUpload}
            multiple={maxVideoCount > 1}
          />
          <input
            type="file"
            ref={audioFileInputRef}
            className="hidden"
            accept="audio/*"
            onChange={handleAudioFileUpload}
            multiple={maxAudioCount > 1}
          />
        </>
      )}
      <div
        className={twMerge(
          "absolute left-0 glass w-[730px] rounded-t-xl flex",
          showVideoReferenceSection ? "-top-[144px]" : "-top-[72px]",
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="grow flex flex-col">
          <div
            className={twMerge(
              "grid grid-cols-1",
              isVideo && showEndFrameSection && "grid-cols-2",
            )}
          >
            <div className="flex gap-2 py-2 px-3">
              <div className="flex flex-col grow gap-1">
                <div className="flex items-center gap-2 opacity-90 text-base-fg">
                  <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    {isVideo
                      ? isReferenceMode
                        ? "Image Ref"
                        : "Start Frame"
                      : "Image Prompts"}
                    {(!isVideo || isReferenceMode) && (
                      <span className="text-base-fg/60 font-semibold">
                        ({usedSlotsRender}/{maxImagePromptCount})
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-[13px] text-base-fg/60">
                  {isVideo
                    ? isReferenceMode
                      ? "Upload images"
                      : "Animate an image"
                    : "Use the elements of an image"}
                </span>
              </div>

              <div className="flex gap-2">
                {allowReorder ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={referenceImages
                        .slice(0, Math.max(0, maxImagePromptCount))
                        .map((img) => img.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {referenceImages
                        .slice(0, Math.max(0, maxImagePromptCount))
                        .map((image, index) => (
                          <SortableImage
                            key={image.id}
                            image={image}
                            index={index}
                          />
                        ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  referenceImages
                    .slice(0, Math.max(0, maxImagePromptCount))
                    .map((image, index) => (
                      <div
                        key={image.id}
                        className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30 hover:border-white/80 transition-all group cursor-pointer hover:cursor-zoom-in"
                        onClick={() => onImageClick?.(image)}
                      >
                        <img
                          src={image.url}
                          alt="Reference"
                          className="h-full w-full object-cover"
                        />
                        {isReferenceMode && (
                          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/60 py-0.5 text-[11px] font-bold text-white">
                            {index + 1}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveReference(image.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 hover:bg-red/70 text-white backdrop-blur-md transition-colors hover:bg-black cursor-pointer"
                        >
                          <FontAwesomeIcon
                            icon={faXmark}
                            className="h-2.5 w-2.5"
                          />
                        </button>
                      </div>
                    ))
                )}
                {uploadingImages
                  .slice(
                    0,
                    Math.max(0, maxImagePromptCount - referenceImages.length),
                  )
                  .map(({ id, file }) => {
                    const previewUrl = URL.createObjectURL(file);
                    return (
                      <div
                        key={id}
                        className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30"
                      >
                        <div className="absolute inset-0">
                          <img
                            src={previewUrl}
                            alt="Uploading preview"
                            className="h-full w-full object-cover blur-sm"
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <FontAwesomeIcon
                            icon={faSpinnerThird}
                            className="h-6 w-6 animate-spin text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                {referenceImages.length + uploadingImages.length <
                  maxImagePromptCount && (
                  <Tooltip
                    interactive={true}
                    position="top"
                    delay={100}
                    className="bg-ui-controls text-base-fg border border-ui-panel-border p-2 -mb-0.5"
                    closeOnClick={true}
                    content={
                      <div className="flex flex-col gap-1.5">
                        {allowUpload && (
                          <Button
                            variant="primary"
                            onClick={handleUploadClickStart}
                            icon={faPlus}
                            className="w-full"
                          >
                            Upload
                          </Button>
                        )}
                        <Button
                          variant="action"
                          onClick={() => {
                            setGalleryTarget("start");
                            setIsGalleryModalOpen(true);
                          }}
                          icon={faImages}
                          className="w-full"
                        >
                          Pick from library
                        </Button>
                      </div>
                    }
                  >
                    <Button
                      variant="action"
                      className="bg-ui-controls/40 hover:bg-ui-controls/60 aspect-square w-full overflow-hidden rounded-lg w-14 border-dashed border-2 border-black/5 dark:border-white/25 transition-all"
                      onClick={() => {
                        if (allowUpload) handleUploadClickStart();
                        else {
                          setGalleryTarget("start");
                          setIsGalleryModalOpen(true);
                        }
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faPlus}
                        className="text-2xl opacity-80 text-base-fg"
                      />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
            {isVideo && showEndFrameSection && (
              <div className="flex gap-3 pe-3">
                <div className="flex grow gap-1">
                  <div className="w-[1px] h-full bg-white/10" />
                  <div className="flex flex-col grow gap-1 p-2">
                    <div className="flex items-center gap-2 opacity-90 text-base-fg">
                      <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        End Frame{" "}
                        <span className="text-base-fg/60 text-xs">
                          (optional)
                        </span>
                      </span>
                    </div>
                    <span className="text-[13px] text-base-fg/60">
                      How video ends
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {endFrameImage ? (
                    <div
                      className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30 hover:border-white/80 transition-all group cursor-pointer hover:cursor-zoom-in"
                      onClick={() => onImageClick?.(endFrameImage)}
                    >
                      <img
                        src={endFrameImage.url}
                        alt="Ending Frame"
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEndFrameImage?.(undefined);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 hover:bg-red/70 text-white backdrop-blur-md transition-colors hover:bg-black cursor-pointer"
                      >
                        <FontAwesomeIcon
                          icon={faXmark}
                          className="h-2.5 w-2.5"
                        />
                      </button>
                    </div>
                  ) : uploadingEnd ? (
                    <div className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30">
                      <div className="absolute inset-0">
                        <img
                          src={URL.createObjectURL(uploadingEnd.file)}
                          alt="Uploading preview"
                          className="h-full w-full object-cover blur-sm"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <FontAwesomeIcon
                          icon={faSpinnerThird}
                          className="h-6 w-6 animate-spin text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <Tooltip
                      interactive={true}
                      position="top"
                      delay={100}
                      className="bg-ui-controls text-base-fg border border-ui-panel-border p-2 -mb-0.5"
                      closeOnClick={true}
                      content={
                        <div className="flex flex-col gap-1.5">
                          {allowUploadEnd && (
                            <Button
                              variant="primary"
                              onClick={handleUploadClickEnd}
                              icon={faPlus}
                              className="w-full"
                            >
                              Upload
                            </Button>
                          )}
                          <Button
                            variant="action"
                            onClick={() => {
                              setGalleryTarget("end");
                              setIsGalleryModalOpen(true);
                            }}
                            icon={faImages}
                            className="w-full"
                          >
                            Pick from library
                          </Button>
                        </div>
                      }
                    >
                      <Button
                        variant="action"
                        className="bg-ui-controls/40 hover:bg-ui-controls/60 aspect-square w-full overflow-hidden rounded-lg w-14 border-dashed border-2 border-black/5 dark:border-white/25 transition-all"
                        onClick={() => {
                          if (allowUploadEnd) handleUploadClickEnd();
                          else {
                            setGalleryTarget("end");
                            setIsGalleryModalOpen(true);
                          }
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faPlus}
                          className="text-2xl opacity-80 text-base-fg"
                        />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>
            )}
          </div>
          {isVideo && showVideoReferenceSection && (
            <div className="grid grid-cols-2 border-t border-white/10">
              {/* Video References - Left */}
              <div className="flex gap-2 py-2 px-3">
                <div className="flex flex-col grow gap-1">
                  <div className="flex items-center gap-2 opacity-90 text-base-fg">
                    <FontAwesomeIcon icon={faVideo} className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      Video Ref{" "}
                      <span className="text-base-fg/60 font-semibold">
                        ({referenceVideos.length}/{maxVideoCount})
                      </span>
                    </span>
                  </div>
                  <span className="text-[13px] text-base-fg/60">
                    {totalVideoDuration}s / {maxVideoRefDuration}s max
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  {referenceVideos.map((video) => (
                    <div
                      key={video.id}
                      className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30 hover:border-white/80 transition-all group cursor-pointer"
                    >
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
                          handleRemoveVideo(video.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 hover:bg-red/70 text-white backdrop-blur-md transition-colors hover:bg-black cursor-pointer"
                      >
                        <FontAwesomeIcon
                          icon={faXmark}
                          className="h-2.5 w-2.5"
                        />
                      </button>
                    </div>
                  ))}
                  {uploadingVideo && (
                    <div className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30">
                      <div className="absolute inset-0">
                        <video
                          src={URL.createObjectURL(uploadingVideo.file)}
                          muted
                          preload="metadata"
                          className="h-full w-full object-cover blur-sm"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <FontAwesomeIcon
                          icon={faSpinnerThird}
                          className="h-6 w-6 animate-spin text-white"
                        />
                      </div>
                    </div>
                  )}
                  {referenceVideos.length < maxVideoCount &&
                    !uploadingVideo && (
                      <Button
                        variant="action"
                        className="bg-ui-controls/40 hover:bg-ui-controls/60 aspect-square w-full overflow-hidden rounded-lg w-14 border-dashed border-2 border-black/5 dark:border-white/25 transition-all"
                        onClick={handleUploadClickVideo}
                      >
                        <FontAwesomeIcon
                          icon={faPlus}
                          className="text-2xl opacity-80 text-base-fg"
                        />
                      </Button>
                    )}
                </div>
              </div>
              {/* Audio References - Right */}
              <div className="flex gap-2 pe-3">
                <div className="flex grow gap-1">
                  <div className="w-[1px] h-full bg-white/10" />
                  <div className="flex flex-col grow gap-1 p-2">
                    <div className="flex items-center gap-2 opacity-90 text-base-fg">
                      <FontAwesomeIcon icon={faMusic} className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        Audio Ref{" "}
                        <span className="text-base-fg/60 font-semibold">
                          ({referenceAudios.length}/{maxAudioCount})
                        </span>
                      </span>
                    </div>
                    <span className="text-[13px] text-base-fg/60">
                      {totalAudioDuration}s / {maxAudioRefDuration}s max
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {referenceAudios.map((audio, index) => (
                    <AudioRefTile
                      key={audio.id}
                      audio={audio}
                      index={index}
                      onRemove={handleRemoveAudio}
                    />
                  ))}
                  {uploadingAudio && (
                    <div className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faSpinnerThird}
                        className="h-6 w-6 animate-spin text-white"
                      />
                    </div>
                  )}
                  {referenceAudios.length < maxAudioCount &&
                    !uploadingAudio && (
                      <Button
                        variant="action"
                        className="bg-ui-controls/40 hover:bg-ui-controls/60 aspect-square w-full overflow-hidden rounded-lg w-14 border-dashed border-2 border-black/5 dark:border-white/25 transition-all"
                        onClick={handleUploadClickAudio}
                      >
                        <FontAwesomeIcon
                          icon={faPlus}
                          className="text-2xl opacity-80 text-base-fg"
                        />
                      </Button>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <div className="w-[1px] h-full bg-white/10" />
          <div className="flex items-center gap-2 w-[1px] h-full bg-base-fg/20 dark:bg-base-fg/10 rounded-lg" />
          <div className="p-2">
            <Button
              variant="action"
              icon={faTrashAlt}
              className="h-8 w-3"
              onClick={() => {
                setReferenceImages([]);
                setReferenceVideos?.([]);
                setReferenceAudios?.([]);
              }}
            />
          </div>
        </div>
      </div>
      <GalleryModal
        isOpen={!!isGalleryModalOpen}
        onClose={handleGalleryClose}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={
          galleryTarget === "end" ? 1 : Math.max(1, availableSlotsRender)
        }
        onUseSelected={handleGalleryImages}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );
};
