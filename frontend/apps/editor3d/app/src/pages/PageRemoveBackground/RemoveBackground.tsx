import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";

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
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isHoldingCompare, setIsHoldingCompare] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(true);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clipLayerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const revealProgressRef = useRef(100);
  const animationFrameRef = useRef<number | null>(null);
  const processingExternalUrlRef = useRef<string | null>(null);

  const store = useRemoveBackgroundStore();
  const {
    images,
    activeImageId,
    isProcessing,
    currentOriginalUrl,
    pendingJobId,
    imageDimensions,
    pendingExternalUrl,
    setIsProcessing,
    setCurrentOriginalUrl,
    setPendingJobId,
    setImageDimensions,
    setPendingExternalUrl,
    addImage,
    setActiveImage,
    getActiveImage,
  } = store;

  const activeImage = getActiveImage();

  const pendingJobIdRef = useRef(pendingJobId);
  const currentOriginalUrlRef = useRef(currentOriginalUrl);

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

  useEffect(() => {
    const processExternalUrl = async () => {
      if (!pendingExternalUrl) return;
      if (processingExternalUrlRef.current === pendingExternalUrl) return;

      processingExternalUrlRef.current = pendingExternalUrl;
      const imageUrl = pendingExternalUrl;
      setPendingExternalUrl(null);
      setIsLoadingImage(true);

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "external-image.png", {
          type: blob.type,
        });
        const base64Image = await convertFileToBase64(file);

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

        setActiveImage(null);
        setCurrentOriginalUrl(imageUrl);
        setIsLoadingImage(false);
        setIsProcessing(true);

        const jobId = uuidv4();
        setPendingJobId(jobId);

        await EnqueueImageBgRemoval({
          base64_image: base64Image,
          frontend_caller: "mini_app",
          frontend_subscriber_id: jobId,
        });
      } catch (error) {
        console.error("Error processing external image:", error);
        toast.error("Failed to process image");
        setIsLoadingImage(false);
        setIsProcessing(false);
        setPendingJobId(null);
      } finally {
        processingExternalUrlRef.current = null;
      }
    };

    processExternalUrl();
  }, [
    pendingExternalUrl,
    setPendingExternalUrl,
    setActiveImage,
    setCurrentOriginalUrl,
    setIsProcessing,
    setPendingJobId,
    setImageDimensions,
  ]);

  const addMenuItems: PopoverItem[] = useMemo(
    () => [
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
    ],
    [],
  );

  const handleAddMenuSelect = useCallback((item: PopoverItem) => {
    if (item.action === "upload") {
      fileInputRef.current?.click();
    } else if (item.action === "library") {
      setIsGalleryModalOpen(true);
    }
  }, []);

  const startRevealAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    revealProgressRef.current = 0;
    setAnimationComplete(false);

    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const progressPercent = eased * 100;

      revealProgressRef.current = progressPercent;

      if (clipLayerRef.current) {
        clipLayerRef.current.style.clipPath = `inset(0 0 0 ${progressPercent}%)`;
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.left = `${progressPercent}%`;
        progressBarRef.current.style.display =
          progressPercent < 100 ? "block" : "none";
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setAnimationComplete(true);
        animationFrameRef.current = null;
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          animationFrameRef.current = requestAnimationFrame(animate);
        }, 50);
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useCanvasBgRemovedEvent(async (event) => {
    if (event.maybe_frontend_subscriber_id !== pendingJobIdRef.current) return;

    const newImage: ProcessedImage = {
      id: uuidv4(),
      originalUrl: currentOriginalUrlRef.current,
      processedUrl: event.image_cdn_url,
      timestamp: Date.now(),
    };

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        img.src = src;
      });
    };

    try {
      const [originalImg] = await Promise.all([
        loadImage(currentOriginalUrlRef.current),
        loadImage(event.image_cdn_url),
      ]);

      addImage(newImage);
      setIsProcessing(false);
      setPendingJobId(null);
      toast.success("Saved to Library");

      setImageDimensions({
        width: originalImg.naturalWidth,
        height: originalImg.naturalHeight,
      });

      startRevealAnimation();
    } catch (error) {
      console.error("Error loading images:", error);
      addImage(newImage);
      setIsProcessing(false);
      setPendingJobId(null);
      toast.success("Saved to Library");
    }
  });

  const resetAnimationState = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    revealProgressRef.current = 0;
    setAnimationComplete(true);
    setIsHoldingCompare(false);
  }, []);

  const handleLocalImageSelect = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file || !file.type.startsWith("image/")) return;

      setIsLoadingImage(true);

      try {
        const base64Image = await convertFileToBase64(file);
        const objectUrl = URL.createObjectURL(file);

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

        setActiveImage(null);
        resetAnimationState();
        setCurrentOriginalUrl(objectUrl);
        setIsLoadingImage(false);
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
        setIsLoadingImage(false);
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

  const handleImageSelect = useCallback((id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [id];
    });
  }, []);

  const handleGallerySelect = useCallback(
    async (selectedItems: GalleryItem[]) => {
      const item = selectedItems[0];
      if (!item || !item.fullImage) {
        toast.error("No image selected");
        return;
      }

      const imageUrl = item.fullImage;
      setIsGalleryModalOpen(false);
      setSelectedGalleryImages([]);
      setIsLoadingImage(true);

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "library-image.png", { type: blob.type });

        const base64Image = await convertFileToBase64(file);

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

        setActiveImage(null);
        resetAnimationState();
        setCurrentOriginalUrl(imageUrl);
        setIsLoadingImage(false);
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
        setIsLoadingImage(false);
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

  const handleDownload = useCallback(async () => {
    const currentActiveImage = getActiveImage();
    if (!currentActiveImage) {
      toast.error("No image to download");
      return;
    }
    try {
      await downloadFileFromUrl(currentActiveImage.processedUrl);
      toast.success("Image saved to Downloads folder");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  }, [getActiveImage]);

  const handleCompareMouseDown = useCallback(() => {
    setIsHoldingCompare(true);
    if (clipLayerRef.current) {
      clipLayerRef.current.style.clipPath = "inset(0 0 0 0)";
    }
    if (progressBarRef.current) {
      progressBarRef.current.style.display = "none";
    }
  }, []);

  const handleCompareMouseUp = useCallback(() => {
    setIsHoldingCompare(false);
    if (clipLayerRef.current) {
      clipLayerRef.current.style.clipPath = `inset(0 0 0 ${revealProgressRef.current}%)`;
    }
    if (progressBarRef.current && revealProgressRef.current < 100) {
      progressBarRef.current.style.display = "block";
    }
  }, []);

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

  const handleThumbnailClick = useCallback(
    (img: ProcessedImage) => {
      setActiveImage(img.id);
      revealProgressRef.current = 100;
      setAnimationComplete(true);
      if (clipLayerRef.current) {
        clipLayerRef.current.style.clipPath = "inset(0 0 0 100%)";
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.display = "none";
      }
      const loadImg = new Image();
      loadImg.onload = () => {
        setImageDimensions({
          width: loadImg.naturalWidth,
          height: loadImg.naturalHeight,
        });
      };
      loadImg.src = img.originalUrl;
    },
    [setActiveImage, setImageDimensions],
  );

  const hasImages = images.length > 0;
  const showUploadScreen = !hasImages && !isProcessing;

  const imageContainerStyle = useMemo(() => {
    if (!imageDimensions) {
      return { width: "600px", height: "450px" };
    }

    const horizontalPadding = 128 + 32;
    const verticalPadding = 128 + 150;

    const availableWidth = windowSize.width - horizontalPadding;
    const availableHeight = windowSize.height - 56 - verticalPadding;

    const maxWidth = Math.min(availableWidth, 1400);
    const maxHeight = Math.max(availableHeight, 200);
    const imageAspect = imageDimensions.width / imageDimensions.height;

    let width = maxWidth;
    let height = width / imageAspect;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * imageAspect;
    }

    width = Math.max(width, 200);
    height = Math.max(height, 150);

    return { width: `${width}px`, height: `${height}px` };
  }, [imageDimensions, windowSize.width, windowSize.height]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleLocalImageSelect(e.target.files);
        e.target.value = "";
      }
    },
    [handleLocalImageSelect],
  );

  const handleOpenGallery = useCallback(() => {
    setIsGalleryModalOpen(true);
  }, []);

  const handleCloseGallery = useCallback(() => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  }, []);

  return (
    <>
      <div className="bg-ui-panel-gradient flex h-[calc(100vh-56px)] w-full overflow-hidden bg-ui-panel text-base-fg">
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-16">
          <main className="flex h-full w-full flex-col items-center justify-center">
            {showUploadScreen ? (
              <div className="w-full max-w-5xl">
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-background shadow-lg">
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
                    onSecondaryClick={handleOpenGallery}
                    disabled={isLoadingImage}
                  />
                  {isLoadingImage && (
                    <div className="bg-ui-panel/80 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                      <LoadingSpinner className="h-12 w-12" />
                    </div>
                  )}
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
                  style={imageContainerStyle}
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
                        ref={clipLayerRef}
                        className={twMerge(
                          "absolute inset-0",
                          animationComplete &&
                            "transition-[clip-path] duration-300",
                        )}
                        style={{
                          clipPath: `inset(0 0 0 ${revealProgressRef.current}%)`,
                        }}
                      >
                        <img
                          src={activeImage.originalUrl}
                          alt="Original"
                          className="absolute inset-0 h-full w-full object-contain"
                        />
                      </div>

                      <div
                        ref={progressBarRef}
                        className="absolute bottom-0 top-0 w-1 bg-primary-500 shadow-lg shadow-primary-500/50"
                        style={{
                          left: `${revealProgressRef.current}%`,
                          transform: "translateX(-50%)",
                          display:
                            animationComplete ||
                            revealProgressRef.current >= 100
                              ? "none"
                              : "block",
                        }}
                      />
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-ui-panel-border bg-ui-background p-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileInputChange}
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
                      onClick={() => handleThumbnailClick(img)}
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
        isOpen={isGalleryModalOpen}
        onClose={handleCloseGallery}
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
