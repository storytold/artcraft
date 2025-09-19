import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";
import { useCreate3dModalStore } from "./create-3d-modal-store";
import { useState, useCallback, useEffect, useRef } from "react";
import { GalleryModal, GalleryItem } from "@storyteller/ui-gallery-modal";
import { ImageInput, ImageFile } from "@storyteller/ui-image-input";
import { faCube } from "@fortawesome/pro-solid-svg-icons";
import { MediaUploadApi } from "@storyteller/api";
import {
  EnqueueImageTo3dObject,
  EnqueueImageTo3dObjectModel,
} from "@storyteller/tauri-api";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";

enum GenerationAction {
  ImageTo3d = "image_to_3d",
}

interface Create3dModalProps {
  onModelComplete?: (mediaToken: string) => void;
}

export const Create3dModal = ({ onModelComplete }: Create3dModalProps = {}) => {
  const { isOpen, close } = useCreate3dModalStore();
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    []
  );
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);

  // Store active toast IDs for 3D model generation
  const activeToastIds = useRef<Record<string, string>>({});

  // Listen for generation complete events
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen("generation-complete-event", (event: any) => {
        console.log("[DEBUG] Generation complete event received:", event);

        // Check if this is an ImageTo3d completion event
        const eventData = event.payload?.data;

        console.log("[DEBUG] eventData:", eventData);
        console.log("[DEBUG] Current activeToastIds:", {...activeToastIds.current});

        if (eventData?.action === GenerationAction.ImageTo3d) {
          console.log("[DEBUG] This is an ImageTo3d completion event");
          
          // Find any active toasts for 3D model generation and update them
          const entries = Object.entries(activeToastIds.current);
          console.log("[DEBUG] Processing", entries.length, "active toast entries");
          
          entries.forEach(
            ([mediaToken, toastId]) => {
              console.log("[DEBUG] Processing toast for mediaToken:", mediaToken);
              
              // Dismiss the loading toast
              toast.dismiss(toastId);
              console.log("[DEBUG] Toast dismissed");

              // Call the callback if provided
              if (onModelComplete) {
                console.log("[DEBUG] Calling onModelComplete with mediaToken:", mediaToken);
                onModelComplete(mediaToken);
              } else {
                console.log("[DEBUG] onModelComplete callback is not provided");
              }

              // Remove from active toasts
              delete activeToastIds.current[mediaToken];
              console.log("[DEBUG] Removed mediaToken from activeToastIds");
            }
          );
        } else {
          console.log("[DEBUG] Not an ImageTo3d event, action:", eventData?.action);
        }
      });

      if (isUnmounted) {
        unlisten.then((f) => f()); // Unsubscribe if unmounted early.
      }
    };

    setup();

    return () => {
      isUnmounted = true;
      if (unlisten) {
        unlisten.then((f) => f());
      }
    };
  }, []);

  const handleOpenGallery = () => {
    setIsGalleryModalOpen(true);
  };

  const handleGalleryClose = () => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) {
        return prev.filter((imageId) => imageId !== id);
      }
      // Only allow single selection for 3D model creation
      return [id];
    });
  };

  const handleGalleryImages = (selectedItems: GalleryItem[]) => {
    if (selectedItems && selectedItems.length > 0) {
      const item = selectedItems[0];
      if (!item.fullImage) return;

      const newImage: ImageFile = {
        id: item.id,
        url: item.fullImage,
        file: new File([], "gallery-image"),
        mediaToken: item.id,
      };
      setSelectedImage(newImage);
    }
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  // Process image for 3D model creation
  const processImageFor3D = useCallback(async (imageToProcess: ImageFile) => {
    let mediaToken = imageToProcess.mediaToken;
    let toastId: string;

    try {
      // toast that won't disappear until we manually dismiss it
      toastId = toast.loading("Generating 3D model...", {
        duration: 300000, // max five minutes
      });

      // If the image is from a local file and doesn't have a media token yet, upload it first
      if (!mediaToken && imageToProcess.file) {
        const mediaUploadApi = new MediaUploadApi();
        const uuid = uuidv4();

        const uploadResult = await mediaUploadApi.UploadImage({
          blob: imageToProcess.file,
          fileName: imageToProcess.file.name,
          uuid: uuid,
        });

        if (!uploadResult.success || !uploadResult.data) {
          throw new Error("Failed to upload image");
        }

        mediaToken = uploadResult.data;
      }

      if (!mediaToken) {
        throw new Error("No media token available");
      }

      // Update toast message to show progress
      toast.loading("Uploading and preparing image...", { id: toastId });

      // Enqueue the image for 3D model creation using the Hunyuan 3D 2 model
      const result = await EnqueueImageTo3dObject({
        image_media_token: mediaToken,
        model: EnqueueImageTo3dObjectModel.Hunyuan3d2,
      });

      if ("error_type" in result) {
        throw new Error(result.error_message || result.error_type);
      }

      toast.loading("Generating 3D model...", {
        id: toastId,
      });

      // Store the toast ID with the media token so we can update it when generation completes
      if (mediaToken) {
        activeToastIds.current[mediaToken] = toastId;
      }

      return true;
    } catch (error) {
      // Handle errors
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(`Failed to create 3D model: ${errorMessage}`, {
        id: toastId!, // Use the non-null assertion as we know toastId is defined
        duration: 5000,
      });
      return false;
    }
  }, []);

  const handleCreate3DModel = () => {
    if (!selectedImage) return;

    // Store the selected image information before closing the modal
    const imageToProcess = selectedImage;

    // Clear the image field after starting the process
    setSelectedImage(null);

    // Close the modal immediately
    close();

    // Start the processing in the background
    processImageFor3D(imageToProcess);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={close}
        className={twMerge("max-w-xl duration-200")}
        backdropClassName={twMerge("duration-200")}
        childPadding={true}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2.5 py-0.5">
            <h2 className="text-[18px] font-semibold">
              Create 3D Model from Image
            </h2>
          </div>

          <div className="flex-grow space-y-6 py-4">
            <div className="text-center">
              {/* Image Input Component */}
              <ImageInput
                value={selectedImage}
                onChange={setSelectedImage}
                onGalleryOpen={handleOpenGallery}
                placeholderText="Drag and drop an image here"
                className="mb-2"
              />
            </div>
          </div>

          <Button
            disabled={!selectedImage}
            onClick={handleCreate3DModel}
            className="w-full"
            icon={faCube}
          >
            Create 3D Model
          </Button>
        </div>
      </Modal>

      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={handleGalleryClose}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={1}
        forceFilter="image"
        onUseSelected={handleGalleryImages}
      />
    </>
  );
};

export default Create3dModal;
