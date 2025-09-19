import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import dayjs from "dayjs";
import { faDownToLine, faPencil } from "@fortawesome/pro-solid-svg-icons";
import {
  EnqueueImageTo3dObject,
  EnqueueImageTo3dObjectModel,
} from "@storyteller/tauri-api";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import React from "react";
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
import { Tooltip } from "@storyteller/ui-tooltip";

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseGallery: () => void;
  imageUrl?: string | null;
  imageAlt?: string;
  onImageError?: () => void;
  title?: string;
  createdAt?: string;
  additionalInfo?: React.ReactNode;
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
}

export function LightboxModal({
  isOpen,
  onClose,
  onCloseGallery,
  imageUrl,
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
}: LightboxModalProps) {
  // NB(bt,2025-06-14): We add ?cors=1 to the image url to prevent caching "sec-fetch-mode: no-cors" from
  // the <image> tag request from being cached. If we then drag it into the canvas after it's been cached,
  // it won't be able to load in cors mode and will show blank in the canvas and 3D engine. This is a really
  // stupid hack around this behavior.
  const imageTagImageUrl = imageUrl ? imageUrl + "?cors=1" : "";

  const [mediaLoaded, setMediaLoaded] = React.useState<boolean>(false);
  const [prompt, setPrompt] = React.useState<string | null>(null);
  const [promptLoading, setPromptLoading] = React.useState<boolean>(false);
  const [hasPromptToken, setHasPromptToken] = React.useState<boolean>(false);
  const [isPromptHovered, setIsPromptHovered] = React.useState<boolean>(false);
  const [generationProvider, setGenerationProvider] = React.useState<
    string | null
  >(null);
  const [modelType, setModelType] = React.useState<string | null>(null);
  const [contextImages, setContextImages] = React.useState<Array<{
    media_links: {
      cdn_url: string;
      maybe_thumbnail_template: string;
    };
    media_token: string;
    semantic: string;
  }> | null>(null);

  // Reset when imageUrl changes
  React.useEffect(() => {
    setMediaLoaded(false);
  }, [imageUrl]);

  // Fetch prompt when mediaId changes
  React.useEffect(() => {
    const fetchPrompt = async () => {
      if (!mediaId) {
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
          mediaFileToken: mediaId,
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
  }, [mediaId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="rounded-xl bg-[#2C2C2C] h-[75vh] w-[60vw] max-w-screen min-w-[35vw] min-h-[40vh] p-4"
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
        <div className="col-span-2 relative flex h-full items-center justify-center overflow-hidden rounded-l-xl bg-[#1A1A1A]">
          {!imageUrl ? (
            <div className="flex h-full w-full items-center justify-center bg-gray-800">
              <span className="text-white/60">Image not available</span>
            </div>
          ) : mediaClass === "video" ? (
            <video
              controls
              loop={true}
              autoPlay={true}
              className="h-full w-full object-contain"
              onLoadedData={() => setMediaLoaded(true)}
            >
              <source src={imageUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
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

          {!mediaLoaded && imageUrl && (
            <div className="absolute inset-0 bg-[#1A1A1A] flex items-center justify-center">
              <LoadingSpinner className="h-12 w-12 text-white" />
            </div>
          )}
        </div>

        {/* info + actions */}
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-5">
            {/* <div className="text-xl font-medium">
              {title || "Image Generation"}
            </div> */}
            {createdAt && (
              <div className="space-y-1.5">
                <div className="text-sm font-medium text-white/90">Created</div>
                <div className="text-sm text-white/70">
                  {dayjs(createdAt).format("MMM D, YYYY")} at{" "}
                  {dayjs(createdAt).format("hh:mm A")}
                </div>
              </div>
            )}

            {hasPromptToken && (
              <>
                {/* Prompt */}
                <div className="relative space-y-1.5">
                  <div className="text-sm font-medium text-white/90">
                    Prompt
                  </div>
                  <div
                    className={twMerge(
                      "relative text-sm text-white/90 break-words bg-black/20 p-3 rounded-lg cursor-pointer transition-colors duration-100 leading-relaxed",
                      isPromptHovered && "bg-black/30"
                    )}
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
                        <span className="text-sm text-white/80">
                          Loading prompt...
                        </span>
                      </div>
                    ) : (
                      prompt || (
                        <span className="text-sm text-white/90">No prompt</span>
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
                      <div className="flex items-center gap-1 text-xs text-white/80 bg-black/80 backdrop-blur-md p-1.5 rounded-tl-lg rounded-br-lg">
                        <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                        <span>Copy prompt</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Context Images */}
                {contextImages && contextImages.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium text-white/90">
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
                          // Hover preview
                          <Tooltip
                            key={contextImage.media_token}
                            className="bg-black p-1.5"
                            content={
                              <div>
                                <div className="flex flex-col items-center bg-white/10 rounded-lg">
                                  <img
                                    src={fullSizeUrl}
                                    alt={`Reference image ${index + 1} preview`}
                                    className="w-auto h-48 object-cover rounded-lg"
                                  />
                                </div>
                                {contextImage.semantic && (
                                  <div className="mt-2 text-xs text-white/90 text-center max-w-48 px-1">
                                    {contextImage.semantic}
                                  </div>
                                )}
                              </div>
                            }
                            position="top"
                            delay={300}
                            closeOnClick={true}
                          >
                            <div
                              className="relative group cursor-pointer"
                              onClick={() => {
                                window.open(
                                  contextImage.media_links.cdn_url,
                                  "_blank"
                                );
                              }}
                            >
                              <div className="relative overflow-hidden rounded-lg border border-white/5 bg-white/10 aspect-square">
                                <img
                                  src={thumbnailUrl}
                                  alt={`Reference image ${index + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                              </div>
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Generation Details */}
                {(generationProvider || modelType) && (
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium text-white/90">
                      Generation Details
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {modelType && (
                        <div className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-lg border border-white/5">
                          <span className="text-sm text-white/70 font-medium">
                            Model
                          </span>
                          <div className="flex items-center gap-2">
                            {getModelCreatorIcon(modelType)}
                            <span className="text-sm text-white/90 rounded">
                              {getModelDisplayName(modelType)}
                            </span>
                          </div>
                        </div>
                      )}
                      {generationProvider && (
                        <div className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-lg border border-white/5">
                          <span className="text-sm text-white/70 font-medium">
                            Provider
                          </span>
                          <span className="text-sm text-white/90 rounded">
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
          {(onAddToSceneClicked && downloadUrl) || downloadUrl ? (
            <div className="mt-15 mb-15 flex justify-end gap-2">
              <Button
                onClick={async (e) => {
                  gtagEvent("image_to_3d_clicked");
                  //let _result = await FalHunyuanImageTo3d({
                  //  image_media_token: mediaId,
                  //  //base64_image: downloadUrl,
                  //});
                  let result = await EnqueueImageTo3dObject({
                    image_media_token: mediaId,
                    model: EnqueueImageTo3dObjectModel.Hunyuan3d2_0,
                  });
                  //e.stopPropagation();
                  //await onAddToSceneClicked(downloadUrl, mediaId);
                  //onClose(); // close the lightbox
                  //onCloseGallery(); // close the gallery
                }}
              >
                3D
              </Button>

              {onEditClicked && downloadUrl && (
                <Button
                  icon={faPencil}
                  onClick={async (e) => {
                    e.stopPropagation();
                    gtagEvent("edit_image_clicked");
                    await onEditClicked(downloadUrl, mediaId);
                  }}
                >
                  Edit
                </Button>
              )}

              {onAddToSceneClicked && downloadUrl && (
                <Button
                  onClick={async (e) => {
                    e.stopPropagation();
                    gtagEvent("add_to_scene_clicked");
                    await onAddToSceneClicked(downloadUrl, mediaId);
                    onClose(); // close the lightbox
                    onCloseGallery(); // close the gallery
                  }}
                >
                  Add to Current Scene
                </Button>
              )}

              {/* {downloadUrl &&
                (onDownloadClicked ? (
                  <Button
                    icon={faDownToLine}
                    onClick={async (e) => {
                      e.stopPropagation();
                      gtagEvent("download_clicked");
                      await onDownloadClicked(downloadUrl, mediaClass);
                    }}
                  >
                    Download
                  </Button>
                ) : (
                  <a
                    href={downloadUrl}
                    download
                    onClick={(e) => {
                      e.stopPropagation();
                      gtagEvent("download_clicked");
                    }}
                    className="no-underline"
                  >
                    <Button icon={faDownToLine}>Download</Button>
                  </a>
                ))} */}

              {onDownloadClicked && downloadUrl && (
                <Button
                  icon={faDownToLine}
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
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export default LightboxModal;
