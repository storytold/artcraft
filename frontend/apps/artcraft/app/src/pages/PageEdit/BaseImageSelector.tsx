import { faImages, faPencil } from "@fortawesome/pro-solid-svg-icons";
import { downloadFileFromUrl } from "libs/api/src/lib/LocalApi";
import { GalleryModal, GalleryItem } from "@storyteller/ui-gallery-modal";
import { useState } from "react";
import toast from "react-hot-toast";
import { uploadImage } from "~/components/reusable/UploadModalMedia/uploadImage";
import { UploaderStates } from "~/enums";
import { MediaFilesApi } from "@storyteller/api";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import { UploadEntryCard } from "~/components/media/UploadEntryCard";

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
    setSelectedGalleryImages((prev) => {
      if (prev.includes(mediaToken))
        return prev.filter((x) => x !== mediaToken);
      const maxSelections = 1;
      if (prev.length >= maxSelections) {
        return maxSelections === 1 ? [mediaToken] : prev;
      }
      return [...prev, mediaToken];
    });
  };

  const handleUseGalleryImages = (selectedItems: GalleryItem[]) => {
    const item = selectedItems[0];
    if (!item || !item.fullImage) {
      toast.error("No image selected");
      return;
    }

    const referenceImage: BaseSelectorImage = {
      url: item.fullImage,
      mediaToken: item.id,
      thumbnailUrlTemplate: item.thumbnailUrlTemplate,
    };
    sendImageEvent(referenceImage);
  };

  const handleFileUpload = (files: FileList) => {
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
                    const mediaLinks = result.data.media_links as
                      | {
                          thumbnail_template?: string;
                          maybe_thumbnail_template?: string;
                        }
                      | undefined;
                    thumbnailUrlTemplate =
                      mediaLinks?.thumbnail_template ||
                      mediaLinks?.maybe_thumbnail_template;
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
  };

  const sendImageEvent = (image: BaseSelectorImage) => {
    handleGalleryClose();
    onImageSelect(image);
  };

  return (
    <>
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-ui-panel text-base-fg">
        <div className="aspect-video w-full max-w-5xl bg-ui-background">
          <UploadEntryCard
            icon={faPencil}
            title="Edit Image"
            description="Click to upload or drag and drop an image here to edit"
            accentBackgroundClass="bg-blue-500/40"
            accentBorderClass="border-blue-400/30"
            accept="image/*"
            multiple
            onFilesSelected={handleFileUpload}
            primaryLabel="Select Image"
            secondaryLabel="Pick from Library"
            secondaryIcon={faImages}
            onSecondaryClick={handleGalleryClick}
            disabled={isLoading || showLoading}
          />
        </div>
      </div>
      <div className="fixed bottom-6 right-6 z-20 flex items-center gap-2">
        <HelpMenuButton />
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
