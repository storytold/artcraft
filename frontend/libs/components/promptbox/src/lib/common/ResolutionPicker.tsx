import { useEffect } from "react";
import { SquareIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon, HighDefinitionIcon, StandardDefinitionIcon } from "@storyteller/icons";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { CommonResolution, ImageModel } from "@storyteller/model-list";

// What the parent hands the picker: the chosen model, the resolution picked so far, and a callback for a new pick.
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
// The resolution menu in the image prompt box. It keeps no state of its own; the parent owns the choice.
export const ResolutionPicker = ({
  model,
  currentResolution,
  handleCommonResolutionSelect,
}: ResolutionPickerProps) => {
  // The resolution to show: the user's pick, else the model's default, else none.
  const useResolution =
    currentResolution ?? model.defaultResolution ?? undefined;

  // If the stored resolution isn't offered by the current model (e.g. 3K picked on GPT Image 2.5, then the
  // user switches to Nano Banana, which has no 3K), reset to the model's default. Otherwise the stale value is
  // still sent with the request and the menu shows no selected row. Mirrors AspectRatioPicker.
  useEffect(() => {
    if (currentResolution === undefined) return;
    if (model.resolutions?.includes(currentResolution)) return;
    const def = model.defaultResolution;
    if (!def) return;
    handleCommonResolutionSelect(def);
  }, [model, currentResolution, handleCommonResolutionSelect]);

  console.log("resolution - currentResolution:", currentResolution);
  console.log("resolution - useResolution:", useResolution);

  // The icon on the menu button: a plain square when nothing is chosen, otherwise the HD or SD icon for the current resolution.
  const getCurrentResolutionIcon = (): LucideIcon => {
    if (!useResolution) {
      return SquareIcon;
    }
    return getResolutionIcon(useResolution);
  };

  // Turns a clicked menu row back into a resolution value and passes it up.
  const handleSelectAdapter = (item: PopoverItem) => {
    const resolution = (item.action ?? item.label) as CommonResolution;
    handleCommonResolutionSelect(resolution);
  };

  // The menu rows, built from the resolutions this model supports.
  let resolutionList: PopoverItem[] = [];

  // One row per supported resolution: text label, the resolution as its action, whether it is the current one, and an icon.
  model.resolutions?.forEach((resolution: CommonResolution) => {
    resolutionList.push({
      label: getResolutionTextLabel(resolution),
      action: resolution,
      selected: useResolution === resolution,
      icon: (
        <DynamicIcon
          icon={getResolutionIcon(resolution)}
          className="h-4 w-4"
        />
      ),
    });
  });

  // Draw a hover tooltip around a popover menu whose button shows the current resolution's icon.
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

// Picks the icon for a resolution: the SD icon for 0.5K, 480p, 720p, 1K and 1080p, the HD icon for 2K, 3K and 4K. Unknown values are logged and get the SD icon.
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

// Maps each resolution to the text shown in the menu (for example 2K or 720p); unknown values show as they are.
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
      return resolution;
  }
};
