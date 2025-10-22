import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import dayjs from "dayjs";
import {
  faCube,
  faDownToLine,
  faPencil,
  faVideo,
} from "@fortawesome/pro-solid-svg-icons";
import {
  EnqueueImageTo3dObject,
  EnqueueImageTo3dObjectModel,
} from "@storyteller/tauri-api";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { gtagEvent } from "@storyteller/google-analytics";
import { MediaFilesApi, PromptsApi } from "@storyteller/api";
import { toast } from "@storyteller/ui-toaster";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import {
  getModelCreatorIcon,
  getModelDisplayName,
  getProviderDisplayName,
} from "@storyteller/model-list";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";
import {
  addCorsParam,
  getContextImageThumbnail,
  THUMBNAIL_SIZES,
  PLACEHOLDER_IMAGES,
} from "@storyteller/common";

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseGallery: () => void;
  imageUrl?: string | null;
  imageUrls?: string[];
  mediaTokens?: string[];
  imageAlt?: string;
  onImageError?: () => void;
  title?: string;
  createdAt?: string;
  additionalInfo?: ReactNode;
  downloadUrl?: string;
  mediaId?: string;
  onDownloadClicked?: (url: string, mediaClass?: string) => Promise<void>;
  onAddToSceneClicked?: (
    url: string,
    media_id: string | undefined
  ) => Promise<void>;
  mediaClass?: string;
  onPromptCopy?: (prompt: string) => void;
  onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
  onTurnIntoVideoClicked?: (
    url: string,
    media_id?: string
  ) => Promise<void> | void;
  batchImageToken?: string;
}

export function LightboxModal({
  isOpen,
  onClose,
  onCloseGallery,
  imageUrl,
  imageUrls,
  mediaTokens,
  imageAlt = "",
  onImageError,
  title,
  createdAt,
  additionalInfo,
  downloadUrl, // cdn url of the image
  mediaId, // media id of the image
  onDownloadClicked,
  onAddToSceneClicked,
  mediaClass,
  onEditClicked,
  onTurnIntoVideoClicked,
  batchImageToken,
}: LightboxModalProps) {
  // NB(bt,2025-06-14): We add ?cors=1 to the image url to prevent caching "sec-fetch-mode: no-cors" from
  // the <image> tag request from being cached. If we then drag it into the canvas after it's been cached,
  // it won't be able to load in cors mode and will show blank in the canvas and 3D engine. This is a really
  // stupid hack around this behavior.

  const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState<boolean>(false);
  const [hasPromptToken, setHasPromptToken] = useState<boolean>(false);
  const [isPromptHovered, setIsPromptHovered] = useState<boolean>(false);
  const [generationProvider, setGenerationProvider] = useState<string | null>(
    null
  );
  const [modelType, setModelType] = useState<string | null>(null);
  const [contextImages, setContextImages] = useState<Array<{
    media_links: {
      cdn_url: string;
      maybe_thumbnail_template: string;
    };
    media_token: string;
    semantic: string;
  }> | null>(null);
  const [batchImages, setBatchImages] = useState<string[] | null>(null);
  const [batchTokens, setBatchTokens] = useState<string[] | null>(null);

  const [currentMediaId, setCurrentMediaId] = useState<string | undefined>(
    mediaId
  );
  useEffect(() => {
    setCurrentMediaId(mediaId);
  }, [mediaId]);

  useEffect(() => {
    if (isOpen) {
      setRefPreviewUrl(null);
      setSelectedIndex(0);
      setMediaLoaded(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!batchImageToken) {
      setBatchImages(null);
      setBatchTokens(null);
    }
  }, [mediaId, imageUrl, batchImageToken]);

  // Fetch prompt when mediaId changes
  useEffect(() => {
    const fetchPrompt = async () => {
      if (!currentMediaId) {
        setPrompt(null);
        setHasPromptToken(false);
        setGenerationProvider(null);
        setModelType(null);
        setContextImages(null);
        return;
      }

      setPromptLoading(true);
      try {
        const mediaFilesApi = new MediaFilesApi();
        const mediaResponse = await mediaFilesApi.GetMediaFileByToken({
          mediaFileToken: currentMediaId,
        });

        if (mediaResponse.success && mediaResponse.data?.maybe_prompt_token) {
          setHasPromptToken(true);
          const promptsApi = new PromptsApi();
          const promptResponse = await promptsApi.GetPromptsByToken({
            token: mediaResponse.data.maybe_prompt_token,
          });

          if (promptResponse.success && promptResponse.data) {
            const promptData = promptResponse.data;
            setPrompt(promptData.maybe_positive_prompt || null);
            setGenerationProvider(promptData.maybe_generation_provider || null);
            setModelType(promptData.maybe_model_type || null);
            setContextImages(promptData.maybe_context_images || null);
          } else {
            setPrompt(null);
            setGenerationProvider(null);
            setModelType(null);
            setContextImages(null);
          }
        } else {
          setHasPromptToken(false);
          setPrompt(null);
          setGenerationProvider(null);
          setModelType(null);
          setContextImages(null);
        }
      } catch (error) {
        console.error("Error fetching prompt:", error);
        setHasPromptToken(false);
        setPrompt(null);
        setGenerationProvider(null);
        setModelType(null);
        setContextImages(null);
      } finally {
        setPromptLoading(false);
      }
    };

    fetchPrompt();
  }, [currentMediaId]);

  useEffect(() => {
    const fetchBatch = async () => {
      if (!batchImageToken) {
        setBatchImages(null);
        setBatchTokens(null);
        return;
      }
      try {
        const mediaFilesApi = new MediaFilesApi();
        const response = await mediaFilesApi.GetMediaFilesByBatchToken({
          batchToken: batchImageToken,
        });
        if (response.success && response.data?.length) {
          const items = response.data
            .map((file: any) => ({
              url: file.media_links?.cdn_url,
              token: file.token,
            }))
            .filter(
              (item): item is { url: string; token: string } =>
                Boolean(item.url) && Boolean(item.token)
            );

          if (items.length > 0) {
            const primaryToken = mediaId;
            const primaryUrl = imageUrl;

            const sortedItems = [...items].sort((a, b) => {
              if (primaryToken === a.token) return -1;
              if (primaryToken === b.token) return 1;
              if (primaryUrl === a.url) return -1;
              if (primaryUrl === b.url) return 1;
              return 0;
            });

            setBatchImages(sortedItems.map((item) => item.url));
            setBatchTokens(sortedItems.map((item) => item.token));
          } else {
            setBatchImages(null);
            setBatchTokens(null);
          }
        } else {
          setBatchImages(null);
          setBatchTokens(null);
        }
      } catch (error: unknown) {
        setBatchImages(null);
        setBatchTokens(null);
      }
    };

    fetchBatch();
  }, [batchImageToken, mediaId, imageUrl]);

  const effectiveImageUrls = useMemo(() => {
    if (batchImages && batchImages.length > 0) {
      return batchImages;
    }
    if (imageUrls && imageUrls.length > 0) {
      return imageUrls;
    }
    return imageUrl ? [imageUrl] : [];
  }, [batchImages, imageUrls, imageUrl]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const carouselOptions: EmblaOptionsType = useMemo(() => ({ loop: true }), []);
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel(carouselOptions);
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    const index = emblaMainApi.selectedScrollSnap();
    setSelectedIndex(index);
    emblaThumbsApi.scrollTo(index);
  }, [emblaMainApi, emblaThumbsApi]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on("select", onSelect).on("reInit", onSelect);
  }, [emblaMainApi, onSelect]);

  useEffect(() => {
    setSelectedIndex(0);
    emblaMainApi?.scrollTo(0, true);
    emblaThumbsApi?.scrollTo(0, true);
  }, [batchImageToken, imageUrl, emblaMainApi, emblaThumbsApi]);

  const selectedImageUrl = effectiveImageUrls[selectedIndex] ?? null;
  const actionUrl = selectedImageUrl ?? downloadUrl ?? undefined;

  const selectedMediaToken = useMemo(() => {
    const tokenFromBatch = batchTokens?.[selectedIndex];
    const tokenFromProps = mediaTokens?.[selectedIndex];
    return tokenFromBatch ?? tokenFromProps ?? mediaId;
  }, [batchTokens, mediaTokens, selectedIndex, mediaId]);

  useEffect(() => {
    if (!selectedImageUrl) {
      setMediaLoaded(false);
      return;
    }

    setMediaLoaded(false);
    const img = new Image();
    img.src = addCorsParam(selectedImageUrl) || selectedImageUrl;

    const handleLoad = () => setMediaLoaded(true);
    const handleError = () => setMediaLoaded(true);

    if (img.complete) {
      setMediaLoaded(true);
    } else {
      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleError);
    }

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [selectedImageUrl]);

  const derivedMediaClass =
    mediaClass ??
    (batchImages && batchImages.length > 0 ? "image" : mediaClass);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="rounded-xl bg-ui-modal h-[760px] w-[1000px] max-w-screen min-w-[1000px] min-h-[600px] p-4"
        draggable
        allowBackgroundInteraction={true}
        showClose={true}
        closeOnOutsideClick={false}
        resizable={true}
        backdropClassName="pointer-events-none hidden"
        expandable={true}
      >
        {/* Invisible drag handle strip at the very top for moving */}
        <Modal.DragHandle>
          <div className="absolute left-0 top-0 z-20 h-12 w-full cursor-move rounded-t-xl" />
        </Modal.DragHandle>

        {/* content grid */}
        <div className="grid h-full grid-cols-3 gap-6">
          {/* image panel */}
          <div className="col-span-2 relative flex h-full items-center justify-center overflow-hidden rounded-l-xl bg-black/30">
            {!selectedImageUrl ? (
              <div className="flex h-full w-full items-center justify-center bg-black/30">
                <span className="text-base-fg/60">Image not available</span>
              </div>
            ) : mediaClass === "video" ? (
              <video
                controls
                loop={true}
                autoPlay={true}
                className="h-full w-full object-contain"
                onLoadedData={() => setMediaLoaded(true)}
              >
                <source src={selectedImageUrl as string} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex h-full w-full flex-col justify-center">
                <div
                  className="embla relative w-full flex-1 overflow-hidden"
                  ref={emblaMainRef}
                >
                  <div className="embla__container flex h-full">
                    {effectiveImageUrls.map((url, idx) => (
                      <div
                        className="embla__slide flex-[0_0_100%]"
                        key={`${url}-${idx}`}
                      >
                        <div className="relative flex h-full items-center justify-center overflow-hidden rounded-lg bg-black/20">
                          <img
                            data-lightbox-modal="true"
                            src={addCorsParam(url) || url}
                            alt={`${imageAlt || "Generated image"} ${idx + 1}`}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              onImageError?.();
                              if (idx === selectedIndex) {
                                setMediaLoaded(true);
                                e.currentTarget.src =
                                  PLACEHOLDER_IMAGES.DEFAULT;
                                e.currentTarget.style.opacity = "0.3";
                              }
                            }}
                            onLoad={() => {
                              if (idx === selectedIndex) {
                                setMediaLoaded(true);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {effectiveImageUrls.length > 1 && (
                  <div className="mt-3 px-2">
                    <div
                      className="embla-thumbs overflow-hidden"
                      ref={emblaThumbsRef}
                    >
                      <div className="embla-thumbs__container flex gap-2">
                        {effectiveImageUrls.map((url, idx) => {
                          const isSelected = idx === selectedIndex;
                          return (
                            <button
                              key={`${url}-thumb-${idx}`}
                              type="button"
                              onClick={() => onThumbClick(idx)}
                              className={twMerge(
                                "embla-thumbs__slide relative h-20 w-20 flex-[0_0_5rem] overflow-hidden rounded-md border-2 transition-all",
                                isSelected
                                  ? "border-brand-primary-400 opacity-100"
                                  : "border-transparent opacity-60 hover:border-white/40 hover:opacity-100"
                              )}
                            >
                              <img
                                src={addCorsParam(url) || url}
                                alt={`Thumbnail ${idx + 1}`}
                                className="h-full w-full object-cover bg-black/20"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!mediaLoaded && selectedImageUrl && (
              <div className="absolute inset-0 bg-ui-panel flex items-center justify-center">
                <LoadingSpinner className="h-12 w-12 text-base-fg" />
              </div>
            )}
          </div>

          {/* info + actions */}
          <div className="flex h-full flex-col col-span-1">
            <div className="flex-1 space-y-5 text-base-fg">
              {/* <div className="text-xl font-medium">
              {title || "Image Generation"}
            </div> */}
              {createdAt && (
                <div className="space-y-1.5">
                  <div className="text-sm font-medium text-base-fg/90">
                    Created
                  </div>
                  <div className="text-sm text-base-fg/70">
                    {dayjs(createdAt).format("MMM D, YYYY")} at{" "}
                    {dayjs(createdAt).format("hh:mm A")}
                  </div>
                </div>
              )}

              {hasPromptToken && (
                <>
                  {/* Prompt */}
                  <div className="relative space-y-1.5">
                    <div className="text-sm font-medium text-base-fg/90">
                      Prompt
                    </div>
                    <div
                      className={twMerge(
                        "relative text-sm text-base-fg break-words p-3 rounded-lg cursor-pointer transition-colors duration-100 leading-relaxed"
                      )}
                      style={{
                        background: isPromptHovered
                          ? "rgb(var(--st-controls-rgb) / 0.30)"
                          : "rgb(var(--st-controls-rgb) / 0.20)",
                      }}
                      onMouseEnter={() => setIsPromptHovered(true)}
                      onMouseLeave={() => setIsPromptHovered(false)}
                      onClick={() => {
                        if (!prompt) return;
                        navigator.clipboard.writeText(prompt).catch(() => {});
                        toast.success("Prompt copied");
                      }}
                    >
                      {promptLoading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner className="h-4 w-4" />
                          <span className="text-sm text-base-fg/80">
                            Loading prompt...
                          </span>
                        </div>
                      ) : (
                        prompt || (
                          <span className="text-sm text-base-fg">
                            No prompt
                          </span>
                        )
                      )}
                    </div>

                    {!promptLoading && (
                      <div
                        className={twMerge(
                          "pointer-events-none absolute inset-0 flex items-end justify-end opacity-0 transition-opacity duration-50",
                          isPromptHovered && "opacity-100"
                        )}
                      >
                        <div
                          className="flex items-center gap-1 text-xs text-base-fg backdrop-blur-md p-1.5 rounded-tl-lg rounded-br-lg"
                          style={{
                            background: "rgb(var(--st-controls-rgb) / 0.80)",
                          }}
                        >
                          <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                          <span>Copy prompt</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {contextImages && contextImages.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-base-fg/90">
                        Reference Images
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {contextImages.map((contextImage, index) => {
                          const { thumbnail, fullSize } =
                            getContextImageThumbnail(contextImage, {
                              size: THUMBNAIL_SIZES.SMALL,
                            });

                          return (
                            <div
                              key={contextImage.media_token}
                              className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30 hover:border-white/80 transition-all group cursor-pointer hover:cursor-zoom-in"
                              onClick={() => setRefPreviewUrl(fullSize)}
                            >
                              <img
                                src={thumbnail}
                                alt={`Reference image ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Generation Details */}
                  {(generationProvider || modelType) && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-base-fg/90">
                        Generation Details
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {modelType && (
                          <div
                            className="flex items-center justify-between py-2 px-3 rounded-lg border border-ui-panel-border"
                            style={{
                              background: "rgb(var(--st-controls-rgb) / 0.20)",
                            }}
                          >
                            <span className="text-sm text-base-fg/70 font-medium">
                              Model
                            </span>
                            <div className="flex items-center gap-2">
                              {getModelCreatorIcon(modelType)}
                              <span className="text-sm text-base-fg rounded">
                                {getModelDisplayName(modelType)}
                              </span>
                            </div>
                          </div>
                        )}
                        {generationProvider && (
                          <div
                            className="flex items-center justify-between py-2 px-3 rounded-lg border border-ui-panel-border"
                            style={{
                              background: "rgb(var(--st-controls-rgb) / 0.20)",
                            }}
                          >
                            <span className="text-sm text-base-fg/70 font-medium">
                              Provider
                            </span>
                            <span className="text-sm text-base-fg rounded">
                              {getProviderDisplayName(generationProvider)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {additionalInfo}
            </div>

            {/* buttons with spacing */}
            {(onAddToSceneClicked && actionUrl) || actionUrl
              ? (() => {
                  const visibleButtons = [
                    onEditClicked && actionUrl && derivedMediaClass === "image",
                    onTurnIntoVideoClicked &&
                      actionUrl &&
                      derivedMediaClass === "image",
                    onAddToSceneClicked && actionUrl,
                    derivedMediaClass === "image",
                    onDownloadClicked && actionUrl,
                  ].filter(Boolean).length;

                  const buttonClass =
                    visibleButtons === 1 ? "w-full col-span-2" : "w-full";

                  return (
                    <div className="mt-15 mb-15 grid grid-cols-2 gap-2">
                      {onEditClicked &&
                        actionUrl &&
                        derivedMediaClass === "image" && (
                          <Button
                            className={buttonClass}
                            icon={faPencil}
                            onClick={async (e) => {
                              e.stopPropagation();
                              gtagEvent("edit_image_clicked");
                              await onEditClicked(
                                actionUrl,
                                selectedMediaToken
                              );
                            }}
                          >
                            Edit Image
                          </Button>
                        )}

                      {onTurnIntoVideoClicked &&
                        actionUrl &&
                        derivedMediaClass === "image" && (
                          <Button
                            className={buttonClass}
                            icon={faVideo}
                            onClick={async (e) => {
                              e.stopPropagation();
                              gtagEvent("turn_into_video_clicked");
                              await onTurnIntoVideoClicked(
                                actionUrl,
                                selectedMediaToken
                              );
                            }}
                          >
                            Turn into Video
                          </Button>
                        )}

                      {onAddToSceneClicked && actionUrl && (
                        <Button
                          className={buttonClass}
                          variant="secondary"
                          onClick={async (e) => {
                            e.stopPropagation();
                            gtagEvent("add_to_scene_clicked");
                            await onAddToSceneClicked(
                              actionUrl,
                              selectedMediaToken
                            );
                            onClose();
                            onCloseGallery();
                          }}
                        >
                          Add to Current Scene
                        </Button>
                      )}

                      {derivedMediaClass === "image" && (
                        <Button
                          icon={faCube}
                          className={buttonClass}
                          variant="secondary"
                          onClick={async (e) => {
                            gtagEvent("image_to_3d_clicked");
                            await EnqueueImageTo3dObject({
                              image_media_token: selectedMediaToken,
                              model: EnqueueImageTo3dObjectModel.Hunyuan3d2_0,
                            });
                          }}
                        >
                          Make 3D Model
                        </Button>
                      )}

                      {onDownloadClicked && actionUrl && (
                        <Button
                          className={buttonClass}
                          icon={faDownToLine}
                          variant="secondary"
                          onClick={async (e) => {
                            e.stopPropagation();
                            gtagEvent("download_clicked");
                            await onDownloadClicked(actionUrl, mediaClass);
                          }}
                        >
                          Download
                        </Button>
                      )}
                    </div>
                  );
                })()
              : null}
          </div>
        </div>
      </Modal>

      {refPreviewUrl && (
        <Modal
          isOpen={true}
          onClose={() => setRefPreviewUrl(null)}
          className="rounded-xl bg-ui-modal h-[50vh] w-fit max-w-screen min-w-[35vw] min-h-[40vh] p-4"
          draggable
          allowBackgroundInteraction={true}
          showClose={true}
          closeOnOutsideClick={true}
          resizable={true}
          backdropClassName=""
          expandable={true}
        >
          <Modal.DragHandle>
            <div className="absolute left-0 top-0 z-20 h-12 w-full cursor-move rounded-t-xl" />
          </Modal.DragHandle>
          <div className="relative flex h-full items-center justify-center overflow-hidden rounded-xl bg-black/30">
            <img
              src={addCorsParam(refPreviewUrl) || refPreviewUrl}
              alt="Reference preview"
              className="h-full w-full object-contain"
            />
          </div>
        </Modal>
      )}
    </>
  );
}

export default LightboxModal;
