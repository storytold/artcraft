import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MusicIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { GenerateIconButton } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  KeyframeCards,
  MentionTextarea,
  PromptClearAllButton,
  ReferenceDeck,
  buildMentionColorMap,
  getMentionColor,
  useDeckMedia,
  type DeckAddAction,
  type DeckItem,
} from "@storyteller/ui-promptbox";
import { arrayMove } from "@dnd-kit/sortable";
import {
  PromptBoxDropOverlay,
  usePromptBoxDrop,
  type DroppedFiles,
} from "./PromptBoxDropZone";
import { toast } from "../toast/toast";
import { uploadImage } from "./upload-image";
import { uploadVideo, uploadAudio } from "./upload-media";
import type { RefImage, RefVideo, RefAudio, MentionItem } from "./types";
import { useEnterToGenerateStore } from "../../lib/enter-to-generate-store";
import {
  PromptFullscreenButton,
  PromptFullscreenModal,
  useFullscreenPrompt,
} from "./PromptFullscreen";

// ── Props ───────────────────────────────────────────────────────────────

interface PromptBoxProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder?: string;
  disabled?: boolean;
  credits?: number | null;

  // Reference images
  supportsImagePrompts?: boolean;
  maxImagePromptCount?: number;
  referenceImages: RefImage[];
  onReferenceImagesChange: (images: RefImage[]) => void;

  // Video mode (start/end frame)
  isVideo?: boolean;
  isReferenceMode?: boolean;
  endFrameImage?: RefImage;
  onEndFrameImageChange?: (image?: RefImage) => void;
  showEndFrameSection?: boolean;

  // Toolbar slots
  leftToolbar?: ReactNode;
  rightToolbar?: ReactNode;

  // Pick from library
  onPickFromLibrary?: () => void;
  onPickEndFrameFromLibrary?: () => void;
  onPickVideoFromLibrary?: () => void;
  onPickAudioFromLibrary?: () => void;
  // Clear all references (images, end frame, videos, audios)
  onClearAllRefs?: () => void;
  // Toolbar clear-all support. The button wipes the prompt and every
  // reference the box renders; pages holding extra state outside the box
  // (media reference row, secondary prompts) clear it via onClearAllExtras
  // and report its presence via hasClearableExtras so the button enables.
  onClearAllExtras?: () => void;
  hasClearableExtras?: boolean;

  // Video/audio references, rendered as cards in the reference deck (video
  // page in reference mode, world page's guide video, audio page's tracks).
  videoRefsSupported?: boolean;
  referenceVideos?: RefVideo[];
  onReferenceVideosChange?: (videos: RefVideo[]) => void;
  maxVideoCount?: number;
  maxVideoRefDuration?: number;
  audioRefsSupported?: boolean;
  referenceAudios?: RefAudio[];
  onReferenceAudiosChange?: (audios: RefAudio[]) => void;
  maxAudioCount?: number;
  maxAudioRefDuration?: number;

  // Always-visible named slot cards rendered beside the reference deck
  // (object page's multi-view angles + input mesh), built from DeckSlotCard.
  referenceSlots?: ReactNode;

  // Model selector (rendered above the toolbar, typically hidden on desktop via lg:hidden)
  modelSelector?: ReactNode;

  // Secondary prompt row rendered directly under the main textarea
  // (e.g. the audio style/genre prompt).
  secondaryPromptRow?: ReactNode;

  // @-mention support (enables colored prompt overlay + autocomplete)
  mentionItems?: MentionItem[];

  // Records which character token a mention name refers to (dropdown pick or
  // chip-menu replace) — needed because several characters can share a name.
  onMentionSelect?: (item: MentionItem) => void;

  // name (without "@") -> character token; picks which character's thumbnail
  // renders in a mention chip when labels collide.
  mentionSelections?: Record<string, string>;

  // Soft prompt-length limit from the model API (`text_prompt_max_length`).
  // Undefined = unlimited (no counter). The limit is not enforced here; the
  // page's submit handler blocks generation when over.
  maxPromptLength?: number;
}

export const PromptBox = forwardRef<HTMLDivElement, PromptBoxProps>(
  (
    {
      prompt,
      onPromptChange,
      onSubmit,
      isSubmitting,
      placeholder = "Describe what you want...",
      disabled,
      credits,
      supportsImagePrompts,
      maxImagePromptCount = 1,
      referenceImages,
      onReferenceImagesChange,
      isVideo,
      isReferenceMode,
      endFrameImage,
      onEndFrameImageChange,
      showEndFrameSection,
      leftToolbar,
      rightToolbar,
      onPickFromLibrary,
      onPickEndFrameFromLibrary,
      onPickVideoFromLibrary,
      onPickAudioFromLibrary,
      onClearAllRefs,
      onClearAllExtras,
      hasClearableExtras,
      videoRefsSupported,
      referenceVideos = [],
      onReferenceVideosChange,
      maxVideoCount = 3,
      maxVideoRefDuration = 30,
      audioRefsSupported,
      referenceAudios = [],
      onReferenceAudiosChange,
      maxAudioCount = 2,
      maxAudioRefDuration = 30,
      referenceSlots,
      modelSelector,
      secondaryPromptRow,
      mentionItems,
      onMentionSelect,
      mentionSelections,
      maxPromptLength,
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const mentionEditorRef = useRef<HTMLDivElement>(null);
    const enterToGenerate = useEnterToGenerateStore((s) => s.enabled);
    const [isFocused, setIsFocused] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { isFullscreen, openFullscreen, closeFullscreen } =
      useFullscreenPrompt();

    const EXPANDED_HEIGHT = "clamp(120px, calc(100vh - 700px), 500px)";

    const toggleExpand = () => {
      setIsExpanded((prev) => {
        const next = !prev;
        const height = next ? EXPANDED_HEIGHT : "auto";
        if (textareaRef.current) {
          textareaRef.current.style.height = height;
        }
        if (mentionEditorRef.current) {
          mentionEditorRef.current.style.height = height;
        }
        return next;
      });
    };

    // @-mention state
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [mentionIndex, setMentionIndex] = useState(0);
    const mentionAnchorRef = useRef<number | null>(null);

    const hasMentionItems = (mentionItems?.length ?? 0) > 0;

    const deck = useDeckMedia({
      referenceImages,
      setReferenceImages: onReferenceImagesChange,
      // 0 blocks image uploads (incl. via the combined picker) on pages whose
      // model only takes audio/video/mesh refs.
      maxImages: supportsImagePrompts ? maxImagePromptCount : 0,
      setEndFrameImage: onEndFrameImageChange,
      referenceVideos,
      setReferenceVideos: onReferenceVideosChange,
      maxVideos: maxVideoCount,
      maxVideoTotalSec: maxVideoRefDuration,
      referenceAudios,
      setReferenceAudios: onReferenceAudiosChange,
      maxAudios: maxAudioCount,
      maxAudioTotalSec: maxAudioRefDuration,
      uploadImage,
      uploadVideo,
      uploadAudio,
      // Library picking stays with the page-level GalleryModals.
      ownGalleryModal: false,
    });

    // Drag & drop onto the box bounds: files route to the reference kind
    // their MIME matches, gated on what the page's model supports. Keyframe
    // mode renders no video/audio deck, so those kinds only land in
    // reference mode where the user can see (and remove) them.
    const isKeyframeMode = !!isVideo && !isReferenceMode;
    const dropAcceptsImages = !!supportsImagePrompts && maxImagePromptCount > 0;
    const dropAcceptsVideos =
      !isKeyframeMode && !!videoRefsSupported && !!onReferenceVideosChange;
    const dropAcceptsAudio =
      !isKeyframeMode && !!audioRefsSupported && !!onReferenceAudiosChange;

    const handleDroppedFiles = ({ images, videos, audios }: DroppedFiles) => {
      if (images.length > 0) {
        if (isKeyframeMode) {
          // Fill the empty keyframe slots in order: start frame, then end.
          const queue = [...images];
          const startOpen =
            referenceImages.length === 0 && deck.uploadingImages.length === 0;
          const endOpen =
            !!showEndFrameSection && !endFrameImage && !deck.uploadingEnd;
          if (startOpen) deck.processImageFiles([queue.shift()!], "start");
          if (endOpen && queue.length > 0) {
            deck.processImageFiles([queue.shift()!], "end");
          }
          if (!startOpen && !endOpen) {
            toast.error(
              showEndFrameSection
                ? "Start and end frames are already set"
                : "The start frame is already set",
            );
          }
        } else if (deck.availableImageSlots <= 0) {
          toast.error(
            `Max ${maxImagePromptCount} image reference${maxImagePromptCount === 1 ? "" : "s"}`,
          );
        } else {
          deck.processImageFiles(images, "start");
        }
      }
      if (videos.length > 0) deck.processVideoFiles(videos);
      if (audios.length > 0) deck.processAudioFiles(audios);
    };

    const drop = usePromptBoxDrop({
      acceptsImages: dropAcceptsImages,
      acceptsVideos: dropAcceptsVideos,
      acceptsAudio: dropAcceptsAudio,
      onDropFiles: handleDroppedFiles,
    });

    // Mixed deck items ordered images → videos → audios so the page's
    // index-derived @ImageN/@VideoN/@AudioN mention labels stay aligned.
    const deckItems: DeckItem[] = useMemo(
      () => [
        ...referenceImages.map((img, i) => ({
          id: img.id,
          kind: "image" as const,
          url: img.url,
          previewUrl: img.fullUrl ?? img.url,
          name: `Image ${i + 1}`,
        })),
        ...deck.uploadingImages.map((entry, i) => ({
          id: entry.id,
          kind: "image" as const,
          url: entry.previewUrl,
          name: `Image ${referenceImages.length + i + 1}`,
          uploading: true,
        })),
        ...referenceVideos.map((video, i) => ({
          id: video.id,
          kind: "video" as const,
          url: video.url,
          name: `Video ${i + 1}`,
          duration: video.duration,
        })),
        ...(deck.uploadingVideo
          ? [
              {
                id: deck.uploadingVideo.id,
                kind: "video" as const,
                url: deck.uploadingVideo.previewUrl,
                name: `Video ${referenceVideos.length + 1}`,
                uploading: true,
              },
            ]
          : []),
        ...referenceAudios.map((audio, i) => ({
          id: audio.id,
          kind: "audio" as const,
          url: audio.url,
          name: `Audio ${i + 1}`,
          duration: audio.duration,
        })),
        ...(deck.uploadingAudio
          ? [
              {
                id: deck.uploadingAudio.id,
                kind: "audio" as const,
                name: `Audio ${referenceAudios.length + 1}`,
                uploading: true,
              },
            ]
          : []),
      ],
      [
        referenceImages,
        referenceVideos,
        referenceAudios,
        deck.uploadingImages,
        deck.uploadingVideo,
        deck.uploadingAudio,
      ],
    );

    const deckAddActions: DeckAddAction[] = [];
    if (
      supportsImagePrompts &&
      referenceImages.length + deck.uploadingImages.length < maxImagePromptCount
    ) {
      deckAddActions.push({
        key: "upload-image",
        label: "Upload",
        group: "image",
        onSelect: deck.openImageUpload,
      });
      if (onPickFromLibrary) {
        deckAddActions.push({
          key: "library-image",
          label: isVideo ? "From library" : "Pick from library",
          group: "image",
          onSelect: onPickFromLibrary,
        });
      }
    }
    if (
      videoRefsSupported &&
      referenceVideos.length < maxVideoCount &&
      !deck.uploadingVideo
    ) {
      deckAddActions.push({
        key: "upload-video",
        label: "Upload",
        group: "video",
        onSelect: deck.openVideoUpload,
      });
      if (onPickVideoFromLibrary) {
        deckAddActions.push({
          key: "library-video",
          label: "From library",
          group: "video",
          onSelect: onPickVideoFromLibrary,
        });
      }
    }
    if (
      audioRefsSupported &&
      referenceAudios.length < maxAudioCount &&
      !deck.uploadingAudio
    ) {
      deckAddActions.push({
        key: "upload-audio",
        label: "Upload",
        group: "audio",
        onSelect: deck.openAudioUpload,
      });
      if (onPickAudioFromLibrary) {
        deckAddActions.push({
          key: "library-audio",
          label: "From library",
          group: "audio",
          onSelect: onPickAudioFromLibrary,
        });
      }
    }

    const handleRemoveDeckItem = (id: string) => {
      if (referenceImages.some((img) => img.id === id)) {
        onReferenceImagesChange(referenceImages.filter((img) => img.id !== id));
      } else if (referenceVideos.some((video) => video.id === id)) {
        onReferenceVideosChange?.(
          referenceVideos.filter((video) => video.id !== id),
        );
      } else if (referenceAudios.some((audio) => audio.id === id)) {
        onReferenceAudiosChange?.(
          referenceAudios.filter((audio) => audio.id !== id),
        );
      }
    };

    const firstFrameItem: DeckItem | undefined = referenceImages[0]
      ? {
          id: referenceImages[0].id,
          kind: "image",
          url: referenceImages[0].url,
          previewUrl: referenceImages[0].fullUrl ?? referenceImages[0].url,
          name: "First frame",
        }
      : deck.uploadingImages[0]
        ? {
            id: deck.uploadingImages[0].id,
            kind: "image",
            url: deck.uploadingImages[0].previewUrl,
            name: "First frame",
            uploading: true,
          }
        : undefined;

    const lastFrameItem: DeckItem | undefined = endFrameImage
      ? {
          id: endFrameImage.id,
          kind: "image",
          url: endFrameImage.url,
          previewUrl: endFrameImage.fullUrl ?? endFrameImage.url,
          name: "Last frame",
        }
      : deck.uploadingEnd
        ? {
            id: deck.uploadingEnd.id,
            kind: "image",
            url: deck.uploadingEnd.previewUrl,
            name: "Last frame",
            uploading: true,
          }
        : undefined;

    const hasAttachedRefs =
      referenceImages.length > 0 ||
      !!endFrameImage ||
      referenceVideos.length > 0 ||
      referenceAudios.length > 0 ||
      !!hasClearableExtras;
    const hasClearableContent = prompt.length > 0 || hasAttachedRefs;

    const handleClearAll = () => {
      onPromptChange("");
      // Prefer the page's single-shot clear (pages that keep all refs in one
      // state object need it to avoid stale-closure partial updates).
      if (onClearAllRefs) {
        onClearAllRefs();
      } else {
        onReferenceImagesChange([]);
        onEndFrameImageChange?.(undefined);
        onReferenceVideosChange?.([]);
        onReferenceAudiosChange?.([]);
      }
      onClearAllExtras?.();
    };

    const handleSwapFrames = () => {
      const first = referenceImages[0];
      if (!first || !endFrameImage) return;
      onReferenceImagesChange([endFrameImage]);
      onEndFrameImageChange?.(first);
    };

    // Left-of-textarea reference widget: image deck, keyframe cards, or the
    // mixed deck depending on page/mode.
    const renderReferenceWidget = (alwaysExpanded?: boolean) => {
      if (isKeyframeMode) {
        if (!supportsImagePrompts) return null;
        return (
          <KeyframeCards
            firstFrame={firstFrameItem}
            lastFrame={lastFrameItem}
            showLastFrame={!!showEndFrameSection}
            onFirstAddActions={[
              {
                key: "upload-first",
                label: "Upload",
                onSelect: deck.openImageUpload,
              },
              ...(onPickFromLibrary
                ? [
                    {
                      key: "library-first",
                      label: "Pick from library",
                      onSelect: onPickFromLibrary,
                    },
                  ]
                : []),
            ]}
            onLastAddActions={[
              {
                key: "upload-last",
                label: "Upload",
                onSelect: deck.openEndUpload,
              },
              ...(onPickEndFrameFromLibrary
                ? [
                    {
                      key: "library-last",
                      label: "Pick from library",
                      onSelect: onPickEndFrameFromLibrary,
                    },
                  ]
                : []),
            ]}
            onRemoveFirst={() => onReferenceImagesChange([])}
            onRemoveLast={() => onEndFrameImageChange?.(undefined)}
            onSwap={handleSwapFrames}
          />
        );
      }
      if (!supportsImagePrompts && !videoRefsSupported && !audioRefsSupported) {
        return null;
      }
      const totalVideoRefSeconds = referenceVideos.reduce(
        (sum, video) => sum + video.duration,
        0,
      );
      const totalAudioRefSeconds = referenceAudios.reduce(
        (sum, audio) => sum + audio.duration,
        0,
      );
      const groupHints: Record<string, string> = {};
      if (supportsImagePrompts) {
        groupHints.image = `${referenceImages.length}/${maxImagePromptCount}`;
      }
      // A non-finite duration cap means "no limit" — show counts only.
      if (videoRefsSupported) {
        groupHints.video =
          `${referenceVideos.length}/${maxVideoCount}` +
          (isFinite(maxVideoRefDuration)
            ? ` · ${totalVideoRefSeconds}/${maxVideoRefDuration}s`
            : "");
      }
      if (audioRefsSupported) {
        groupHints.audio =
          `${referenceAudios.length}/${maxAudioCount}` +
          (isFinite(maxAudioRefDuration)
            ? ` · ${totalAudioRefSeconds}/${maxAudioRefDuration}s`
            : "");
      }

      return (
        <ReferenceDeck
          items={deckItems}
          canAdd={deckAddActions.length > 0}
          addActions={deckAddActions}
          addMenuGroupHints={groupHints}
          onAddClick={
            supportsImagePrompts || videoRefsSupported || audioRefsSupported
              ? deck.openAnyUpload
              : undefined
          }
          onRemove={handleRemoveDeckItem}
          onReorderImages={(from, to) =>
            onReferenceImagesChange(arrayMove(referenceImages, from, to))
          }
          onClearAll={onClearAllRefs}
          alwaysExpanded={alwaysExpanded}
        />
      );
    };

    // Filtered mention items for autocomplete
    const filteredMentionItems = useMemo(() => {
      if (!mentionItems?.length) return [];
      if (!mentionFilter) return mentionItems;
      return mentionItems.filter((item) =>
        item.label.toLowerCase().includes(mentionFilter.toLowerCase()),
      );
    }, [mentionItems, mentionFilter]);

    // Auto-resize textarea (skip when expanded)
    useEffect(() => {
      if (isExpanded) return;
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [prompt, isExpanded]);

    // Move caret to end on mount so autoFocus doesn't leave it at position 0
    useEffect(() => {
      const ta = textareaRef.current;
      if (ta && ta.value.length > 0) {
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }, []);

    // Sync scroll between textarea and highlight overlay
    const handleScroll = useCallback(() => {
      if (highlightRef.current && textareaRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    }, []);

    // Handle prompt change with @-mention detection
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        onPromptChange(value);

        if (hasMentionItems) {
          const textBeforeCursor = value.slice(0, cursorPos);
          const lastAtIndex = textBeforeCursor.lastIndexOf("@");

          if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
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
      },
      [onPromptChange, hasMentionItems],
    );

    // Insert a mention at the cursor position
    const insertMention = useCallback(
      (label: string) => {
        const textarea = textareaRef.current;
        if (!textarea || mentionAnchorRef.current === null) return;

        const before = prompt.slice(0, mentionAnchorRef.current);
        const after = prompt.slice(textarea.selectionStart);
        const next = before + label + " " + after;
        onPromptChange(next);
        setMentionOpen(false);
        setMentionFilter("");
        mentionAnchorRef.current = null;

        requestAnimationFrame(() => {
          const pos = before.length + label.length + 1;
          textarea.setSelectionRange(pos, pos);
          textarea.focus();
        });
      },
      [prompt, onPromptChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Handle @-mention navigation
        if (mentionOpen && filteredMentionItems.length > 0) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setMentionIndex((prev) => (prev + 1) % filteredMentionItems.length);
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setMentionIndex((prev) =>
              prev <= 0 ? filteredMentionItems.length - 1 : prev - 1,
            );
            return;
          }
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            insertMention(filteredMentionItems[mentionIndex].label);
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setMentionOpen(false);
            return;
          }
        }

        if (e.key === "Enter" && enterToGenerate && !e.shiftKey) {
          e.preventDefault();
          onSubmit();
        }
      },
      [
        onSubmit,
        mentionOpen,
        filteredMentionItems,
        mentionIndex,
        insertMention,
      ],
    );

    // Build a regex that matches all known @-mention labels. Case-insensitive
    // so a typed `@image1` still highlights when the canonical label is
    // `@Image1`.
    const mentionRegex = useMemo(() => {
      if (!mentionItems?.length) return null;
      const escaped = mentionItems
        .map((m) => m.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .sort((a, b) => b.length - a.length);
      return new RegExp(`(${escaped.join("|")})`, "gi");
    }, [mentionItems]);

    // Lower-cased label → canonical label lookup, so the split-parts match
    // against the original case-sensitive mentionItems regardless of how the
    // user capitalized their mention.
    const mentionLabelMap = useMemo(() => {
      const m = new Map<string, string>();
      for (const item of mentionItems ?? []) {
        m.set(item.label.toLowerCase(), item.label);
      }
      return m;
    }, [mentionItems]);

    // Build label → color map for MentionTextarea
    const mentionColorMap = useMemo(
      () => buildMentionColorMap(mentionItems),
      [mentionItems],
    );

    // Render highlighted prompt with colored @-mentions
    const renderHighlightedPrompt = useCallback(() => {
      if (!hasMentionItems || !mentionRegex) return null;
      const parts = prompt.split(mentionRegex);
      return parts.map((part, i) => {
        const canonical = mentionLabelMap.get(part.toLowerCase());
        if (canonical) {
          return (
            <span
              key={i}
              style={{
                color: getMentionColor(canonical, mentionItems),
                fontWeight: 600,
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      });
    }, [prompt, hasMentionItems, mentionRegex, mentionLabelMap, mentionItems]);

    return (
      <div ref={ref} className="prompt-box-root">
        <div className="relative flex flex-col">
          {deck.fileInputs}

          <div
            className={twMerge(
              "glass p-3 sm:p-4 !transition-all duration-200",
              isFocused && "border-primary",
            )}
            {...drop.dropZoneProps}
          >
            <PromptBoxDropOverlay
              dragState={drop.dragState}
              acceptsImages={dropAcceptsImages}
              acceptsVideos={dropAcceptsVideos}
              acceptsAudio={dropAcceptsAudio}
              keyframeMode={isKeyframeMode}
            />
            <div className="flex gap-3">
              {renderReferenceWidget()}
              {referenceSlots}

              <div className="promptbox-resize-wrap relative flex-1">
                {hasMentionItems && mentionItems ? (
                  <MentionTextarea
                    ref={mentionEditorRef}
                    value={prompt}
                    onChange={onPromptChange}
                    mentionItems={mentionItems}
                    placeholder={placeholder}
                    className={twMerge(
                      "promptbox-scrollbar min-h-[2.5em] w-full resize-y pr-8 text-base-fg placeholder-base-fg/60",
                      isExpanded ? "max-h-[500px]" : "max-h-[5.5em]",
                    )}
                    colorMap={mentionColorMap}
                    enterToGenerate={enterToGenerate}
                    onMentionSelect={onMentionSelect}
                    selectedTokens={mentionSelections}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        enterToGenerate &&
                        !e.shiftKey &&
                        !e.metaKey
                      ) {
                        e.preventDefault();
                        onSubmit();
                      }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                ) : (
                  <>
                    {hasMentionItems && (
                      <div
                        ref={highlightRef}
                        aria-hidden
                        className={twMerge(
                          "pointer-events-none absolute inset-0 overflow-y-auto whitespace-pre-wrap break-words pr-8 text-sm text-base-fg",
                          isExpanded ? "max-h-[500px]" : "max-h-[5.5em]",
                        )}
                      >
                        {renderHighlightedPrompt()}
                      </div>
                    )}

                    <textarea
                      ref={textareaRef}
                      rows={1}
                      autoFocus
                      placeholder={placeholder}
                      className={twMerge(
                        "promptbox-scrollbar min-h-[2.5em] w-full flex-1 resize-y overflow-y-auto bg-transparent pr-8 text-sm text-base-fg placeholder-base-fg/60 focus:outline-none",
                        isExpanded ? "max-h-[500px]" : "max-h-[5.5em]",
                        hasMentionItems && "text-transparent caret-white",
                      )}
                      value={prompt}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onScroll={handleScroll}
                    />

                    {mentionOpen && filteredMentionItems.length > 0 && (
                      <div className="absolute bottom-full left-0 z-50 mb-1 w-64 max-w-[calc(100vw-3rem)] overflow-hidden rounded-[3px] border border-ui-panel-border bg-ui-controls">
                        <div className="px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/50">
                          Mentions
                        </div>
                        {filteredMentionItems.map((item, i) => (
                          <button
                            key={item.label}
                            className={twMerge(
                              "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-base-fg transition-colors",
                              i === mentionIndex
                                ? "bg-white/10"
                                : "hover:bg-white/5",
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              insertMention(item.label);
                            }}
                            onMouseEnter={() => setMentionIndex(i)}
                          >
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-black/20">
                              {(item.type === "image" ||
                                item.type === "character") &&
                              item.preview ? (
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
                              ) : item.type === "character" ? (
                                <UsersIcon className="h-3.5 w-3.5 text-white/60" />
                              ) : (
                                <DynamicIcon
                                  icon={
                                    item.type === "video"
                                      ? VideoIcon
                                      : MusicIcon
                                  }
                                  className="h-3.5 w-3.5 text-white/60"
                                />
                              )}
                            </div>
                            <span
                              className="font-medium"
                              style={{
                                color: getMentionColor(
                                  item.label,
                                  mentionItems,
                                ),
                              }}
                            >
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <PromptFullscreenButton onClick={openFullscreen} />

                {maxPromptLength !== undefined && (
                  <div
                    className={twMerge(
                      // right-4 keeps the counter clear of the textarea's resize grip.
                      "pointer-events-none absolute -bottom-1 right-4 text-[10px] tabular-nums",
                      isFinite(maxPromptLength) &&
                        prompt.length > maxPromptLength
                        ? "text-red-500"
                        : "text-base-fg/40",
                    )}
                  >
                    {prompt.length} /{" "}
                    {isFinite(maxPromptLength) ? maxPromptLength : "∞"}
                  </div>
                )}
              </div>
            </div>

            {secondaryPromptRow && (
              <div className="mt-2">{secondaryPromptRow}</div>
            )}

            {/* Toolbar */}
            <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {modelSelector}
                {leftToolbar}
              </div>
              <div className="flex items-center gap-1.5 sm:shrink-0">
                {rightToolbar}
                <PromptClearAllButton
                  onClick={handleClearAll}
                  disabled={!hasClearableContent}
                  confirmClear={hasAttachedRefs}
                />
                <GenerateIconButton
                  onClick={onSubmit}
                  disabled={disabled ?? (!prompt.trim() || isSubmitting)}
                  loading={isSubmitting}
                  credits={credits}
                />
              </div>
            </div>

            {/* Expand / Collapse toggle — hidden on small screens */}
            <div className="absolute -bottom-1 left-1/2 hidden -translate-x-1/2 sm:block">
              <Tooltip
                content={isExpanded ? "Collapse" : "Expand"}
                position="top"
              >
                <button
                  type="button"
                  onClick={toggleExpand}
                  className="px-3 py-0.5 text-white/30 rounded-[3px] hover:bg-white/5 transition-colors hover:text-white/90"
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
          maxPromptLength={maxPromptLength}
          footerControls={
            <>
              {modelSelector}
              {leftToolbar}
            </>
          }
          imagePromptRow={
            renderReferenceWidget(true) || referenceSlots ? (
              <div className="flex flex-wrap items-center gap-3">
                {renderReferenceWidget(true)}
                {referenceSlots}
              </div>
            ) : undefined
          }
          clearAllButton={
            <PromptClearAllButton
              onClick={handleClearAll}
              disabled={!hasClearableContent}
              confirmClear={hasAttachedRefs}
            />
          }
        >
          {hasMentionItems && mentionItems ? (
            <MentionTextarea
              value={prompt}
              onChange={onPromptChange}
              mentionItems={mentionItems}
              placeholder={placeholder}
              className="promptbox-scrollbar h-full min-h-0 w-full overflow-y-auto text-base-fg placeholder-base-fg/60"
              style={{ resize: "none" }}
              colorMap={mentionColorMap}
              enterToGenerate={enterToGenerate}
              onMentionSelect={onMentionSelect}
              selectedTokens={mentionSelections}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  enterToGenerate &&
                  !e.shiftKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />
          ) : (
            <textarea
              placeholder={placeholder}
              className="promptbox-scrollbar text-sm h-full min-h-0 w-full resize-none overflow-y-auto bg-transparent text-base-fg placeholder-base-fg/60 focus:outline-none"
              value={prompt}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          )}
        </PromptFullscreenModal>
      </div>
    );
  },
);

PromptBox.displayName = "PromptBox";
