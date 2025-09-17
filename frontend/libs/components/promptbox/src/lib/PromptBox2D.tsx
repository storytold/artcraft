import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { toast } from "@storyteller/ui-toaster";
import {
  JobContextType,
  MaybeCanvasRenderBitmapType,
  UploaderState,
  UploaderStates,
} from "@storyteller/common";
import { downloadFileFromUrl } from "@storyteller/api";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import {
  faMessageXmark,
  faMessageCheck,
  faSparkles,
  faSpinnerThird,
  faTimes,
  faPlus,
  faUpload,
  faImages,
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
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { PromptsApi } from "@storyteller/api";
import {
  EnqueueContextualEditImage,
  EnqueueContextualEditImageSize,
} from "@storyteller/tauri-api";
import { usePrompt2DStore, RefImage } from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";
import { getCapabilitiesForModel } from "@storyteller/model-list";
import { ImageModel } from "@storyteller/model-list";

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
  const [content, setContent] = useState("");
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
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    []
  );
  const referenceImages = usePrompt2DStore((s) => s.referenceImages);
  const setReferenceImages = usePrompt2DStore((s) => s.setReferenceImages);
  const [uploadingImages, setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const uploadId = Math.random().toString(36).substring(7);
        setUploadingImages((prev) => [...prev, { id: uploadId, file }]);

        const reader = new FileReader();
        reader.onloadend = () => {
          uploadImage({
            title: `reference-image-${Math.random()
              .toString(36)
              .substring(2, 15)}`,
            assetFile: file,
            progressCallback: (newState) => {
              console.debug("Upload progress:", newState.data);
              if (newState.status === UploaderStates.success && newState.data) {
                const referenceImage: RefImage = {
                  id: Math.random().toString(36).substring(7),
                  url: reader.result as string,
                  file,
                  mediaToken: newState.data || "",
                };
                setReferenceImages([...referenceImages, referenceImage]);
                setUploadingImages((prev) =>
                  prev.filter((img) => img.id !== uploadId)
                );
                toast.success("Reference image added.");
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                setUploadingImages((prev) =>
                  prev.filter((img) => img.id !== uploadId)
                );

                toast.error("Upload failed. Please try again.");
              }
            },
          });
        };

        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveReference = (id: string) => {
    setReferenceImages(referenceImages.filter((img) => img.id !== id));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleGallerySelect = () => setIsGalleryModalOpen(true);

  const handleGalleryClose = () => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleImageSelect = (id: string) => {
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) {
        return prev.filter((imageId) => imageId !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleGalleryImages = (selectedItems: GalleryItem[]) => {
    const newRefs = [...referenceImages];
    selectedItems.forEach((item) => {
      if (!item.fullImage) return;
      newRefs.push({
        id: Math.random().toString(36).substring(7),
        url: item.fullImage,
        file: new File([], "library-image"),
        mediaToken: item.id,
      });
    });
    setReferenceImages(newRefs);
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "upload":
        handleUploadClick();
        break;
      case "gallery":
        handleGallerySelect();
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

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
        {(referenceImages.length > 0 || uploadingImages.length > 0) && (
          <div className="flex w-full gap-2">
            {referenceImages.map((image) => (
              <div
                key={image.id}
                className="glass relative aspect-square w-20 rounded-lg"
              >
                <img
                  src={image.url}
                  alt="Reference"
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  onClick={() => handleRemoveReference(image.id)}
                  className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            {uploadingImages.map(({ id, file }) => {
              const previewUrl = URL.createObjectURL(file);
              return (
                <div
                  key={id}
                  className="glass relative aspect-square w-20 overflow-hidden rounded-lg"
                >
                  <div className="absolute inset-0">
                    <img
                      src={previewUrl}
                      alt="Uploading preview"
                      className="h-full w-full object-cover blur-sm"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <FontAwesomeIcon
                      icon={faSpinnerThird}
                      className="h-6 w-6 animate-spin text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="glass w-[730px] rounded-xl p-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            multiple
          />
          <div className="flex justify-center gap-2">
            <PopoverMenu
              mode="button"
              panelTitle="Add Image"
              items={[
                {
                  label: "Upload from device",
                  selected: false,
                  icon: <FontAwesomeIcon icon={faUpload} className="h-4 w-4" />,
                  action: "upload",
                },
                {
                  label: "Choose from library",
                  selected: false,
                  icon: <FontAwesomeIcon icon={faImages} className="h-4 w-4" />,
                  action: "gallery",
                },
              ]}
              onPanelAction={handleAction}
              showIconsInList
              buttonClassName="bg-transparent hover:bg-transparent py-1.5 px-0 pr-1 m-0 hover:opacity-50 transition-opacity duration-100 ring-0 border-none focus:ring-0 outline-none"
              triggerIcon={
                <FontAwesomeIcon icon={faPlus} className="text-xl" />
              }
            />

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
      <GalleryModal
        isOpen={!!isGalleryModalOpen}
        onClose={handleGalleryClose}
        mode="select"
        selectedItemIds={selectedGalleryImages}
        onSelectItem={handleImageSelect}
        maxSelections={4}
        onUseSelected={handleGalleryImages}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );
};
