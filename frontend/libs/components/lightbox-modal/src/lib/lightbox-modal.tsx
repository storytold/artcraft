import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import dayjs from "dayjs";
import {
  faChevronLeft,
  faChevronRight,
  faCube,
  faDownToLine,
  faGlobe,
  faPencil,
  faTrashCan,
  faVideo,
  faWandMagicSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import {
  EnqueueImageTo3dObject,
  EnqueueImageTo3dObjectModel,
  MediaFileDelete,
} from "@storyteller/tauri-api";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { Viewer3D } from "@storyteller/ui-viewer-3d";
import {
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { gtagEvent } from "@storyteller/google-analytics";
import { MediaFilesApi, PromptsApi } from "@storyteller/api";
import { toast } from "@storyteller/ui-toaster";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faLink, faCheck } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";
import {
  getModelCreatorIcon,
  getModelDisplayName,
  getProviderDisplayName,
  getProviderIconByName,
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
    media_id: string | undefined,
  ) => Promise<void>;
  mediaClass?: string;
  onPromptCopy?: (prompt: string) => void;
  onEditClicked?: (url: string, media_id?: string) => Promise<void> | void;
  onTurnIntoVideoClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onRemoveBackgroundClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  onMake3DWorldClicked?: (
    url: string,
    media_id?: string,
  ) => Promise<void> | void;
  batchImageToken?: string;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
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
  onRemoveBackgroundClicked,
  onMake3DWorldClicked,
  batchImageToken,
  onNavigatePrev,
  onNavigateNext,
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
  const [isPromptExpanded, setIsPromptExpanded] = useState<boolean>(false);
  const promptRef = useRef<HTMLDivElement>(null);
  const [isPromptClamped, setIsPromptClamped] = useState<boolean>(false);
  const [promptCopied, setPromptCopied] = useState<boolean>(false);
  const promptCopiedTimeoutRef = useRef<number | null>(null);
  const [generationProvider, setGenerationProvider] = useState<string | null>(
    null,
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
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const shareCopiedTimeoutRef = useRef<number | null>(null);

  // Stable API instances
  const mediaFilesApi = useMemo(() => new MediaFilesApi(), []);
  const promptsApi = useMemo(() => new PromptsApi(), []);

  useEffect(() => {
    if (isOpen) {
      setRefPreviewUrl(null);
      setSelectedIndex(0);
      setMediaLoaded(false);
      setShareCopied(false);
      setIsPromptExpanded(false);
      if (shareCopiedTimeoutRef.current) {
        window.clearTimeout(shareCopiedTimeoutRef.current);
        shareCopiedTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (shareCopiedTimeoutRef.current) {
        window.clearTimeout(shareCopiedTimeoutRef.current);
        shareCopiedTimeoutRef.current = null;
      }
    };
  }, []);

  // Fetch prompt when mediaId changes — debounced to avoid API spam during
  // rapid next/prev navigation, with cancellation for stale responses.
  useEffect(() => {
    if (!mediaId) {
      setPrompt(null);
      setHasPromptToken(false);
      setGenerationProvider(null);
      setModelType(null);
      setContextImages(null);
      setPromptLoading(false);
      return;
    }

    // Immediately show skeletons & clear stale data
    setPromptLoading(true);
    setPrompt(null);
    setGenerationProvider(null);
    setModelType(null);
    setContextImages(null);

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const mediaResponse = await mediaFilesApi.GetMediaFileByToken({
          mediaFileToken: mediaId,
        });
        if (cancelled) return;

        if (mediaResponse.success && mediaResponse.data?.maybe_prompt_token) {
          setHasPromptToken(true);
          const promptResponse = await promptsApi.GetPromptsByToken({
            token: mediaResponse.data.maybe_prompt_token,
          });
          if (cancelled) return;

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
        if (cancelled) return;
        console.error("Error fetching prompt:", error);
        setHasPromptToken(false);
        setPrompt(null);
        setGenerationProvider(null);
        setModelType(null);
        setContextImages(null);
      } finally {
        if (!cancelled) setPromptLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mediaId, mediaFilesApi, promptsApi]);

  // Detect if prompt text is clamped (overflows the 4-line clamp)
  useEffect(() => {
    if (!promptRef.current || !prompt || promptLoading) {
      setIsPromptClamped(false);
      return;
    }
    // Use requestAnimationFrame to ensure DOM has painted
    const raf = requestAnimationFrame(() => {
      if (promptRef.current) {
        setIsPromptClamped(
          promptRef.current.scrollHeight > promptRef.current.clientHeight,
        );
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [prompt, promptLoading, isPromptExpanded]);

  // Fetch batch images — debounced + cancellable like fetchPrompt above.
  useEffect(() => {
    if (!batchImageToken) {
      setBatchImages(null);
      setBatchTokens(null);
      return;
    }

    // Clear stale batch data immediately
    setBatchImages(null);
    setBatchTokens(null);

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const response = await mediaFilesApi.GetMediaFilesByBatchToken({
          batchToken: batchImageToken,
        });
        if (cancelled) return;

        if (response.success && response.data?.length) {
          const items = response.data
            .map((file: any) => ({
              url: file.media_links?.cdn_url,
              token: file.token,
            }))
            .filter(
              (item): item is { url: string; token: string } =>
                Boolean(item.url) && Boolean(item.token),
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
        if (cancelled) return;
        setBatchImages(null);
        setBatchTokens(null);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [batchImageToken, mediaId, imageUrl, mediaFilesApi]);

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
    [emblaMainApi, emblaThumbsApi],
  );

  const onDeleteClicked = useCallback(
    (mediaToken: string) => {
      showActionReminder({
        reminderType: "default",
        title: "Delete this media?",
        message: (
          <p className="text-sm text-white/70">
            This will permanently remove the media from your library. This
            action cannot be undone.
          </p>
        ),
        primaryActionText: "Delete",
        secondaryActionText: "Cancel",
        primaryActionBtnClassName: "bg-red text-white hover:bg-red/90",
        onPrimaryAction: async () => {
          try {
            await MediaFileDelete(mediaToken);
          } finally {
            isActionReminderOpen.value = false;
            onClose();
          }
        },
      });
    },
    [onClose],
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

  const derivedMediaClass = useMemo(
    () =>
      mediaClass ??
      (batchImages && batchImages.length > 0 ? "image" : mediaClass),
    [mediaClass, batchImages],
  );

  // Keyboard navigation for gallery prev/next
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is interacting with an input, textarea, etc.
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft" && onNavigatePrev) {
        e.preventDefault();
        onNavigatePrev();
      } else if (e.key === "ArrowRight" && onNavigateNext) {
        e.preventDefault();
        onNavigateNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onNavigatePrev, onNavigateNext]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="rounded-xl bg-ui-modal h-[760px] w-[1200px] max-w-screen min-w-[1000px] min-h-[600px] p-4"
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
        <div className="flex h-full gap-4">
          {/* image panel - flexible width */}
          <div className="group/nav relative flex h-full flex-1 items-center justify-center overflow-hidden rounded-l-xl bg-black/30">
            {!selectedImageUrl ? (
              <div className="flex h-full w-full items-center justify-center bg-black/30">
                <span className="text-base-fg/60">Image not available</span>
              </div>
            ) : mediaClass === "dimensional" ? (
              <div className="h-full w-full">
                <Viewer3D
                  key={selectedImageUrl}
                  modelUrl={selectedImageUrl}
                  isActive={true}
                  showGrid={true}
                  className="h-full w-full"
                />
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
                                // Set the `data-brokenurl` property for debugging the broken images:
                                (
                                  e.currentTarget as HTMLImageElement
                                ).dataset.brokenurl = url || "";
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
                                  : "border-transparent opacity-60 hover:border-white/40 hover:opacity-100",
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

            {!mediaLoaded &&
              selectedImageUrl &&
              mediaClass !== "dimensional" && (
                <div className="absolute inset-0 bg-ui-panel flex items-center justify-center">
                  <LoadingSpinner className="h-12 w-12 text-base-fg" />
                </div>
              )}

            {/* Gallery navigation arrows – only visible on hover */}
            {onNavigatePrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigatePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/70 opacity-0 transition-opacity duration-200 hover:bg-black/70 hover:text-white group-hover/nav:opacity-100 focus:outline-none"
                aria-label="Previous item"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-lg" />
              </button>
            )}
            {onNavigateNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/70 opacity-0 transition-opacity duration-200 hover:bg-black/70 hover:text-white group-hover/nav:opacity-100 focus:outline-none"
                aria-label="Next item"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-lg" />
              </button>
            )}
          </div>

          {/* info + actions - fixed width */}
          <div className="flex h-full w-[280px] shrink-0 flex-col">
            <div className="flex-1 overflow-y-auto space-y-5 text-base-fg min-h-0 pb-2">
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

              {(hasPromptToken || promptLoading) && (
                <>
                  {/* Prompt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-base-fg/90">
                        Prompt
                      </div>
                      {!promptLoading && prompt && (
                        <button
                          className="flex items-center gap-1.5 text-xs text-base-fg/60 hover:text-base-fg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!prompt) return;
                            navigator.clipboard
                              .writeText(prompt)
                              .catch(() => {});
                            toast.success("Prompt copied");
                            setPromptCopied(true);
                            if (promptCopiedTimeoutRef.current) {
                              window.clearTimeout(
                                promptCopiedTimeoutRef.current,
                              );
                            }
                            promptCopiedTimeoutRef.current = window.setTimeout(
                              () => {
                                setPromptCopied(false);
                                promptCopiedTimeoutRef.current = null;
                              },
                              1500,
                            );
                          }}
                        >
                          <FontAwesomeIcon
                            icon={promptCopied ? faCheck : faCopy}
                            className="h-3 w-3"
                          />
                          <span>{promptCopied ? "Copied!" : "Copy"}</span>
                        </button>
                      )}
                    </div>
                    <div
                      className="text-sm text-base-fg break-words p-3 rounded-lg leading-relaxed"
                      style={{
                        background: "rgb(var(--st-controls-rgb) / 0.20)",
                      }}
                    >
                      {promptLoading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-3 w-full rounded bg-white/10" />
                          <div className="h-3 w-4/5 rounded bg-white/10" />
                          <div className="h-3 w-3/5 rounded bg-white/10" />
                        </div>
                      ) : (
                        <div
                          ref={promptRef}
                          className={twMerge(
                            !isPromptExpanded && "line-clamp-4",
                          )}
                        >
                          {prompt || (
                            <span className="text-sm text-base-fg">
                              No prompt
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!promptLoading &&
                      prompt &&
                      (isPromptClamped || isPromptExpanded) && (
                        <button
                          className="flex w-full items-center justify-center gap-1 text-xs text-base-fg/70 hover:text-base-fg transition-colors py-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPromptExpanded((prev) => !prev);
                          }}
                        >
                          <span>{isPromptExpanded ? "Hide" : "See all"}</span>
                          <svg
                            className={twMerge(
                              "h-3 w-3 transition-transform duration-200",
                              isPromptExpanded && "rotate-180",
                            )}
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M2.5 4.5L6 8L9.5 4.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                  </div>

                  {promptLoading ? (
                    /* Skeleton placeholders while fetching metadata */
                    <>
                      {/* Reference Images skeleton */}
                      <div className="space-y-1.5 animate-pulse">
                        <div className="h-3.5 w-28 rounded bg-white/10" />
                        <div className="flex gap-1.5">
                          <div className="h-12 w-12 rounded-lg bg-white/10" />
                          <div className="h-12 w-12 rounded-lg bg-white/10" />
                          <div className="h-12 w-12 rounded-lg bg-white/10" />
                        </div>
                      </div>
                      {/* Generation Details skeleton */}
                      <div className="space-y-1.5 animate-pulse">
                        <div className="h-3.5 w-32 rounded bg-white/10" />
                        <div
                          className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-ui-panel-border"
                          style={{
                            background: "rgb(var(--st-controls-rgb) / 0.20)",
                          }}
                        >
                          <div className="h-3.5 w-12 rounded bg-white/10" />
                          <div className="h-3.5 w-24 rounded bg-white/10" />
                        </div>
                        <div
                          className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-ui-panel-border"
                          style={{
                            background: "rgb(var(--st-controls-rgb) / 0.20)",
                          }}
                        >
                          <div className="h-3.5 w-14 rounded bg-white/10" />
                          <div className="h-3.5 w-20 rounded bg-white/10" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {contextImages && contextImages.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-sm font-medium text-base-fg/90">
                            Reference Images
                          </div>
                          <div className="grid grid-cols-5 gap-1.5 w-fit">
                            {contextImages.map((contextImage, index) => {
                              const { thumbnail, fullSize } =
                                getContextImageThumbnail(contextImage, {
                                  size: THUMBNAIL_SIZES.SMALL,
                                });

                              return (
                                <div
                                  key={contextImage.media_token}
                                  className="glass relative aspect-square overflow-hidden rounded-lg w-12 border-2 border-white/30 hover:border-white/80 transition-all group cursor-pointer hover:cursor-zoom-in"
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
                                  background:
                                    "rgb(var(--st-controls-rgb) / 0.20)",
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
                                  background:
                                    "rgb(var(--st-controls-rgb) / 0.20)",
                                }}
                              >
                                <span className="text-sm text-base-fg/70 font-medium">
                                  Provider
                                </span>
                                <div className="flex items-center gap-2">
                                  {getProviderIconByName(
                                    generationProvider,
                                    "h-4 w-4 invert",
                                  )}
                                  <span className="text-sm text-base-fg rounded">
                                    {getProviderDisplayName(generationProvider)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {additionalInfo}
            </div>

            {/* buttons with spacing */}
            {actionUrl && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {onEditClicked &&
                  actionUrl &&
                  derivedMediaClass === "image" && (
                    <Button
                      className="w-full"
                      variant="primary"
                      icon={faPencil}
                      onClick={async (e) => {
                        e.stopPropagation();
                        gtagEvent("edit_image_clicked");
                        await onEditClicked(actionUrl, selectedMediaToken);
                      }}
                    >
                      Edit Image
                    </Button>
                  )}

                {onTurnIntoVideoClicked &&
                  actionUrl &&
                  derivedMediaClass === "image" && (
                    <Button
                      className="w-full"
                      variant="primary"
                      icon={faVideo}
                      onClick={async (e) => {
                        e.stopPropagation();
                        gtagEvent("turn_into_video_clicked");
                        await onTurnIntoVideoClicked(
                          actionUrl,
                          selectedMediaToken,
                        );
                      }}
                    >
                      Make Video
                    </Button>
                  )}

                {onRemoveBackgroundClicked &&
                  actionUrl &&
                  derivedMediaClass === "image" && (
                    <Button
                      className="w-full"
                      variant="secondary"
                      icon={faWandMagicSparkles}
                      onClick={async (e) => {
                        e.stopPropagation();
                        gtagEvent("remove_background_clicked");
                        await onRemoveBackgroundClicked(
                          actionUrl,
                          selectedMediaToken,
                        );
                        onClose();
                        onCloseGallery();
                      }}
                    >
                      Remove BG
                    </Button>
                  )}

                {derivedMediaClass === "image" && (
                  <Button
                    className="w-full"
                    variant="secondary"
                    icon={faCube}
                    onClick={async (e) => {
                      gtagEvent("image_to_3d_clicked");
                      await EnqueueImageTo3dObject({
                        image_media_token: selectedMediaToken,
                        model: EnqueueImageTo3dObjectModel.Hunyuan3d3,
                        frontend_caller: "mini_app",
                      });
                    }}
                  >
                    Make 3D
                  </Button>
                )}

                {onMake3DWorldClicked &&
                  actionUrl &&
                  derivedMediaClass === "image" && (
                    <Button
                      className="w-full"
                      variant="secondary"
                      icon={faGlobe}
                      onClick={async (e) => {
                        e.stopPropagation();
                        gtagEvent("image_to_3d_world_clicked");
                        await onMake3DWorldClicked(
                          actionUrl,
                          selectedMediaToken,
                        );
                        onClose();
                        onCloseGallery();
                      }}
                    >
                      Make 3D World
                    </Button>
                  )}

                {onDownloadClicked && actionUrl && (
                  <Button
                    className={
                      derivedMediaClass === "image"
                        ? "w-full"
                        : "w-full col-span-2"
                    }
                    variant="secondary"
                    icon={faDownToLine}
                    onClick={async (e) => {
                      e.stopPropagation();
                      gtagEvent("download_clicked");
                      await onDownloadClicked(actionUrl, mediaClass);
                    }}
                  >
                    Download
                  </Button>
                )}

                {onAddToSceneClicked && actionUrl && (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={async (e) => {
                      e.stopPropagation();
                      gtagEvent("add_to_scene_clicked");
                      await onAddToSceneClicked(actionUrl, selectedMediaToken);
                      onClose();
                      onCloseGallery();
                    }}
                  >
                    Add to Scene
                  </Button>
                )}

                {selectedMediaToken && (
                  <Button
                    className="w-full"
                    variant="secondary"
                    icon={shareCopied ? faCheck : faLink}
                    onClick={async (e) => {
                      e.stopPropagation();
                      gtagEvent("share_link_copied");
                      const shareUrl = `https://getartcraft.com/media/${selectedMediaToken}`;
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        toast.success("Share link copied");
                        setShareCopied(true);
                        if (shareCopiedTimeoutRef.current) {
                          window.clearTimeout(shareCopiedTimeoutRef.current);
                        }
                        shareCopiedTimeoutRef.current = window.setTimeout(
                          () => {
                            setShareCopied(false);
                            shareCopiedTimeoutRef.current = null;
                          },
                          1500,
                        );
                      } catch (err) {
                        toast.error("Unable to copy link");
                      }
                    }}
                  >
                    {shareCopied ? "Link Copied!" : "Share"}
                  </Button>
                )}

                {selectedMediaToken && onDeleteClicked && (
                  <Button
                    icon={faTrashCan}
                    className="w-full"
                    variant="destructive"
                    onClick={async (e) => {
                      e.stopPropagation();
                      gtagEvent("delete_media_clicked");
                      await onDeleteClicked(selectedMediaToken);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
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
