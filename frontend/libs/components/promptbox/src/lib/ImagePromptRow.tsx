import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { downloadFileFromUrl } from "@storyteller/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImages,
  faPlus,
  faSpinnerThird,
  faTrashAlt,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { faImage } from "@fortawesome/pro-regular-svg-icons";
import { RefImage } from "./promptStore";
import { twMerge } from "tailwind-merge";
import { UploaderState, UploaderStates } from "@storyteller/common";

export type UploadImageFn = ({
  title,
  assetFile,
  progressCallback,
}: {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}) => Promise<void>;

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
  endFrameImage?: RefImage;
  setEndFrameImage?: (image?: RefImage) => void;
  allowUploadEnd?: boolean;
}

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
  endFrameImage,
  setEndFrameImage,
  allowUploadEnd,
}: ImagePromptRowProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<"start" | "end">("start");
  const [uploadTarget, setUploadTarget] = useState<"start" | "end">("start");
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    []
  );
  const [uploadingEnd, setUploadingEnd] = useState<{
    id: string;
    file: File;
  } | null>(null);

  const usedSlotsRender = useMemo(
    () =>
      Math.min(
        maxImagePromptCount,
        referenceImages.length + uploadingImages.length
      ),
    [maxImagePromptCount, referenceImages.length, uploadingImages.length]
  );
  const availableSlotsRender = useMemo(
    () =>
      Math.max(
        0,
        maxImagePromptCount - referenceImages.length - uploadingImages.length
      ),
    [maxImagePromptCount, referenceImages.length, uploadingImages.length]
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
                    prev.filter((img) => img.id !== uploadId)
                  );
                }
                if (uploadTarget === "end") {
                  setEndFrameImage?.(referenceImage);
                } else {
                  setReferenceImages([...referenceImages, referenceImage]);
                }
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                if (uploadTarget === "end") {
                  setUploadingEnd(null);
                } else {
                  setUploadingImages((prev) =>
                    prev.filter((img) => img.id !== uploadId)
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
              prev.filter((img) => img.id !== uploadId)
            );
          }
          if (uploadTarget === "end") {
            setEndFrameImage?.(referenceImage);
          } else {
            setReferenceImages([...referenceImages, referenceImage]);
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
      if (prev.length >= Math.max(1, maxImagePromptCount)) return prev;
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
      maxImagePromptCount - referenceImages.length
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
      <div
        className={twMerge(
          "absolute -top-[72px] left-0 glass w-[730px] rounded-t-xl flex",
          className
        )}
      >
        <div
          className={twMerge(
            "grow grid py-2 px-3 grid-cols-1",
            isVideo && "grid-cols-2 gap-5"
          )}
        >
          <div className="flex gap-2">
            <div className="flex flex-col grow gap-1">
              <div className="flex items-center gap-2 opacity-90">
                <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
                <span className="text-sm text-white font-medium flex items-center gap-1.5">
                  {isVideo ? "Starting Frame" : "Image Prompts"}
                  {!isVideo && (
                    <span className="text-white/60 font-semibold">
                      ({usedSlotsRender}/{maxImagePromptCount})
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[13px] text-white/60">
                {isVideo ? "Animate an image" : "Use the elements of an image"}
              </span>
            </div>

            <div className="flex gap-2">
              {referenceImages
                .slice(0, Math.max(0, maxImagePromptCount))
                .map((image) => (
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveReference(image.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 hover:bg-red/70 text-white backdrop-blur-md transition-colors hover:bg-black cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              {uploadingImages
                .slice(
                  0,
                  Math.max(0, maxImagePromptCount - referenceImages.length)
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
                  className="bg-[#46464B] p-2 -mb-0.5"
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
                        className="w-full bg-[#686870] hover:bg-[#78787F]"
                      >
                        Pick from library
                      </Button>
                    </div>
                  }
                >
                  <Button
                    variant="action"
                    className="bg-white/10 hover:bg-white/20 aspect-square w-full overflow-hidden rounded-lg w-14 border-dashed border-2 border-white/30 hover:border-white/50 transition-all"
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
                      className="text-2xl opacity-80"
                    />
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
          {isVideo && (
            <div className="flex gap-2">
              <div className="flex flex-col grow gap-1">
                <div className="flex items-center gap-2 opacity-90">
                  <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
                  <span className="text-sm text-white font-medium flex items-center gap-1.5">
                    Ending Frame
                  </span>
                </div>
                <span className="text-[13px] text-white/60">
                  Optional end frame
                </span>
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
                      <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
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
                    className="bg-[#46464B] p-2 -mb-0.5"
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
                          className="w-full bg-[#686870] hover:bg-[#78787F]"
                        >
                          Pick from library
                        </Button>
                      </div>
                    }
                  >
                    <Button
                      variant="action"
                      className="bg-white/10 hover:bg-white/20 aspect-square w-full overflow-hidden rounded-lg w-14 border-dashed border-2 border-white/30 hover:border-white/50 transition-all"
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
                        className="text-2xl opacity-80"
                      />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="col-span-2 flex items-center">
          <div className="flex items-center gap-2 w-[1px] h-full bg-white/10 rounded-lg" />
          <div className="p-2">
            <Button
              variant="action"
              icon={faTrashAlt}
              className="h-8 w-3 bg-[#5F5F68]/60 hover:bg-[#5F5F68]/90"
              onClick={() => setReferenceImages([])}
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
