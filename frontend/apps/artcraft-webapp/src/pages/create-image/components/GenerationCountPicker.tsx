import { CopyIcon } from "lucide-react";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { PROMPT_TOOLBAR_ICON_BUTTON_CLASSES } from "@storyteller/ui-promptbox";
import { twMerge } from "tailwind-merge";

const DEFAULT_GENERATION_COUNT = 4;

interface GenerationCountPickerProps {
  batchSizeMax?: number;
  batchSizeOptions?: number[] | null;
  currentCount: number;
  handleCountChange: (count: number) => void;
  panelTitle?: string;
}

// Shared by the desktop popover and the mobile settings field.
export function buildCountItems(
  currentCount: number,
  batchSizeMax?: number,
  batchSizeOptions?: number[] | null,
): PopoverItem[] {
  const maxCount = batchSizeMax ?? DEFAULT_GENERATION_COUNT;
  if (batchSizeOptions?.length) {
    return batchSizeOptions.map((option) => ({
      label: String(option),
      selected: option === currentCount,
    }));
  }
  const items: PopoverItem[] = [];
  for (let i = 1; i <= maxCount; i++) {
    items.push({ label: String(i), selected: i === currentCount });
  }
  return items;
}

export function countFromLabel(
  label: string,
  batchSizeMax?: number,
): number | null {
  const maxCount = batchSizeMax ?? DEFAULT_GENERATION_COUNT;
  let count = parseInt(label, 10);
  if (isNaN(count)) return null;
  if (count < 1 || count > maxCount) {
    count = Math.min(Math.max(1, count), maxCount);
  }
  return count;
}

export const GenerationCountPicker = ({
  batchSizeMax,
  batchSizeOptions,
  currentCount,
  handleCountChange,
  panelTitle = "No. of images",
}: GenerationCountPickerProps) => {
  const generationCountOptions = buildCountItems(
    currentCount,
    batchSizeMax,
    batchSizeOptions,
  );

  const onSelect = (item: PopoverItem) => {
    const count = countFromLabel(item.label, batchSizeMax);
    if (count != null) handleCountChange(count);
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
        panelTitle={panelTitle}
        triggerIcon={<CopyIcon  className="h-4 w-4" />}
        buttonClassName={twMerge(PROMPT_TOOLBAR_ICON_BUTTON_CLASSES, "w-11")}
      />
    </Tooltip>
  );
};
