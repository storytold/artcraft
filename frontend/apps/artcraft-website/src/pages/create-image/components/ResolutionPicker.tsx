import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/pro-regular-svg-icons";
import {
  faHighDefinition,
  faStandardDefinition,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CommonResolution, ImageModel } from "@storyteller/model-list";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";

interface ResolutionPickerProps {
  model: ImageModel;
  currentResolution?: CommonResolution;
  handleCommonResolutionSelect: (selected: CommonResolution) => void;
}

const RESOLUTION_ICONS: Record<CommonResolution, IconDefinition> = {
  [CommonResolution.OneK]: faStandardDefinition,
  [CommonResolution.TwoK]: faHighDefinition,
  [CommonResolution.FourK]: faHighDefinition,
};

const RESOLUTION_LABELS: Record<CommonResolution, string> = {
  [CommonResolution.OneK]: "1K",
  [CommonResolution.TwoK]: "2K",
  [CommonResolution.FourK]: "4K",
};

const LABEL_TO_RESOLUTION: Record<string, CommonResolution> = {
  "1K": CommonResolution.OneK,
  "2K": CommonResolution.TwoK,
  "4K": CommonResolution.FourK,
};

export const ResolutionPicker = ({
  model,
  currentResolution,
  handleCommonResolutionSelect,
}: ResolutionPickerProps) => {
  const activeResolution =
    currentResolution ?? model.defaultResolution ?? undefined;

  const handleSelectAdapter = (item: PopoverItem) => {
    const resolution = LABEL_TO_RESOLUTION[item.label];
    if (resolution) {
      handleCommonResolutionSelect(resolution);
    }
  };

  const resolutionList: PopoverItem[] =
    model.resolutions?.map((resolution) => ({
      label: RESOLUTION_LABELS[resolution] ?? "1K",
      selected: activeResolution === resolution,
      icon: (
        <FontAwesomeIcon
          icon={RESOLUTION_ICONS[resolution] ?? faStandardDefinition}
          className="h-4 w-4"
        />
      ),
    })) ?? [];

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
