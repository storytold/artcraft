import { CopyIcon } from "lucide-react";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { PROMPT_TOOLBAR_ICON_BUTTON_CLASSES } from "../PromptClearAllButton";

interface VideoGenerationCountPickerProps {
  counts: number[];
  currentCount: number;
  handleCountChange: (count: number) => void;
}

export const VideoGenerationCountPicker = ({
  counts,
  currentCount,
  handleCountChange,
}: VideoGenerationCountPickerProps) => {
  const options: PopoverItem[] = counts.map((count) => ({
    label: String(count),
    selected: count === currentCount,
  }));

  const onSelect = (item: PopoverItem) => {
    const count = parseInt(item.label, 10);
    if (counts.includes(count)) {
      handleCountChange(count);
    }
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
        items={options}
        onSelect={onSelect}
        mode="toggle"
        panelTitle="No. of videos"
        triggerIcon={<CopyIcon  className="h-4 w-4" />}
        buttonClassName={PROMPT_TOOLBAR_ICON_BUTTON_CLASSES}
      />
    </Tooltip>
  );
};
