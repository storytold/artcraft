import { CopyIcon } from "lucide-react";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { PROMPT_TOOLBAR_ICON_BUTTON_CLASSES } from "../PromptClearAllButton";

interface VideoGenerationCountPickerProps {
  maxCount: number;
  currentCount: number;
  handleCountChange: (count: number) => void;
}

export const VideoGenerationCountPicker = ({
  maxCount,
  currentCount,
  handleCountChange,
}: VideoGenerationCountPickerProps) => {
  const options: PopoverItem[] = [];
  for (let i = 1; i <= maxCount; i++) {
    options.push({
      label: String(i),
      selected: i === currentCount,
    });
  }

  const onSelect = (item: PopoverItem) => {
    const count = parseInt(item.label, 10);
    if (!isNaN(count) && count >= 1 && count <= maxCount) {
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
