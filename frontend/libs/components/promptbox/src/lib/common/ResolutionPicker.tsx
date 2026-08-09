import { SquareIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon, HighDefinitionIcon, StandardDefinitionIcon } from "@storyteller/icons";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { CommonResolution, ImageModel } from "@storyteller/model-list";

interface ResolutionPickerProps {
  model: ImageModel;
  currentResolution?: CommonResolution;
  handleCommonResolutionSelect: (selected: CommonResolution) => void;
  //model: ImageModel | VideoModel
}

/**
 * Stateless component.
 *
 * Picker for "common aspect ratios", the new data structure Tauri accepts for
 * all image and video models (Note: this is not fully rolled out yet. Some/most
 * models may still use the old format.)
 *
 * @param model - currently selected model
 * @param currentAspectRatio - currently selected aspect ratio
 * @param handleCommonResolutionSelect - callback when a resolution is selected
 */
export const ResolutionPicker = ({
  model,
  currentResolution,
  handleCommonResolutionSelect,
}: ResolutionPickerProps) => {
  const useResolution =
    currentResolution ?? model.defaultResolution ?? undefined;

  console.log("resolution - currentResolution:", currentResolution);
  console.log("resolution - useResolution:", useResolution);

  const getCurrentResolutionIcon = (): LucideIcon => {
    if (!useResolution) {
      return SquareIcon;
    }
    return getResolutionIcon(useResolution);
  };

  const handleSelectAdapter = (item: PopoverItem) => {
    const resolution = popOverLabelToResolution(item.label, model);
    handleCommonResolutionSelect(resolution);
  };

  let resolutionList: PopoverItem[] = [];

  model.resolutions?.forEach((resolution: CommonResolution) => {
    resolutionList.push({
      label: getResolutionTextLabel(resolution),
      selected: useResolution === resolution,
      description: `foo ${resolution}`,
      icon: (
        <DynamicIcon
          icon={getResolutionIcon(resolution)}
          className="h-4 w-4"
        />
      ),
    });
  });

  return (
    <>
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
              icon={getCurrentResolutionIcon()}
              className="h-4 w-4"
            />
          }
        />
      </Tooltip>
    </>
  );
};

const getResolutionIcon = (resolution: CommonResolution): LucideIcon => {
  switch (resolution) {
    case CommonResolution.HalfK:
    case CommonResolution.FourEightyP:
    case CommonResolution.SevenTwentyP:
    case CommonResolution.OneK:
    case CommonResolution.TenEightyP:
      return StandardDefinitionIcon;
    case CommonResolution.TwoK:
    case CommonResolution.ThreeK:
    case CommonResolution.FourK:
      return HighDefinitionIcon;
    default:
      console.error("Unknown resolution in icon mapping:", resolution);
      return StandardDefinitionIcon; // Fail open-ish
  }
};

const getResolutionTextLabel = (resolution: CommonResolution): string => {
  switch (resolution) {
    case CommonResolution.HalfK:
      return "0.5K";
    case CommonResolution.FourEightyP:
      return "480p";
    case CommonResolution.SevenTwentyP:
      return "720p";
    case CommonResolution.OneK:
      return "1K";
    case CommonResolution.TenEightyP:
      return "1080p";
    case CommonResolution.TwoK:
      return "2K";
    case CommonResolution.ThreeK:
      return "3K";
    case CommonResolution.FourK:
      return "4K";
    default:
      console.error("Unknown resolution:", resolution);
      return "1K"; // Fail open-ish
  }
};

// Note: We only need this to deal with turning PopOverItems back into typesafe aspect ratios
const popOverLabelToResolution = (
  label: string,
  model: ImageModel,
): CommonResolution => {
  switch (label) {
    case "0.5K":
      return CommonResolution.HalfK;
    case "480p":
      return CommonResolution.FourEightyP;
    case "720p":
      return CommonResolution.SevenTwentyP;
    case "1K":
      return CommonResolution.OneK;
    case "1080p":
      return CommonResolution.TenEightyP;
    case "2K":
      return CommonResolution.TwoK;
    case "3K":
      return CommonResolution.ThreeK;
    case "4K":
      return CommonResolution.FourK;
  }
  console.error("Unknown resolution label:", label, "for model:", model.id);
  // If we can't find it, return the model's default resolution or 1K as fallback
  return model.defaultResolution || CommonResolution.OneK;
};
