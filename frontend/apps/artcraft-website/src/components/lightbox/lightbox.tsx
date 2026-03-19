import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { toast } from "@storyteller/ui-toaster";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { MediaFilesApi, PromptsApi } from "@storyteller/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faLink,
  faCheck,
  faArrowDownToLine,
  faPencil,
  faCircleInfo,
  faImage,
  faChevronLeft,
  faChevronRight,
  faTrashCan,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import {
  addCorsParam,
  getContextImageThumbnail,
  THUMBNAIL_SIZES,
  PLACEHOLDER_IMAGES,
} from "@storyteller/common";
import {
  getModelCreatorIcon,
  getModelDisplayName,
  getProviderDisplayName,
  getProviderIconByName,
} from "@storyteller/model-list";
import { ActionReminderModal } from "@storyteller/ui-action-reminder-modal";
import { Viewer3D } from "@storyteller/ui-viewer-3d";
import dayjs from "dayjs";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LightboxItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage?: string | null;
  createdAt: string;
  mediaClass?: string;
  batchImageToken?: string;
  mediaTokens?: string[];
  imageUrls?: string[];
}

interface ContextImage {
  media_links: { cdn_url: string; maybe_thumbnail_template: string };
  media_token: string;
  semantic: string;
}

interface PromptData {
  text: string | null;
  loading: boolean;
  hasToken: boolean;
  provider: string | null;
  modelType: string | null;
  contextImages: ContextImage[] | null;
}

const EMPTY_PROMPT: PromptData = {
  text: null,
  loading: false,
  hasToken: false,
  provider: null,
  modelType: null,
  contextImages: null,
};

const COPY_TIMEOUT = 1500;
const SHARE_URL_BASE = "https://getartcraft.com/media/";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
const MODEL_3D_EXTENSIONS = [".glb", ".gltf", ".fbx", ".spz"];

const isVideoUrl = (url: string): boolean =>
  VIDEO_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext));

const is3DModelUrl = (url: string): boolean =>
  MODEL_3D_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext));

// ── Helpers ────────────────────────────────────────────────────────────────

const useCopyFeedback = () => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const trigger = useCallback(() => {
    setCopied(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, COPY_TIMEOUT);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { copied, trigger };
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
    <span className="text-sm text-white/60 font-medium">{label}</span>
    <span className="text-sm text-white font-medium flex items-center gap-2">
      {value}
    </span>
  </div>
);

// ── Component ──────────────────────────────────────────────────────────────

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaToken?: string | null;
  cdnUrl?: string | null;
  imageUrls?: string[];
  mediaTokens?: string[];
  batchImageToken?: string;
  mediaClass?: string;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onDeleted?: (id: string) => void;
}

export function Lightbox({
  isOpen,
  onClose,
  mediaToken,
  cdnUrl,
  imageUrls: propImageUrls,
  mediaTokens: propMediaTokens,
  batchImageToken: propBatchImageToken,
  mediaClass: propMediaClass,
  onNavigatePrev,
  onNavigateNext,
  onDeleted,
}: LightboxProps) {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [promptData, setPromptData] = useState<PromptData>(EMPTY_PROMPT);
  const [batchImages, setBatchImages] = useState<string[] | null>(null);
  const [batchTokens, setBatchTokens] = useState<string[] | null>(null);
  const [mediaWidth, setMediaWidth] = useState<number | undefined>();
  const [mediaHeight, setMediaHeight] = useState<number | undefined>();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isPromptClamped, setIsPromptClamped] = useState(false);
  const [discoveredBatchToken, setDiscoveredBatchToken] = useState<string | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  const promptCopy = useCopyFeedback();
  const shareCopy = useCopyFeedback();

  const mediaFilesApi = useMemo(() => new MediaFilesApi(), []);
  const promptsApi = useMemo(() => new PromptsApi(), []);

  // Reset on open / mediaToken change
  useEffect(() => {
    if (isOpen) {
      setMediaLoaded(false);
      setSelectedIndex(0);
      setIsPromptExpanded(false);
      setMediaWidth(undefined);
      setMediaHeight(undefined);
      setDiscoveredBatchToken(null);
    }
  }, [isOpen, mediaToken]);

  // Fetch prompt + details when mediaToken changes
  useEffect(() => {
    if (!mediaToken || !isOpen) {
      setPromptData(EMPTY_PROMPT);
      return;
    }

    setPromptData({ ...EMPTY_PROMPT, loading: true });
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const mediaResponse = await mediaFilesApi.GetMediaFileByToken({
          mediaFileToken: mediaToken,
        });
        if (cancelled) return;

        if (mediaResponse.success && mediaResponse.data) {
          // Auto-discover batch token from media file
          const batchToken = (mediaResponse.data as any)?.maybe_batch_token;
          if (batchToken) setDiscoveredBatchToken(batchToken);
        }

        if (
          mediaResponse.success &&
          mediaResponse.data?.maybe_prompt_token
        ) {
          const promptResponse = await promptsApi.GetPromptsByToken({
            token: mediaResponse.data.maybe_prompt_token,
          });
          if (cancelled) return;

          const d = promptResponse.success ? promptResponse.data : null;
          setPromptData({
            text: d?.maybe_positive_prompt || null,
            loading: false,
            hasToken: true,
            provider: d?.maybe_generation_provider || null,
            modelType: d?.maybe_model_type || null,
            contextImages: d?.maybe_context_images || null,
          });
        } else {
          if (!cancelled) setPromptData(EMPTY_PROMPT);
        }
      } catch {
        if (!cancelled) setPromptData(EMPTY_PROMPT);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mediaToken, isOpen, mediaFilesApi, promptsApi]);

  // Fetch batch images (from prop or auto-discovered batch token)
  const effectiveBatchToken = propBatchImageToken || discoveredBatchToken;

  useEffect(() => {
    if (!effectiveBatchToken || !isOpen) {
      setBatchImages(null);
      setBatchTokens(null);
      return;
    }

    setBatchImages(null);
    setBatchTokens(null);
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const response = await mediaFilesApi.GetMediaFilesByBatchToken({
          batchToken: effectiveBatchToken,
        });
        if (cancelled) return;

        if (response.success && response.data?.length) {
          const items = response.data
            .map((file: any) => ({
              url: file.media_links?.cdn_url,
              token: file.token,
            }))
            .filter(
              (item: any): item is { url: string; token: string } =>
                Boolean(item.url) && Boolean(item.token),
            );

          if (items.length > 0) {
            const sorted = [...items].sort((a, b) => {
              if (mediaToken === a.token) return -1;
              if (mediaToken === b.token) return 1;
              if (cdnUrl === a.url) return -1;
              if (cdnUrl === b.url) return 1;
              return 0;
            });
            setBatchImages(sorted.map((i) => i.url));
            setBatchTokens(sorted.map((i) => i.token));
          }
        }
      } catch {
        // ignore
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [effectiveBatchToken, mediaToken, cdnUrl, isOpen, mediaFilesApi]);

  // Detect prompt clamping
  useEffect(() => {
    if (!promptRef.current || !promptData.text || promptData.loading) {
      setIsPromptClamped(false);
      return;
    }
    const raf = requestAnimationFrame(() => {
      if (promptRef.current) {
        setIsPromptClamped(
          promptRef.current.scrollHeight > promptRef.current.clientHeight,
        );
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [promptData.text, promptData.loading, isPromptExpanded]);

  // Effective image URLs
  const effectiveImageUrls = useMemo(() => {
    if (batchImages && batchImages.length > 0) return batchImages;
    if (propImageUrls && propImageUrls.length > 0) return propImageUrls;
    return cdnUrl ? [cdnUrl] : [];
  }, [batchImages, propImageUrls, cdnUrl]);

  // Carousel
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
  }, [propBatchImageToken, cdnUrl, emblaMainApi, emblaThumbsApi]);

  const selectedImageUrl = effectiveImageUrls[selectedIndex] ?? null;
  const selectedMediaToken = useMemo(() => {
    return batchTokens?.[selectedIndex] ?? propMediaTokens?.[selectedIndex] ?? mediaToken;
  }, [batchTokens, propMediaTokens, selectedIndex, mediaToken]);

  const isVideo = selectedImageUrl ? isVideoUrl(selectedImageUrl) : (propMediaClass === "video");
  const is3D = selectedImageUrl ? is3DModelUrl(selectedImageUrl) : (propMediaClass === "dimensional");

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!selectedMediaToken) return;
    try {
      await mediaFilesApi.DeleteMediaFileByToken({
        mediaFileToken: selectedMediaToken,
      });
      toast.success("Media deleted");
      onDeleted?.(selectedMediaToken);
      onClose();
    } catch {
      toast.error("Failed to delete media");
    } finally {
      setConfirmDeleteOpen(false);
    }
  }, [selectedMediaToken, mediaFilesApi, onDeleted, onClose]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="rounded-xl h-[680px] w-[1100px] max-w-[95vw] max-h-[90vh] p-0"
        showClose={false}
      >
        <div className="flex h-full">
          {/* Media preview panel */}
          <div className="group/nav relative flex h-full flex-1 items-center justify-center overflow-hidden rounded-l-xl bg-black">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-40 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>

            {!selectedImageUrl ? (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-base-fg/60">Media not available</span>
              </div>
            ) : is3D ? (
              <Viewer3D
                key={selectedImageUrl}
                modelUrl={addCorsParam(selectedImageUrl) || selectedImageUrl}
                isActive
                className="h-full w-full"
              />
            ) : isVideo ? (
              <video
                key={selectedImageUrl}
                controls
                loop
                autoPlay
                muted
                playsInline
                className="h-full w-full object-contain"
                onLoadedData={() => setMediaLoaded(true)}
              >
                <source src={selectedImageUrl} type="video/mp4" />
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
                        <div className="relative flex h-full items-center justify-center overflow-hidden bg-black">
                          <img
                            src={addCorsParam(url) || url}
                            alt={`Image ${idx + 1}`}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              if (idx === selectedIndex) {
                                setMediaLoaded(true);
                              }
                              const target = e.currentTarget;
                              if (target.dataset.fallback) return;
                              target.dataset.fallback = "1";
                              target.src = PLACEHOLDER_IMAGES.DEFAULT;
                              target.style.opacity = "0.3";
                            }}
                            onLoad={(e) => {
                              if (idx === selectedIndex) {
                                setMediaLoaded(true);
                                const img = e.currentTarget;
                                setMediaWidth(img.naturalWidth);
                                setMediaHeight(img.naturalHeight);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {effectiveImageUrls.length > 1 && (
                  <div className="mt-3 px-2 pb-2">
                    <div className="embla-thumbs overflow-hidden" ref={emblaThumbsRef}>
                      <div className="embla-thumbs__container flex gap-2 justify-center">
                        {effectiveImageUrls.map((url, idx) => (
                          <button
                            key={`${url}-thumb-${idx}`}
                            type="button"
                            onClick={() => onThumbClick(idx)}
                            className={`relative h-16 w-16 flex-[0_0_4rem] overflow-hidden rounded-md border-2 transition-all ${
                              idx === selectedIndex
                                ? "border-primary-400 opacity-100"
                                : "border-transparent opacity-60 hover:border-white/40 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={addCorsParam(url) || url}
                              alt={`Thumbnail ${idx + 1}`}
                              className="h-full w-full object-cover bg-black/20"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!mediaLoaded && selectedImageUrl && !isVideo && !is3D && (
              <div className="absolute inset-0 flex items-center justify-center bg-ui-panel">
                <LoadingSpinner className="h-12 w-12 text-base-fg" />
              </div>
            )}

            {/* Gallery navigation arrows */}
            {onNavigatePrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigatePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/70 opacity-0 transition-opacity duration-200 hover:bg-black/70 hover:text-white group-hover/nav:opacity-100"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/70 opacity-0 transition-opacity duration-200 hover:bg-black/70 hover:text-white group-hover/nav:opacity-100"
                aria-label="Next item"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-lg" />
              </button>
            )}
          </div>

          {/* Info sidebar */}
          <div className="flex h-full w-[300px] shrink-0 flex-col bg-ui-panel rounded-r-xl">
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 min-h-0">
              {promptData.loading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-white/10 rounded" />
                    <div className="h-20 w-full bg-white/10 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-10 w-full bg-white/10 rounded-lg" />
                    <div className="h-10 w-full bg-white/10 rounded-lg" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Prompt */}
                  {promptData.hasToken && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                          <FontAwesomeIcon icon={faPencil} />
                          <span>Prompt</span>
                        </div>
                        {promptData.text && (
                          <button
                            onClick={() => {
                              if (!promptData.text) return;
                              navigator.clipboard
                                .writeText(promptData.text)
                                .catch(() => {});
                              toast.success("Prompt copied");
                              promptCopy.trigger();
                            }}
                            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={promptCopy.copied ? faCheck : faCopy}
                              className="h-3 w-3"
                            />
                            <span>
                              {promptCopy.copied ? "Copied" : "Copy"}
                            </span>
                          </button>
                        )}
                      </div>

                      <div className="text-sm text-white/90 break-words px-4 py-3 rounded-xl bg-black/20 leading-relaxed border border-white/5">
                        <div
                          ref={promptRef}
                          className={!isPromptExpanded ? "line-clamp-4" : ""}
                        >
                          {promptData.text || (
                            <span className="text-white/60">No prompt</span>
                          )}
                        </div>
                      </div>

                      {promptData.text &&
                        (isPromptClamped || isPromptExpanded) && (
                          <button
                            className="flex w-full items-center justify-center gap-1 text-xs text-white/70 hover:text-white transition-colors py-1"
                            onClick={() =>
                              setIsPromptExpanded((prev) => !prev)
                            }
                          >
                            <span>
                              {isPromptExpanded ? "Show less" : "Show more"}
                            </span>
                          </button>
                        )}
                    </div>
                  )}

                  {/* Reference Images */}
                  {promptData.contextImages &&
                    promptData.contextImages.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                          <FontAwesomeIcon icon={faImage} />
                          <span>Reference Images</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {promptData.contextImages.map(
                            (contextImage, index) => {
                              const { thumbnail } =
                                getContextImageThumbnail(contextImage, {
                                  size: THUMBNAIL_SIZES.SMALL,
                                });
                              return (
                                <a
                                  key={contextImage.media_token}
                                  href={`/media/${contextImage.media_token}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative aspect-square overflow-hidden rounded-lg border border-white/10 hover:border-white/40 transition-colors block"
                                >
                                  <img
                                    src={thumbnail}
                                    alt={`Reference ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </a>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}

                  {/* Generation Details */}
                  {(promptData.provider || promptData.modelType) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                        <FontAwesomeIcon icon={faCircleInfo} />
                        <span>Information</span>
                      </div>

                      <div className="flex flex-col rounded-xl bg-black/20 border border-white/5 overflow-hidden">
                        {promptData.modelType && (
                          <InfoRow
                            label="Model"
                            value={
                              <>
                                {getModelCreatorIcon(promptData.modelType)}
                                <span>
                                  {getModelDisplayName(promptData.modelType)}
                                </span>
                              </>
                            }
                          />
                        )}
                        {promptData.provider && (
                          <InfoRow
                            label="Provider"
                            value={
                              <>
                                {getProviderIconByName(
                                  promptData.provider,
                                  "h-4 w-4 invert",
                                )}
                                <span>
                                  {getProviderDisplayName(promptData.provider)}
                                </span>
                              </>
                            }
                          />
                        )}
                        {mediaWidth && mediaHeight && (
                          <InfoRow
                            label="Size"
                            value={`${mediaWidth} x ${mediaHeight}`}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="p-4 pt-2 space-y-2 border-t border-white/5">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="w-full border border-ui-panel-border bg-ui-controls/40 hover:bg-ui-controls/60 text-white"
                  icon={shareCopy.copied ? faCheck : faLink}
                  variant="secondary"
                  onClick={async () => {
                    if (!selectedMediaToken) return;
                    const shareUrl = `${SHARE_URL_BASE}${selectedMediaToken}`;
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Share link copied");
                      shareCopy.trigger();
                    } catch {
                      toast.error("Unable to copy link");
                    }
                  }}
                >
                  {shareCopy.copied ? "Copied" : "Share"}
                </Button>
                <a
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors border border-ui-panel-border ${
                    selectedImageUrl
                      ? "bg-ui-controls/40 hover:bg-ui-controls/60 text-white"
                      : "bg-ui-controls/20 text-white/60 cursor-not-allowed pointer-events-none"
                  }`}
                  href={
                    selectedImageUrl
                      ? addCorsParam(selectedImageUrl) || selectedImageUrl
                      : undefined
                  }
                  download={
                    selectedImageUrl
                      ? `artcraft-${selectedMediaToken || "media"}`
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FontAwesomeIcon icon={faArrowDownToLine} />
                  Download
                </a>
              </div>
              {selectedMediaToken && (
                <Button
                  icon={faTrashCan}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                  variant="destructive"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ActionReminderModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete this media?"
        message={
          <span className="text-sm text-white/80">
            This will permanently remove the media from your library. This
            action cannot be undone.
          </span>
        }
        onPrimaryAction={handleDelete}
        primaryActionText="Delete"
        secondaryActionText="Cancel"
        primaryActionIcon={faTrashCan}
        primaryActionBtnClassName="bg-red-500/10 hover:bg-red-500/20 text-red-500"
      />
    </>
  );
}

export default Lightbox;
