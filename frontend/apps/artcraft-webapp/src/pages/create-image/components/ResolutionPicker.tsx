import { SquareIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon, HighDefinitionIcon, StandardDefinitionIcon } from "@storyteller/icons";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";

interface ResolutionPickerProps {
  resolutionOptions: string[];
  defaultResolution?: string;
  currentResolution?: string;
  handleResolutionSelect: (selected: string) => void;
}

const RESOLUTION_ICONS: Record<string, LucideIcon> = {
  half_k: StandardDefinitionIcon,
  four_eighty_p: StandardDefinitionIcon,
  seven_twenty_p: StandardDefinitionIcon,
  one_k: StandardDefinitionIcon,
  ten_eighty_p: HighDefinitionIcon,
  two_k: HighDefinitionIcon,
  three_k: HighDefinitionIcon,
  four_k: HighDefinitionIcon,
};

const RESOLUTION_LABELS: Record<string, string> = {
  half_k: "0.5K",
  four_eighty_p: "480p",
  seven_twenty_p: "720p",
  one_k: "1K",
  ten_eighty_p: "1080p",
  two_k: "2K",
  three_k: "3K",
  four_k: "4K",
};

const LABEL_TO_RESOLUTION: Record<string, string> = Object.fromEntries(
  Object.entries(RESOLUTION_LABELS).map(([k, v]) => [v, k]),
);

export function resolutionFromLabel(label: string): string | undefined {
  return LABEL_TO_RESOLUTION[label];
}

// Shared by the desktop popover and the mobile settings field.
export function buildResolutionItems(
  resolutionOptions: string[],
  selected?: string,
): PopoverItem[] {
  return resolutionOptions.map((resolution) => ({
    label: RESOLUTION_LABELS[resolution] ?? resolution,
    selected: selected === resolution,
    icon: (
      <DynamicIcon
        icon={RESOLUTION_ICONS[resolution] ?? StandardDefinitionIcon}
        className="h-4 w-4"
      />
    ),
  }));
}

export const ResolutionPicker = ({
  resolutionOptions,
  defaultResolution,
  currentResolution,
  handleResolutionSelect,
}: ResolutionPickerProps) => {
  const activeResolution = currentResolution ?? defaultResolution ?? undefined;

  const handleSelectAdapter = (item: PopoverItem) => {
    const resolution = resolutionFromLabel(item.label);
    if (resolution) {
      handleResolutionSelect(resolution);
    }
  };

  const resolutionList = buildResolutionItems(
    resolutionOptions,
    activeResolution,
  );

  return (
    <Tooltip
      content="Resolution"
      position="top"
      className="z-50"
      closeOnClick={true}
    >
      <PopoverMenu
        items={resolutionList}
        onSelect={handleSelectAdapter}
        mode="toggle"
        panelTitle="Resolution"
        showIconsInList
        triggerIcon={
          <DynamicIcon
            icon={
              activeResolution
                ? (RESOLUTION_ICONS[activeResolution] ?? SquareIcon)
                : SquareIcon
            }
            className="h-4 w-4"
          />
        }
      />
    </Tooltip>
  );
};
