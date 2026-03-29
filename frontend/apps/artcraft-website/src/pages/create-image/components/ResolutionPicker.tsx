import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/pro-regular-svg-icons";
import {
  faHighDefinition,
  faStandardDefinition,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";

interface ResolutionPickerProps {
  resolutionOptions: string[];
  defaultResolution?: string;
  currentResolution?: string;
  handleResolutionSelect: (selected: string) => void;
}

const RESOLUTION_ICONS: Record<string, IconDefinition> = {
  half_k: faStandardDefinition,
  four_eighty_p: faStandardDefinition,
  seven_twenty_p: faStandardDefinition,
  one_k: faStandardDefinition,
  ten_eighty_p: faHighDefinition,
  two_k: faHighDefinition,
  three_k: faHighDefinition,
  four_k: faHighDefinition,
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

export const ResolutionPicker = ({
  resolutionOptions,
  defaultResolution,
  currentResolution,
  handleResolutionSelect,
}: ResolutionPickerProps) => {
  const activeResolution = currentResolution ?? defaultResolution ?? undefined;

  const handleSelectAdapter = (item: PopoverItem) => {
    const resolution = LABEL_TO_RESOLUTION[item.label];
    if (resolution) {
      handleResolutionSelect(resolution);
    }
  };

  const resolutionList: PopoverItem[] = resolutionOptions.map((resolution) => ({
    label: RESOLUTION_LABELS[resolution] ?? resolution,
    selected: activeResolution === resolution,
    icon: (
      <FontAwesomeIcon
        icon={RESOLUTION_ICONS[resolution] ?? faStandardDefinition}
        className="h-4 w-4"
      />
    ),
  }));

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
          <FontAwesomeIcon
            icon={
              activeResolution
                ? (RESOLUTION_ICONS[activeResolution] ?? faSquare)
                : faSquare
            }
            className="h-4 w-4"
          />
        }
      />
    </Tooltip>
  );
};
