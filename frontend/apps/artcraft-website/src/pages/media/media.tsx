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
  faDownToLine,
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
} from "@storyteller/model-list";

export default function MediaPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const mediaIdParam = routeId || searchParams.get("media") || undefined;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mediaToken, setMediaToken] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState<boolean>(false);
  const [mediaRecordLoading, setMediaRecordLoading] = useState<boolean>(true);

  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState<boolean>(false);
  const [hasPromptToken, setHasPromptToken] = useState<boolean>(false);
  const [isPromptHovered, setIsPromptHovered] = useState<boolean>(false);
  const [generationProvider, setGenerationProvider] = useState<string | null>(
    null
  );
  const [modelType, setModelType] = useState<string | null>(null);
  const [contextImages, setContextImages] = useState<Array<{
    media_links: { cdn_url: string; maybe_thumbnail_template: string };
    media_token: string;
    semantic: string;
  }> | null>(null);

  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const shareCopiedTimeoutRef = useRef<number | null>(null);
  const [promptCopied, setPromptCopied] = useState<boolean>(false);
  const promptCopiedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shareCopiedTimeoutRef.current) {
        window.clearTimeout(shareCopiedTimeoutRef.current);
        shareCopiedTimeoutRef.current = null;
      }
      if (promptCopiedTimeoutRef.current) {
        window.clearTimeout(promptCopiedTimeoutRef.current);
        promptCopiedTimeoutRef.current = null;
      }
    };
  }, []);

  const loadMedia = useCallback(async (id: string) => {
    setMediaLoaded(false);
    setShareCopied(false);
    setMediaRecordLoading(true);
    const mediaFilesApi = new MediaFilesApi();
    try {
      const mediaResponse = await mediaFilesApi.GetMediaFileByToken({
        mediaFileToken: id,
      });
      if (mediaResponse.success && mediaResponse.data) {
        const file = mediaResponse.data;
        const url = file.media_links?.cdn_url || null;
        setImageUrl(url);
        setMediaToken(file.token || id);
        setCreatedAt(file.created_at || null);

        if (file.maybe_prompt_token) {
          setHasPromptToken(true);
          setPromptLoading(true);
          try {
            const promptsApi = new PromptsApi();
            const promptResponse = await promptsApi.GetPromptsByToken({
              token: file.maybe_prompt_token,
            });
            if (promptResponse.success && promptResponse.data) {
              const promptData = promptResponse.data;
              setPrompt(promptData.maybe_positive_prompt || null);
              setGenerationProvider(
                promptData.maybe_generation_provider || null
              );
              setModelType(promptData.maybe_model_type || null);
              setContextImages(promptData.maybe_context_images || null);
            } else {
              setPrompt(null);
              setGenerationProvider(null);
              setModelType(null);
              setContextImages(null);
            }
          } finally {
            setPromptLoading(false);
          }
        } else {
          setHasPromptToken(false);
          setPrompt(null);
          setGenerationProvider(null);
          setModelType(null);
          setContextImages(null);
        }
      } else {
        setImageUrl(null);
        setMediaToken(null);
        toast.error("Media not found");
      }
    } catch (err) {
      setImageUrl(null);
      setMediaToken(null);
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
    if (!imageUrl) return;
    setMediaLoaded(false);
    const img = new Image();
    img.src = addCorsParam(imageUrl) || imageUrl;
    const onLoad = () => setMediaLoaded(true);
    const onError = () => setMediaLoaded(true);
    if (img.complete) setMediaLoaded(true);
    else {
      img.addEventListener("load", onLoad);
      img.addEventListener("error", onError);
    }
    return () => {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
    };
  }, [imageUrl]);

  const handleCopyPrompt = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      if (promptCopiedTimeoutRef.current) {
        window.clearTimeout(promptCopiedTimeoutRef.current);
      }
      promptCopiedTimeoutRef.current = window.setTimeout(() => {
        setPromptCopied(false);
        promptCopiedTimeoutRef.current = null;
      }, 1500);
    } catch (err) {
      toast.error("Unable to copy prompt");
    }
  }, [prompt]);

  const handleCopyShareLink = useCallback(async () => {
    if (!mediaToken) return;
    const shareUrl = `https://getartcraft.com/media/${mediaToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      if (shareCopiedTimeoutRef.current) {
        window.clearTimeout(shareCopiedTimeoutRef.current);
      }
      shareCopiedTimeoutRef.current = window.setTimeout(() => {
        setShareCopied(false);
        shareCopiedTimeoutRef.current = null;
      }, 1500);
      toast.success("Share link copied");
    } catch (err) {
      toast.error("Unable to copy link");
    }
  }, [mediaToken]);

  // Download handled via anchor-style button link

  const shareButtonIcon = shareCopied ? faCheck : faLink;
  const shareButtonText = shareCopied ? "Share link copied" : "Copy Share Link";

  return (
    <div className="relative min-h-screen w-full px-4 sm:px-6 pt-24 pb-8 bg-dots">
      <div className="mx-auto max-w-7xl">
        <div className="grid h-full grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 relative flex min-h-[360px] sm:min-h-[420px] items-center justify-center overflow-hidden rounded-xl bg-black/30">
            {mediaRecordLoading ? (
              <div className="absolute inset-0 animate-pulse">
                <div className="h-full w-full bg-white/5" />
              </div>
            ) : imageUrl ? (
              <div className="relative flex h-full w-full items-center justify-center">
                <img
                  src={addCorsParam(imageUrl) || imageUrl}
                  alt="Generated image"
                  className="max-h-[75vh] w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      PLACEHOLDER_IMAGES.DEFAULT;
                    (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                    setMediaLoaded(true);
                  }}
                  onLoad={() => setMediaLoaded(true)}
                />
                {!mediaLoaded && (
                  <div className="absolute inset-0 bg-ui-panel/80 flex items-center justify-center">
                    <LoadingSpinner className="h-12 w-12 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-white/60">Image not available</span>
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
                  {createdAt && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-white/90">
                        Created
                      </div>
                      <div className="text-sm text-white/70">
                        {dayjs(createdAt).format("MMM D, YYYY")} at{" "}
                        {dayjs(createdAt).format("hh:mm A")}
                      </div>
                    </div>
                  )}

                  {hasPromptToken && (
                    <>
                      <div className="relative space-y-1.5">
                        <div className="text-sm font-medium text-white/90">
                          Prompt
                        </div>
                        <div
                          className={twMerge(
                            "relative text-sm text-white break-words p-3 rounded-lg cursor-pointer transition-colors duration-100 leading-relaxed bg-ui-controls/20 backdrop-blur-md"
                          )}
                          onMouseEnter={() => setIsPromptHovered(true)}
                          onMouseLeave={() => setIsPromptHovered(false)}
                          onClick={handleCopyPrompt}
                        >
                          {promptLoading ? (
                            <div className="flex items-center gap-2">
                              <LoadingSpinner className="h-4 w-4" />
                              <span className="text-sm text-white/80">
                                Loading prompt...
                              </span>
                            </div>
                          ) : (
                            prompt || (
                              <span className="text-sm text-white">
                                No prompt
                              </span>
                            )
                          )}
                        </div>
                        {!promptLoading && (
                          <div
                            className={twMerge(
                              "pointer-events-none absolute inset-0 flex items-end justify-end opacity-0 transition-opacity duration-50",
                              (isPromptHovered || promptCopied) && "opacity-100"
                            )}
                          >
                            <div className="flex items-center gap-1 text-xs text-white backdrop-blur-md p-1.5 rounded-tl-lg rounded-br-lg bg-ui-controls/40">
                              <FontAwesomeIcon
                                icon={promptCopied ? faCheck : faCopy}
                                className="h-3 w-3"
                              />
                              <span>
                                {promptCopied ? "Prompt copied" : "Copy prompt"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {contextImages && contextImages.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-sm font-medium text-white/90">
                            Reference Images
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {contextImages.map((contextImage, index) => {
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

                      {(generationProvider || modelType) && (
                        <div className="space-y-1.5">
                          <div className="text-sm font-medium text-white/90">
                            Generation Details
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {modelType && (
                              <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-ui-panel-border/40 bg-ui-controls/20 backdrop-blur-md">
                                <span className="text-sm text-white/70 font-medium">
                                  Model
                                </span>
                                <div className="flex items-center gap-2">
                                  {getModelCreatorIcon(modelType)}
                                  <span className="text-sm text-white rounded">
                                    {getModelDisplayName(modelType)}
                                  </span>
                                </div>
                              </div>
                            )}
                            {generationProvider && (
                              <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-ui-panel-border/40 bg-ui-controls/20 backdrop-blur-md">
                                <span className="text-sm text-white/70 font-medium">
                                  Provider
                                </span>
                                <span className="text-sm text-white rounded">
                                  {getProviderDisplayName(generationProvider)}
                                </span>
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
                  imageUrl
                    ? "bg-ui-controls hover:bg-ui-controls/80 text-base-fg"
                    : "bg-ui-controls text-base-fg cursor-not-allowed pointer-events-none"
                )}
                href={imageUrl ? addCorsParam(imageUrl) || imageUrl : undefined}
                download={
                  imageUrl ? `artcraft-${mediaToken || "image"}` : undefined
                }
                aria-disabled={!imageUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={faDownToLine} />
                Download Image
              </a>
              <Button
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
