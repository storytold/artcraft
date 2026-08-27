import { useState, useRef, useEffect, useMemo, ReactNode } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { JobContextType, UploaderState } from "@storyteller/common";
import { toast } from "@storyteller/ui-toaster";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { GenerateIconButton } from "@storyteller/ui-button";
import { GenerateImage, GenerateImageRequest } from "@storyteller/tauri-api";
import { ChevronDownIcon, ChevronUpIcon, MaximizeIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { ImageModel } from "@storyteller/model-list";
import { arrayMove } from "@dnd-kit/sortable";
import type { UploadMediaFn } from "@storyteller/api";
import {
  usePromptImageStore,
  RefImage,
  useEnterToGenerateStore,
} from "./promptStore";
import { useAutoGrowEditorHeight } from "./useAutoGrowEditorHeight";
import { PromptFullscreenModal, useFullscreenPrompt } from "./PromptFullscreenModal";
import { PromptFullscreenButton } from "./PromptFullscreenButton";
import { PromptClearAllButton } from "./PromptClearAllButton";
import { gtagEvent } from "@storyteller/google-analytics";
import { twMerge } from "tailwind-merge";
import { GenerationProvider } from "@storyteller/api-enums";
import { AspectRatioPicker } from "./common/AspectRatioPicker";
import { AspectRatioIcon } from "./common/AspectRatioIcon";
import { GenerationCountPicker } from "./common/GenerationCountPicker";
import { ResolutionPicker } from "./common/ResolutionPicker";
import { QualityPicker } from "./common/QualityPicker";
import { ReferenceDeck } from "./deck/ReferenceDeck";
import { useDeckMedia } from "./deck/useDeckMedia";
import {
  PromptBoxDropOverlay,
  usePromptBoxDrop,
  type DroppedFiles,
} from "./deck/usePromptBoxDrop";
import { DeckAddAction, DeckItem } from "./deck/deckTypes";

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
    subscriberId: string,
  ) => void | Promise<void>;
  selectedModel?: ImageModel;
  selectedProvider?: GenerationProvider;
  imageMediaId?: string;
  url?: string;
  onImageRowVisibilityChange?: (visible: boolean) => void;
  credits?: number | null;
  /** Optional model-picker slot rendered at the start of the toolbar
   *  (left of the aspect-ratio picker). */
  modelSelector?: ReactNode;
}

export const PromptBoxImage = ({
  useJobContext,
  uploadImage,
  onEnqueuePressed,
  selectedModel,
  selectedProvider,
  imageMediaId,
  url,
  credits,
  modelSelector,
}: PromptBoxImageProps) => {
  useSignals();

  console.debug(
    "Selected model and provider:",
    selectedModel,
    selectedProvider,
  );

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

  const prompt = usePromptImageStore((s) => s.prompt);
  const setPrompt = usePromptImageStore((s) => s.setPrompt);
  const aspectRatio = usePromptImageStore((s) => s.aspectRatio);
  const setAspectRatio = usePromptImageStore((s) => s.setAspectRatio);
  const resolution = usePromptImageStore((s) => s.resolution);
  const setResolution = usePromptImageStore((s) => s.setResolution);
  const generationCount = usePromptImageStore((s) => s.generationCount);
  const setGenerationCount = usePromptImageStore((s) => s.setGenerationCount);
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Collapsed auto-grow + manual expand, position-aware and recomputed only on
  // toggle / content change / viewport resize (not every render).
  const { isExpanded, toggleExpand } = useAutoGrowEditorHeight(
    textareaRef,
    prompt,
  );
  const { isFullscreen, openFullscreen, closeFullscreen } =
    useFullscreenPrompt();

  const referenceImages = usePromptImageStore((s) => s.referenceImages);
  const setReferenceImages = usePromptImageStore((s) => s.setReferenceImages);
  const enterToGenerate = useEnterToGenerateStore((s) => s.enabled);

  const maxImagePromptCount = Math.max(
    1,
    selectedModel?.maxImagePromptCount ?? 1,
  );

  const deck = useDeckMedia({
    referenceImages,
    setReferenceImages,
    maxImages: maxImagePromptCount,
    uploadImage: uploadImage as UploadMediaFn | undefined,
    ownGalleryModal: true,
  });

  // Drag & drop / paste onto the box bounds. Images are the only reference
  // kind this box takes, and only when the model can use them at all.
  const dropAcceptsImages = !!selectedModel?.canUseImagePrompt;

  const handleDroppedFiles = ({ images }: DroppedFiles) => {
    if (images.length === 0) return;
    if (deck.availableImageSlots <= 0) {
      toast.error(
        `Max ${maxImagePromptCount} image reference${maxImagePromptCount === 1 ? "" : "s"}`,
      );
      return;
    }
    deck.processImageFiles(images, "start");
  };

  const drop = usePromptBoxDrop({
    acceptsImages: dropAcceptsImages,
    acceptsVideos: false,
    acceptsAudio: false,
    onDropFiles: handleDroppedFiles,
  });

  const deckItems: DeckItem[] = useMemo(
    () => [
      ...referenceImages.map((img, i) => ({
        id: img.id,
        kind: "image" as const,
        url: img.url,
        name: `Image ${i + 1}`,
      })),
      ...deck.uploadingImages.map((entry, i) => ({
        id: entry.id,
        kind: "image" as const,
        url: entry.previewUrl,
        name: `Image ${referenceImages.length + i + 1}`,
        uploading: true,
      })),
    ],
    [referenceImages, deck.uploadingImages],
  );

  const deckAddActions: DeckAddAction[] = [
    {
      key: "upload-image",
      label: "Upload",
      group: "image",
      onSelect: deck.openImageUpload,
    },
    {
      key: "library-image",
      label: "Pick from library",
      group: "image",
      onSelect: () => deck.openGallery("start"),
    },
  ];

  const renderReferenceDeck = (alwaysExpanded?: boolean) =>
    selectedModel?.canUseImagePrompt ? (
      <ReferenceDeck
        items={deckItems}
        canAdd={deckItems.length < maxImagePromptCount}
        addActions={deckAddActions}
        addMenuGroupHints={{
          image: `${referenceImages.length}/${maxImagePromptCount}`,
        }}
        onAddClick={deck.openAnyUpload}
        onRemove={(id) =>
          setReferenceImages(referenceImages.filter((img) => img.id !== id))
        }
        onReorderImages={(from, to) =>
          setReferenceImages(arrayMove(referenceImages, from, to))
        }
        onClearAll={() => setReferenceImages([])}
        alwaysExpanded={alwaysExpanded}
      />
    ) : null;

  // New aspect ratio and resolution — stored globally so cost estimates can observe them
  const commonAspectRatio = usePromptImageStore((s) => s.commonAspectRatio);
  const setCommonAspectRatio = usePromptImageStore(
    (s) => s.setCommonAspectRatio,
  );
  const commonResolution = usePromptImageStore((s) => s.commonResolution);
  const setCommonResolution = usePromptImageStore((s) => s.setCommonResolution);
  const commonQuality = usePromptImageStore((s) => s.commonQuality);
  const setCommonQuality = usePromptImageStore((s) => s.setCommonQuality);

  const [aspectRatioList, setAspectRatioList] = useState<PopoverItem[]>([
    {
      label: "Wide",
      selected: aspectRatio === "wide",
      icon: <AspectRatioIcon ratio={[16, 10]} />,
    },
    {
      label: "Tall",
      selected: aspectRatio === "tall",
      icon: <AspectRatioIcon ratio={[10, 16]} />,
    },
    {
      label: "Square",
      selected: aspectRatio === "square",
      icon: <AspectRatioIcon ratio={[1, 1]} />,
    },
  ]);
  const [resolutionList, setResolutionList] = useState<PopoverItem[]>([
    {
      label: "1K",
      selected: resolution === "1k",
      icon: <MaximizeIcon  className="h-4 w-4" />,
    },
    {
      label: "2K",
      selected: resolution === "2k",
      icon: <MaximizeIcon  className="h-4 w-4" />,
    },
    {
      label: "4K",
      selected: resolution === "4k",
      icon: <MaximizeIcon  className="h-4 w-4" />,
    },
  ]);

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
    if (selectedModel?.isValidGenerationCount(generationCount)) {
      return;
    }
    const defaultGenerations = selectedModel?.defaultGenerationCount || 4;
    setGenerationCount(defaultGenerations);
  }, [selectedModel, generationCount]);

  useEffect(() => {
    setAspectRatioList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label.toLowerCase() === aspectRatio,
      })),
    );
  }, [aspectRatio]);

  useEffect(() => {
    setResolutionList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label.toLowerCase() === resolution,
      })),
    );
  }, [resolution]);

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    setAspectRatio(selectedItem.label.toLowerCase() as any);
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

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next =
      value.slice(0, selectionStart) + pastedText + value.slice(selectionEnd);
    setPrompt(next);
    requestAnimationFrame(() => {
      const pos = Math.min(selectionStart + pastedText.length, next.length);
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const hasClearableContent = prompt.length > 0 || referenceImages.length > 0;

  const handleClearAll = () => {
    setPrompt("");
    setReferenceImages([]);
  };

  const maxLen = selectedModel?.maxPromptLength ?? 1000;

  const handleEnqueue = async () => {
    if (!prompt.trim()) {
      console.warn("Cannot generate image: prompt is empty");
      return;
    }
    if (isFinite(maxLen) && prompt.length > maxLen) {
      toast.error(
        `Prompt exceeds the ${maxLen} character limit for this model`,
      );
      return;
    }

    if (!selectedModel) {
      console.warn("Cannot generate image: no model selected");
      return;
    }

    console.debug("Selected model:", selectedModel);
    console.debug("Prompt:", prompt);

    setIsEnqueueing(true);

    gtagEvent("enqueue_image");

    const subscriberId = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    setTimeout(() => {
      console.debug("Turn off blocking of prompt box...");
      setIsEnqueueing(false);
    }, 10000);

    try {
      const request: GenerateImageRequest = {
        prompt: prompt,
        model: selectedModel,
        batch_size: generationCount,
        frontend_caller: "text_to_image",
        frontend_subscriber_id: subscriberId,
      };

      if (!!selectedProvider) {
        request.provider = selectedProvider;
      }

      if (selectedModel?.supportsNewAspectRatio()) {
        request.aspect_ratio = commonAspectRatio;
      }

      if (selectedModel?.supportsNewResolution()) {
        request.resolution = commonResolution;
      }

      if (selectedModel?.supportsQuality()) {
        request.quality = commonQuality ?? selectedModel.defaultQuality;
      }

      if (
        selectedModel?.canUseImagePrompt &&
        !!referenceImages &&
        referenceImages.length > 0
      ) {
        request.image_media_tokens = referenceImages
          .map((image) => image.mediaToken)
          .filter((t) => t.length > 0);
      }

      window.__storeTaskEnqueueMeta?.({
        prompt,
        refImageUrls: referenceImages?.map((img) => img.url).filter(Boolean),
        modelType: (selectedModel as any)?.tauriId || String(selectedModel),
        timestamp: Date.now(),
        batchCount: generationCount,
      });

      console.debug("Image Generation Request", request);

      const generateResponse = await GenerateImage(request);
      console.debug("PromptBoxImage - generateResponse", generateResponse);

      await onEnqueuePressed?.(prompt, generationCount, subscriberId);
    } catch (err) {
      console.error("PromptBoxImage - enqueue failed", err);
      toast.error("Failed to start image generation. Please try again.");
    } finally {
      setIsEnqueueing(false);
    }
  };

  const getCurrentLegacyAspectRatioIcon = () => {
    const selected = aspectRatioList.find((item) => item.selected);
    switch (selected?.label?.toLowerCase()) {
      case "wide":
        return <AspectRatioIcon ratio={[16, 10]} />;
      case "tall":
        return <AspectRatioIcon ratio={[10, 16]} />;
      case "square":
        return <AspectRatioIcon ratio={[1, 1]} />;
      default:
        return <AspectRatioIcon ratio={[16, 10]} />;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    const isSubmitCombo = enterToGenerate && !e.shiftKey;
    if (isSubmitCombo) {
      e.preventDefault();
      handleEnqueue();
    }
  };

  return (
    <>
      {deck.fileInputs}
      {deck.galleryModal}

      <div className="relative z-20 flex flex-col">
        <div
          className={twMerge(
            "glass relative w-full rounded-[3px] p-4",
            isFocused
              ? "ring-1 ring-primary border-primary"
              : "ring-1 ring-transparent",
          )}
          {...drop.dropZoneProps}
        >
          <PromptBoxDropOverlay
            dragState={drop.dragState}
            acceptsImages={dropAcceptsImages}
            acceptsVideos={false}
            acceptsAudio={false}
          />
          <div className="flex justify-center gap-2">
            {renderReferenceDeck()}

            <div className="promptbox-resize-wrap relative flex-1">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Describe what you want in the image..."
                className="promptbox-scrollbar text-md mb-2 min-h-[2.5em] w-full resize-y overflow-y-auto rounded-[3px] bg-transparent pb-2 pr-8 pt-1 text-base-fg placeholder-base-fg/60 transition-[height] duration-200 ease-out focus:outline-none"
                value={prompt}
                onChange={handleChange}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <PromptFullscreenButton onClick={openFullscreen} />
              <span
                className={`absolute -bottom-1 right-0 text-[10px] tabular-nums ${isFinite(maxLen) && prompt.length > maxLen ? "text-red-500" : "text-base-fg/40"}`}
              >
                {prompt.length} / {isFinite(maxLen) ? maxLen : "∞"}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {modelSelector}
              {selectedModel?.supportsNewAspectRatio() && (
                <AspectRatioPicker
                  model={selectedModel}
                  currentAspectRatio={commonAspectRatio}
                  handleCommonAspectRatioSelect={setCommonAspectRatio}
                />
              )}
              {selectedModel?.canChangeAspectRatio &&
                !selectedModel?.supportsNewAspectRatio() && (
                  <Tooltip
                    content="Aspect Ratio (Legacy)"
                    position="top"
                    className="z-50"
                    closeOnClick={true}
                  >
                    <PopoverMenu
                      items={aspectRatioList}
                      onSelect={handleAspectRatioSelect}
                      mode="toggle"
                      panelTitle="Aspect Ratio (Legacy)"
                      showIconsInList
                      triggerIcon={getCurrentLegacyAspectRatioIcon()}
                    />
                  </Tooltip>
                )}
              {selectedModel?.supportsNewResolution() && (
                <ResolutionPicker
                  model={selectedModel}
                  currentResolution={commonResolution}
                  handleCommonResolutionSelect={setCommonResolution}
                />
              )}
              {selectedModel?.canChangeResolution &&
                !selectedModel?.supportsNewResolution() && (
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
                        <MaximizeIcon  className="h-4 w-4" />
                      }
                    />
                  </Tooltip>
                )}
              {selectedModel?.supportsQuality() && (
                <QualityPicker
                  model={selectedModel}
                  currentQuality={commonQuality}
                  handleCommonQualitySelect={setCommonQuality}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <PromptClearAllButton
                onClick={handleClearAll}
                disabled={!hasClearableContent}
                confirmClear={referenceImages.length > 0}
              />
              <GenerationCountPicker
                currentModel={selectedModel}
                currentCount={generationCount}
                handleCountChange={(count) => {
                  setGenerationCount(count);
                }}
              />
              <GenerateIconButton
                onClick={handleEnqueue}
                disabled={!prompt.trim()}
                loading={isEnqueueing}
                credits={credits}
              />
            </div>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <Tooltip
              content={isExpanded ? "Collapse" : "Expand"}
              position="top"
              className="-mb-2"
            >
              <button
                type="button"
                onClick={toggleExpand}
                className="text-base-fg/30 hover:text-base-fg/90 transition-colors px-3 py-0.5"
              >
                <DynamicIcon
                  icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                  className="text-xs"
                />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      <PromptFullscreenModal
        isOpen={isFullscreen}
        onClose={closeFullscreen}
        promptLength={prompt.length}
        maxLength={maxLen}
        footerControls={modelSelector}
        imagePromptRow={renderReferenceDeck(true) ?? undefined}
        clearAllButton={
          <PromptClearAllButton
            onClick={handleClearAll}
            disabled={!hasClearableContent}
            confirmClear={referenceImages.length > 0}
          />
        }
      >
        <textarea
          placeholder="Describe what you want in the image..."
          className="promptbox-scrollbar text-md h-full min-h-0 w-full resize-none overflow-y-auto rounded-[3px] bg-transparent text-base-fg placeholder-base-fg/60 focus:outline-none"
          value={prompt}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
        />
      </PromptFullscreenModal>
    </>
  );
};
