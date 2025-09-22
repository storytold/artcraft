import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { toast } from "@storyteller/ui-toaster";
import {
  JobContextType,
  MaybeCanvasRenderBitmapType,
  UploaderState,
  UploaderStates,
} from "@storyteller/common";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import {
  faMessageXmark,
  faMessageCheck,
  faSparkles,
  faSpinnerThird,
  faFrame,
  faCopy,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faRectangleVertical,
  faSquare,
  faRectangle,
} from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import { PromptsApi } from "@storyteller/api";
import {
  EnqueueContextualEditImage,
  EnqueueContextualEditImageSize,
} from "@storyteller/tauri-api";
import { usePrompt2DStore, RefImage } from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";
import { getCapabilitiesForModel } from "@storyteller/model-list";
import { ImageModel } from "@storyteller/model-list";
import { ImagePromptRow } from "./ImagePromptRow";
import { twMerge } from "tailwind-merge";

export type AspectRatio = "1:1" | "3:2" | "2:3";

interface PromptBox2DProps {
  uploadImage: ({
    title,
    assetFile,
    progressCallback,
  }: {
    title: string;
    assetFile: File;
    progressCallback: (newState: UploaderState) => void;
  }) => Promise<void>;
  selectedImageModel?: ImageModel;
  getCanvasRenderBitmap: () => MaybeCanvasRenderBitmapType;
  EncodeImageBitmapToBase64: (imageBitmap: ImageBitmap) => Promise<string>;
  useJobContext: () => JobContextType;
  onEnqueuePressed?: () => void | Promise<void>;
  onAspectRatioChange?: (ratio: AspectRatio) => void;
  onFitPressed?: () => void | Promise<void>;
}

export const PromptBox2D = ({
  uploadImage,
  getCanvasRenderBitmap,
  EncodeImageBitmapToBase64,
  useJobContext,
  onEnqueuePressed,
  onAspectRatioChange,
  selectedImageModel,
  onFitPressed,
}: PromptBox2DProps) => {
  useSignals();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode>("");
  const { addJobToken } = useJobContext();

  //const { lastRenderedBitmap } = useCanvasSignal();
  const prompt = usePrompt2DStore((s) => s.prompt);
  const setPrompt = usePrompt2DStore((s) => s.setPrompt);
  const useSystemPrompt = usePrompt2DStore((s) => s.useSystemPrompt);
  const setUseSystemPrompt = usePrompt2DStore((s) => s.setUseSystemPrompt);
  const aspectRatio = usePrompt2DStore((s) => s.aspectRatio);
  const setAspectRatio = usePrompt2DStore((s) => s.setAspectRatio);
  const generationCount = usePrompt2DStore((s) => s.generationCount);
  const setGenerationCount = usePrompt2DStore((s) => s.setGenerationCount);

  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const referenceImages = usePrompt2DStore((s) => s.referenceImages);
  const setReferenceImages = usePrompt2DStore((s) => s.setReferenceImages);
  const [showImagePrompts, setShowImagePrompts] = useState(false);
  const [aspectRatioList, setAspectRatioList] = useState<PopoverItem[]>([
    {
      label: "3:2",
      selected: aspectRatio === "3:2",
      icon: <FontAwesomeIcon icon={faRectangle} className="h-4 w-4" />,
    },
    {
      label: "2:3",
      selected: aspectRatio === "2:3",
      icon: <FontAwesomeIcon icon={faRectangleVertical} className="h-4 w-4" />,
    },
    {
      label: "1:1",
      selected: aspectRatio === "1:1",
      icon: <FontAwesomeIcon icon={faSquare} className="h-4 w-4" />,
    },
  ]);

  const [generationCountList, setGenerationCountList] = useState<PopoverItem[]>(
    []
  );

  // Update generation count options from selected model capabilities
  useEffect(() => {
    const caps = getCapabilitiesForModel(selectedImageModel);
    const items: PopoverItem[] = Array.from(
      { length: caps.maxGenerationCount },
      (_, i) => i + 1
    ).map((count) => ({
      label: String(count),
      selected: count === generationCount,
    }));
    setGenerationCountList(items);

    // Clamp selection to allowed range
    if (generationCount < 1 || generationCount > caps.maxGenerationCount) {
      setGenerationCount(
        Math.min(Math.max(1, generationCount), caps.maxGenerationCount)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageModel]);

  // Keep UI selection in sync when store value changes
  useEffect(() => {
    setGenerationCountList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === String(generationCount),
      }))
    );
  }, [generationCount]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isImageRowVisible =
    showImagePrompts ||
    (selectedImageModel?.canUseImagePrompt && referenceImages.length > 0) ||
    false;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  });

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    onAspectRatioChange?.(selectedItem.label as AspectRatio);
    setAspectRatio(selectedItem.label as AspectRatio);
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      }))
    );
  };

  // Image prompt row replaces legacy upload/gallery UI

  const handleGenerationCountSelect = (selectedItem: PopoverItem) => {
    const count = parseInt(selectedItem.label, 10);
    setGenerationCount(count);
    setGenerationCountList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      }))
    );
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    e.stopPropagation();
    setPrompt(e.target.value);
  };

  const handleTauriEnqueue = async () => {
    const api = new PromptsApi();
    let image = getCanvasRenderBitmap();
    if (image === undefined) {
      console.log("image is undefined");
      return;
    }
    const base64Bitmap = await EncodeImageBitmapToBase64(image);

    const byteString = atob(base64Bitmap);
    const mimeString = "image/png";

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const uuid = crypto.randomUUID(); // Generate a new UUID
    const file = new File([ab], `${uuid}.png`, { type: mimeString });

    const snapshotMediaToken = await api.uploadSceneSnapshot({
      screenshot: file,
    });

    if (snapshotMediaToken.data === undefined) {
      toast.error("Error: Unable to upload scene snapshot Please try again.");
      return;
    }

    console.log("useSystemPrompt", useSystemPrompt);
    console.log("Snapshot media token:", snapshotMediaToken.data);

    const aspectRatio = getCurrentAspectRatio();

    const generateResponse = await EnqueueContextualEditImage({
      model: selectedImageModel,
      scene_image_media_token: snapshotMediaToken.data!,
      image_media_tokens: referenceImages.map((image) => image.mediaToken),
      disable_system_prompt: !useSystemPrompt,
      prompt: prompt,
      image_count: generationCount,
      aspect_ratio: aspectRatio,
    });

    console.log("generateResponse", generateResponse);
  };

  const handleWebEnqueue = async () => {
    const api = new PromptsApi();
    // to take the snapshot of the canvas
    // Call onEnqueuePressed if it exists

    let image = getCanvasRenderBitmap();
    if (image === undefined) {
      toast.error(
        "Error: Unable to generate image. Please check the input and try again."
      );
      return;
    }
    const base64Bitmap = await EncodeImageBitmapToBase64(image);

    const byteString = atob(base64Bitmap);
    const mimeString = "image/png";

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const uuid = crypto.randomUUID(); // Generate a new UUID
    const file = new File([ab], `${uuid}.png`, { type: mimeString });

    const snapshotMediaToken = await api.uploadSceneSnapshot({
      screenshot: file,
    });

    if (snapshotMediaToken.data === undefined) {
      toast.error("Error: Unable to upload scene snapshot Please try again.");
      return;
    }
    console.log("useSystemPrompt", useSystemPrompt);
    console.log("Snapshot media token:", snapshotMediaToken.data);

    const response = await api.enqueueImageGeneration({
      disableSystemPrompt: !useSystemPrompt,
      prompt: prompt,
      snapshotMediaToken: snapshotMediaToken.data,
      additionalImages: referenceImages.map((image) => image.mediaToken),
    });

    if (response.success === true) {
      toast.success("Please wait while we process your image.");
      if (response.data) {
        addJobToken(response.data);
      }
      return;
    } else {
      toast.error("Failed to enqueue image generation. Please try again.");
    }
  };

  const handleEnqueue = async () => {
    console.log("Pressing Enqueue");
    if (onEnqueuePressed) {
      try {
        await onEnqueuePressed();
      } catch (error) {
        console.error("Error in onEnqueuePressed callback:", error);
        return;
      }
    }

    gtagEvent("enqueue_2d");

    if (isEnqueueing) return;
    setIsEnqueueing(true);
    if (!prompt.trim()) return;
    try {
      console.log(
        "(4) Enqueuing with prompt:",
        prompt,
        "and reference images:",
        referenceImages
      );

      const isDesktop = IsDesktopApp();
      console.log("Is this a desktop app?", isDesktop);

      if (isDesktop) {
        await handleTauriEnqueue();
      } else {
        await handleWebEnqueue();
      }
    } catch (error) {
      console.error("Error during image generation:", error);
      toast.error(
        "An error occurred while generating the image. Please try again."
      );
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsEnqueueing(false);
    }
  };

  const getCurrentAspectRatioIcon = () => {
    const selected = aspectRatioList.find((item) => item.selected);
    if (!selected || !selected.icon) return faRectangle;
    const iconElement = selected.icon as React.ReactElement<{ icon: IconProp }>;
    return iconElement.props.icon;
  };

  const getCurrentAspectRatio = (): EnqueueContextualEditImageSize => {
    const selected = aspectRatioList.find((item) => item.selected);
    switch (selected?.label) {
      case "3:2":
        return EnqueueContextualEditImageSize.Wide;
      case "2:3":
        return EnqueueContextualEditImageSize.Tall;
      case "1:1":
      default:
        return EnqueueContextualEditImageSize.Square;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Stop propagation of keyboard events to prevent them from reaching the canvas
    e.stopPropagation();

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnqueue();
    }
  };

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setContent("");
        }}
      >
        {content}
      </Modal>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col gap-3">
        {selectedImageModel?.canUseImagePrompt && isImageRowVisible && (
          <ImagePromptRow
            visible={true}
            maxImagePromptCount={Math.max(
              1,
              selectedImageModel?.maxImagePromptCount ?? 1
            )}
            allowUpload={true}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            uploadImage={uploadImage as any}
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
          />
        )}
        <div
          className={twMerge(
            "glass w-[730px] rounded-xl p-4",
            selectedImageModel?.canUseImagePrompt &&
              isImageRowVisible &&
              "rounded-t-none"
          )}
        >
          <div className="flex justify-center gap-2">
            {selectedImageModel?.canUseImagePrompt && (
              <Tooltip
                content="Add Image"
                position="top"
                closeOnClick={true}
                className={twMerge(isImageRowVisible && "hidden opacity-0")}
              >
                <Button
                  variant="action"
                  className={twMerge(
                    "h-8 w-8 p-0 bg-transparent hover:bg-transparent group transition-all border-0 shadow-none",
                    isImageRowVisible && "text-primary"
                  )}
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
              </Tooltip>
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Describe your image..."
              className="text-md mb-2 max-h-[5.5em] flex-1 resize-none overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-base-fg placeholder-base-fg/60 focus:outline-none"
              value={prompt}
              onChange={handleChange}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              onFocus={() => {}}
              onBlur={() => {}}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Tooltip
                content="Aspect ratio"
                position="top"
                className="z-50"
                closeOnClick={true}
              >
                <PopoverMenu
                  items={aspectRatioList}
                  onSelect={handleAspectRatioSelect}
                  mode="toggle"
                  panelTitle="Aspect Ratio"
                  showIconsInList
                  triggerIcon={
                    <FontAwesomeIcon
                      icon={getCurrentAspectRatioIcon()}
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
              {onFitPressed && (
                <Tooltip
                  content={"Fit canvas to screen"}
                  position="top"
                  className="z-50"
                  delay={200}
                >
                  <Button
                    variant="secondary"
                    className="h-9 bg-ui-controls/60 px-3 text-base-fg hover:bg-ui-controls/90"
                    onClick={onFitPressed}
                  >
                    <FontAwesomeIcon icon={faFrame} className="h-4 w-4" />
                    Fit
                  </Button>
                </Tooltip>
              )}
              <Tooltip
                content="Number of generations"
                position="top"
                className="z-50"
                closeOnClick={true}
              >
                <PopoverMenu
                  items={generationCountList}
                  onSelect={handleGenerationCountSelect}
                  mode="toggle"
                  panelTitle="No. of images"
                  triggerIcon={
                    <FontAwesomeIcon icon={faCopy} className="h-4 w-4" />
                  }
                  buttonClassName="h-9"
                />
              </Tooltip>
              <Button
                className="flex items-center border-none bg-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                icon={!isEnqueueing ? faSparkles : undefined}
                onClick={handleEnqueue}
                disabled={isEnqueueing || !prompt.trim()}
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
    </>
  );
};
