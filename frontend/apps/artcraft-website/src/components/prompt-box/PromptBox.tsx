import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { twMerge } from "tailwind-merge";
import { GenerateButton } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { ImagePromptRow } from "./ImagePromptRow";
import type { RefImage } from "./types";

interface PromptBoxProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  placeholder?: string;
  disabled?: boolean;

  // Reference images
  supportsImagePrompts?: boolean;
  maxImagePromptCount?: number;
  referenceImages: RefImage[];
  onReferenceImagesChange: (images: RefImage[]) => void;

  // Toolbar slots
  leftToolbar?: ReactNode;
  rightToolbar?: ReactNode;

  // Pick from library
  onPickFromLibrary?: () => void;

  // Clear session button
  showClearSession?: boolean;
  onClearSession?: () => void;
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
      supportsImagePrompts,
      maxImagePromptCount = 1,
      referenceImages,
      onReferenceImagesChange,
      leftToolbar,
      rightToolbar,
      onPickFromLibrary,
      showClearSession,
      onClearSession,
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showImagePrompts, setShowImagePrompts] = useState(false);

    const isImageRowVisible =
      supportsImagePrompts &&
      (showImagePrompts || referenceImages.length > 0);

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    });

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSubmit();
        }
      },
      [onSubmit],
    );

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
            />
          )}

          <div
            className={twMerge(
              "glass rounded-xl p-4",
              isImageRowVisible && "rounded-t-none",
              isFocused && "ring-1 ring-primary",
            )}
          >
            <div className="flex gap-2">
              {supportsImagePrompts && (
                <Tooltip
                  content="Add Image"
                  position="top"
                  closeOnClick={true}
                  className={twMerge(
                    isImageRowVisible && "hidden opacity-0",
                  )}
                >
                  <button
                    type="button"
                    className={twMerge(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-transparent p-0 transition-all hover:bg-white/10",
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

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={placeholder}
                className="max-h-[5.5em] flex-1 resize-none overflow-y-auto bg-transparent text-sm text-white placeholder-white/50 focus:outline-none"
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
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
