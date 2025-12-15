import { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles,
  faImages,
  faPlus,
  faEye,
  faDownload,
  faUpload,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { downloadFileFromUrl } from "@storyteller/api";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { UploadEntryCard } from "../../components/media/UploadEntryCard";
import {
  useRemoveBackgroundStore,
  ProcessedImage,
} from "./RemoveBackgroundStore";
import {
  EnqueueImageBgRemoval,
  useCanvasBgRemovedEvent,
} from "@storyteller/tauri-api";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { twMerge } from "tailwind-merge";

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("Failed to convert file to base64."));
      }
    };
    reader.onerror = () => reject(new Error("Error reading file."));
    reader.readAsDataURL(file);
  });
};

export const RemoveBackground = () => {
  // Local UI state (not persisted)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all persisted state from store
  const store = useRemoveBackgroundStore();
  const {
    images,
    activeImageId,
    isProcessing,
    currentOriginalUrl,
    pendingJobId,
    revealProgress,
    isAnimating,
    isHoldingCompare,
    imageDimensions,
    setIsProcessing,
    setCurrentOriginalUrl,
    setPendingJobId,
    setRevealProgress,
    setIsAnimating,
    setIsHoldingCompare,
    setImageDimensions,
    resetAnimationState,
    addImage,
    setActiveImage,
    getActiveImage,
  } = store;

  const activeImage = getActiveImage();

  // Keep a ref for the event handler (to avoid stale closures)
  const pendingJobIdRef = useRef(pendingJobId);
  const currentOriginalUrlRef = useRef(currentOriginalUrl);

  // Sync refs with store state
  useEffect(() => {
    pendingJobIdRef.current = pendingJobId;
  }, [pendingJobId]);

  useEffect(() => {
    currentOriginalUrlRef.current = currentOriginalUrl;
  }, [currentOriginalUrl]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const addMenuItems: PopoverItem[] = [
    {
      label: "Upload Image",
      selected: false,
      icon: <FontAwesomeIcon icon={faUpload} className="h-4 w-4" />,
      action: "upload",
    },
    {
      label: "Choose from Library",
      selected: false,
      icon: <FontAwesomeIcon icon={faImages} className="h-4 w-4" />,
      action: "library",
    },
  ];

  const handleAddMenuSelect = (item: PopoverItem) => {
    if (item.action === "upload") {
      fileInputRef.current?.click();
    } else if (item.action === "library") {
      setIsGalleryModalOpen(true);
    }
  };

  useCanvasBgRemovedEvent(async (event) => {
    if (event.maybe_frontend_subscriber_id !== pendingJobIdRef.current) return;

    const newImage: ProcessedImage = {
      id: uuidv4(),
      originalUrl: currentOriginalUrlRef.current,
      processedUrl: event.image_cdn_url,
      timestamp: Date.now(),
    };

    // Wait for BOTH the original and processed images to load before showing result
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        img.src = src;
      });
    };

    try {
      // Load both images in parallel
      const [originalImg] = await Promise.all([
        loadImage(currentOriginalUrlRef.current),
        loadImage(event.image_cdn_url),
      ]);

      // Both images loaded - now show the result
      addImage(newImage);
      setIsProcessing(false);
      setPendingJobId(null);

      setImageDimensions({
        width: originalImg.naturalWidth,
        height: originalImg.naturalHeight,
      });

      setRevealProgress(0);

      // Wait for React to re-render and browser to paint before starting animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            setIsAnimating(true);
          }, 50);
        });
      });
    } catch (error) {
      console.error("Error loading images:", error);
      // Still show result even if image load fails
      addImage(newImage);
      setIsProcessing(false);
      setPendingJobId(null);
    }
  });

  useEffect(() => {
    if (!isAnimating) return;

    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setRevealProgress(eased * 100);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimating, setRevealProgress, setIsAnimating]);

  const handleLocalImageSelect = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file || !file.type.startsWith("image/")) return;

      try {
        const base64Image = await convertFileToBase64(file);
        const objectUrl = URL.createObjectURL(file);

        // Wait for image to load before switching views
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            setImageDimensions({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
            resolve();
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = objectUrl;
        });

        // Clear previous active image so it doesn't show behind
        setActiveImage(null);

        // Reset animation state for new generation
        resetAnimationState();

        // Now switch to processing view
        setCurrentOriginalUrl(objectUrl);
        setIsProcessing(true);

        const jobId = uuidv4();
        setPendingJobId(jobId);

        await EnqueueImageBgRemoval({
          base64_image: base64Image,
          frontend_caller: "mini_app",
          frontend_subscriber_id: jobId,
        });
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
        setIsProcessing(false);
        setPendingJobId(null);
      }
    },
    [
      setActiveImage,
      resetAnimationState,
      setCurrentOriginalUrl,
      setIsProcessing,
      setPendingJobId,
      setImageDimensions,
    ],
  );

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [id];
    });
  };

  const handleGallerySelect = async (selectedItems: GalleryItem[]) => {
    const item = selectedItems[0];
    if (!item || !item.fullImage) {
      toast.error("No image selected");
      return;
    }

    const imageUrl = item.fullImage;
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "library-image.png", { type: blob.type });

      const base64Image = await convertFileToBase64(file);

      // Wait for image to load before switching views
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setImageDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
          resolve();
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      // Clear previous active image so it doesn't show behind
      setActiveImage(null);

      // Reset animation state for new generation
      resetAnimationState();

      // Now switch to processing view
      setCurrentOriginalUrl(imageUrl);
      setIsProcessing(true);

      const jobId = uuidv4();
      setPendingJobId(jobId);

      await EnqueueImageBgRemoval({
        base64_image: base64Image,
        frontend_caller: "mini_app",
        frontend_subscriber_id: jobId,
      });
    } catch (error) {
      console.error("Error processing gallery image:", error);
      toast.error("Failed to process image");
      setIsProcessing(false);
      setPendingJobId(null);
    }
  };

  const handleDownload = async () => {
    if (!activeImage) {
      toast.error("No image to download");
      return;
    }
    try {
      await downloadFileFromUrl(activeImage.processedUrl);
      toast.success("Image saved to Downloads folder");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  const handleCompareMouseDown = () => {
    setIsHoldingCompare(true);
  };

  const handleCompareMouseUp = useCallback(() => {
    setIsHoldingCompare(false);
  }, [setIsHoldingCompare]);

  useEffect(() => {
    if (isHoldingCompare) {
      document.addEventListener("mouseup", handleCompareMouseUp);
      document.addEventListener("mouseleave", handleCompareMouseUp);
    }
    return () => {
      document.removeEventListener("mouseup", handleCompareMouseUp);
      document.removeEventListener("mouseleave", handleCompareMouseUp);
    };
  }, [isHoldingCompare, handleCompareMouseUp]);

  const hasImages = images.length > 0;
  const showUploadScreen = !hasImages && !isProcessing;

  const getImageContainerStyle = () => {
    if (!imageDimensions) {
      return { width: "600px", height: "450px" };
    }

    // Account for padding (p-16 = 64px * 2 = 128px) and some margin
    const horizontalPadding = 128 + 32; // p-16 + extra margin
    const verticalPadding = 128 + 150; // p-16 + buttons + thumbnails + gaps

    const availableWidth = windowSize.width - horizontalPadding;
    const availableHeight = windowSize.height - 56 - verticalPadding; // 56px header

    const maxWidth = Math.min(availableWidth, 1400);
    const maxHeight = Math.max(availableHeight, 200);
    const imageAspect = imageDimensions.width / imageDimensions.height;

    let width = maxWidth;
    let height = width / imageAspect;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * imageAspect;
    }

    // Ensure minimum dimensions
    width = Math.max(width, 200);
    height = Math.max(height, 150);

    return { width: `${width}px`, height: `${height}px` };
  };

  return (
    <>
      <div className="bg-ui-panel-gradient flex h-[calc(100vh-56px)] w-full overflow-hidden bg-ui-panel text-base-fg">
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-16">
          <main className="flex h-full w-full flex-col items-center justify-center">
            {showUploadScreen ? (
              <div className="w-full max-w-5xl">
                <div className="aspect-video overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-background shadow-lg">
                  <UploadEntryCard
                    icon={faWandMagicSparkles}
                    title="Remove Background"
                    description="Instantly remove backgrounds from your images with AI-powered precision."
                    accentBackgroundClass="bg-violet-500/40"
                    accentBorderClass="border-violet-400/30"
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
              <div className="flex h-full w-full max-w-[1400px] flex-col items-center gap-4">
                {(activeImage || isProcessing) && (
                  <div className="flex gap-3">
                    <Button
                      variant="action"
                      icon={faEye}
                      onMouseDown={handleCompareMouseDown}
                      disabled={!activeImage || isProcessing}
                      className={twMerge(
                        "border-ui-controls-border select-none border-2 px-6 py-2.5 text-sm font-semibold transition-all",
                        isHoldingCompare
                          ? "border-primary bg-primary/20"
                          : "border-ui-controls-border",
                        (!activeImage || isProcessing) &&
                          "cursor-not-allowed opacity-50",
                      )}
                    >
                      {isHoldingCompare
                        ? "Showing Original"
                        : "Hold to Compare"}
                    </Button>
                    <Button
                      variant="primary"
                      icon={faDownload}
                      onClick={handleDownload}
                      disabled={!activeImage || isProcessing}
                      className={twMerge(
                        "select-none border-2 border-primary px-6 py-2.5 text-sm font-semibold transition-all",
                        (!activeImage || isProcessing) &&
                          "cursor-not-allowed opacity-50",
                      )}
                    >
                      Download
                    </Button>
                  </div>
                )}

                <div
                  className="relative overflow-hidden rounded-2xl border border-ui-panel-border shadow-xl"
                  style={getImageContainerStyle()}
                >
                  {isProcessing && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                      {currentOriginalUrl && (
                        <img
                          src={currentOriginalUrl}
                          alt="Processing"
                          className="absolute inset-0 h-full w-full object-contain opacity-30"
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary-500/30 border-t-primary-500" />
                          <FontAwesomeIcon
                            icon={faWandMagicSparkles}
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-primary-400"
                          />
                        </div>
                        <span className="text-lg font-semibold text-white">
                          Removing Background...
                        </span>
                      </div>
                    </div>
                  )}
                  {activeImage && (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `
                            linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
                            linear-gradient(-45deg, #1a1a1a 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #1a1a1a 75%),
                            linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)
                          `,
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                          backgroundColor: "#2a2a2a",
                        }}
                      />

                      <img
                        src={activeImage.processedUrl}
                        alt="Background Removed"
                        className="absolute inset-0 h-full w-full object-contain"
                      />

                      <div
                        className="absolute inset-0 transition-all duration-300"
                        style={{
                          clipPath: isHoldingCompare
                            ? "inset(0 0 0 0)"
                            : `inset(0 0 0 ${revealProgress}%)`,
                        }}
                      >
                        <img
                          src={activeImage.originalUrl}
                          alt="Original"
                          className="absolute inset-0 h-full w-full object-contain"
                        />
                      </div>

                      {!isHoldingCompare && revealProgress < 100 && (
                        <div
                          className="absolute bottom-0 top-0 w-1 bg-primary-500 shadow-lg shadow-primary-500/50"
                          style={{
                            left: `${revealProgress}%`,
                            transform: "translateX(-50%)",
                          }}
                        />
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-ui-panel-border bg-ui-background p-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleLocalImageSelect(e.target.files);
                        e.target.value = "";
                      }
                    }}
                  />

                  <PopoverMenu
                    items={addMenuItems}
                    onSelect={handleAddMenuSelect}
                    mode="button"
                    position="top"
                    showIconsInList
                    buttonClassName={twMerge(
                      "h-14 w-14 border-2 border-dashed border-ui-panel-border bg-ui-controls/50",
                      isProcessing && "cursor-not-allowed opacity-50",
                    )}
                    triggerIcon={
                      <FontAwesomeIcon icon={faPlus} className="text-xl" />
                    }
                  />

                  {images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        setActiveImage(img.id);
                        setRevealProgress(100);
                        const loadImg = new Image();
                        loadImg.onload = () => {
                          setImageDimensions({
                            width: loadImg.naturalWidth,
                            height: loadImg.naturalHeight,
                          });
                        };
                        loadImg.src = img.originalUrl;
                      }}
                      className={twMerge(
                        "relative h-14 w-14 overflow-hidden rounded-lg border-2 transition-all",
                        img.id === activeImageId
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-primary/50",
                      )}
                    >
                      <img
                        src={img.processedUrl}
                        alt="Processed"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <GalleryModal
        isOpen={!!isGalleryModalOpen}
        onClose={() => {
          setIsGalleryModalOpen(false);
          setSelectedGalleryImages([]);
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
