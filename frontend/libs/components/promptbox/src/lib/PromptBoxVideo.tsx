import { useState, useRef, useEffect, useMemo } from "react";
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
  faWaveformLines,
  faClock,
  faTriangleExclamation,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/pro-solid-svg-icons";
import { faCircleInfo } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GalleryItem, GalleryModal } from "@storyteller/ui-gallery-modal";
import {
  SizeIconOption,
  SizeOption,
  VideoModel,
} from "@storyteller/model-list";
import {
  usePromptVideoStore,
  RefImage,
  VideoInputMode,
  useCharactersStore,
} from "./promptStore";
import { gtagEvent } from "@storyteller/google-analytics";
import { ImagePromptRow } from "./ImagePromptRow";
import type { UploadImageFn } from "./ImagePromptRow";
import { AspectRatioIcon } from "./common/AspectRatioIcon";
import { VideoGenerationCountPicker } from "./common/VideoGenerationCountPicker";
import { twMerge } from "tailwind-merge";
import { toast } from "@storyteller/ui-toaster";
import { GenerationProvider } from "@storyteller/api-enums";
import { CharactersModal } from "./CharactersModal";
import { CharactersApi } from "@storyteller/api";
import { MentionTextarea } from "./MentionTextarea";
import type { MentionItem } from "./MentionTextarea";

declare global {
  interface Window {
    __storeTaskEnqueueMeta?: (meta: {
      prompt?: string;
      refImageUrls?: string[];
      modelType?: string;
      timestamp: number;
    }) => void;
  }
}

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
  const [isCharactersModalOpen, setIsCharactersModalOpen] = useState(false);

  // Characters store for @-mentions
  const storedCharacters = useCharactersStore((s) => s.characters);
  const charactersLoaded = useCharactersStore((s) => s.loaded);
  const storeSetCharacters = useCharactersStore((s) => s.setCharacters);
  const storeSetLoaded = useCharactersStore((s) => s.setLoaded);

  // Load characters on mount if not already loaded
  useEffect(() => {
    if (charactersLoaded) return;
    const api = new CharactersApi();
    api
      .ListCharacters()
      .then((res) => {
        if (res.success && res.data) {
          storeSetCharacters(
            res.data.map((c) => ({
              character_token: c.token,
              name: c.name,
              avatar_image_url: c.maybe_avatar?.cdn_url,
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => storeSetLoaded(true));
  }, [charactersLoaded, storeSetCharacters, storeSetLoaded]);

  // CSS viewport units handle resize reactivity automatically
  const EXPANDED_HEIGHT = "clamp(120px, calc(100vh - 700px), 500px)";

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      const el = (mentionEditorRef.current ?? textareaRef.current) as HTMLElement | null;
      if (el) {
        el.style.height = next ? EXPANDED_HEIGHT : "auto";
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
  const mentionEditorRef = useRef<HTMLDivElement>(null);

  // Apply height constraints to whichever editor element is active
  useEffect(() => {
    const el = (mentionEditorRef.current ?? textareaRef.current) as HTMLElement | null;
    if (el) {
      const maxH = isExpanded ? 500 : Math.min(window.innerHeight - 700, 500);
      el.style.maxHeight = `${Math.max(maxH, 88)}px`;
      el.style.minHeight = "0";
      if (!isExpanded) {
        const capped = Math.min(el.scrollHeight, 88);
        el.style.minHeight = `${capped}px`;
      }
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

  // Sync duration with model default when switching models.
  // Read duration from the store directly to avoid stale closure issues
  // when the model and duration are updated together (e.g. during recreate).
  useEffect(() => {
    const currentDuration = usePromptVideoStore.getState().duration;
    if (selectedModel?.durationOptions && selectedModel.defaultDuration) {
      if (
        currentDuration === null ||
        !selectedModel.durationOptions.includes(currentDuration)
      ) {
        setDuration(selectedModel.defaultDuration);
      }
    } else if (currentDuration !== null) {
      setDuration(null);
    }
  }, [selectedModel]);

  // Sync resolution with model default when switching models.
  // Read from store directly to avoid stale closure (same as duration above).
  useEffect(() => {
    const currentResolution = usePromptVideoStore.getState().resolution;
    if (selectedModel?.resolutionOptions && selectedModel.defaultResolution) {
      if (
        !selectedModel.resolutionOptions.includes(currentResolution as string)
      ) {
        setResolution(selectedModel.defaultResolution);
      }
    }
  }, [selectedModel]);

  // Reset input mode when switching to a model that doesn't support reference.
  // Read from store directly to avoid stale closure (same as duration above).
  useEffect(() => {
    const currentInputMode = usePromptVideoStore.getState().inputMode;
    if (
      !selectedModel?.supportsReferenceMode &&
      currentInputMode === "reference"
    ) {
      setInputMode("keyframe");
      setReferenceVideos([]);
      setReferenceAudios([]);
    }
  }, [selectedModel]);

  // Reset generation count when switching away from seedance 2.0.
  // Read from store directly to avoid stale closure (same as duration above).
  useEffect(() => {
    const currentGenerationCount =
      usePromptVideoStore.getState().generationCount;
    if (selectedModel?.id !== "seedance_2p0" && currentGenerationCount > 1) {
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
  const CHARACTER_COLORS = [
    "rgb(45, 212, 191)", // teal
    "rgb(34, 197, 94)", // emerald
    "rgb(14, 165, 233)", // sky
  ];

  const hasAnyRefs =
    referenceImages.length > 0 ||
    referenceVideos.length > 0 ||
    referenceAudios.length > 0;

  // Characters are only supported for seedance_2p0
  const isSeedance2p0 = selectedModel?.id === "seedance_2p0";
  const activeCharacters = isSeedance2p0 ? storedCharacters : [];

  // Build a set of character names for highlight matching
  const characterNames = activeCharacters.map((c) => c.name);

  const hasAnyMentionables = hasAnyRefs || activeCharacters.length > 0;

  // @-mention autocomplete state (for fallback textarea path)
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionAnchorRef = useRef<number | null>(null);

  const mentionItems = [
    ...(isReferenceMode
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
        ]
      : []),
    ...activeCharacters.map((char) => ({
      label: `@${char.name}`,
      type: "character" as const,
      preview: char.avatar_image_url,
    })),
  ].filter((item) =>
    mentionFilter
      ? item.label.toLowerCase().includes(mentionFilter.toLowerCase())
      : true,
  );

  // All mention items (unfiltered) for the contentEditable MentionTextarea
  const allMentionItems: MentionItem[] = useMemo(() => [
    ...(isReferenceMode
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
        ]
      : []),
    ...activeCharacters.map((char) => ({
      label: `@${char.name}`,
      type: "character" as const,
      preview: char.avatar_image_url,
    })),
  ], [isReferenceMode, referenceImages, referenceVideos, referenceAudios, activeCharacters]);

  // Build label → color map for inline mention highlighting
  const mentionColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of allMentionItems) {
      const imgMatch = item.label.match(/^@Image(\d+)$/);
      if (imgMatch) {
        const idx = parseInt(imgMatch[1]) - 1;
        map[item.label] = IMAGE_COLORS[idx % IMAGE_COLORS.length];
        continue;
      }
      const vidMatch = item.label.match(/^@Video(\d+)$/);
      if (vidMatch) {
        const idx = parseInt(vidMatch[1]) - 1;
        map[item.label] = VIDEO_COLORS[idx % VIDEO_COLORS.length];
        continue;
      }
      const audMatch = item.label.match(/^@Audio(\d+)$/);
      if (audMatch) {
        const idx = parseInt(audMatch[1]) - 1;
        map[item.label] = AUDIO_COLORS[idx % AUDIO_COLORS.length];
        continue;
      }
      if (item.type === "character") {
        const charName = item.label.slice(1);
        const charIdx = characterNames.indexOf(charName);
        if (charIdx !== -1) {
          map[item.label] = CHARACTER_COLORS[charIdx % CHARACTER_COLORS.length];
        }
      }
    }
    return map;
  }, [allMentionItems, characterNames]);

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

    // Trigger @-mention for reference files (in reference mode) or characters (always)
    if ((isReferenceMode && hasAnyRefs) || activeCharacters.length > 0) {
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
      toast.error(
        `Prompt exceeds the ${maxLen} character limit for this model`,
      );
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

      // Extract character tokens from @-mentions in prompt
      const mentionedCharacters = activeCharacters.filter((c) =>
        prompt.includes(`@${c.name}`),
      );
      if (mentionedCharacters.length > 0) {
        request.reference_character_tokens = mentionedCharacters.map(
          (c) => c.character_token,
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
      refImageUrls: referenceImages?.map((img) => img.url).filter(Boolean),
      modelType: (selectedModel as any)?.tauriId || String(selectedModel),
      timestamp: Date.now(),
    });

    const subscriberIds: string[] = [];
    const enqueuePromises: Promise<unknown>[] = [];

    for (let i = 0; i < count; i++) {
      const subscriberId = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      subscriberIds.push(subscriberId);
      enqueuePromises.push(EnqueueImageToVideo(buildRequest(subscriberId)));
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
            <div className="promptbox-resize-wrap relative flex-1">
              {hasAnyMentionables ? (
                <MentionTextarea
                  ref={mentionEditorRef}
                  value={prompt}
                  onChange={setPrompt}
                  mentionItems={allMentionItems}
                  colorMap={mentionColorMap}
                  placeholder={
                    isReferenceMode
                      ? "Use @Image1, @Video1, @Audio1... to reference uploads in prompt..."
                      : "Describe what you want to happen in the video..."
                  }
                  className="promptbox-scrollbar text-md relative mb-2 min-h-[2.5em] w-full resize-y overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-base-fg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (selectedModel?.requiresImage && referenceImages.length === 0) return;
                      if (!prompt.trim()) return;
                      handleEnqueue();
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              ) : (
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Describe what you want to happen in the video..."
                  className="promptbox-scrollbar text-md relative mb-2 min-h-[2.5em] w-full resize-y overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-base-fg placeholder-base-fg/60 focus:outline-none"
                  value={prompt}
                  onChange={handleChange}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              )}
              <span
                className={`absolute -bottom-1 right-0 text-[10px] tabular-nums ${prompt.length > maxLen ? "text-red-500" : "text-base-fg/40"}`}
              >
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

              {selectedModel?.id === "seedance_2p0" && (
                <button
                    type="button"
                    onClick={() => setIsCharactersModalOpen(true)}
                    className="flex h-9 items-center justify-center gap-1 rounded-lg border border-ui-controls-border bg-ui-controls px-3 text-sm font-medium text-base-fg transition-all duration-150 hover:bg-ui-controls/80 active:scale-95"
                  >
                    @Characters
                  </button>
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
                    credits={
                      credits != null ? credits * generationCount : credits
                    }
                  >
                    Generate
                  </GenerateButton>
                </div>
              </Tooltip>
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
                <FontAwesomeIcon
                  icon={isExpanded ? faChevronUp : faChevronDown}
                  className="text-xs"
                />
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
      <CharactersModal
        isOpen={isCharactersModalOpen}
        onClose={() => setIsCharactersModalOpen(false)}
        onSelectCharacter={(character) => {
          const mention = `@${character.name}`;
          const spaceBefore = prompt.length > 0 && !prompt.endsWith(" ") ? " " : "";
          setPrompt(prompt + spaceBefore + mention + " ");
          setIsCharactersModalOpen(false);
        }}
      />
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
