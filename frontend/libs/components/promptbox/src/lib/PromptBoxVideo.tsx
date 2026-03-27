import { useState, useRef, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { JobContextType } from "@storyteller/common";
import { downloadFileFromUrl } from "@storyteller/api";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { SliderV2 } from "@storyteller/ui-sliderv2";
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
  faTriangleExclamation,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faCircleInfo,
  faVideo,
  faMusic,
} from "@fortawesome/pro-regular-svg-icons";
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
import { VideoGenerationCountPicker } from "./common/VideoGenerationCountPicker";
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
    subscriberIds: string[],
  ) => void | Promise<void>;
  selectedModel?: VideoModel;
  selectedProvider?: GenerationProvider;
  imageMediaId?: string;
  url?: string;
  onImageRowVisibilityChange?: (visible: boolean) => void;
  uploadImage?: UploadImageFn;
  uploadVideo?: UploadImageFn;
  uploadAudio?: UploadImageFn;
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
  uploadVideo,
  uploadAudio,
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
  const generationCount = usePromptVideoStore((s) => s.generationCount);
  const setGenerationCount = usePromptVideoStore((s) => s.setGenerationCount);
  const [isEnqueueing, setIsEnqueueing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (textareaRef.current) {
        if (next) {
          textareaRef.current.style.height = `${window.innerHeight - 300}px`;
        } else {
          textareaRef.current.style.height = "auto";
        }
      }
      return next;
    });
  };
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    [],
  );
  const referenceImages = usePromptVideoStore((s) => s.referenceImages);
  const setReferenceImages = usePromptVideoStore((s) => s.setReferenceImages);
  const endFrameImage = usePromptVideoStore((s) => s.endFrameImage);
  const setEndFrameImage = usePromptVideoStore((s) => s.setEndFrameImage);
  const referenceVideos = usePromptVideoStore((s) => s.referenceVideos);
  const setReferenceVideos = usePromptVideoStore((s) => s.setReferenceVideos);
  const referenceAudios = usePromptVideoStore((s) => s.referenceAudios);
  const setReferenceAudios = usePromptVideoStore((s) => s.setReferenceAudios);
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
      // Hard pixel limit so the resize handle can never exceed viewport
      textareaRef.current.style.maxHeight = `${window.innerHeight - 700}px`;
      textareaRef.current.style.minHeight = "0";
      // Cap auto-grow at ~5.5em so it doesn't fight with manual resize
      const capped = Math.min(textareaRef.current.scrollHeight, 88);
      textareaRef.current.style.minHeight = `${capped}px`;
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
      setReferenceVideos([]);
      setReferenceAudios([]);
    }
  }, [selectedModel]);

  // Reset generation count when switching away from seedance 2.0
  useEffect(() => {
    if (selectedModel?.id !== "seedance_2p0" && generationCount > 1) {
      setGenerationCount(1);
    }
  }, [selectedModel]);

  const durationRange = selectedModel?.durationOptions?.length
    ? {
      min: selectedModel.durationOptions[0]!,
      max: selectedModel.durationOptions[
        selectedModel.durationOptions.length - 1
      ]!,
    }
    : null;
  const effectiveDuration = duration ?? selectedModel?.defaultDuration ?? 5;
  const [localDuration, setLocalDuration] = useState(effectiveDuration);
  const durationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    setLocalDuration(effectiveDuration);
  }, [effectiveDuration]);
  const handleDurationSlide = (v: number) => {
    setLocalDuration(v);
    clearTimeout(durationTimerRef.current);
    durationTimerRef.current = setTimeout(() => setDuration(v), 300);
  };

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
    // Clear images/videos when switching modes to avoid stale state
    if (mode === "reference") {
      setEndFrameImage(undefined);
    } else {
      setReferenceVideos([]);
      setReferenceAudios([]);
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

  // Color palettes for @-mention highlights
  const IMAGE_COLORS = [
    "rgb(96, 165, 250)", // blue
    "rgb(251, 146, 60)", // orange
    "rgb(167, 139, 250)", // purple
    "rgb(52, 211, 153)", // green
    "rgb(251, 113, 133)", // pink
  ];
  const VIDEO_COLORS = [
    "rgb(250, 204, 21)", // yellow
    "rgb(245, 158, 11)", // amber
  ];
  const AUDIO_COLORS = [
    "rgb(192, 132, 252)", // violet
    "rgb(232, 121, 249)", // fuchsia
  ];

  const hasAnyRefs =
    referenceImages.length > 0 ||
    referenceVideos.length > 0 ||
    referenceAudios.length > 0;

  const renderHighlightedPrompt = () => {
    if (!isReferenceMode || !hasAnyRefs) return null;
    const parts = prompt.split(/(@(?:Image|Video|Audio)\d+)/g);
    return parts.map((part, i) => {
      const imgMatch = part.match(/^@Image(\d+)$/);
      if (imgMatch) {
        const idx = parseInt(imgMatch[1]) - 1;
        return (
          <span
            key={i}
            style={{ color: IMAGE_COLORS[idx % IMAGE_COLORS.length] }}
          >
            {part}
          </span>
        );
      }
      const vidMatch = part.match(/^@Video(\d+)$/);
      if (vidMatch) {
        const idx = parseInt(vidMatch[1]) - 1;
        return (
          <span
            key={i}
            style={{ color: VIDEO_COLORS[idx % VIDEO_COLORS.length] }}
          >
            {part}
          </span>
        );
      }
      const audMatch = part.match(/^@Audio(\d+)$/);
      if (audMatch) {
        const idx = parseInt(audMatch[1]) - 1;
        return (
          <span
            key={i}
            style={{ color: AUDIO_COLORS[idx % AUDIO_COLORS.length] }}
          >
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
    ? [
      ...referenceImages.map((img, i) => ({
        label: `@Image${i + 1}`,
        type: "image" as const,
        preview: img.url,
      })),
      ...referenceVideos.map((vid, i) => ({
        label: `@Video${i + 1}`,
        type: "video" as const,
        preview: vid.url,
      })),
      ...referenceAudios.map((_aud, i) => ({
        label: `@Audio${i + 1}`,
        type: "audio" as const,
        preview: undefined as string | undefined,
      })),
    ].filter((item) =>
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
      const pos = Math.min(selectionStart + pastedText.length, next.length);
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setPrompt(value);

    if (isReferenceMode && hasAnyRefs) {
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

  const maxLen = selectedModel?.maxPromptLength ?? 1000;

  const handleEnqueue = async () => {
    if (!prompt.trim()) {
      console.warn("Cannot generate video: prompt is empty");
      toast.error("Please enter a prompt to generate video");
      return;
    }
    if (prompt.length > maxLen) {
      toast.error(`Prompt exceeds the ${maxLen} character limit for this model`);
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

    const isSeedance2 = selectedModel.id === "seedance_2p0";
    const count = isSeedance2 ? generationCount : 1;

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

    const buildRequest = (subscriberId: string): EnqueueImageToVideoRequest => {
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

      // Pass reference video tokens in reference mode
      if (isRefMode && referenceVideos.length > 0) {
        request.reference_video_media_tokens = referenceVideos.map(
          (v) => v.mediaToken,
        );
      }

      // Pass reference audio tokens in reference mode
      if (isRefMode && referenceAudios.length > 0) {
        request.reference_audio_media_tokens = referenceAudios.map(
          (a) => a.mediaToken,
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
      }

      if (selectedModel.supportsCommonAspectRatio) {
        const selectedOption = selectedModel.sizeOptions?.find(
          (option) => option.textLabel === aspectRatio,
        );

        if (selectedOption) {
          request.aspect_ratio =
            selectedOption.tauriValue as typeof request.aspect_ratio;
        } else {
          const maybeDefault = selectedModel.sizeOptions[0];
          if (!!maybeDefault) {
            request.aspect_ratio =
              maybeDefault.tauriValue as typeof request.aspect_ratio;
          }
        }
      }

      return request;
    };

    window.__storeTaskEnqueueMeta?.({
      prompt,
      refImageUrls: referenceImages
        ?.map((img) => img.url)
        .filter(Boolean),
      modelType: (selectedModel as any)?.tauriId || String(selectedModel),
      timestamp: Date.now(),
    });

    const subscriberIds: string[] = [];
    const enqueuePromises: Promise<void>[] = [];

    for (let i = 0; i < count; i++) {
      const subscriberId = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      subscriberIds.push(subscriberId);
      enqueuePromises.push(
        EnqueueImageToVideo(buildRequest(subscriberId)) as Promise<void>,
      );
    }

    try {
      await Promise.all(enqueuePromises);
    } catch (err) {
      console.error("PromptBoxVideo - enqueue failed", err);
      toast.error("Failed to start video generation. Please try again.");
    }

    onEnqueuePressed?.(prompt, subscriberIds);

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
            referenceVideos={isReferenceMode ? referenceVideos : undefined}
            setReferenceVideos={
              isReferenceMode ? setReferenceVideos : undefined
            }
            maxVideoCount={selectedModel?.maxReferenceVideos ?? 3}
            maxVideoRefDuration={selectedModel?.maxVideoRefDuration ?? 15}
            showVideoReferenceSection={isReferenceMode}
            uploadVideo={uploadVideo}
            referenceAudios={isReferenceMode ? referenceAudios : undefined}
            setReferenceAudios={
              isReferenceMode ? setReferenceAudios : undefined
            }
            maxAudioCount={selectedModel?.maxReferenceAudios ?? 2}
            maxAudioRefDuration={selectedModel?.maxAudioRefDuration ?? 15}
            uploadAudio={uploadAudio}
          />
        )}
        <div
          className={twMerge(
            "glass relative w-[860px] rounded-xl p-4",
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
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-white/20 flex items-center justify-center bg-black/20">
                      {item.type === "image" && item.preview ? (
                        <img
                          src={item.preview}
                          alt={item.label}
                          className="h-full w-full object-cover"
                        />
                      ) : item.type === "video" && item.preview ? (
                        <video
                          src={item.preview}
                          muted
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={item.type === "video" ? faVideo : faMusic}
                          className="h-3.5 w-3.5 text-base-fg/60"
                        />
                      )}
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

            <div className="promptbox-resize-wrap relative flex-1">
              {isReferenceMode && hasAnyRefs && (
                <div
                  ref={highlightRef}
                  aria-hidden
                  className="text-md pointer-events-none absolute inset-0 overflow-y-auto whitespace-pre-wrap break-words rounded pb-2 pr-2 pt-1 text-base-fg"
                >
                  {renderHighlightedPrompt()}
                </div>
              )}
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  isReferenceMode
                    ? "Use @Image1, @Video1, @Audio1... to reference uploads in prompt..."
                    : "Describe what you want to happen in the video..."
                }
                className={twMerge(
                  "promptbox-scrollbar text-md relative mb-2 min-h-[2.5em] w-full resize-y overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 placeholder-base-fg/60 focus:outline-none",
                  isReferenceMode && hasAnyRefs
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
              <span className={`absolute -bottom-1 right-0 text-[10px] tabular-nums ${prompt.length > maxLen ? "text-red-500" : "text-base-fg/40"}`}>
                {prompt.length} / {maxLen}
              </span>
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

              {durationRange && (
                <Tooltip content="Duration" position="top" className="z-50">
                  <PopoverMenu
                    mode="default"
                    panelTitle="Duration"
                    triggerIcon={
                      <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                    }
                    triggerLabel={`${effectiveDuration}s`}
                  >
                    <div className="w-48 pb-0.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1">
                          <SliderV2
                            min={durationRange.min}
                            max={durationRange.max}
                            value={localDuration}
                            onChange={handleDurationSlide}
                            step={1}
                            suffix="s"
                            variant="filled"
                          />
                        </div>
                        <span className="min-w-6 shrink-0 text-sm font-medium tabular-nums text-base-fg">
                          {localDuration}s
                        </span>
                      </div>
                      <div className="mt-1.5 flex justify-between px-0.5 text-[11px] text-base-fg/40">
                        <span>{durationRange.min}s</span>
                        <span>{durationRange.max}s</span>
                      </div>
                    </div>
                  </PopoverMenu>
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
              {selectedModel?.id === "seedance_2p0" && (
                <VideoGenerationCountPicker
                  maxCount={4}
                  currentCount={generationCount}
                  handleCountChange={setGenerationCount}
                />
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
                    credits={credits != null ? credits * generationCount : credits}
                  >
                    Generate
                  </GenerateButton>
                </div>
              </Tooltip>
            </div>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <Tooltip content={isExpanded ? "Collapse" : "Expand"} position="top" className="-mb-2">
              <button
                type="button"
                onClick={toggleExpand}
                className="text-base-fg/30 hover:text-base-fg/90 transition-colors px-3 py-0.5"
              >
                <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-xs" />
              </button>
            </Tooltip>
          </div>
        </div>
        {selectedModel?.id === "seedance_2p0" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3.5 py-2.5 text-xs text-yellow-200">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-400"
            />
            <span>
              Seedance 2.0 is in Early Alpha. Generations may be slow, and may
              experience outages. Seedance may reject safe inputs unexpectedly.
              Try several short generations before longer ones.
            </span>
          </div>
        )}
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
