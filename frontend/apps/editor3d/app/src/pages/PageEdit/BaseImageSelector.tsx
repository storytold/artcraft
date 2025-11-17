import { faImage, faUpload, faImages } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { downloadFileFromUrl } from "libs/api/src/lib/LocalApi";
import { Button } from "@storyteller/ui-button";
import { GalleryModal, GalleryItem } from "@storyteller/ui-gallery-modal";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadImage } from "~/components/reusable/UploadModalMedia/uploadImage";
import { UploaderStates } from "~/enums";
import { MediaFilesApi } from "@storyteller/api";
import { TutorialModalButton } from "@storyteller/ui-tutorial-modal";

export interface BaseSelectorImage {
  url: string;
  mediaToken: string;

  // Link to the thumbnail *template* URL of the image
  // This is not a URL itself! It must be converted into a URL by replacing parameters.
  thumbnailUrlTemplate?: string;

  // Link to the full image URL of the full image asset
  fullImageUrl?: string;
}

export type BaseImageSelectorProps = {
  onImageSelect: (imageUrl: BaseSelectorImage) => void;
  showLoading?: boolean;
};

const MAX_GALLERY_SELECTIONS = 1;

export const BaseImageSelector = ({
  onImageSelect,
  showLoading = false,
}: BaseImageSelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleGalleryClick = () => setIsGalleryModalOpen(true);

  const handleGalleryClose = () => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleImageSelect = (mediaToken: string) => {
    // If already selected, deselect it
    // Else if not selected and under max limit, select it
    if (selectedGalleryImages.includes(mediaToken)) {
      setSelectedGalleryImages([]);
    } else {
      setSelectedGalleryImages([mediaToken]);
    }
  };

  const handleUseGalleryImages = (selectedItems: GalleryItem[]) => {
    // We only want one file
    if (selectedItems.length !== 1) {
      return;
    }
    const item = selectedItems[0];
    if (!item.fullImage) {
      return;
    }
    const referenceImage: BaseSelectorImage = {
      url: item.fullImage,
      mediaToken: item.id,
      thumbnailUrlTemplate: item.thumbnailUrlTemplate,
    };
    sendImageEvent(referenceImage);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setIsLoading(true);

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          uploadImage({
            title: `reference-image-${Math.random()
              .toString(36)
              .substring(2, 15)}`,
            assetFile: file,
            progressCallback: (newState) => {
              console.debug("Upload progress:", newState.data);
              if (newState.status === UploaderStates.success && newState.data) {
                const mediaToken = newState.data || "";
                // Attempt to resolve the CDN URL for the uploaded image token; fallback to data URL
                (async () => {
                  let finalUrl = reader.result as string;
                  let thumbnailUrlTemplate = undefined;
                  try {
                    const api = new MediaFilesApi();
                    const result = await api.GetMediaFileByToken({
                      mediaFileToken: mediaToken,
                    });
                    if (result.success && result.data) {
                      finalUrl =
                        result.data.media_links?.cdn_url ||
                        result.data.public_bucket_url ||
                        finalUrl;
                      // NB(bt,2025-10-09): I think `thumbnail_template` is wrong and that
                      // `maybe_thumbnail_template` is the correct API field, but upstream
                      // seems to imply otherwise. Let's simply check both keys for now.
                      thumbnailUrlTemplate =
                        result.data.media_links?.thumbnail_template ||
                        (result.data.media_links as any)
                          ?.maybe_thumbnail_template;
                    }
                  } catch (e) {
                    console.warn(
                      "Falling back to data URL for uploaded image",
                      e,
                    );
                  }

                  const referenceImage: BaseSelectorImage = {
                    mediaToken,
                    url: finalUrl,
                    fullImageUrl: finalUrl,
                    thumbnailUrlTemplate: thumbnailUrlTemplate,
                  };

                  toast.success("Image uploaded successfully!");
                  sendImageEvent(referenceImage);
                  setIsLoading(false);
                })();
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                toast.error("Upload failed. Please try again.");
                setIsLoading(false);
              }
            },
          });
        };

        reader.readAsDataURL(file);
      });
    }
  };

  const sendImageEvent = (image: BaseSelectorImage) => {
    handleGalleryClose();
    onImageSelect(image);
  };

  return (
    <>
      <div className="relative flex h-full flex-col items-center justify-center gap-8 overflow-hidden">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
          multiple
        />
        {isLoading || showLoading ? (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <span className="text-base-fg">Uploading image...</span>
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-blue-400/30 bg-blue-500/40 shadow-xl backdrop-blur-sm">
                  <FontAwesomeIcon
                    icon={faImage}
                    className="text-5xl text-white drop-shadow-lg"
                  />
                </div>
              </div>
              <div className="space-y-3 text-center">
                <h3 className="text-4xl font-bold tracking-tight text-base-fg">
                  Edit Image
                </h3>
                <p className="max-w-md text-base leading-relaxed text-base-fg/70">
                  Click to upload or drag and drop an image here to edit
                </p>
              </div>
            </div>
            <div className="relative z-10 mt-4 flex gap-4">
              <Button
                variant="primary"
                icon={faUpload}
                onClick={handleUploadClick}
                className="px-8 py-3 text-base font-semibold shadow-lg"
              >
                Select Image
              </Button>
              <Button
                variant="action"
                icon={faImages}
                onClick={handleGalleryClick}
                className="border-2 px-8 py-3 text-base font-semibold"
              >
                Pick from Library
              </Button>
            </div>
          </>
        )}
      </div>
      <div className="fixed bottom-6 right-6 z-20 flex items-center gap-2">
        <TutorialModalButton />
      </div>
      <GalleryModal
        isOpen={!!isGalleryModalOpen}
        onClose={handleGalleryClose}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={MAX_GALLERY_SELECTIONS}
        onUseSelected={handleUseGalleryImages}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );
};
