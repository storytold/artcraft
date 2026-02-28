import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button, ToggleButton, GenerateButton } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import {
  faMessageXmark,
  faMessageCheck,
  faFrame,
  faExpand,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faRectangleVertical,
  faSquare,
  faRectangle,
} from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { Prompt2DStore, RefImage } from "./promptStore";
import { ImageModel } from "@storyteller/model-list";
import { ImagePromptRow, UploadImageFn } from "./ImagePromptRow";
import { twMerge } from "tailwind-merge";
import { GenerationProvider } from "@storyteller/api-enums";
import { GenerationCountPicker } from "./common/GenerationCountPicker";
import { StoreApi, UseBoundStore } from "zustand";
import { useSubscriptionState } from "@storyteller/subscription";

export type AspectRatio = "wide" | "tall" | "square";

export interface PromptBox2DProps {
  uploadImage?: UploadImageFn;
  selectedImageModel?: ImageModel;
  selectedProvider?: GenerationProvider;
  EncodeImageBitmapToBase64: (imageBitmap: ImageBitmap) => Promise<string>;
  onGenerateClick: (
    prompt: string,
    options?: {
      aspectRatio?: string;
      resolution?: string;
      images?: RefImage[];
      selectedProvider?: GenerationProvider;
    },
  ) => void | Promise<void>;
  isDisabled?: boolean;
  isEnqueueing?: boolean;
  generationCount?: number;
  onGenerationCountChange?: (count: number) => void;
  onAspectRatioChange?: (ratio: AspectRatio) => void;
  onFitPressed?: () => void | Promise<void>;
  usePrompt2DStore: UseBoundStore<StoreApi<Prompt2DStore>>;
}

export const PromptBox2D = ({
  uploadImage,
  selectedImageModel,
  selectedProvider,
  EncodeImageBitmapToBase64,
  onGenerateClick,
  isDisabled = false,
  isEnqueueing = false,
  generationCount = 1,
  onGenerationCountChange,
  onAspectRatioChange,
  onFitPressed,
  usePrompt2DStore,
}: PromptBox2DProps) => {
  useSignals();

  // Check subscription status to determine if user is on free plan
  const hasPaidPlan = useSubscriptionState((s) => s.hasPaidPlan);
  const isFreeUser = !hasPaidPlan();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode>("");

  //const { lastRenderedBitmap } = useCanvasSignal();
  const prompt = usePrompt2DStore((s) => s.prompt);
  const setPrompt = usePrompt2DStore((s) => s.setPrompt);
  const useSystemPrompt = usePrompt2DStore((s) => s.useSystemPrompt);
  const setUseSystemPrompt = usePrompt2DStore((s) => s.setUseSystemPrompt);
  const aspectRatio = usePrompt2DStore((s) => s.aspectRatio);
  const setAspectRatio = usePrompt2DStore((s) => s.setAspectRatio);
  const resolution = usePrompt2DStore((s) => s.resolution);
  const setResolution = usePrompt2DStore((s) => s.setResolution);
  const [internalEnqueueing, setInternalEnqueueing] = useState(false);

  const referenceImages = usePrompt2DStore((s) => s.referenceImages);
  const setReferenceImages = usePrompt2DStore((s) => s.setReferenceImages);
  const [showImagePrompts, setShowImagePrompts] = useState(false);
  const [aspectRatioList, setAspectRatioList] = useState<PopoverItem[]>([
    {
      label: "Wide",
      selected: aspectRatio === "wide",
      icon: <FontAwesomeIcon icon={faRectangle} className="h-4 w-4" />,
    },
    {
      label: "Tall",
      selected: aspectRatio === "tall",
      icon: <FontAwesomeIcon icon={faRectangleVertical} className="h-4 w-4" />,
    },
    {
      label: "Square",
      selected: aspectRatio === "square",
      icon: <FontAwesomeIcon icon={faSquare} className="h-4 w-4" />,
    },
  ]);

  const [resolutionList, setResolutionList] = useState<PopoverItem[]>([
    {
      label: "1K",
      selected: resolution === "1k",
      icon: <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />,
    },
    {
      label: "2K",
      selected: resolution === "2k",
      icon: <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />,
    },
    {
      label: "4K",
      selected: resolution === "4k",
      icon: <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />,
    },
  ]);

  useEffect(() => {
    if (selectedImageModel?.isValidGenerationCount(generationCount)) {
      return;
    }
    const defaultGenerations = selectedImageModel?.defaultGenerationCount || 4;
    onGenerationCountChange?.(defaultGenerations);
  }, [selectedImageModel, generationCount]);

  useEffect(() => {
    setResolutionList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label.toLowerCase() === resolution,
      })),
    );
  }, [resolution]);

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
    const value = selectedItem.label.toLowerCase() as AspectRatio;
    onAspectRatioChange?.(value);
    setAspectRatio(value);
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      })),
    );
  };

  const handleResolutionSelect = (selectedItem: PopoverItem) => {
    setResolution(selectedItem.label.toLowerCase() as any);
  };

  // Image prompt row replaces legacy upload/gallery UI

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

  // const handleTauriEnqueue = async () => {
  //   const api = new PromptsApi();
  //   let image = getCanvasRenderBitmap();
  //   if (image === undefined) {
  //     console.log("image is undefined");
  //     return;
  //   }
  //   const base64Bitmap = await EncodeImageBitmapToBase64(image);

  //   const byteString = atob(base64Bitmap);
  //   const mimeString = "image/png";

  //   const ab = new ArrayBuffer(byteString.length);
  //   const ia = new Uint8Array(ab);

  //   for (let i = 0; i < byteString.length; i++) {
  //     ia[i] = byteString.charCodeAt(i);
  //   }

  //   const uuid = crypto.randomUUID(); // Generate a new UUID
  //   const file = new File([ab], `${uuid}.png`, { type: mimeString });

  //   const snapshotMediaToken = await api.uploadSceneSnapshot({
  //     screenshot: file,
  //   });

  //   if (snapshotMediaToken.data === undefined) {
  //     toast.error("Error: Unable to upload scene snapshot Please try again.");
  //     return;
  //   }

  //   console.log("useSystemPrompt", useSystemPrompt);
  //   console.log("Snapshot media token:", snapshotMediaToken.data);

  //   const aspectRatio = getCurrentAspectRatio();
  //   const resolution = getCurrentResolution();

  //   let request: EnqueueEditImageRequest = {
  //     model: selectedImageModel,
  //     scene_image_media_token: snapshotMediaToken.data!,
  //     image_media_tokens: referenceImages
  //       .map((image) => image.mediaToken)
  //       .filter((t) => t.length > 0),
  //     disable_system_prompt: !useSystemPrompt,
  //     prompt: prompt,
  //     image_count: generationCount,
  //     aspect_ratio: aspectRatio,
  //     image_resolution: resolution,
  //   };

  //   if (!!selectedProvider) {
  //     request.provider = selectedProvider;
  //   }

  //   const generateResponse = await EnqueueEditImage(request);

  //   console.log("generateResponse", generateResponse);
  // };

  const handleGenerate = async () => {
    const busy = Boolean(isEnqueueing ?? internalEnqueueing);
    if (busy || isDisabled || !prompt.trim()) return;
    setInternalEnqueueing(true);
    const timeout = setTimeout(() => {
      setInternalEnqueueing(false);
    }, 10000);
    try {
      await Promise.resolve(
        onGenerateClick(prompt, {
          aspectRatio,
          resolution,
          images: referenceImages,
          selectedProvider: selectedProvider,
        }),
      );
    } finally {
      clearTimeout(timeout);
      setInternalEnqueueing(false);
    }
  };

  const getCurrentAspectRatioIcon = () => {
    const selected = aspectRatioList.find((item) => item.selected);
    if (!selected || !selected.icon) return faRectangle;
    const iconElement = selected.icon as React.ReactElement<{ icon: IconProp }>;
    return iconElement.props.icon;
  };

  // const getCurrentAspectRatio = (): EnqueueEditImageSize => {
  //   const selected = aspectRatioList.find((item) => item.selected);
  //   switch (selected?.label.toLowerCase()) {
  //     case "wide":
  //       return EnqueueEditImageSize.Wide;
  //     case "tall":
  //       return EnqueueEditImageSize.Tall;
  //     case "square":
  //     default:
  //       return EnqueueEditImageSize.Square;
  //   }
  // };

  // const getCurrentResolution = (): EnqueueEditImageResolution | undefined => {
  //   const selected = resolutionList.find((item) => item.selected);
  //   switch (selected?.label) {
  //     case "1k":
  //       return EnqueueEditImageResolution.OneK;
  //     case "2k":
  //       return EnqueueEditImageResolution.TwoK;
  //     case "4k":
  //       return EnqueueEditImageResolution.FourK;
  //     default:
  //       return undefined;
  //   }
  // };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Stop propagation of keyboard events to prevent them from reaching the canvas
    e.stopPropagation();

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
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
              selectedImageModel?.maxImagePromptCount ?? 1,
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
                />,
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
              "rounded-t-none",
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
                    isImageRowVisible && "text-primary",
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
              {selectedImageModel?.canChangeAspectRatio && (
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
              )}
              {selectedImageModel?.canChangeResolution && (
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
                      <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />
                    }
                  />
                </Tooltip>
              )}
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
              <GenerationCountPicker
                currentModel={selectedImageModel}
                currentCount={generationCount}
                handleCountChange={(count) => {
                  onGenerationCountChange?.(count);
                }}
                isFreeUser={isFreeUser}
              />
              <GenerateButton
                className="flex items-center border-none bg-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                icon={undefined}
                onClick={handleGenerate}
                disabled={isEnqueueing || !prompt.trim()}
                loading={isEnqueueing}
              >
                Generate
              </GenerateButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
