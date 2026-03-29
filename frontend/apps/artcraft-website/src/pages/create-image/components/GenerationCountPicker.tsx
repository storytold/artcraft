import { faCopy } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";

const DEFAULT_GENERATION_COUNT = 4;

interface GenerationCountPickerProps {
  batchSizeMax?: number;
  batchSizeOptions?: number[] | null;
  currentCount: number;
  handleCountChange: (count: number) => void;
}

export const GenerationCountPicker = ({
  batchSizeMax,
  batchSizeOptions,
  currentCount,
  handleCountChange,
}: GenerationCountPickerProps) => {
  const maxCount = batchSizeMax ?? DEFAULT_GENERATION_COUNT;
  const hasPredefinedOptions = !!batchSizeOptions?.length;

  let generationCountOptions: PopoverItem[];

  if (hasPredefinedOptions) {
    generationCountOptions = batchSizeOptions!.map((option) => ({
      label: String(option),
      selected: option === currentCount,
    }));
  } else {
    generationCountOptions = [];
    for (let i = 1; i <= maxCount; i++) {
      generationCountOptions.push({
        label: String(i),
        selected: i === currentCount,
      });
    }
  }

  const onSelect = (item: PopoverItem) => {
    let count = parseInt(item.label, 10);
    if (isNaN(count)) return;
    if (count < 1 || count > maxCount) {
      count = Math.min(Math.max(1, count), maxCount);
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
        buttonClassName="h-9"
      />
    </Tooltip>
  );
};
