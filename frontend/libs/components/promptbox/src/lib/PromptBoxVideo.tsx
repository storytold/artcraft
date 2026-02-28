import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { JobContextType } from "@storyteller/common";
import { downloadFileFromUrl } from "@storyteller/api";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { ToggleButton, GenerateButton } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";
import {
  EnqueueImageToVideo,
  EnqueueImageToVideoRequest,
} from "@storyteller/tauri-api";
import {
  faMessageXmark,
  faMessageCheck,
  faWaveformLines,
  faClock,
} from "@fortawesome/pro-solid-svg-icons";
import { faCircleInfo } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import {
  SizeIconOption,
  SizeOption,
  VideoModel,
} from "@storyteller/model-list";
import { usePromptVideoStore, RefImage, VideoInputMode } from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";
import { ImagePromptRow } from "./ImagePromptRow";
import type { UploadImageFn } from "./ImagePromptRow";
import { AspectRatioIcon } from "./common/AspectRatioIcon";
import { twMerge } from "tailwind-merge";
import { toast } from "@storyteller/ui-toaster";
import { GenerationProvider } from "@storyteller/api-enums";

type GROK_ASPECT_RATIO = "landscape" | "portrait" | "square";

const DEFAULT_RESOLUTIONS: SizeOption[] = [
  {
    tauriValue: "720p",
    textLabel: "720p",
    icon: SizeIconOption.Landscape,
  },
  {
    tauriValue: "480p",
    textLabel: "480p",
    icon: SizeIconOption.Landscape,
  },
];

interface PromptBoxVideoProps {
  useJobContext: () => JobContextType;
  onEnqueuePressed?: (
    prompt: string,
    subscriberId: string,
  ) => void | Promise<void>;
  selectedModel?: VideoModel;
  selectedProvider?: GenerationProvider;
  imageMediaId?: string;
  url?: string;
  onImageRowVisibilityChange?: (visible: boolean) => void;
  uploadImage?: UploadImageFn;
  credits?: number | null;
}

export const PromptBoxVideo = ({
  useJobContext,
  onEnqueuePressed,
  selectedModel,
  selectedProvider,
  imageMediaId,
  url,
  onImageRowVisibilityChange,
  uploadImage,
  credits,
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);
  const prompt = usePromptVideoStore((s) => s.prompt);
  const setPrompt = usePromptVideoStore((s) => s.setPrompt);
  const useSystemPrompt = usePromptVideoStore((s) => s.useSystemPrompt);
  const setUseSystemPrompt = usePromptVideoStore((s) => s.setUseSystemPrompt);
  const generateWithSound = usePromptVideoStore((s) => s.generateWithSound);
  const setGenerateWithSound = usePromptVideoStore(
    (s) => s.setGenerateWithSound,
  );
  const resolution = usePromptVideoStore((s) => s.resolution);
  const setResolution = usePromptVideoStore((s) => s.setResolution);
  const aspectRatio = usePromptVideoStore((s) => s.aspectRatio);
  const setAspectRatio = usePromptVideoStore((s) => s.setAspectRatio);
  const duration = usePromptVideoStore((s) => s.duration);
  const setDuration = usePromptVideoStore((s) => s.setDuration);
  const inputMode = usePromptVideoStore((s) => s.inputMode);
  const setInputMode = usePromptVideoStore((s) => s.setInputMode);
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
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

  // TODO: Get rid of default resolutions. Just disable it if not present.
  let aspectRatioOptions: PopoverItem[];

  const buildAspectRatioOptions = (options: SizeOption[]): PopoverItem[] => {
    const currentExists = options.some(
      (option) => option.textLabel === aspectRatio,
    );
    const useFirstOption = !currentExists;

    return options.map((option, index) => ({
      label: option.textLabel,
      selected:
        option.textLabel === aspectRatio || (useFirstOption && index === 0),
      icon: <AspectRatioIcon sizeIcon={option.icon} />,
    }));
  };

  if (!!selectedModel?.sizeOptions && selectedModel.sizeOptions.length > 0) {
    aspectRatioOptions = buildAspectRatioOptions(selectedModel.sizeOptions);
  } else {
    aspectRatioOptions = buildAspectRatioOptions(DEFAULT_RESOLUTIONS);
  }

  const [aspectRatioList, setAspectRatioList] =
    useState<PopoverItem[]>(aspectRatioOptions);

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

  const handleAspectRatioSelect = (selectedItem: PopoverItem) => {
    setAspectRatio(selectedItem.label);
    setAspectRatioList((prev) =>
      aspectRatioOptions.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      })),
    );
  };

  // Sync duration with model default when switching models
  useEffect(() => {
    if (selectedModel?.durationOptions && selectedModel.defaultDuration) {
      if (
        duration === null ||
        !selectedModel.durationOptions.includes(duration)
      ) {
        setDuration(selectedModel.defaultDuration);
      }
    } else if (duration !== null) {
      setDuration(null);
    }
  }, [selectedModel]);

  // Sync resolution with model default when switching models
  useEffect(() => {
    if (selectedModel?.resolutionOptions && selectedModel.defaultResolution) {
      if (!selectedModel.resolutionOptions.includes(resolution as string)) {
        setResolution(selectedModel.defaultResolution);
      }
    }
  }, [selectedModel]);

  // Reset input mode when switching to a model that doesn't support reference
  useEffect(() => {
    if (!selectedModel?.supportsReferenceMode && inputMode === "reference") {
      setInputMode("keyframe");
    }
  }, [selectedModel]);

  const durationOptions: PopoverItem[] | null = selectedModel?.durationOptions
    ? selectedModel.durationOptions.map((d) => ({
        label: `${d}s`,
        selected: d === (duration ?? selectedModel.defaultDuration),
      }))
    : null;

  const resolutionPickerOptions: PopoverItem[] | null =
    selectedModel?.resolutionOptions
      ? selectedModel.resolutionOptions.map((r) => ({
          label: r,
          selected: r === resolution,
        }))
      : null;

  const handleResolutionSelect = (selectedItem: PopoverItem) => {
    setResolution(selectedItem.label);
  };

  const handleDurationSelect = (selectedItem: PopoverItem) => {
    const seconds = parseInt(selectedItem.label);
    setDuration(seconds);
  };

  const inputModeOptions: PopoverItem[] | null =
    selectedModel?.supportsReferenceMode
      ? [
          {
            label: "Keyframe",
            description: "First/Last frame",
            selected: inputMode === "keyframe",
          },
          {
            label: "Reference",
            description: "Multi-media ref",
            selected: inputMode === "reference",
          },
        ]
      : null;

  const handleInputModeSelect = (selectedItem: PopoverItem) => {
    const mode: VideoInputMode =
      selectedItem.label === "Reference" ? "reference" : "keyframe";
    setInputMode(mode);
    // Clear images when switching modes to avoid stale state
    if (mode === "reference") {
      setEndFrameImage(undefined);
    }
  };

  const isReferenceMode =
    inputMode === "reference" && !!selectedModel?.supportsReferenceMode;
  const maxImageCount = isReferenceMode
    ? (selectedModel?.maxReferenceImages ?? 3)
    : 1;

  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Color palette for @Image mentions
  const MENTION_COLORS = [
    "rgb(96, 165, 250)", // blue
    "rgb(251, 146, 60)", // orange
    "rgb(167, 139, 250)", // purple
    "rgb(52, 211, 153)", // green
    "rgb(251, 113, 133)", // pink
  ];

  const renderHighlightedPrompt = () => {
    if (!isReferenceMode || referenceImages.length === 0) return null;
    const parts = prompt.split(/(@Image\d+)/g);
    return parts.map((part, i) => {
      const match = part.match(/^@Image(\d+)$/);
      if (match) {
        const imgIndex = parseInt(match[1]) - 1;
        const color = MENTION_COLORS[imgIndex % MENTION_COLORS.length];
        return (
          <span key={i} style={{ color, fontWeight: 600 }}>
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // @-mention autocomplete state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionAnchorRef = useRef<number | null>(null);

  const mentionItems = isReferenceMode
    ? referenceImages
        .map((img, i) => ({
          label: `@Image${i + 1}`,
          image: img,
        }))
        .filter((item) =>
          mentionFilter
            ? item.label.toLowerCase().includes(mentionFilter.toLowerCase())
            : true,
        )
    : [];

  const insertMention = (label: string) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionAnchorRef.current === null) return;
    const before = prompt.slice(0, mentionAnchorRef.current);
    const after = prompt.slice(textarea.selectionStart);
    const next = before + label + " " + after;
    setPrompt(next);
    setMentionOpen(false);
    setMentionFilter("");
    mentionAnchorRef.current = null;
    requestAnimationFrame(() => {
      const pos = before.length + label.length + 1;
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    });
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
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setPrompt(value);

    if (isReferenceMode && referenceImages.length > 0) {
      // Find the last '@' before cursor that could be a mention trigger
      const textBeforeCursor = value.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        // Only trigger if no space after @ (still typing the mention)
        if (!textAfterAt.includes(" ")) {
          mentionAnchorRef.current = lastAtIndex;
          setMentionFilter("@" + textAfterAt);
          setMentionOpen(true);
          setMentionIndex(0);
          return;
        }
      }
    }

    setMentionOpen(false);
    setMentionFilter("");
    mentionAnchorRef.current = null;
  };

  const handleEnqueue = async () => {
    if (!prompt.trim()) {
      console.warn("Cannot generate video: prompt is empty");
      toast.error("Please enter a prompt to generate video");
      return;
    }

    if (!selectedModel) {
      console.warn("Cannot generate video: no model selected");
      toast.error("Please select a model to generate video");
      return;
    }

    if (selectedModel?.requiresImage && referenceImages.length === 0) {
      console.warn("Cannot generate video: no reference image provided");
      toast.error("Please add a starting frame image to generate video");
      return;
    }

    setIsEnqueueing(true);

    gtagEvent("enqueue_video");

    const subscriberId = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    const isRefMode =
      inputMode === "reference" && !!selectedModel.supportsReferenceMode;

    let imageMediaToken = undefined;

    if (!isRefMode && referenceImages.length > 0) {
      imageMediaToken = referenceImages[0].mediaToken;
    }

    setTimeout(() => {
      // TODO(bt,2025-05-08): This is a hack so we don't accidentally wind up with a permanently disabled prompt box if
      // the backend hangs on a given request.
      console.debug("Turn off blocking of prompt box...");
      setIsEnqueueing(false);
    }, 10000);

    let request: EnqueueImageToVideoRequest = {
      model: selectedModel,
      image_media_token: imageMediaToken,
      prompt: prompt,
      end_frame_image_media_token: isRefMode
        ? undefined
        : endFrameImage?.mediaToken,
      frontend_caller: "image_to_video",
      frontend_subscriber_id: subscriberId,
    };

    if (!!selectedProvider) {
      request.provider = selectedProvider;
    }

    if (selectedModel.generateWithSound) {
      request.generate_audio = !!generateWithSound;
    }

    // Pass reference image tokens in reference mode
    if (isRefMode && referenceImages.length > 0) {
      request.reference_image_media_tokens = referenceImages.map(
        (img) => img.mediaToken,
      );
    }

    // Pass duration if model supports it
    if (selectedModel.durationOptions && duration !== null) {
      request.duration_seconds = duration;
    }

    switch (selectedModel?.tauriId) {
      case "grok_video":
        request.grok_aspect_ratio = getGrokAspectRatio();
        break;

      case "sora_2":
        request.sora_orientation =
          resolution === "720p" ? "landscape" : "portrait";
        break;

      case "seedance_2p0": {
        const selectedOption = selectedModel.sizeOptions?.find(
          (option) => option.textLabel === aspectRatio,
        );
        if (selectedOption) {
          request.aspect_ratio =
            selectedOption.tauriValue as typeof request.aspect_ratio;
        }
        break;
      }
    }

    await EnqueueImageToVideo(request);

    onEnqueuePressed?.(prompt, subscriberId);

    setIsEnqueueing(false);
  };

  const getCurrentAspectRatioIcon = (): SizeIconOption => {
    const selectedLabel = aspectRatioList.find((item) => item.selected)?.label;
    const allOptions = selectedModel?.sizeOptions ?? DEFAULT_RESOLUTIONS;
    const match = allOptions.find((o) => o.textLabel === selectedLabel);
    return match?.icon ?? SizeIconOption.Landscape;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention dropdown navigation
    if (mentionOpen && mentionItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % mentionItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) =>
          prev <= 0 ? mentionItems.length - 1 : prev - 1,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(mentionItems[mentionIndex].label);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (selectedModel?.requiresImage && referenceImages.length === 0) {
        return;
      }

      if (!prompt.trim()) {
        return;
      }

      handleEnqueue();
    }
  };

  const getGrokAspectRatio = (): GROK_ASPECT_RATIO => {
    // NB: This function was just written to give us better type safety.
    // There has to be a cleaner appraoach.
    const maybeAspectRatio = selectedModel?.sizeOptions?.find(
      (option) => option.textLabel === aspectRatio,
    )?.tauriValue;

    switch (maybeAspectRatio) {
      case "landscape":
        return "landscape";
      case "portrait":
        return "portrait";
      case "square":
        return "square";
      default:
        return "landscape";
    }
  };

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  const modelNeedsAnImageButNoneAreSelected =
    selectedModel?.requiresImage && referenceImages.length === 0;

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
            isReferenceMode={isReferenceMode}
            maxImagePromptCount={maxImageCount}
            allowUpload={true}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            onImageClick={(image) => {
              setContent(
                <img
                  src={image.url}
                  alt="Reference preview"
                  className="h-full w-full object-contain"
                />,
              );
              setIsModalOpen(true);
            }}
            uploadImage={uploadImage}
            endFrameImage={isReferenceMode ? undefined : endFrameImage}
            setEndFrameImage={isReferenceMode ? undefined : setEndFrameImage}
            allowUploadEnd={!isReferenceMode && !!selectedModel?.endFrame}
            showEndFrameSection={!isReferenceMode && !!selectedModel?.endFrame}
          />
        )}
        <div
          className={twMerge(
            "glass w-[730px] rounded-xl p-4",
            isImageRowVisible && "rounded-t-none",
            isFocused
              ? "ring-1 ring-primary border-primary"
              : "ring-1 ring-transparent",
          )}
        >
          <div className="relative flex justify-center gap-2">
            {/* @-mention autocomplete dropdown */}
            {mentionOpen && mentionItems.length > 0 && (
              <div className="absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-lg border border-white/10 bg-ui-controls shadow-lg backdrop-blur-xl">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-base-fg/50">
                  Reference Files
                </div>
                {mentionItems.map((item, i) => (
                  <button
                    key={item.label}
                    className={twMerge(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-base-fg transition-colors cursor-pointer",
                      i === mentionIndex ? "bg-white/10" : "hover:bg-white/5",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(item.label);
                    }}
                    onMouseEnter={() => setMentionIndex(i)}
                  >
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-white/20">
                      <img
                        src={item.image.url}
                        alt={item.label}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
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

            <div className="relative flex-1">
              {isReferenceMode && referenceImages.length > 0 && (
                <div
                  ref={highlightRef}
                  aria-hidden
                  className="text-md pointer-events-none absolute inset-0 max-h-[5.5em] overflow-y-auto whitespace-pre-wrap break-words rounded pb-2 pr-2 pt-1 text-base-fg"
                >
                  {renderHighlightedPrompt()}
                </div>
              )}
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  isReferenceMode
                    ? "Use @Image1, @Image2... to reference your uploaded images in the prompt..."
                    : "Describe what you want to happen in the video..."
                }
                className={twMerge(
                  "text-md relative mb-2 max-h-[5.5em] w-full resize-none overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 placeholder-base-fg/60 focus:outline-none",
                  isReferenceMode && referenceImages.length > 0
                    ? "text-transparent caret-base-fg"
                    : "text-base-fg",
                )}
                value={prompt}
                onChange={handleChange}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </div>
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
                  items={aspectRatioOptions}
                  onSelect={handleAspectRatioSelect}
                  mode="toggle"
                  panelTitle="Aspect Ratio"
                  showIconsInList
                  triggerIcon={
                    <AspectRatioIcon sizeIcon={getCurrentAspectRatioIcon()} />
                  }
                />
              </Tooltip>

              {resolutionPickerOptions && (
                <Tooltip
                  content="Resolution"
                  position="top"
                  className="z-50"
                  closeOnClick={true}
                >
                  <PopoverMenu
                    items={resolutionPickerOptions}
                    onSelect={handleResolutionSelect}
                    mode="toggle"
                    panelTitle="Resolution"
                  />
                </Tooltip>
              )}

              {durationOptions && (
                <Tooltip
                  content="Duration"
                  position="top"
                  className="z-50"
                  closeOnClick={true}
                >
                  <PopoverMenu
                    items={durationOptions}
                    onSelect={handleDurationSelect}
                    mode="toggle"
                    panelTitle="Duration"
                    triggerIcon={
                      <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                    }
                  />
                </Tooltip>
              )}

              {selectedModel?.supportsSystemPrompt !== false && (
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
              )}

              {selectedModel?.generateWithSound && (
                <Tooltip
                  content={generateWithSound ? "Sound: ON" : "Sound: OFF"}
                  position="top"
                  className="z-50"
                  delay={200}
                >
                  <ToggleButton
                    isActive={generateWithSound}
                    icon={faWaveformLines}
                    activeIcon={faWaveformLines}
                    onClick={() => setGenerateWithSound(!generateWithSound)}
                  />
                </Tooltip>
              )}

              {inputModeOptions && (
                <Tooltip
                  content="Input Mode"
                  position="top"
                  className="z-50"
                  closeOnClick={true}
                >
                  <PopoverMenu
                    items={inputModeOptions}
                    onSelect={handleInputModeSelect}
                    mode="toggle"
                    panelTitle="Input Mode"
                  />
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-2">
              {modelNeedsAnImageButNoneAreSelected && (
                <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium animate-pulse">
                  <FontAwesomeIcon icon={faCircleInfo} />
                  Starting frame required
                </span>
              )}
              <Tooltip
                content="Add a starting image before generating"
                position="top"
                className="z-50"
                delay={0}
                disabled={!modelNeedsAnImageButNoneAreSelected}
              >
                <div>
                  <GenerateButton
                    className="flex items-center border-none bg-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                    icon={undefined}
                    onClick={handleEnqueue}
                    disabled={!prompt.trim()}
                    loading={isEnqueueing}
                    credits={credits}
                  >
                    Generate
                  </GenerateButton>
                </div>
              </Tooltip>
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
