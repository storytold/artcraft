import { useState, useRef, useEffect, ReactNode } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { useSignals } from "@preact/signals-react/runtime";
import {
  JobContextType,
  UploaderState,
  UploaderStates,
} from "@storyteller/common";
import { downloadFileFromUrl } from "@storyteller/api";
import { toast } from "@storyteller/ui-toaster";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import {
  EnqueueTextToImage,
  EnqueueTextToImageRequest,
  EnqueueTextToImageSize,
} from "@storyteller/tauri-api";
import {
  faMessageXmark,
  faMessageCheck,
  faSparkles,
  faSpinnerThird,
  faCopy,
  faTrashAlt,
  faPlus,
  faXmark,
  faImages,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faRectangle,
  faSquare,
  faRectangleVertical,
  faImage,
} from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import { ImageModel, getCapabilitiesForModel } from "@storyteller/model-list";
import { usePromptImageStore, RefImage } from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";
import { twMerge } from "tailwind-merge";

interface PromptBoxImageProps {
  useJobContext: () => JobContextType;
  uploadImage?: ({
    title,
    assetFile,
    progressCallback,
  }: {
    title: string;
    assetFile: File;
    progressCallback: (newState: UploaderState) => void;
  }) => Promise<void>;
  onEnqueuePressed?: (
    prompt: string,
    count: number,
    subscriberId: string
  ) => void | Promise<void>;
  selectedModel?: ImageModel;
  imageMediaId?: string;
  url?: string;
  onImageRowVisibilityChange?: (visible: boolean) => void;
}

export const PromptBoxImage = ({
  useJobContext,
  uploadImage,
  onEnqueuePressed,
  selectedModel,
  imageMediaId,
  url,
  onImageRowVisibilityChange,
}: PromptBoxImageProps) => {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);

  const prompt = usePromptImageStore((s) => s.prompt);
  const setPrompt = usePromptImageStore((s) => s.setPrompt);
  const useSystemPrompt = usePromptImageStore((s) => s.useSystemPrompt);
  const setUseSystemPrompt = usePromptImageStore((s) => s.setUseSystemPrompt);
  const aspectRatio = usePromptImageStore((s) => s.aspectRatio);
  const setAspectRatio = usePromptImageStore((s) => s.setAspectRatio);
  const generationCount = usePromptImageStore((s) => s.generationCount);
  const setGenerationCount = usePromptImageStore((s) => s.setGenerationCount);
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    []
  );
  const referenceImages = usePromptImageStore((s) => s.referenceImages);
  const setReferenceImages = usePromptImageStore((s) => s.setReferenceImages);
  const [uploadingImages, _setUploadingImages] = useState<
    { id: string; file: File }[]
  >([]);
  const [showImagePrompts, setShowImagePrompts] = useState(false);
  const isImageRowVisible =
    showImagePrompts ||
    referenceImages.length > 0 ||
    uploadingImages.length > 0;

  useEffect(() => {
    onImageRowVisibilityChange?.(isImageRowVisible);
  }, [isImageRowVisible, onImageRowVisibilityChange]);
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

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    // Build generation count options based on selected model
    const caps = getCapabilitiesForModel(selectedModel);
    const defaultCount = Math.min(
      Math.max(1, caps.defaultGenerationCount ?? 1),
      caps.maxGenerationCount
    );

    setGenerationCount(defaultCount);

    const items: PopoverItem[] = Array.from(
      { length: caps.maxGenerationCount },
      (_, i) => i + 1
    ).map((count) => ({
      label: String(count),
      selected: count === defaultCount,
      icon: <FontAwesomeIcon icon={faCopy} className="h-4 w-4" />,
    }));
    setGenerationCountList(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  useEffect(() => {
    setGenerationCountList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === String(generationCount),
      }))
    );
  }, [generationCount]);

  useEffect(() => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === aspectRatio,
      }))
    );
  }, [aspectRatio]);

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    setAspectRatio(selectedItem.label as any);
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      }))
    );
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

  const handleRemoveReference = (id: string) => {
    setReferenceImages(referenceImages.filter((img) => img.id !== id));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const maxImagePrompts = Math.max(1, selectedModel?.maxImagePromptCount ?? 1);
  const availableSlotsRender = Math.max(
    0,
    maxImagePrompts - referenceImages.length - uploadingImages.length
  );
  const usedSlotsRender = Math.min(
    maxImagePrompts,
    referenceImages.length + uploadingImages.length
  );
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const maxCount = Math.max(1, selectedModel?.maxImagePromptCount ?? 1);
    const currentCount = referenceImages.length + uploadingImages.length;
    const availableSlots = Math.max(0, maxCount - currentCount);
    if (availableSlots <= 0) {
      toast.error("Image limit reached for this model.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    if (filesToProcess.length < files.length) {
      toast.error(
        `Max ${availableSlots} image${
          availableSlots === 1 ? "" : "s"
        } allowed. Added the first ${filesToProcess.length}.`
      );
    }

    filesToProcess.forEach((file) => {
      const uploadId = Math.random().toString(36).substring(7);
      _setUploadingImages((prev) => [...prev, { id: uploadId, file }]);

      const reader = new FileReader();
      reader.onloadend = async () => {
        if (uploadImage) {
          await uploadImage({
            title: `reference-image-${Math.random()
              .toString(36)
              .substring(2, 15)}`,
            assetFile: file,
            progressCallback: (newState: UploaderState) => {
              if (newState.status === UploaderStates.success && newState.data) {
                const referenceImage: RefImage = {
                  id: Math.random().toString(36).substring(7),
                  url: reader.result as string,
                  file,
                  mediaToken: newState.data,
                };
                unstable_batchedUpdates(() => {
                  _setUploadingImages((prev) =>
                    prev.filter((img) => img.id !== uploadId)
                  );
                  const latestRefs =
                    usePromptImageStore.getState().referenceImages;
                  setReferenceImages([...latestRefs, referenceImage]);
                });
              } else if (
                newState.status === UploaderStates.assetError ||
                newState.status === UploaderStates.imageCreateError
              ) {
                unstable_batchedUpdates(() => {
                  _setUploadingImages((prev) =>
                    prev.filter((img) => img.id !== uploadId)
                  );
                });
              }
            },
          });
        } else {
          const referenceImage: RefImage = {
            id: Math.random().toString(36).substring(7),
            url: reader.result as string,
            file,
            mediaToken: "",
          };
          unstable_batchedUpdates(() => {
            _setUploadingImages((prev) =>
              prev.filter((img) => img.id !== uploadId)
            );
            const latestRefs = usePromptImageStore.getState().referenceImages;
            setReferenceImages([...latestRefs, referenceImage]);
          });
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    });
  };
  const handleUploadClick = () => fileInputRef.current?.click();
  const toggleImageOptions = () => {
    const anyImages = referenceImages.length > 0 || uploadingImages.length > 0;
    setShowImagePrompts((prev) => {
      if (prev) {
        return anyImages;
      }
      return true;
    });
  };
  const handleGalleryClose = () => {
    setIsGalleryModalOpen(false);
    setSelectedGalleryImages([]);
  };

  const handleImageSelect = (id: string) => {
    const maxSelect = Math.max(1, selectedModel?.maxImagePromptCount ?? 1);
    setSelectedGalleryImages((prev) => {
      if (prev.includes(id)) {
        return prev.filter((imageId) => imageId !== id);
      }
      if (prev.length >= maxSelect) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleGalleryImages = (selectedItems: GalleryItem[]) => {
    const maxCount = Math.max(1, selectedModel?.maxImagePromptCount ?? 1);
    const availableSlots = Math.max(0, maxCount - referenceImages.length);
    if (availableSlots <= 0) {
      setIsGalleryModalOpen(false);
      setSelectedGalleryImages([]);
      return;
    }

    const newRefs = [...referenceImages];
    selectedItems.slice(0, availableSlots).forEach((item) => {
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
    setIsEnqueueing(true);

    gtagEvent("enqueue_image");

    const subscriberId = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    onEnqueuePressed?.(prompt, generationCount, subscriberId);

    setTimeout(() => {
      // TODO(bt,2025-05-08): This is a hack so we don't accidentally wind up with a permanently disabled prompt box if
      // the backend hangs on a given request.
      console.debug("Turn off blocking of prompt box...");
      setIsEnqueueing(false);
    }, 10000);

    const aspectRatio = getCurrentAspectRatio();
    
    const request : EnqueueTextToImageRequest = {
      prompt: prompt,
      model: selectedModel,
      aspect_ratio: aspectRatio,
      number_images: generationCount,
      frontend_caller: "text_to_image",
      frontend_subscriber_id: subscriberId,
    };

    if (selectedModel?.canUseImagePrompt && !!referenceImages && referenceImages.length > 0) {
      request.image_media_tokens = referenceImages.map((image) => image.mediaToken);
    }

    const generateResponse = await EnqueueTextToImage(request);

    console.log("PromptBoxImage - generateResponse", generateResponse);

    setIsEnqueueing(false);
  };

  const getCurrentResolutionIcon = () => {
    const selected = aspectRatioList.find((item) => item.selected);
    if (!selected || !selected.icon) return faRectangle;
    const iconElement = selected.icon as React.ReactElement<{ icon: IconProp }>;
    return iconElement.props.icon;
  };

  const getCurrentAspectRatio = (): EnqueueTextToImageSize => {
    const selected = aspectRatioList.find((item) => item.selected);
    switch (selected?.label) {
      case "3:2":
        return EnqueueTextToImageSize.Wide;
      case "2:3":
        return EnqueueTextToImageSize.Tall;
      case "1:1":
      default:
        return EnqueueTextToImageSize.Square;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
          setContent(null);
        }}
        className="max-w-4xl max-h-[80vh]"
      >
        {content}
      </Modal>

      <div className="relative z-20 flex flex-col">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
          multiple={availableSlotsRender > 1}
        />
        {isImageRowVisible && selectedModel?.canUseImagePrompt && (
          <div className="absolute -top-[72px] left-0 glass w-[730px] rounded-t-xl flex">
            <div className="grow grid grid-cols-1 gap-1 py-2 px-3">
              <div className="flex gap-2">
                <div className="flex flex-col grow gap-1">
                  <div className="flex items-center gap-2 opacity-90">
                    <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
                    <span className="text-sm text-white font-medium flex items-center gap-1.5">
                      Image Prompts
                      <span className="text-white/60 font-semibold">
                        ({usedSlotsRender}/{selectedModel?.maxImagePromptCount})
                      </span>
                    </span>
                  </div>
                  <span className="text-[13px] text-white/60">
                    Use the elements of an image
                  </span>
                </div>

                <div className="flex gap-2">
                  {referenceImages
                    .slice(
                      0,
                      Math.max(0, selectedModel?.maxImagePromptCount ?? 1)
                    )
                    .map((image) => (
                      <div
                        key={image.id}
                        className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30 hover:border-white/80 transition-all group cursor-pointer hover:cursor-zoom-in"
                        onClick={() => {
                          setContent(
                            <img
                              src={image.url}
                              alt="Reference preview"
                              className="w-full h-full object-contain"
                            />
                          );
                          setIsModalOpen(true);
                        }}
                      >
                        <img
                          src={image.url}
                          alt="Reference"
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveReference(image.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 hover:bg-red/70 text-white backdrop-blur-md transition-colors hover:bg-black cursor-pointer"
                        >
                          <FontAwesomeIcon
                            icon={faXmark}
                            className="h-2.5 w-2.5"
                          />
                        </button>
                      </div>
                    ))}
                  {uploadingImages
                    .slice(
                      0,
                      Math.max(
                        0,
                        (selectedModel?.maxImagePromptCount ?? 1) -
                          referenceImages.length
                      )
                    )
                    .map(({ id, file }) => {
                      const previewUrl = URL.createObjectURL(file);
                      return (
                        <div
                          key={id}
                          className="glass relative aspect-square overflow-hidden rounded-lg w-14 border-2 border-white/30"
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
                  {referenceImages.length + uploadingImages.length <
                    (selectedModel?.maxImagePromptCount ?? 1) && (
                    <Tooltip
                      interactive={true}
                      position="top"
                      delay={100}
                      className="bg-[#46464B] p-2 -mb-0.5"
                      closeOnClick={true}
                      content={
                        <div className="flex flex-col gap-1.5">
                          <Button
                            variant="primary"
                            onClick={handleUploadClick}
                            icon={faPlus}
                            className="w-full"
                          >
                            Upload
                          </Button>
                          <Button
                            variant="action"
                            onClick={() => setIsGalleryModalOpen(true)}
                            icon={faImages}
                            className="w-full bg-[#686870] hover:bg-[#78787F]"
                          >
                            Pick from library
                          </Button>
                        </div>
                      }
                    >
                      <Button
                        variant="action"
                        className="bg-white/10 hover:bg-white/20 aspect-square w-full overflow-hidden rounded-lg w-14 border-dashed border-2 border-white/30 hover:border-white/50 transition-all"
                        onClick={handleUploadClick}
                      >
                        <FontAwesomeIcon
                          icon={faPlus}
                          className="text-2xl opacity-80"
                        />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-2 flex items-center">
              <div className="flex items-center gap-2 w-[1px] h-full bg-white/10 rounded-lg" />
              <div className="p-2">
                <Button
                  variant="action"
                  icon={faTrashAlt}
                  className="h-8 w-3 bg-[#5F5F68]/60 hover:bg-[#5F5F68]/90"
                  onClick={() => {
                    setReferenceImages([]);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div
          className={twMerge(
            "glass w-[730px] rounded-xl p-4",
            isImageRowVisible && "rounded-t-none"
          )}
        >
          <div className="flex justify-center gap-2">
            {selectedModel?.canUseImagePrompt && (
              <Tooltip
                content="Add Image"
                position="top"
                closeOnClick={true}
                className={twMerge(isImageRowVisible && "hidden opacity-0")}
              >
                <Button
                  variant="action"
                  className={twMerge(
                    "h-8 w-8 p-0 bg-transparent hover:bg-transparent group transition-all",
                    isImageRowVisible && "text-primary"
                  )}
                  onClick={toggleImageOptions}
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
              placeholder="Describe what you want in the image..."
              className="text-md mb-2 max-h-[5.5em] flex-1 resize-none overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-white placeholder-white placeholder:text-white/60 focus:outline-none"
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
                content="Aspect Ratio"
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
                  triggerIcon={
                    <FontAwesomeIcon icon={faCopy} className="h-4 w-4" />
                  }
                  panelClassName="min-w-28"
                  panelTitle="No. of images"
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
        maxSelections={Math.max(1, availableSlotsRender)}
        onUseSelected={handleGalleryImages}
        onDownloadClicked={downloadFileFromUrl}
        forceFilter="image"
      />
    </>
  );
};
