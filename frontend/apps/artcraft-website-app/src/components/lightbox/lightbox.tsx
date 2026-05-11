import { Modal } from "@storyteller/ui-modal";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { toast } from "../toast/toast";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MediaFilesApi, PromptsApi, type UserInfo } from "@storyteller/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faTrashCan,
} from "@fortawesome/pro-solid-svg-icons";
import { addCorsParam, PLACEHOLDER_IMAGES } from "@storyteller/common";
import { ActionReminderModal } from "@storyteller/ui-action-reminder-modal";
import { Viewer3D } from "@storyteller/ui-viewer-3d";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";
import {
  createPromptData,
  EMPTY_PROMPT,
  is3DModelUrl,
  isVideoUrl,
  type PromptData,
} from "./shared";
import { LightboxDetails } from "./LightboxDetails";
import {
  applyMakeVideoFromImage,
  applyRecreateFromMediaToken,
} from "../../lib/recreate";

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
  /** When false, suppress batch carousel (batch siblings shown as separate gallery cards instead). Default true. */
  showBatchCarousel?: boolean;
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
  showBatchCarousel = true,
}: LightboxProps) {
  const navigate = useNavigate();
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [promptData, setPromptData] = useState<PromptData>(EMPTY_PROMPT);
  const [creator, setCreator] = useState<UserInfo | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [batchImages, setBatchImages] = useState<string[] | null>(null);
  const [batchTokens, setBatchTokens] = useState<string[] | null>(null);
  const [mediaWidth, setMediaWidth] = useState<number | undefined>();
  const [mediaHeight, setMediaHeight] = useState<number | undefined>();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [discoveredBatchToken, setDiscoveredBatchToken] = useState<
    string | null
  >(null);

  const mediaFilesApi = useMemo(() => new MediaFilesApi(), []);
  const promptsApi = useMemo(() => new PromptsApi(), []);

  // Reset on open / mediaToken change
  useEffect(() => {
    if (isOpen) {
      setMediaLoaded(false);
      setSelectedIndex(0);
      setMediaWidth(undefined);
      setMediaHeight(undefined);
      setDiscoveredBatchToken(null);
    }
  }, [isOpen, mediaToken]);

  // Fetch prompt + details when mediaToken changes
  useEffect(() => {
    if (!mediaToken || !isOpen) {
      setPromptData(EMPTY_PROMPT);
      setCreator(null);
      setCreatedAt(null);
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
          const file = mediaResponse.data;
          setCreator(file.maybe_creator_user || null);
          setCreatedAt(file.created_at || null);
          const batchToken = (file as any)?.maybe_batch_token;
          if (batchToken) setDiscoveredBatchToken(batchToken);

          if (file.maybe_prompt_token) {
            const promptResponse = await promptsApi.GetPromptsByToken({
              token: file.maybe_prompt_token,
            });
            if (cancelled) return;

            const d = promptResponse.success ? promptResponse.data : null;
            setPromptData(createPromptData(d, true, false));
          } else {
            setPromptData(EMPTY_PROMPT);
          }
        } else {
          setPromptData(EMPTY_PROMPT);
          setCreator(null);
          setCreatedAt(null);
        }
      } catch {
        if (!cancelled) {
          setPromptData(EMPTY_PROMPT);
          setCreator(null);
          setCreatedAt(null);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mediaToken, isOpen, mediaFilesApi, promptsApi]);

  // Fetch batch images (from prop or auto-discovered batch token)
  const effectiveBatchToken = showBatchCarousel
    ? propBatchImageToken || discoveredBatchToken
    : undefined;

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
    return (
      batchTokens?.[selectedIndex] ??
      propMediaTokens?.[selectedIndex] ??
      mediaToken
    );
  }, [batchTokens, propMediaTokens, selectedIndex, mediaToken]);

  const isVideo = selectedImageUrl
    ? isVideoUrl(selectedImageUrl)
    : propMediaClass === "video";
  const is3D = selectedImageUrl
    ? is3DModelUrl(selectedImageUrl)
    : propMediaClass === "dimensional";

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

  const recreateMediaClass: "image" | "video" | null = isVideo
    ? "video"
    : is3D
      ? null
      : "image";

  const handleRecreate = useCallback(async () => {
    if (!selectedMediaToken || !recreateMediaClass) return;
    onClose();
    await applyRecreateFromMediaToken(
      selectedMediaToken,
      recreateMediaClass,
      navigate,
    );
  }, [selectedMediaToken, recreateMediaClass, navigate, onClose]);

  const canMakeVideo = !isVideo && !is3D;
  const handleMakeVideo = useCallback(() => {
    if (!selectedMediaToken || !selectedImageUrl || !canMakeVideo) return;
    onClose();
    applyMakeVideoFromImage(selectedMediaToken, selectedImageUrl, navigate);
  }, [selectedMediaToken, selectedImageUrl, canMakeVideo, navigate, onClose]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="rounded-xl h-[90vh] sm:h-[680px] w-full sm:w-[1100px] max-w-[95vw] max-h-[90vh] p-0 border-white/5 shadow-2xl"
        backdropClassName="!bg-black/80"
        showClose={false}
      >
        <div className="flex flex-col sm:flex-row h-full">
          {/* Media preview panel */}
          <div className="group/nav relative flex h-[45vh] sm:h-full flex-1 items-center justify-center overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none bg-black">
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
                disablePictureInPicture
                controlsList="nodownload noplaybackrate nofullscreen"
                className="h-full w-full object-contain"
                onLoadedData={(e) => {
                  setMediaLoaded(true);
                  const el = e.currentTarget;
                  setMediaWidth(el.videoWidth);
                  setMediaHeight(el.videoHeight);
                }}
                ref={(el) => {
                  if (el) {
                    el.setAttribute("webkit-playsinline", "true");
                    el.setAttribute("x-webkit-airplay", "deny");
                  }
                }}
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
                    <div
                      className="embla-thumbs overflow-hidden"
                      ref={emblaThumbsRef}
                    >
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
              <div className="absolute inset-0 flex items-center justify-center bg-black">
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
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/50 text-white/70 sm:opacity-0 transition-opacity duration-200 hover:bg-black/70 hover:text-white sm:group-hover/nav:opacity-100"
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
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/50 text-white/70 sm:opacity-0 transition-opacity duration-200 hover:bg-black/70 hover:text-white sm:group-hover/nav:opacity-100"
                aria-label="Next item"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-lg" />
              </button>
            )}
          </div>

          <LightboxDetails
            promptData={promptData}
            mediaToken={selectedMediaToken}
            mediaUrl={selectedImageUrl}
            mediaWidth={mediaWidth}
            mediaHeight={mediaHeight}
            createdAt={createdAt}
            creator={creator}
            onClose={onClose}
            onRecreate={recreateMediaClass ? handleRecreate : undefined}
            onMakeVideo={
              canMakeVideo && selectedMediaToken && selectedImageUrl
                ? handleMakeVideo
                : undefined
            }
            onDelete={
              selectedMediaToken
                ? () => setConfirmDeleteOpen(true)
                : undefined
            }
          />
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
