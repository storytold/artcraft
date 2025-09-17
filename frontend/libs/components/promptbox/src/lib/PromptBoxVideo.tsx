import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { JobContextType } from "@storyteller/common";
import { downloadFileFromUrl } from "@storyteller/api";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import { EnqueueImageToVideo } from "@storyteller/tauri-api";
import {
  faMessageXmark,
  faMessageCheck,
  faSparkles,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import { faRectangle } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { VideoModel } from "@storyteller/model-list";
import { usePromptVideoStore, RefImage } from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";
import { ImagePromptRow } from "./ImagePromptRow";
import type { UploadImageFn } from "./ImagePromptRow";
import { twMerge } from "tailwind-merge";
import { toast } from "@storyteller/ui-toaster";

interface PromptBoxVideoProps {
  useJobContext: () => JobContextType;
  onEnqueuePressed?: (
    prompt: string,
    subscriberId: string
  ) => void | Promise<void>;
  selectedModel?: VideoModel;
  imageMediaId?: string;
  url?: string;
  onImageRowVisibilityChange?: (visible: boolean) => void;
  uploadImage?: UploadImageFn;
}

export const PromptBoxVideo = ({
  useJobContext,
  onEnqueuePressed,
  selectedModel,
  imageMediaId,
  url,
  onImageRowVisibilityChange,
  uploadImage,
}: PromptBoxVideoProps) => {
  useSignals();

  // for the image media id and url, we need to set the reference image gallery panel.
  useEffect(() => {
    if (imageMediaId && url) {
      const referenceImage: RefImage = {
        id: Math.random().toString(36).substring(7),
        url: url,
        file: new File([], "library-image"),
        mediaToken: imageMediaId,
      };
      setReferenceImages([referenceImage]);
    }
  }, [imageMediaId, url]);

  console.log("Is this a desktop app?", IsDesktopApp());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);
  const prompt = usePromptVideoStore((s) => s.prompt);
  const setPrompt = usePromptVideoStore((s) => s.setPrompt);
  const useSystemPrompt = usePromptVideoStore((s) => s.useSystemPrompt);
  const setUseSystemPrompt = usePromptVideoStore((s) => s.setUseSystemPrompt);
  const resolution = usePromptVideoStore((s) => s.resolution);
  const setResolution = usePromptVideoStore((s) => s.setResolution);
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    []
  );
  const referenceImages = usePromptVideoStore((s) => s.referenceImages);
  const setReferenceImages = usePromptVideoStore((s) => s.setReferenceImages);
  const endFrameImage = usePromptVideoStore((s) => s.endFrameImage);
  const setEndFrameImage = usePromptVideoStore((s) => s.setEndFrameImage);
  const [uploadingImages, _setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
  const [showImagePrompts, _setShowImagePrompts] = useState(true);
  const isImageRowVisible =
    showImagePrompts ||
    referenceImages.length > 0 ||
    uploadingImages.length > 0;
  const [resolutionList, setResolutionList] = useState<PopoverItem[]>([
    {
      label: "720p",
      selected: resolution === "720p",
      icon: <FontAwesomeIcon icon={faRectangle} className="h-4 w-4" />,
    },
    {
      label: "480p",
      selected: resolution === "480p",
      icon: <FontAwesomeIcon icon={faRectangle} className="h-4 w-4" />,
    },
  ]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  });

  useEffect(() => {
    if (imageMediaId && url) {
      const referenceImage: RefImage = {
        id: Math.random().toString(36).substring(7),
        url: url,
        file: new File([], "library-image"),
        mediaToken: imageMediaId,
      };
      setReferenceImages([referenceImage]);
    }
  }, [imageMediaId, url]);

  useEffect(() => {
    onImageRowVisibilityChange?.(isImageRowVisible);
  }, [isImageRowVisible, onImageRowVisibilityChange]);

  const handleResolutionSelect = (selectedItem: PopoverItem) => {
    setResolution(selectedItem.label as any);
    setResolutionList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      }))
    );
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next =
      value.slice(0, selectionStart) + pastedText + value.slice(selectionEnd);
    setPrompt(next);
    requestAnimationFrame(() => {
      const pos = selectionStart + pastedText.length;
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleEnqueue = async () => {
    if (!prompt.trim()) {
      console.warn("Cannot generate video: prompt is empty");
      return;
    }

    if (referenceImages.length === 0) {
      console.warn("Cannot generate video: no reference image provided");
      return;
    }

    if (!selectedModel) {
      console.warn("Cannot generate video: no model selected");
      return;
    }

    setIsEnqueueing(true);

    gtagEvent("enqueue_video");

    setTimeout(() => {
      // TODO(bt,2025-05-08): This is a hack so we don't accidentally wind up with a permanently disabled prompt box if
      // the backend hangs on a given request.
      console.debug("Turn off blocking of prompt box...");
      setIsEnqueueing(false);
    }, 10000);

    const subscriberId = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    await EnqueueImageToVideo({
      model: selectedModel,
      image_media_token: referenceImages[0].mediaToken,
      prompt: prompt,
      end_frame_image_media_token: endFrameImage?.mediaToken,
      frontend_caller: "image_to_video",
      frontend_subscriber_id: subscriberId,
    });

    onEnqueuePressed?.(prompt, subscriberId);

    setIsEnqueueing(false);
  };

  const getCurrentResolutionIcon = () => {
    const selected = resolutionList.find((item) => item.selected);
    if (!selected || !selected.icon) return faRectangle;
    const iconElement = selected.icon as React.ReactElement<{ icon: IconProp }>;
    return iconElement.props.icon;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (prompt.trim() && referenceImages.length === 0) {
        toast.error("Please choose a starting frame image to generate video");
        return;
      }

      handleEnqueue();
    }
  };

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // Hide/clear ending frame if model doesn't support it
  useEffect(() => {
    if (selectedModel && !selectedModel.endFrame && endFrameImage) {
      setEndFrameImage(undefined);
    }
  }, [selectedModel, endFrameImage, setEndFrameImage]);

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setContent(null);
        }}
      >
        {content}
      </Modal>
      <div className="relative z-20 flex flex-col gap-3">
        {isImageRowVisible && (
          <ImagePromptRow
            visible={true}
            isVideo={true}
            maxImagePromptCount={1}
            allowUpload={true}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            onImageClick={(image) => {
              setContent(
                <img
                  src={image.url}
                  alt="Reference preview"
                  className="w-full h-full object-contain"
                />
              );
              setIsModalOpen(true);
            }}
            uploadImage={uploadImage}
            endFrameImage={endFrameImage}
            setEndFrameImage={setEndFrameImage}
            allowUploadEnd={!!selectedModel?.endFrame}
            showEndFrameSection={!!selectedModel?.endFrame}
          />
        )}
        <div
          className={twMerge(
            "glass w-[730px] rounded-xl p-4",
            isImageRowVisible && "rounded-t-none",
            isFocused
              ? "ring-1 ring-primary border-primary"
              : "ring-1 ring-transparent"
          )}
        >
          <div className="flex justify-center gap-2">
            {/* Hide the Add image button for video for now */}
            {/* <Tooltip
              content="Add Image"
              position="top"
              closeOnClick={true}
              className={isImageRowVisible ? "hidden opacity-0" : undefined}
            >
              <Button
                variant="action"
                className={`h-8 w-8 p-0 bg-transparent hover:bg-transparent group transition-all ${
                  isImageRowVisible ? "text-primary" : ""
                }`}
                onClick={() => setShowImagePrompts((prev) => !prev)}
              >
                <svg
                  width="24"
                  height="20"
                  viewBox="0 0 24 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="group-hover:opacity-100 opacity-80 transition-all"
                >
                  <path
                    opacity="1"
                    d="M2.66667 2H16C16.3667 2 16.6667 2.3 16.6667 2.66667V6.1125C17.1 6.04167 17.5458 6 18 6C18.225 6 18.4458 6.00833 18.6667 6.02917V2.66667C18.6667 1.19583 17.4708 0 16 0H2.66667C1.19583 0 0 1.19583 0 2.66667V16C0 17.4708 1.19583 18.6667 2.66667 18.6667H11.5C11.0625 18.0583 10.7083 17.3875 10.4542 16.6667H2.66667C2.3 16.6667 2 16.3667 2 16V2.66667C2 2.3 2.3 2 2.66667 2ZM11.8625 7.49167C11.6833 7.1875 11.3542 7 11 7C10.6458 7 10.3167 7.1875 10.1375 7.49167L8.2 10.7833L7.48333 9.75833C7.29583 9.49167 6.99167 9.33333 6.6625 9.33333C6.33333 9.33333 6.02917 9.49167 5.84167 9.75833L3.50833 13.0917C3.29583 13.3958 3.26667 13.7958 3.44167 14.125C3.61667 14.4542 3.9625 14.6667 4.33333 14.6667H10.0292C10.0125 14.4458 10 14.225 10 14C10 11.7833 10.9 9.77917 12.3542 8.33333L11.8625 7.49583V7.49167ZM5.33333 6.66667C6.07083 6.66667 6.66667 6.07083 6.66667 5.33333C6.66667 4.59583 6.07083 4 5.33333 4C4.59583 4 4 4.59583 4 5.33333C4 6.07083 4.59583 6.66667 5.33333 6.66667ZM18 20C21.3125 20 24 17.3125 24 14C24 10.6875 21.3125 8 18 8C14.6875 8 12 10.6875 12 14C12 17.3125 14.6875 20 18 20ZM18.6667 11.3333V13.3333H20.6667C21.0333 13.3333 21.3333 13.6333 21.3333 14C21.3333 14.3667 21.0333 14.6667 20.6667 14.6667H18.6667V16.6667C18.6667 17.0333 18.3667 17.3333 18 17.3333C17.6333 17.3333 17.3333 17.0333 17.3333 16.6667V14.6667H15.3333C14.9667 14.6667 14.6667 14.3667 14.6667 14C14.6667 13.6333 14.9667 13.3333 15.3333 13.3333H17.3333V11.3333C17.3333 10.9667 17.6333 10.6667 18 10.6667C18.3667 10.6667 18.6667 10.9667 18.6667 11.3333Z"
                    fill="currentColor"
                  />
                </svg>
              </Button>
            </Tooltip> */}

            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Describe what you want to happen in the video..."
              className="text-md mb-2 max-h-[5.5em] flex-1 resize-none overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-base-fg placeholder-base-fg/60 focus:outline-none"
              value={prompt}
              onChange={handleChange}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Tooltip
                content="Resolution"
                position="top"
                className="z-50"
                closeOnClick={true}
              >
                <PopoverMenu
                  items={resolutionList}
                  onSelect={handleResolutionSelect}
                  mode="toggle"
                  panelTitle="Resolution"
                  showIconsInList
                  triggerIcon={
                    <FontAwesomeIcon
                      icon={getCurrentResolutionIcon()}
                      className="h-4 w-4"
                    />
                  }
                />
              </Tooltip>
              <Tooltip
                content={
                  useSystemPrompt
                    ? "Use system prompt: ON"
                    : "Use system prompt: OFF"
                }
                position="top"
                className="z-50"
                delay={200}
              >
                <ToggleButton
                  isActive={useSystemPrompt}
                  icon={faMessageXmark}
                  activeIcon={faMessageCheck}
                  onClick={() => setUseSystemPrompt(!useSystemPrompt)}
                />
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="flex items-center border-none bg-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                icon={!isEnqueueing ? faSparkles : undefined}
                onClick={handleEnqueue}
                disabled={
                  isEnqueueing ||
                  !prompt.trim() ||
                  referenceImages.length === 0 ||
                  !selectedModel
                }
              >
                {isEnqueueing ? (
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    className="animate-spin text-lg"
                  />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <GalleryModal
        isOpen={!!isGalleryModalOpen}
        onClose={() => {
          setIsGalleryModalOpen(false);
          setSelectedGalleryImages([]);
        }}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={(id) => {
          setSelectedGalleryImages((prev) => (prev.includes(id) ? [] : [id]));
        }}
        maxSelections={1}
        onUseSelected={(selectedItems: GalleryItem[]) => {
          const item = selectedItems[0];
          if (!item || !item.fullImage) return;
          const referenceImage: RefImage = {
            id: Math.random().toString(36).substring(7),
            url: item.fullImage,
            file: new File([], "library-image"),
            mediaToken: item.id,
          };
          setReferenceImages([referenceImage]);
          setIsGalleryModalOpen(false);
          setSelectedGalleryImages([]);
        }}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );
};
