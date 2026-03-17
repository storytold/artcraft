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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faVideo } from "@fortawesome/pro-solid-svg-icons";
import { GenerateButton } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { ImagePromptRow } from "./ImagePromptRow";
import type { RefImage, MentionItem } from "./types";

// ── @-mention color palette ─────────────────────────────────────────────

const IMAGE_COLORS = [
  "rgb(96, 165, 250)",
  "rgb(251, 146, 60)",
  "rgb(167, 139, 250)",
  "rgb(52, 211, 153)",
  "rgb(251, 113, 133)",
];

const VIDEO_COLORS = [
  "rgb(250, 204, 21)",
  "rgb(245, 158, 11)",
  "rgb(74, 222, 128)",
];

const AUDIO_COLORS = ["rgb(192, 132, 252)", "rgb(232, 121, 249)"];

function getMentionColor(label: string): string {
  const imgMatch = label.match(/^@Image(\d+)$/);
  if (imgMatch)
    return IMAGE_COLORS[(parseInt(imgMatch[1]) - 1) % IMAGE_COLORS.length];
  const vidMatch = label.match(/^@Video(\d+)$/);
  if (vidMatch)
    return VIDEO_COLORS[(parseInt(vidMatch[1]) - 1) % VIDEO_COLORS.length];
  const audMatch = label.match(/^@Audio(\d+)$/);
  if (audMatch)
    return AUDIO_COLORS[(parseInt(audMatch[1]) - 1) % AUDIO_COLORS.length];
  return "rgb(255, 255, 255)";
}

// ── Props ───────────────────────────────────────────────────────────────

interface PromptBoxProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
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
  // Clear all references (images, end frame, videos, audios)
  onClearAllRefs?: () => void;

  // Clear session button
  showClearSession?: boolean;
  onClearSession?: () => void;

  // Media reference row (video/audio refs, rendered between image row and prompt)
  mediaReferenceRow?: ReactNode;

  // @-mention support (enables colored prompt overlay + autocomplete)
  mentionItems?: MentionItem[];
}

export const PromptBox = forwardRef<HTMLDivElement, PromptBoxProps>(
  (
    {
      prompt,
      onPromptChange,
      onSubmit,
      isSubmitting,
      submitLabel = "Generate",
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
      onClearAllRefs,
      showClearSession,
      onClearSession,
      mediaReferenceRow,
      mentionItems,
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showImagePrompts, setShowImagePrompts] = useState(false);

    // @-mention state
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");
    const [mentionIndex, setMentionIndex] = useState(0);
    const mentionAnchorRef = useRef<number | null>(null);

    const isImageRowVisible =
      supportsImagePrompts &&
      (isVideo || showImagePrompts || referenceImages.length > 0);

    const hasMentionItems = (mentionItems?.length ?? 0) > 0;
    const hasAnyRowAbove = isImageRowVisible || !!mediaReferenceRow;

    // Filtered mention items for autocomplete
    const filteredMentionItems = useMemo(() => {
      if (!mentionItems?.length) return [];
      if (!mentionFilter) return mentionItems;
      return mentionItems.filter((item) =>
        item.label.toLowerCase().includes(mentionFilter.toLowerCase()),
      );
    }, [mentionItems, mentionFilter]);

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [prompt]);

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

        if (e.key === "Enter" && !e.shiftKey) {
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

    // Render highlighted prompt with colored @-mentions
    const renderHighlightedPrompt = useCallback(() => {
      if (!hasMentionItems) return null;
      const parts = prompt.split(/(@(?:Image|Video|Audio)\d+)/g);
      return parts.map((part, i) => {
        if (/^@(?:Image|Video|Audio)\d+$/.test(part)) {
          return (
            <span
              key={i}
              style={{ color: getMentionColor(part), fontWeight: 600 }}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      });
    }, [prompt, hasMentionItems]);

    return (
      <div ref={ref}>
        {showClearSession && (
          <div className="mb-2 flex w-full justify-end">
            <button
              onClick={onClearSession}
              className="rounded-md bg-red-500/20 px-3 py-1 text-xs text-white/70 transition-colors hover:bg-red-500/30"
            >
              Clear session
            </button>
          </div>
        )}

        <div className="relative flex flex-col">
          {isImageRowVisible && (
            <ImagePromptRow
              maxImagePromptCount={maxImagePromptCount}
              referenceImages={referenceImages}
              setReferenceImages={onReferenceImagesChange}
              onPickFromLibrary={onPickFromLibrary}
              onClearAll={onClearAllRefs}
              isVideo={isVideo}
              isReferenceMode={isReferenceMode}
              endFrameImage={endFrameImage}
              setEndFrameImage={onEndFrameImageChange}
              showEndFrameSection={showEndFrameSection}
            />
          )}

          {mediaReferenceRow}

          <div
            className={twMerge(
              "glass rounded-xl p-4 !transition-all duration-200",
              hasAnyRowAbove && "rounded-t-none",
              isFocused && "ring-1 ring-primary",
            )}
          >
            <div className="flex gap-3">
              {supportsImagePrompts && !isVideo && (
                <Tooltip
                  content="Add Image"
                  position="top"
                  closeOnClick={true}
                  className={twMerge(isImageRowVisible && "hidden opacity-0")}
                >
                  <button
                    type="button"
                    className={twMerge(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-transparent p-0 transition-all hover:text-primary-500",
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
                      className="opacity-80 transition-all hover:opacity-100"
                    >
                      <path
                        d="M2.66667 2H16C16.3667 2 16.6667 2.3 16.6667 2.66667V6.1125C17.1 6.04167 17.5458 6 18 6C18.225 6 18.4458 6.00833 18.6667 6.02917V2.66667C18.6667 1.19583 17.4708 0 16 0H2.66667C1.19583 0 0 1.19583 0 2.66667V16C0 17.4708 1.19583 18.6667 2.66667 18.6667H11.5C11.0625 18.0583 10.7083 17.3875 10.4542 16.6667H2.66667C2.3 16.6667 2 16.3667 2 16V2.66667C2 2.3 2.3 2 2.66667 2ZM11.8625 7.49167C11.6833 7.1875 11.3542 7 11 7C10.6458 7 10.3167 7.1875 10.1375 7.49167L8.2 10.7833L7.48333 9.75833C7.29583 9.49167 6.99167 9.33333 6.6625 9.33333C6.33333 9.33333 6.02917 9.49167 5.84167 9.75833L3.50833 13.0917C3.29583 13.3958 3.26667 13.7958 3.44167 14.125C3.61667 14.4542 3.9625 14.6667 4.33333 14.6667H10.0292C10.0125 14.4458 10 14.225 10 14C10 11.7833 10.9 9.77917 12.3542 8.33333L11.8625 7.49583V7.49167ZM5.33333 6.66667C6.07083 6.66667 6.66667 6.07083 6.66667 5.33333C6.66667 4.59583 6.07083 4 5.33333 4C4.59583 4 4 4.59583 4 5.33333C4 6.07083 4.59583 6.66667 5.33333 6.66667ZM18 20C21.3125 20 24 17.3125 24 14C24 10.6875 21.3125 8 18 8C14.6875 8 12 10.6875 12 14C12 17.3125 14.6875 20 18 20ZM18.6667 11.3333V13.3333H20.6667C21.0333 13.3333 21.3333 13.6333 21.3333 14C21.3333 14.3667 21.0333 14.6667 20.6667 14.6667H18.6667V16.6667C18.6667 17.0333 18.3667 17.3333 18 17.3333C17.6333 17.3333 17.3333 17.0333 17.3333 16.6667V14.6667H15.3333C14.9667 14.6667 14.6667 14.3667 14.6667 14C14.6667 13.6333 14.9667 13.3333 15.3333 13.3333H17.3333V11.3333C17.3333 10.9667 17.6333 10.6667 18 10.6667C18.3667 10.6667 18.6667 10.9667 18.6667 11.3333Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </Tooltip>
              )}

              <div className="relative flex-1">
                {/* Highlighted prompt overlay for @-mentions */}
                {hasMentionItems && (
                  <div
                    ref={highlightRef}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 max-h-[5.5em] overflow-y-auto whitespace-pre-wrap break-words text-sm text-white"
                  >
                    {renderHighlightedPrompt()}
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={placeholder}
                  className={twMerge(
                    "max-h-[5.5em] w-full flex-1 resize-none overflow-y-auto bg-transparent text-md text-white placeholder-white/50 focus:outline-none",
                    hasMentionItems && "text-transparent caret-white",
                  )}
                  value={prompt}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onScroll={handleScroll}
                />

                {/* @-mention autocomplete dropdown */}
                {mentionOpen && filteredMentionItems.length > 0 && (
                  <div className="absolute bottom-full left-0 z-50 mb-1 w-64 overflow-hidden rounded-lg border border-white/10 bg-[#2a2a2e] shadow-lg backdrop-blur-xl">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                      Reference Files
                    </div>
                    {filteredMentionItems.map((item, i) => (
                      <button
                        key={item.label}
                        className={twMerge(
                          "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-white transition-colors",
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
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/20 bg-black/20">
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
                              className="h-3.5 w-3.5 text-white/60"
                            />
                          )}
                        </div>
                        <span
                          className="font-medium"
                          style={{ color: getMentionColor(item.label) }}
                        >
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">{leftToolbar}</div>
              <div className="flex items-center gap-2">
                {rightToolbar}
                <GenerateButton
                  className="flex items-center border-none bg-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onSubmit}
                  disabled={disabled ?? (!prompt.trim() || isSubmitting)}
                  loading={isSubmitting}
                  credits={credits}
                >
                  {submitLabel}
                </GenerateButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

PromptBox.displayName = "PromptBox";
