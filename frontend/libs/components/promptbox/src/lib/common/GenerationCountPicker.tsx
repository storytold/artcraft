import { CopyIcon } from "lucide-react";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { ImageModel } from "@storyteller/model-list";
import { PROMPT_TOOLBAR_ICON_BUTTON_CLASSES } from "../PromptClearAllButton";

// How many images a model may make at once when it does not say.
const DEFAULT_GENERATION_COUNT: number = 4;

// The chosen model (for its limits), the current count, and a callback for a new count.
interface GenerationCountPickerProps {
  currentModel?: ImageModel;
  currentCount: number;
  handleCountChange: (count: number) => void;
}

// The "number of images" menu in the image prompt box.
export const GenerationCountPicker = ({
  currentModel,
  currentCount,
  handleCountChange,
}: GenerationCountPickerProps) => {
  // The most images allowed: the model's limit, else the default.
  const maxGenerationCount =
    currentModel?.maxGenerationCount || DEFAULT_GENERATION_COUNT;
  // Some models allow only certain counts (for example just 4) instead of every number up to the limit.
  const hasPredefinedOptions = !!currentModel?.predefinedGenerationCounts;

  // The menu rows.
  let generationCountOptions: PopoverItem[];

  if (hasPredefinedOptions) {
    // Count pickers either have a "[1,2, ... max]" set of options, or a pre-defined list of options.
    generationCountOptions = buildPredefinedCountOptions(
      currentModel?.predefinedGenerationCounts || [],
      currentCount,
    );
  } else {
    generationCountOptions = buildSequentialCountOptions(
      maxGenerationCount,
      currentCount,
    );
  }

  // When a row is clicked: read its number, ignore anything unreadable, keep it within 1 to the model's limit, and pass it up.
  const onSelect = (item: PopoverItem) => {
    let count = parseInt(item.label, 10);
    if (isNaN(count)) {
      return;
    }
    if (count < 1 || count > maxGenerationCount) {
      count = Math.min(Math.max(1, count), maxGenerationCount);
    }
    handleCountChange(count);
  };

  // A hover tooltip around a popover menu with a copy icon as its button.
  return (
    <Tooltip
      content="Number of generations"
      position="top"
      className="z-50"
      closeOnClick={true}
      delay={0}
    >
      <PopoverMenu
        items={generationCountOptions}
        onSelect={onSelect}
        mode="toggle"
        panelTitle="No. of images"
        triggerIcon={<CopyIcon  className="h-4 w-4" />}
        buttonClassName={PROMPT_TOOLBAR_ICON_BUTTON_CLASSES}
      />
    </Tooltip>
  );
};

// Rows for 1, 2, 3 ... up to the limit, marking the current count.
const buildSequentialCountOptions = (
  maxCount: number,
  currentCount: number,
): PopoverItem[] => {
  const options = [];
  for (let i = 0; i < maxCount; i++) {
    const count = i + 1;
    options.push({
      label: String(count),
      selected: count === currentCount,
    });
  }
  return options;
};

// Rows for exactly the counts the model lists, marking the current count.
const buildPredefinedCountOptions = (
  options: number[],
  currentCount: number,
): PopoverItem[] => {
  const result: PopoverItem[] = [];
  options.forEach((option) => {
    result.push({
      label: String(option),
      selected: option === currentCount,
    });
  });
  return result;
};
