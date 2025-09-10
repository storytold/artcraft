import {
  faEdit,
  // faExpand,
  faMessageCheck,
  faMessageXmark,
  faMousePointer,
  faSparkles,
  faSpinnerThird,
  faFrame,
  faCopy,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { ButtonIconSelect } from "@storyteller/ui-button-icon-select";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useEffect, useRef, useState } from "react";
import { ImageModel, getCapabilitiesForModel } from "@storyteller/model-list";
import { twMerge } from "tailwind-merge";

export interface PromptBoxEditProps {
  onModeChange?: (mode: string) => void;
  selectedMode?: string;
  onGenerateClick: (prompt: string) => void | Promise<void>;
  isDisabled?: boolean;
  onFitPressed?: () => void | Promise<void>;
  selectedImageModel?: ImageModel;
  generationCount?: number;
  onGenerationCountChange?: (count: number) => void;
  supportsMaskedInpainting?: boolean;
  isEnqueueing?: boolean;
}

export const PromptBoxEdit = ({
  onModeChange: onModeSelectionChange,
  selectedMode,
  onGenerateClick,
  isEnqueueing,
  isDisabled,
  onFitPressed,
  selectedImageModel,
  generationCount: generationCountProp,
  onGenerationCountChange,
  supportsMaskedInpainting = false,
}: PromptBoxEditProps) => {
  const [prompt, setPrompt] = useState("");
  const [useSystemPrompt, setUseSystemPrompt] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [generationCount, setGenerationCount] = useState<number>(
    typeof generationCountProp === "number" ? generationCountProp : 1
  );
  const [internalEnqueueing, setInternalEnqueueing] = useState(false);

  const [generationCountList, setGenerationCountList] = useState<PopoverItem[]>(
    []
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  });

  // Sync internal state if a controlled prop is provided
  useEffect(() => {
    if (typeof generationCountProp === "number") {
      setGenerationCount(generationCountProp);
    }
  }, [generationCountProp]);

  // Build generation count options based on selected model
  useEffect(() => {
    const caps = getCapabilitiesForModel(selectedImageModel);
    console.log(">>> caps", caps);
    const items: PopoverItem[] = Array.from(
      { length: caps.maxGenerationCount },
      (_, i) => i + 1
    ).map((count) => ({
      label: String(count),
      selected: count === generationCount,
      icon: <FontAwesomeIcon icon={faCopy} className="h-4 w-4" />,
    }));
    setGenerationCountList(items);

    // Clamp selection
    if (generationCount < 1 || generationCount > caps.maxGenerationCount) {
      const clamped = Math.min(
        Math.max(1, generationCount),
        caps.maxGenerationCount
      );
      setGenerationCount(clamped);
      onGenerationCountChange?.(clamped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageModel]);

  // Keep UI selection in sync when store/value changes
  useEffect(() => {
    setGenerationCountList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === String(generationCount),
      }))
    );
  }, [generationCount]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pastedText = e.clipboardData.getData("text");
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next =
      value.slice(0, selectionStart) + pastedText + value.slice(selectionEnd);
    setPrompt(next);
    // Restore caret after React updates the value
    requestAnimationFrame(() => {
      const pos = selectionStart + pastedText.length;
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    setPrompt(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Stop propagation of keyboard events to prevent them from reaching the canvas
    e.stopPropagation();

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Block Enter if requirements are not met
      const busy = Boolean(isEnqueueing ?? internalEnqueueing);
      if (!prompt.trim() || isDisabled || busy) return;
      void handleGenerate();
    }
  };

  const handleGenerationCountSelect = (selectedItem: PopoverItem) => {
    const count = parseInt(selectedItem.label, 10);
    setGenerationCount(count);
    onGenerationCountChange?.(count);
    setGenerationCountList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.label === selectedItem.label,
      }))
    );
  };

  const handleGenerate = async () => {
    const busy = Boolean(isEnqueueing ?? internalEnqueueing);
    if (busy || isDisabled || !prompt.trim()) return;
    setInternalEnqueueing(true);
    const timeout = setTimeout(() => {
      setInternalEnqueueing(false);
    }, 10000);
    try {
      await Promise.resolve(onGenerateClick(prompt));
    } finally {
      clearTimeout(timeout);
      setInternalEnqueueing(false);
    }
  };

  const modes = [
    {
      value: "edit",
      icon: faEdit,
      text: "Edit Region",
      tooltip: "Edit area for inpainting",
    },
    {
      value: "select",
      icon: faMousePointer,
      text: "Select",
      tooltip: "Selection mode",
    },
    // Commented out for now - BFL-1000
    // {
    //   value: "expand",
    //   icon: faExpand,
    //   text: "Expand",
    //   tooltip: "Expand area for outpainting",
    // },
  ];

  return (
    <>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col gap-3">
        <div
          className={twMerge(
            "glass w-[730px] rounded-xl p-4",
            isFocused && "ring-1 ring-primary border-primary"
          )}
        >
          <div className="flex justify-center gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Write what you want to change in your image and click generate..."
              className="text-md mb-2 max-h-[5.5em] flex-1 resize-none overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-white placeholder-white placeholder:text-white/60 focus:outline-none"
              value={prompt}
              onChange={handleChange}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {supportsMaskedInpainting && (
                <ButtonIconSelect
                  options={modes}
                  onOptionChange={onModeSelectionChange}
                  selectedOption={selectedMode}
                />
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
                    className="h-9 bg-[#5F5F68]/60 px-3 text-white hover:bg-[#5F5F68]/90"
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
                icon={
                  !(isEnqueueing ?? internalEnqueueing) && !isDisabled
                    ? faSparkles
                    : undefined
                }
                onClick={handleGenerate}
                disabled={
                  (isEnqueueing ?? internalEnqueueing) ||
                  isDisabled ||
                  !prompt.trim()
                }
              >
                {isEnqueueing ?? internalEnqueueing ? (
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
    </>
  );
};
