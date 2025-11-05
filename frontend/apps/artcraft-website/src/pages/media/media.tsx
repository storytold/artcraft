import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { Button } from "@storyteller/ui-button";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { toast } from "@storyteller/ui-toaster";
import { MediaFilesApi, PromptsApi } from "@storyteller/api";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faLink,
  faCheck,
  faArrowDownToLine,
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

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
const COPY_FEEDBACK_DURATION = 1500;
const SHARE_URL_BASE = 'https://getartcraft.com/media/';

const isVideoUrl = (url: string): boolean => {
  const urlLower = url.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => urlLower.includes(ext));
};

interface ContextImage {
  media_links: { cdn_url: string; maybe_thumbnail_template: string };
  media_token: string;
  semantic: string;
}

interface MediaData {
  url: string | null;
  token: string | null;
  createdAt: string | null;
  isVideo: boolean;
  isLoaded: boolean;
}

interface PromptData {
  text: string | null;
  loading: boolean;
  hasToken: boolean;
  provider: string | null;
  modelType: string | null;
  contextImages: ContextImage[] | null;
}

const EMPTY_PROMPT_DATA: PromptData = {
  text: null,
  loading: false,
  hasToken: false,
  provider: null,
  modelType: null,
  contextImages: null,
};

const createPromptData = (
  data: any,
  hasToken: boolean,
  loading: boolean = false
): PromptData => ({
  text: data?.maybe_positive_prompt || null,
  loading,
  hasToken,
  provider: data?.maybe_generation_provider || null,
  modelType: data?.maybe_model_type || null,
  contextImages: data?.maybe_context_images || null,
});

const useCopyFeedback = () => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const triggerCopy = useCallback(() => {
    setCopied(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, COPY_FEEDBACK_DURATION);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copied, triggerCopy };
};

export default function MediaPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const mediaIdParam = routeId || searchParams.get("media") || undefined;

  const [media, setMedia] = useState<MediaData>({
    url: null,
    token: null,
    createdAt: null,
    isVideo: false,
    isLoaded: false,
  });
  const [mediaRecordLoading, setMediaRecordLoading] = useState(true);

  const [promptData, setPromptData] = useState<PromptData>(EMPTY_PROMPT_DATA);
  const [isPromptHovered, setIsPromptHovered] = useState(false);

  const shareCopy = useCopyFeedback();
  const promptCopy = useCopyFeedback();

  const loadMedia = useCallback(async (id: string) => {
    setMedia(prev => ({ ...prev, isLoaded: false }));
    setMediaRecordLoading(true);

    const mediaFilesApi = new MediaFilesApi();
    try {
      const mediaResponse = await mediaFilesApi.GetMediaFileByToken({
        mediaFileToken: id,
      });

      if (mediaResponse.success && mediaResponse.data) {
        const file = mediaResponse.data;
        const url = file.media_links?.cdn_url || null;
        
        setMedia({
          url,
          token: file.token || id,
          createdAt: file.created_at || null,
          isVideo: url ? isVideoUrl(url) : false,
          isLoaded: false,
        });

        if (file.maybe_prompt_token) {
          setPromptData(prev => ({ ...prev, hasToken: true, loading: true }));
          
          try {
            const promptsApi = new PromptsApi();
            const promptResponse = await promptsApi.GetPromptsByToken({
              token: file.maybe_prompt_token,
            });

            const data = promptResponse.success ? promptResponse.data : null;
            setPromptData(createPromptData(data, true, false));
          } catch {
            setPromptData(prev => ({ ...prev, loading: false }));
          }
        } else {
          setPromptData(EMPTY_PROMPT_DATA);
        }
      } else {
        setMedia({ url: null, token: null, createdAt: null, isVideo: false, isLoaded: false });
        toast.error("Media not found");
      }
    } catch {
      setMedia({ url: null, token: null, createdAt: null, isVideo: false, isLoaded: false });
      toast.error("Failed to load media");
    } finally {
      setMediaRecordLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mediaIdParam) {
      loadMedia(mediaIdParam);
    }
  }, [mediaIdParam, loadMedia]);

  useEffect(() => {
    if (!media.url) return;
    
    if (media.isVideo) {
      setMedia(prev => ({ ...prev, isLoaded: true }));
      return;
    }
    
    const img = new Image();
    img.src = addCorsParam(media.url) || media.url;
    const handleLoad = () => setMedia(prev => ({ ...prev, isLoaded: true }));
    
    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleLoad);
    }
    
    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleLoad);
    };
  }, [media.url, media.isVideo]);

  const handleCopyPrompt = useCallback(async () => {
    if (!promptData.text) return;
    try {
      await navigator.clipboard.writeText(promptData.text);
      promptCopy.triggerCopy();
    } catch {
      toast.error("Unable to copy prompt");
    }
  }, [promptData.text, promptCopy]);

  const handleCopyShareLink = useCallback(async () => {
    if (!media.token) return;
    const shareUrl = `${SHARE_URL_BASE}${media.token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      shareCopy.triggerCopy();
      toast.success("Share link copied");
    } catch {
      toast.error("Unable to copy link");
    }
  }, [media.token, shareCopy]);

  const shareButtonIcon = shareCopy.copied ? faCheck : faLink;
  const shareButtonText = shareCopy.copied ? "Share link copied" : "Copy Share Link";

  return (
    <div className="relative min-h-screen w-full px-4 sm:px-6 pt-24 pb-8 bg-dots">
      <div className="mx-auto max-w-7xl">
        <div className="grid h-full grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 relative flex min-h-[360px] sm:min-h-[420px] items-center justify-center overflow-hidden rounded-xl bg-black/30">
            {mediaRecordLoading ? (
              <div className="absolute inset-0 animate-pulse">
                <div className="h-full w-full bg-white/5" />
              </div>
            ) : media.url ? (
              <div className="relative flex h-full w-full items-center justify-center">
                {media.isVideo ? (
                  <video
                    src={addCorsParam(media.url) || media.url}
                    className="max-h-[75vh] w-full object-contain"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => console.error('Video failed to load')}
                    onLoadedData={() => setMedia(prev => ({ ...prev, isLoaded: true }))}
                  />
                ) : (
                  <>
                    <img
                      src={addCorsParam(media.url) || media.url}
                      alt="Generated image"
                      className="max-h-[75vh] w-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGES.DEFAULT;
                        (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                        setMedia(prev => ({ ...prev, isLoaded: true }));
                      }}
                      onLoad={() => setMedia(prev => ({ ...prev, isLoaded: true }))}
                    />
                    {!media.isLoaded && (
                      <div className="absolute inset-0 bg-ui-panel/80 flex items-center justify-center">
                        <LoadingSpinner className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-white/60">Media not available</span>
              </div>
            )}
          </div>

          <div className="flex h-full flex-col lg:col-span-1 mt-6 lg:mt-0">
            <div className="flex-1 space-y-5 text-white">
              {mediaRecordLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="space-y-1.5">
                    <div className="h-4 w-20 bg-white/10 rounded" />
                    <div className="h-4 w-40 bg-white/10 rounded" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-16 bg-white/10 rounded" />
                    <div className="h-20 w-full bg-white/10 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square w-14 bg-white/10 rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-white/10 rounded" />
                    <div className="h-10 w-full bg-white/10 rounded-lg" />
                    <div className="h-10 w-full bg-white/10 rounded-lg" />
                  </div>
                </div>
              ) : (
                <>
                  {media.createdAt && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-white/90">
                        Created
                      </div>
                      <div className="text-sm text-white/70">
                        {dayjs(media.createdAt).format("MMM D, YYYY")} at{" "}
                        {dayjs(media.createdAt).format("hh:mm A")}
                      </div>
                    </div>
                  )}

                  {promptData.hasToken && (
                    <>
                      <div className="relative space-y-1.5">
                        <div className="text-sm font-medium text-white/90">
                          Prompt
                        </div>
                        <div
                          className="relative text-sm text-white break-words p-3 rounded-lg cursor-pointer transition-colors duration-100 leading-relaxed bg-ui-controls/20 backdrop-blur-md"
                          onMouseEnter={() => setIsPromptHovered(true)}
                          onMouseLeave={() => setIsPromptHovered(false)}
                          onClick={handleCopyPrompt}
                        >
                          {promptData.loading ? (
                            <div className="flex items-center gap-2">
                              <LoadingSpinner className="h-4 w-4" />
                              <span className="text-sm text-white/80">
                                Loading prompt...
                              </span>
                            </div>
                          ) : (
                            promptData.text || (
                              <span className="text-sm text-white">
                                No prompt
                              </span>
                            )
                          )}
                        </div>
                        {!promptData.loading && (
                          <div
                            className={twMerge(
                              "pointer-events-none absolute inset-0 flex items-end justify-end opacity-0 transition-opacity duration-50",
                              (isPromptHovered || promptCopy.copied) && "opacity-100"
                            )}
                          >
                            <div className="flex items-center gap-1 text-xs text-white backdrop-blur-md p-1.5 rounded-tl-lg rounded-br-lg bg-ui-controls/40">
                              <FontAwesomeIcon
                                icon={promptCopy.copied ? faCheck : faCopy}
                                className="h-3 w-3"
                              />
                              <span>
                                {promptCopy.copied ? "Prompt copied" : "Copy prompt"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {promptData.contextImages && promptData.contextImages.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-sm font-medium text-white/90">
                            Reference Images
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {promptData.contextImages.map((contextImage, index) => {
                              const { thumbnail } = getContextImageThumbnail(
                                contextImage,
                                { size: THUMBNAIL_SIZES.SMALL }
                              );
                              return (
                                <div
                                  key={contextImage.media_token}
                                  className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30"
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

                      {(promptData.provider || promptData.modelType) && (
                        <div className="space-y-1.5">
                          <div className="text-sm font-medium text-white/90">
                            Generation Details
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {promptData.modelType && (
                              <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-ui-panel-border/40 bg-ui-controls/20 backdrop-blur-md">
                                <span className="text-sm text-white/70 font-medium">
                                  Model
                                </span>
                                <div className="flex items-center gap-2">
                                  {getModelCreatorIcon(promptData.modelType)}
                                  <span className="text-sm text-white rounded">
                                    {getModelDisplayName(promptData.modelType)}
                                  </span>
                                </div>
                              </div>
                            )}
                            {promptData.provider && (
                              <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-ui-panel-border/40 bg-ui-controls/20 backdrop-blur-md">
                                <span className="text-sm text-white/70 font-medium">
                                  Provider
                                </span>
                                <div className="flex items-center gap-2">
                                  {getProviderIconByName(promptData.provider, "h-4 w-4 invert")}
                                  <span className="text-sm text-white rounded">
                                    {getProviderDisplayName(promptData.provider)}
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
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <Button
                className="w-full border-0 shadow-none"
                icon={shareButtonIcon}
                variant="secondary"
                onClick={handleCopyShareLink}
              >
                {shareButtonText}
              </Button>
              <a
                className={twMerge(
                  "w-full border-0 shadow-none inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  media.url
                    ? "bg-ui-controls hover:bg-ui-controls/80 text-base-fg"
                    : "bg-ui-controls text-base-fg cursor-not-allowed pointer-events-none"
                )}
                href={media.url ? addCorsParam(media.url) || media.url : undefined}
                download={
                  media.url ? `artcraft-${media.token || (media.isVideo ? "video" : "image")}` : undefined
                }
                aria-disabled={!media.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={faArrowDownToLine} />
                Download {media.isVideo ? 'Video' : 'Image'}
              </a>
              <Button
              icon={faArrowDownToLine}
                className="w-full col-span-2 border-0 shadow-none"
                variant="primary"
                onClick={() => {
                  window.location.href = "/download";
                }}
              >
                Download ArtCraft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
