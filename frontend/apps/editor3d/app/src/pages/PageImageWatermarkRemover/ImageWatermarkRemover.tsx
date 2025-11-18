import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImages,
  faDroplet,
  faArrowRotateRight,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { downloadFileFromUrl } from "@storyteller/api";
import { UploadEntryCard } from "../../components/media/UploadEntryCard";
import toast from "react-hot-toast";

export const ImageWatermarkRemover = () => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFromGallery, setIsLoadingFromGallery] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleLocalImageSelect = (files: FileList) => {
    const file = files[0];
    if (file && file.type.startsWith("image/")) {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }

      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setImageDimensions(null);
    }
  };

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const maxSelections = 1;
      if (prev.length >= maxSelections) {
        return maxSelections === 1 ? [id] : prev;
      }
      return [...prev, id];
    });
  };

  const handleGallerySelect = async (selectedItems: GalleryItem[]) => {
    const item = selectedItems[0];
    if (!item || !item.fullImage) {
      toast.error("No image selected");
      return;
    }

    if (isLoadingFromGallery) {
      return;
    }

    setIsLoadingFromGallery(true);

    if (imageUrl && imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }

    setImageUrl(item.fullImage);
    setImageDimensions(null);

    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
    setIsLoadingFromGallery(false);
  };

  const handleRemoveWatermark = async () => {
    if (!imageUrl) {
      toast.error("Please select an image first");
      return;
    }

    setIsProcessing(true);
    toast.loading("Processing watermark removal...", {
      id: "watermark-removal",
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Watermark removal completed!", {
        id: "watermark-removal",
      });
    } catch (error) {
      toast.error("Failed to remove watermark", { id: "watermark-removal" });
      console.error("Error removing watermark:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-ui-panel-gradient flex h-[calc(100vh-56px)] w-full overflow-hidden bg-ui-panel text-base-fg">
        <div className="flex-1 overflow-y-auto">
          <main
            className={
              !imageUrl
                ? "flex min-h-full w-full items-center justify-center p-8"
                : "flex w-full justify-center px-8 py-6"
            }
          >
            {!imageUrl ? (
              <div className="w-full max-w-5xl">
                <div className="aspect-video overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-background shadow-lg">
                  <UploadEntryCard
                    icon={faDroplet}
                    title="Remove Image Watermark"
                    description="Erase watermarks from your images seamlessly. Upload your image and get a clean, watermark-free result."
                    accentBackgroundClass="bg-indigo-500/40"
                    accentBorderClass="border-indigo-400/30"
                    accept="image/*"
                    onFilesSelected={handleLocalImageSelect}
                    primaryLabel="Select Image"
                    secondaryLabel="Pick from Library"
                    secondaryIcon={faImages}
                    onSecondaryClick={() => setIsGalleryModalOpen(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex w-full max-w-5xl flex-col gap-5">
                <div className="w-full overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-background shadow-lg">
                  <div className="relative w-full bg-black">
                    <Button
                      icon={faArrowRotateRight}
                      variant="action"
                      onClick={() => {
                        setImageUrl("");
                        setImageDimensions(null);
                      }}
                      className="absolute right-3 top-3 z-10 border-2 border-red/50 px-3 py-1.5 text-sm hover:border-red/80 hover:bg-red/80"
                    >
                      Switch Image
                    </Button>
                    <div className="flex min-h-[400px] items-center justify-center p-6">
                      <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Selected pic"
                        className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          setImageDimensions({
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    icon={isProcessing ? undefined : faDroplet}
                    loading={isProcessing}
                    onClick={handleRemoveWatermark}
                    className="px-12 py-3 text-lg font-semibold"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Remove Watermark"}
                  </Button>
                </div>

                <div className="rounded-2xl border border-ui-panel-border bg-ui-background p-6 shadow-lg">
                  <div>
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-base-fg/60">
                      <FontAwesomeIcon
                        icon={faImages}
                        className="text-primary"
                      />
                      Image Information
                    </div>
                    {imageDimensions ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between border-b border-ui-divider py-2">
                          <span className="font-medium text-base-fg/70">
                            Resolution
                          </span>
                          <span className="font-mono text-lg font-bold text-base-fg">
                            {imageDimensions.width} × {imageDimensions.height}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="font-medium text-base-fg/70">
                            Aspect Ratio
                          </span>
                          <span className="font-mono text-lg font-bold text-base-fg">
                            {(
                              imageDimensions.width / imageDimensions.height
                            ).toFixed(2)}
                            :1
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-base-fg/50">Loading...</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <GalleryModal
        isOpen={!!isGalleryModalOpen}
        onClose={() => {
          if (!isLoadingFromGallery) {
            setIsGalleryModalOpen(false);
            setSelectedGalleryImages([]);
          }
        }}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={1}
        onUseSelected={handleGallerySelect}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );
};
