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
import { useEffect, useState, ReactNode } from "react";
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
}: LightboxModalProps) {
  // NB(bt,2025-06-14): We add ?cors=1 to the image url to prevent caching "sec-fetch-mode: no-cors" from
  // the <image> tag request from being cached. If we then drag it into the canvas after it's been cached,
  // it won't be able to load in cors mode and will show blank in the canvas and 3D engine. This is a really
  // stupid hack around this behavior.
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number | null>(
    null
  );
  const displayUrl =
    selectedBatchIndex !== null && imageUrls
      ? imageUrls[selectedBatchIndex]
      : imageUrl || null;
  const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);
  const imageTagImageUrl = displayUrl ? displayUrl + "?cors=1" : "";

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

  // Reset when imageUrl changes
  useEffect(() => {
    setMediaLoaded(false);
  }, [imageUrl, selectedBatchIndex]);

  // Maintain current media id (updates when selecting from batch)
  const [currentMediaId, setCurrentMediaId] = useState<string | undefined>(
    mediaId
  );
  useEffect(() => {
    setCurrentMediaId(mediaId);
  }, [mediaId]);

  // Reset promoted selection whenever a new lightbox item is shown or dialog re-opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBatchIndex(null);
      setRefPreviewUrl(null);
    }
  }, [isOpen]);
  useEffect(() => {
    // If the upstream lightbox content changes, return to grid state
    setSelectedBatchIndex(null);
    setRefPreviewUrl(null);
  }, [mediaId, imageUrls]);

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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="rounded-xl bg-ui-modal h-[75vh] w-[60vw] max-w-screen min-w-[35vw] min-h-[40vh] p-4"
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
            {!displayUrl ? (
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
                <source src={displayUrl as string} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : imageUrls &&
              imageUrls.length > 1 &&
              selectedBatchIndex === null ? (
              <div
                className="grid w-full h-full p-2 gap-2"
                style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
              >
                {imageUrls.slice(0, 4).map((url, idx) => (
                  <div
                    key={idx}
                    className="relative flex items-center justify-center overflow-hidden rounded-lg bg-black/20 cursor-pointer"
                    onClick={() => {
                      setSelectedBatchIndex(idx);
                      const maybeToken = mediaTokens?.[idx];
                      if (maybeToken) setCurrentMediaId(maybeToken);
                    }}
                  >
                    <img
                      src={url + "?cors=1"}
                      alt={`Generated ${idx + 1}`}
                      className="h-full w-full object-contain"
                      onLoad={() => setMediaLoaded(true)}
                      onError={onImageError}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <img
                data-lightbox-modal="true"
                src={imageTagImageUrl}
                alt={imageAlt}
                className="h-full w-full object-contain"
                onError={onImageError}
                onLoad={() => setMediaLoaded(true)}
              />
            )}

            {!mediaLoaded && displayUrl && (
              <div className="absolute inset-0 bg-ui-panel flex items-center justify-center">
                <LoadingSpinner className="h-12 w-12 text-base-fg" />
              </div>
            )}
          </div>

          {/* info + actions */}
          <div className="flex h-full flex-col">
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

                  {/* Context Images */}
                  {contextImages && contextImages.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-base-fg/90">
                        Reference Images
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {contextImages.map((contextImage, index) => {
                          const thumbnailUrl = contextImage.media_links
                            .maybe_thumbnail_template
                            ? contextImage.media_links.maybe_thumbnail_template.replace(
                                "{WIDTH}",
                                "128"
                              )
                            : contextImage.media_links.cdn_url;

                          const fullSizeUrl = contextImage.media_links
                            .maybe_thumbnail_template
                            ? contextImage.media_links.maybe_thumbnail_template.replace(
                                "{WIDTH}",
                                "512"
                              )
                            : contextImage.media_links.cdn_url;

                          return (
                            <div
                              key={contextImage.media_token}
                              className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30 hover:border-white/80 transition-all group cursor-pointer hover:cursor-zoom-in"
                              onClick={() => setRefPreviewUrl(fullSizeUrl)}
                            >
                              <img
                                src={thumbnailUrl}
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
            {(onAddToSceneClicked && downloadUrl) || downloadUrl
              ? (() => {
                  const visibleButtons = [
                    onEditClicked && downloadUrl && mediaClass === "image",
                    onTurnIntoVideoClicked &&
                      downloadUrl &&
                      mediaClass === "image",
                    onAddToSceneClicked && downloadUrl,
                    mediaClass === "image",
                    onDownloadClicked && downloadUrl,
                  ].filter(Boolean).length;

                  const buttonClass =
                    visibleButtons === 1 ? "w-full col-span-2" : "w-full";

                  return (
                    <div className="mt-15 mb-15 grid grid-cols-2 gap-2">
                      {onEditClicked &&
                        downloadUrl &&
                        mediaClass === "image" && (
                          <Button
                            className={buttonClass}
                            icon={faPencil}
                            onClick={async (e) => {
                              e.stopPropagation();
                              gtagEvent("edit_image_clicked");
                              await onEditClicked(downloadUrl, mediaId);
                            }}
                          >
                            Edit Image
                          </Button>
                        )}

                      {onTurnIntoVideoClicked &&
                        downloadUrl &&
                        mediaClass === "image" && (
                          <Button
                            className={buttonClass}
                            icon={faVideo}
                            onClick={async (e) => {
                              e.stopPropagation();
                              gtagEvent("turn_into_video_clicked");
                              await onTurnIntoVideoClicked(
                                downloadUrl,
                                mediaId
                              );
                            }}
                          >
                            Turn into Video
                          </Button>
                        )}

                      {onAddToSceneClicked && downloadUrl && (
                        <Button
                          className={buttonClass}
                          variant="secondary"
                          onClick={async (e) => {
                            e.stopPropagation();
                            gtagEvent("add_to_scene_clicked");
                            await onAddToSceneClicked(downloadUrl, mediaId);
                            onClose();
                            onCloseGallery();
                          }}
                        >
                          Add to Current Scene
                        </Button>
                      )}

                      {mediaClass === "image" && (
                        <Button
                          icon={faCube}
                          className={buttonClass}
                          variant="secondary"
                          onClick={async (e) => {
                            gtagEvent("image_to_3d_clicked");
                            await EnqueueImageTo3dObject({
                              image_media_token: mediaId,
                              model: EnqueueImageTo3dObjectModel.Hunyuan3d2_0,
                            });
                          }}
                        >
                          Make 3D Model
                        </Button>
                      )}

                      {onDownloadClicked && downloadUrl && (
                        <Button
                          className={buttonClass}
                          icon={faDownToLine}
                          variant="secondary"
                          onClick={async (e) => {
                            e.stopPropagation();
                            gtagEvent("download_clicked");
                            await onDownloadClicked(downloadUrl, mediaClass);
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
              src={`${refPreviewUrl}?cors=1`}
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
