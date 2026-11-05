import { CopyIcon } from "lucide-react";
import { PopoverMenu, PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { PROMPT_TOOLBAR_ICON_BUTTON_CLASSES } from "../PromptClearAllButton";

// The counts the video model allows, the current count, and a callback for a new count.
interface VideoGenerationCountPickerProps {
  counts: number[];
  currentCount: number;
  handleCountChange: (count: number) => void;
}

// The "number of videos" menu in the video prompt box.
export const VideoGenerationCountPicker = ({
  counts,
  currentCount,
  handleCountChange,
}: VideoGenerationCountPickerProps) => {
  // One menu row per allowed count, marking the current one.
  const options: PopoverItem[] = counts.map((count) => ({
    label: String(count),
    selected: count === currentCount,
  }));

  // When a row is clicked: accept the number only if the model allows it, then pass it up.
  const onSelect = (item: PopoverItem) => {
    const count = parseInt(item.label, 10);
    if (counts.includes(count)) {
      handleCountChange(count);
    }
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
