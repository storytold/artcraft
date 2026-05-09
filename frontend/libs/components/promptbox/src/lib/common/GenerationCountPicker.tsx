import { faCopy } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { ImageModel } from "@storyteller/model-list";

const DEFAULT_GENERATION_COUNT: number = 4;

interface GenerationCountPickerProps {
  currentModel?: ImageModel;
  currentCount: number;
  handleCountChange: (count: number) => void;
}

export const GenerationCountPicker = ({
  currentModel,
  currentCount,
  handleCountChange,
}: GenerationCountPickerProps) => {
  const maxGenerationCount =
    currentModel?.maxGenerationCount || DEFAULT_GENERATION_COUNT;
  const hasPredefinedOptions = !!currentModel?.predefinedGenerationCounts;

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
        triggerIcon={<FontAwesomeIcon icon={faCopy} className="h-4 w-4" />}
      />
    </Tooltip>
  );
};

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
