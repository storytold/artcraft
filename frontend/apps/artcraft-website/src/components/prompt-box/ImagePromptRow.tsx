import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImages,
  faPlus,
  faSpinner,
  faSpinnerThird,
  faTrashAlt,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { faImage } from "@fortawesome/pro-regular-svg-icons";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { twMerge } from "tailwind-merge";
import { UploaderStates } from "@storyteller/common";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RefImage } from "./types";
import { uploadImage } from "./upload-image";

interface ImagePromptRowProps {
  maxImagePromptCount: number;
  referenceImages: RefImage[];
  setReferenceImages: (images: RefImage[]) => void;
  onPickFromLibrary?: () => void;
  onClearAll?: () => void;
  className?: string;

  // Video mode props
  isVideo?: boolean;
  isReferenceMode?: boolean;
  endFrameImage?: RefImage;
  setEndFrameImage?: (image?: RefImage) => void;
  showEndFrameSection?: boolean;
}

export const ImagePromptRow = ({
  maxImagePromptCount,
  referenceImages,
  setReferenceImages,
  onPickFromLibrary,
  onClearAll,
  className,
  isVideo,
  isReferenceMode,
  endFrameImage,
  setEndFrameImage,
  showEndFrameSection,
}: ImagePromptRowProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);
  const [uploadingEndFrame, setUploadingEndFrame] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);

  const referenceImagesRef = useRef(referenceImages);
  referenceImagesRef.current = referenceImages;

  const allowReorder = maxImagePromptCount > 1 && referenceImages.length > 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const usedSlots = Math.min(
    maxImagePromptCount,
    referenceImages.length + uploadingImages.length,
  );

  const handleRemoveReference = (id: string) => {
    setReferenceImages(referenceImages.filter((img) => img.id !== id));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentCount = referenceImages.length + uploadingImages.length;
    const availableSlots = Math.max(0, maxImagePromptCount - currentCount);
    if (availableSlots <= 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);

    filesToProcess.forEach((file) => {
      const uploadId = Math.random().toString(36).substring(7);
      setUploadingImages((prev) => [...prev, { id: uploadId, file }]);

      const reader = new FileReader();
      reader.onloadend = async () => {
        await uploadImage({
          title: `reference-image-${Math.random().toString(36).substring(2, 15)}`,
          assetFile: file,
          progressCallback: (newState) => {
            if (newState.status === UploaderStates.success && newState.data) {
              const refImage: RefImage = {
                id: Math.random().toString(36).substring(7),
                url: reader.result as string,
                file,
                mediaToken: newState.data,
              };
              setUploadingImages((prev) =>
                prev.filter((img) => img.id !== uploadId),
              );
              setReferenceImages([...referenceImagesRef.current, refImage]);
            } else if (
              newState.status === UploaderStates.assetError ||
              newState.status === UploaderStates.imageCreateError
            ) {
              setUploadingImages((prev) =>
                prev.filter((img) => img.id !== uploadId),
              );
            }
          },
        });

        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = referenceImages.findIndex((img) => img.id === active.id);
    const newIndex = referenceImages.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setReferenceImages(arrayMove(referenceImages, oldIndex, newIndex));
  };

  const handleEndFrameUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !setEndFrameImage) return;

    setUploadingEndFrame(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      await uploadImage({
        title: `end-frame-${Math.random().toString(36).substring(2, 15)}`,
        assetFile: file,
        progressCallback: (newState) => {
          if (newState.status === UploaderStates.success && newState.data) {
            setEndFrameImage({
              id: Math.random().toString(36).substring(7),
              url: reader.result as string,
              file,
              mediaToken: newState.data,
            });
            setUploadingEndFrame(false);
          } else if (
            newState.status === UploaderStates.assetError ||
            newState.status === UploaderStates.imageCreateError
          ) {
            setUploadingEndFrame(false);
          }
        },
      });
      if (endFrameInputRef.current) endFrameInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const canAddMore =
    referenceImages.length + uploadingImages.length < maxImagePromptCount;

  // Context-aware labels
  const sectionLabel = isVideo
    ? isReferenceMode
      ? "Image Ref"
      : "Start Frame"
    : "Image Prompts";

  const sectionSubtitle = isVideo
    ? isReferenceMode
      ? "Upload images"
      : "Animate an image"
    : "Use the elements of an image";

  const showCount = !isVideo || isReferenceMode;

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
      {showEndFrameSection && (
        <input
          type="file"
          ref={endFrameInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleEndFrameUpload}
        />
      )}
      <div
        className={twMerge("glass flex rounded-t-xl", className)}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 flex-1 gap-2 px-3 py-2">
          <div className="flex grow flex-col gap-1">
            <div className="flex items-center gap-2 text-white/90">
              <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {sectionLabel}
                {showCount && (
                  <span className="font-semibold text-white/60">
                    ({usedSlots}/{maxImagePromptCount})
                  </span>
                )}
              </span>
            </div>
            <span className="text-[13px] text-white/60">{sectionSubtitle}</span>
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
                    .slice(0, maxImagePromptCount)
                    .map((img) => img.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {referenceImages
                    .slice(0, maxImagePromptCount)
                    .map((image) => (
                      <SortableImage
                        key={image.id}
                        image={image}
                        allowReorder={allowReorder}
                        onRemove={handleRemoveReference}
                      />
                    ))}
                </SortableContext>
              </DndContext>
            ) : (
              referenceImages
                .slice(0, maxImagePromptCount)
                .map((image) => (
                  <ImageThumbnail
                    key={image.id}
                    image={image}
                    onRemove={handleRemoveReference}
                  />
                ))
            )}

            {uploadingImages
              .slice(
                0,
                Math.max(0, maxImagePromptCount - referenceImages.length),
              )
              .map(({ id, file }) => (
                <UploadingThumbnail key={id} file={file} />
              ))}

            {canAddMore &&
              (onPickFromLibrary ? (
                <Tooltip
                  interactive
                  position="top"
                  delay={100}
                  className="bg-ui-controls text-base-fg border border-ui-panel-border p-2 -mb-0.5"
                  closeOnClick
                  content={
                    <div className="flex flex-col gap-1.5">
                      <Button
                        variant="primary"
                        onClick={() => fileInputRef.current?.click()}
                        icon={faPlus}
                        className="w-full"
                      >
                        Upload
                      </Button>
                      <Button
                        variant="action"
                        onClick={onPickFromLibrary}
                        icon={faImages}
                        className="w-full bg-white/15 hover:bg-white/20"
                      >
                        Pick from library
                      </Button>
                    </div>
                  }
                >
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10"
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="text-2xl text-white/80"
                    />
                  </button>
                </Tooltip>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="text-2xl text-white/80"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* End frame section */}
        {isVideo && showEndFrameSection && (
          <div className="flex min-w-0 flex-1 items-stretch gap-3 pe-3">
            <div className="flex grow gap-1">
              <div className="w-[1px] bg-white/10" />
              <div className="flex grow flex-col gap-1 p-2">
                <div className="flex items-center gap-2 text-white/90">
                  <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    End Frame{" "}
                    <span className="text-xs text-white/60">(optional)</span>
                  </span>
                </div>
                <span className="text-[13px] text-white/60">
                  How video ends
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {endFrameImage ? (
                <div className="group relative aspect-square w-14 overflow-hidden rounded-lg border-2 border-white/30 transition-all hover:border-white/80">
                  <img
                    src={endFrameImage.url}
                    alt="End frame"
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => setEndFrameImage?.(undefined)}
                    className="absolute right-[2px] top-[2px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-colors hover:bg-black group-hover:opacity-100"
                  >
                    <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : uploadingEndFrame ? (
                <div className="flex aspect-square w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-white/30 bg-white/5">
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    spin
                    className="h-6 w-6 text-white"
                  />
                </div>
              ) : (
                <button
                  onClick={() => endFrameInputRef.current?.click()}
                  className="flex aspect-square w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10"
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

        {/* Clear all refs */}
        {onClearAll && (
          <div className="flex items-center">
            <div className="h-full w-[1px] bg-white/10" />
            <div className="p-2">
              <button
                onClick={onClearAll}
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
              >
                <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ── Sub-components ───────────────────────────────────────────────────────

const ImageThumbnail = ({
  image,
  onRemove,
}: {
  image: RefImage;
  onRemove: (id: string) => void;
}) => (
  <div className="group glass relative aspect-square w-14 overflow-hidden rounded-lg border-2 border-white/30 transition-all hover:border-white/80">
    <img
      src={image.url}
      alt="Reference"
      className="h-full w-full object-cover"
    />
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove(image.id);
      }}
      className="absolute right-[2px] top-[2px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-colors hover:bg-black group-hover:opacity-100"
    >
      <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
    </button>
  </div>
);

const SortableImage = ({
  image,
  allowReorder,
  onRemove,
}: {
  image: RefImage;
  allowReorder: boolean;
  onRemove: (id: string) => void;
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
        "group glass relative aspect-square w-14 overflow-hidden rounded-lg border-2 border-white/30 transition-opacity",
        allowReorder
          ? "cursor-move hover:border-white/80"
          : "cursor-pointer hover:border-white/80",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      <img
        src={image.url}
        alt="Reference"
        className="h-full w-full object-cover"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(image.id);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-[2px] top-[2px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-colors hover:bg-black group-hover:opacity-100"
      >
        <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
      </button>
    </div>
  );
};

const UploadingThumbnail = ({ file }: { file: File }) => {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);
  return (
    <div className="glass relative aspect-square w-14 overflow-hidden rounded-lg border-2 border-white/30">
      <div className="absolute inset-0">
        <img
          src={previewUrl}
          alt="Uploading preview"
          className="h-full w-full object-cover blur-sm"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <FontAwesomeIcon icon={faSpinner} spin className="h-6 w-6 text-white" />
      </div>
    </div>
  );
};
