import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImages,
  faDownload,
  faCrosshairs,
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/pro-solid-svg-icons";
import { Button, GenerateButton } from "@storyteller/ui-button";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { MediaUploadApi, MediaFilesApi, downloadFileFromUrl } from "@storyteller/api";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

import { UploadEntryCard } from "../../components/media/UploadEntryCard";
import {
  useAnglesStore,
  ROTATION_VALUES,
  TILT_VALUES,
  ZOOM_VALUES,
  rotationToDisplay,
  displayToRotation,
  DISPLAY_ROTATION_VALUES,
} from "./AnglesStore";
import { OrbitSphere, snapToNearest } from "./OrbitSphere";
import { twMerge } from "tailwind-merge";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { SliderV2 } from "@storyteller/ui-sliderv2";
// import { Switch } from "@headlessui/react";
import { EnqueueEditImage } from "@storyteller/tauri-api";
import {
  ClassyModelSelector,
  ANGLES_PAGE_MODEL_LIST,
  ModelPage,
  useSelectedModel,
  useSelectedProviderForModel,
} from "@storyteller/ui-model-selector";
import {
  CostCalculatorButton,
  useCostBreakdownModalStore,
} from "@storyteller/ui-pricing-modal";
import { HelpMenuButton } from "@storyteller/ui-help-menu";
import { HistoryStack, type ImageBundle, type BaseSelectorImage } from "@storyteller/ui-pagedraw";

const ANGLES_MODEL_PAGE = ModelPage.Angles;

// ─── Main Angles Component ─────────────────────────────────────────────────────

export const Angles = () => {
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Model selector
  const selectedModel = useSelectedModel(ANGLES_MODEL_PAGE);
  const selectedProvider = useSelectedProviderForModel(
    ANGLES_MODEL_PAGE,
    selectedModel?.id,
  );

  // Cost estimation
  const anglesCredits = useCostBreakdownModalStore(
    (s) => s.estimatedCreditsByPage[ANGLES_MODEL_PAGE],
  );

  // State selectors (only re-render when specific values change)
  const sourceImageUrl = useAnglesStore((s) => s.sourceImageUrl);
  const sourceMediaToken = useAnglesStore((s) => s.sourceMediaToken);
  const sourceThumbnailUrlTemplate = useAnglesStore((s) => s.sourceThumbnailUrlTemplate);
  const imageDimensions = useAnglesStore((s) => s.imageDimensions);
  const angleConfig = useAnglesStore((s) => s.angleConfig);
  // const generateFromBestAngles = useAnglesStore(
  //   (s) => s.generateFromBestAngles,
  // );
  const generatedAngles = useAnglesStore((s) => s.generatedAngles);
  const activeAngleId = useAnglesStore((s) => s.activeAngleId);
  const isProcessing = useAnglesStore((s) => s.isProcessing);
  const isLoadingImage = useAnglesStore((s) => s.isLoadingImage);

  // Actions (stable references — never cause re-renders)
  const setSourceImage = useAnglesStore((s) => s.setSourceImage);
  const setImageDimensions = useAnglesStore((s) => s.setImageDimensions);
  const setRotation = useAnglesStore((s) => s.setRotation);
  const setTilt = useAnglesStore((s) => s.setTilt);
  const setZoom = useAnglesStore((s) => s.setZoom);
  // const setGenerateFromBestAngles = useAnglesStore(
  //   (s) => s.setGenerateFromBestAngles,
  // );
  const setActiveAngle = useAnglesStore((s) => s.setActiveAngle);
  const setIsLoadingImage = useAnglesStore((s) => s.setIsLoadingImage);
  const resetSource = useAnglesStore((s) => s.resetSource);

  // Currently displayed image (active generated angle, or source)
  const activeAngle = useMemo(
    () => generatedAngles.find((a) => a.id === activeAngleId) ?? null,
    [generatedAngles, activeAngleId],
  );

  // The token of whatever is currently selected (for HistoryStack highlight)
  const selectedImageToken = activeAngleId ?? sourceMediaToken ?? undefined;

  // Event listener is at module level in AnglesStore.ts — persists across navigations.

  // Derive history bundles from store (no local state needed)
  const historyBundles = useMemo<ImageBundle[]>(
    () =>
      generatedAngles.map((angle) => ({
        images: [
          {
            url: angle.imageUrl,
            mediaToken: angle.id,
            thumbnailUrlTemplate: angle.thumbnailUrlTemplate,
            fullImageUrl: angle.imageUrl,
          },
        ],
      })),
    [generatedAngles],
  );

  // Derive pending placeholders from store
  const pendingSubscriberIds = useAnglesStore((s) => s.pendingSubscriberIds);
  const pendingGenerations = useMemo(
    () => pendingSubscriberIds.map((id) => ({ id, count: 1 })),
    [pendingSubscriberIds],
  );

  // Window resize handler (debounced to avoid excessive re-renders)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // ─── Local file upload → MediaUploadApi → media token ───────────────────────
  const handleLocalImageSelect = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file || !file.type.startsWith("image/")) return;

      setIsLoadingImage(true);

      try {
        const objectUrl = URL.createObjectURL(file);

        // Load dimensions
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

        // Upload to backend for media token
        const mediaUploadApi = new MediaUploadApi();
        const uploadResult = await mediaUploadApi.UploadImage({
          blob: file,
          fileName: file.name,
          uuid: uuidv4(),
        });

        if (!uploadResult?.success || !uploadResult.data) {
          throw new Error("Upload failed — no media token returned");
        }

        const mediaToken = uploadResult.data;

        // Fetch CDN URL + thumbnail template from backend
        let cdnUrl = objectUrl;
        let thumbnailUrlTemplate: string | undefined;
        try {
          const api = new MediaFilesApi();
          const mediaFile = await api.GetMediaFileByToken({ mediaFileToken: mediaToken });
          if (mediaFile.success && mediaFile.data) {
            const links = mediaFile.data.media_links as { cdn_url?: string; thumbnail_template?: string; maybe_thumbnail_template?: string } | undefined;
            cdnUrl = links?.cdn_url || (mediaFile.data as any).public_bucket_url || objectUrl;
            thumbnailUrlTemplate = links?.thumbnail_template || links?.maybe_thumbnail_template;
          }
        } catch {
          // Fall back to blob URL if fetching CDN info fails
        }

        setSourceImage(cdnUrl, mediaToken, thumbnailUrlTemplate);
        setIsLoadingImage(false);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
        setIsLoadingImage(false);
      }
    },
    [setSourceImage, setImageDimensions, setIsLoadingImage],
  );

  const handleImageSelect = useCallback((id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [id];
    });
  }, []);

  // ─── Gallery select → media token from item.id ──────────────────────────────
  const handleGallerySelect = useCallback(
    async (selectedItems: GalleryItem[]) => {
      const item = selectedItems[0];
      if (!item || !item.fullImage) {
        toast.error("No image selected");
        return;
      }

      const mediaToken = item.id; // item.id is a media token
      const imageUrl = item.fullImage;

      setIsGalleryModalOpen(false);
      setSelectedGalleryImages([]);
      setIsLoadingImage(true);

      try {
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

        setSourceImage(imageUrl, mediaToken);
        setIsLoadingImage(false);
      } catch (error) {
        console.error("Error processing gallery image:", error);
        toast.error("Failed to process image");
        setIsLoadingImage(false);
      }
    },
    [setSourceImage, setImageDimensions, setIsLoadingImage],
  );

  // ─── Generate with subscriber pattern ───────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const state = useAnglesStore.getState();
    if (!state.sourceMediaToken) return;

    const subscriberId = uuidv4();
    state.startGeneration(subscriberId);

    window.__storeTaskEnqueueMeta?.({
      prompt: "",
      modelType: (selectedModel as any)?.tauriId || "flux_2_lora_angles",
      timestamp: Date.now(),
    });

    try {
      await EnqueueEditImage({
        model: selectedModel ?? ("flux_2_lora_angles" as any),
        provider: selectedProvider ?? undefined,
        image_media_tokens: [state.sourceMediaToken],
        prompt: "",
        horizontal_angle: state.angleConfig.rotation,
        vertical_angle: state.angleConfig.tilt,
        zoom: state.angleConfig.zoom,
        frontend_subscriber_id: subscriberId,
      });

    } catch (error) {
      console.error("Error generating angle:", error);
      toast.error("Failed to generate angle");
      useAnglesStore.getState().removePendingSubscriber(subscriberId);
    }
  }, [selectedModel, selectedProvider]);

  const handleDownload = useCallback(async () => {
    if (!activeAngle) {
      toast.error("No image to download");
      return;
    }
    try {
      await downloadFileFromUrl(activeAngle.imageUrl);
      toast.success("Image saved to Downloads folder");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  }, [activeAngle]);

  // Called when user releases the sphere drag — values are already snapped
  const handleSphereDragEnd = useCallback(
    (snappedRotation: number, snappedTilt: number) => {
      setRotation(snappedRotation);
      setTilt(snappedTilt);
    },
    [setRotation, setTilt],
  );

  const showUploadScreen = !sourceImageUrl && !isLoadingImage;

  const imageContainerStyle = useMemo(() => {
    if (!imageDimensions) {
      return { width: "600px", height: "450px" };
    }

    const horizontalPadding = 128 + 80;
    const verticalPadding = 56 + 64 + 160;

    const availableWidth = windowSize.width - horizontalPadding;
    const availableHeight = windowSize.height - verticalPadding;

    const maxWidth = Math.min(availableWidth, 1200);
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

  const handleChangeImage = useCallback(() => {
    resetSource();
    useAnglesStore.getState().clearGeneratedAngles();
  }, [resetSource]);

  // Slider handlers that snap to allowed values
  const handleRotationSlider = useCallback(
    (value: number) => {
      const snapped = snapToNearest(value, DISPLAY_ROTATION_VALUES);
      setRotation(displayToRotation(snapped));
    },
    [setRotation],
  );

  const handleTiltSlider = useCallback(
    (value: number) => {
      setTilt(snapToNearest(value, TILT_VALUES));
    },
    [setTilt],
  );

  const handleZoomSlider = useCallback(
    (value: number) => {
      setZoom(snapToNearest(value, ZOOM_VALUES));
    },
    [setZoom],
  );

  // Arrow step handlers for orbit sphere
  const handleRotationStep = useCallback(
    (direction: 1 | -1) => {
      const idx = ROTATION_VALUES.indexOf(angleConfig.rotation);
      const next =
        (idx + direction + ROTATION_VALUES.length) % ROTATION_VALUES.length;
      setRotation(ROTATION_VALUES[next]);
    },
    [angleConfig.rotation, setRotation],
  );

  const handleTiltStep = useCallback(
    (direction: 1 | -1) => {
      const idx = TILT_VALUES.indexOf(angleConfig.tilt);
      const next = Math.max(
        0,
        Math.min(TILT_VALUES.length - 1, idx + direction),
      );
      setTilt(TILT_VALUES[next]);
    },
    [angleConfig.tilt, setTilt],
  );

  // ─── HistoryStack data ──────────────────────────────────────────────────────
  // Source image as the first entry so user can return to original
  const allBundles = useMemo(() => {
    if (!sourceImageUrl || !sourceMediaToken) return historyBundles;
    const sourceBundle: ImageBundle = {
      images: [
        {
          url: sourceImageUrl,
          mediaToken: sourceMediaToken,
          thumbnailUrlTemplate: sourceThumbnailUrlTemplate ?? undefined,
          fullImageUrl: sourceImageUrl,
        },
      ],
    };
    return [sourceBundle, ...historyBundles];
  }, [sourceImageUrl, sourceMediaToken, sourceThumbnailUrlTemplate, historyBundles]);

  const handleHistoryImageSelect = useCallback(
    (image: BaseSelectorImage) => {
      // If selecting the source image, clear active angle to show source
      if (image.mediaToken === useAnglesStore.getState().sourceMediaToken) {
        setActiveAngle(null);
      } else {
        setActiveAngle(image.mediaToken);
      }
    },
    [setActiveAngle],
  );

  const handleHistoryImageRemove = useCallback((image: BaseSelectorImage) => {
    useAnglesStore.getState().removeGeneratedAngle(image.mediaToken);
  }, []);

  const handleHistoryClear = useCallback(() => {
    useAnglesStore.getState().clearGeneratedAngles();
  }, []);

  return (
    <>
      <div className="flex h-[calc(100vh-56px)] w-full flex-col overflow-hidden bg-ui-background text-base-fg">
        {showUploadScreen ? (
          /* ──── Upload screen ──── */
          <div className="flex flex-1 items-center justify-center p-8 lg:p-16">
            <div className="w-full max-w-5xl">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-ui-panel-border bg-ui-panel shadow-lg">
                <UploadEntryCard
                  icon={faCrosshairs}
                  title="Angles"
                  description="Generate new camera angles from a single photo. Upload an image to get started."
                  accentBackgroundClass="bg-lime-500/20"
                  accentBorderClass="border-lime-500/40"
                  accept="image/*"
                  onFilesSelected={handleLocalImageSelect}
                  primaryLabel="Upload media"
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
          </div>
        ) : (
          /* ──── Editor layout — floating panels over full-bleed canvas ──── */
          <div className="relative h-full w-full">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileInputChange}
            />

            {/* Full-bleed image display */}
            <div className="flex h-full w-full items-center justify-center px-16 pb-56 pt-16">
              <div
                className="relative overflow-hidden rounded-xl shadow-lg"
                style={imageContainerStyle}
              >
                {activeAngle ? (
                  <img
                    src={activeAngle.imageUrl}
                    alt="Generated Angle"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : sourceImageUrl ? (
                  <img
                    src={sourceImageUrl}
                    alt="Source"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-ui-background">
                    <LoadingSpinner className="h-12 w-12" />
                  </div>
                )}
              </div>
            </div>

            {/* ── Floating top toolbar ── */}
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
              <div className="flex items-center gap-2">
                <Button
                  variant="action"
                  onClick={handleChangeImage}
                  className="select-none px-4 py-1.5 text-sm font-medium transition-all"
                >
                  Change Image
                </Button>
                {activeAngle && (
                  <Button
                    variant="primary"
                    icon={faDownload}
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className={twMerge(
                      "select-none px-4 py-1.5 text-sm font-medium transition-all",
                      isProcessing && "cursor-not-allowed opacity-50",
                    )}
                  >
                    Download
                  </Button>
                )}
              </div>
            </div>

            {/* ── History stack (right side, like PageEdit) ── */}
            <div className="absolute right-4 top-1/2 z-10 -translate-y-1/2">
              <HistoryStack
                onClear={handleHistoryClear}
                imageBundles={allBundles}
                pendingPlaceholders={pendingGenerations}
                blurredBackgroundUrl={sourceImageUrl ?? undefined}
                selectedImageToken={selectedImageToken}
                onImageSelect={handleHistoryImageSelect}
                onImageRemove={handleHistoryImageRemove}
              />
            </div>

            {/* ── Floating bottom angle controls ── */}
            <div className="absolute bottom-4 left-1/2 z-10 w-[calc(100%-32px)] max-w-[860px] -translate-x-1/2">
              <div className="glass flex items-center gap-4 rounded-xl px-4 lg:gap-5 lg:px-5">
                {/* Orbit sphere */}
                <div className="relative shrink-0 px-5 py-5">
                  <button
                    onClick={() => handleTiltStep(1)}
                    className="absolute left-1/2 top-0 z-10 -translate-x-1/2 p-1 text-base-fg/40 transition-colors hover:text-base-fg/80"
                  >
                    <FontAwesomeIcon
                      icon={faChevronUp}
                      className="text-[10px]"
                    />
                  </button>
                  <button
                    onClick={() => handleTiltStep(-1)}
                    className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 p-1 text-base-fg/40 transition-colors hover:text-base-fg/80"
                  >
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="text-[10px]"
                    />
                  </button>
                  <button
                    onClick={() => handleRotationStep(-1)}
                    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 p-1 text-base-fg/40 transition-colors hover:text-base-fg/80"
                  >
                    <FontAwesomeIcon
                      icon={faChevronLeft}
                      className="text-[10px]"
                    />
                  </button>
                  <button
                    onClick={() => handleRotationStep(1)}
                    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 p-1 text-base-fg/40 transition-colors hover:text-base-fg/80"
                  >
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-[10px]"
                    />
                  </button>
                  <OrbitSphere
                    rotation={angleConfig.rotation}
                    tilt={angleConfig.tilt}
                    zoom={angleConfig.zoom}
                    onDragEnd={handleSphereDragEnd}
                  />
                </div>

                {/* Divider */}
                <div className="h-20 w-px shrink-0 bg-base-fg/10" />

                {/* Sliders group */}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-xs font-medium text-base-fg">
                      Rotation
                    </span>
                    <div className="min-w-0 flex-1">
                      <SliderV2
                        min={-180}
                        max={180}
                        step={45}
                        value={rotationToDisplay(angleConfig.rotation)}
                        onChange={handleRotationSlider}
                        suffix="°"
                      />
                    </div>
                    <span className="w-10 shrink-0 text-left text-xs tabular-nums text-base-fg/70">
                      {rotationToDisplay(angleConfig.rotation)}°
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-xs font-medium text-base-fg">
                      Tilt
                    </span>
                    <div className="min-w-0 flex-1">
                      <SliderV2
                        min={-60}
                        max={60}
                        step={30}
                        value={angleConfig.tilt}
                        onChange={handleTiltSlider}
                        suffix="°"
                      />
                    </div>
                    <span className="w-9 shrink-0 text-left text-xs tabular-nums text-base-fg/70">
                      {angleConfig.tilt}°
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-xs font-medium text-base-fg">
                      Zoom
                    </span>
                    <div className="min-w-0 flex-1">
                      <SliderV2
                        min={0}
                        max={10}
                        step={5}
                        value={angleConfig.zoom}
                        onChange={handleZoomSlider}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-left text-xs tabular-nums text-base-fg/70">
                      {angleConfig.zoom}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-20 w-px shrink-0 bg-base-fg/10" />

                {/* Toggle + Generate */}
                <div className="flex shrink-0 flex-col items-end gap-2.5">
                  {/* <Switch.Group>
                    <div className="flex items-center gap-2">
                      <Switch.Label className="cursor-pointer whitespace-nowrap text-xs text-base-fg/50">
                        Best 12 angles
                      </Switch.Label>
                      <Switch
                        checked={generateFromBestAngles}
                        onChange={setGenerateFromBestAngles}
                        className={twMerge(
                          "group inline-flex h-5 w-9 items-center rounded-full transition-colors",
                          generateFromBestAngles ? "bg-primary" : "bg-action",
                        )}
                      >
                        <span
                          className={twMerge(
                            "size-3.5 rounded-full bg-white transition",
                            generateFromBestAngles
                              ? "translate-x-[18px]"
                              : "translate-x-1",
                          )}
                        />
                      </Switch>
                    </div>
                  </Switch.Group> */}

                  <GenerateButton
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={!sourceMediaToken}
                    credits={anglesCredits}
                    className="whitespace-nowrap px-5 py-1.5 text-sm"
                  >
                    Generate
                  </GenerateButton>
                </div>
              </div>
            </div>

            {/* ── Model selector (bottom-left) ── */}
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-5">
              <ClassyModelSelector
                items={ANGLES_PAGE_MODEL_LIST}
                page={ANGLES_MODEL_PAGE}
                mode="hoverSelect"
                panelTitle="Select Model"
                panelClassName="min-w-[300px]"
                showIconsInList
              />
            </div>

            {/* ── Cost calculator + Help (bottom-right) ── */}
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
              <CostCalculatorButton modelPage={ANGLES_MODEL_PAGE} />
              <HelpMenuButton />
            </div>
          </div>
        )}
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
