import { useEffect } from "react";
import { CommonAspectRatio } from "@storyteller/model-list";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { ImageModel } from "@storyteller/model-list";
import { AspectRatioIcon, AutoIcon } from "./AspectRatioIcon";

// What the parent hands the picker: the chosen model, the ratio picked so far, and a callback for a new pick.
interface AspectRatioPickerProps {
  model: ImageModel;
  currentAspectRatio?: CommonAspectRatio;
  handleCommonAspectRatioSelect: (selected: CommonAspectRatio) => void;
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
 * @param handleCommonAspectRatioSelect - callback when an aspect ratio is selected
 */
// The aspect-ratio menu in the image prompt box. It keeps no state of its own; the parent owns the choice.
export const AspectRatioPicker = ({
  model,
  currentAspectRatio,
  handleCommonAspectRatioSelect,
}: AspectRatioPickerProps) => {
  // The ratio to show: the user's pick, else the model's default, else none.
  const useAspectRatio =
    currentAspectRatio ?? model.defaultAspectRatio ?? undefined;

  // If the stored ratio isn't supported by the current model (e.g. user picked
  // SquareHd on Imagen then switched to Flux Pro 1.1), reset to the model's
  // default. Otherwise PopoverMenu's toggle mode finds no selected item and
  // renders just the icon with no label.
  // If the model was switched to one that does not offer the stored ratio, move the choice to that model's default.
  useEffect(() => {
    if (currentAspectRatio === undefined) return;
    if (model.aspectRatios?.includes(currentAspectRatio)) return;
    const def = model.defaultAspectRatio;
    if (!def) return;
    handleCommonAspectRatioSelect(def);
  }, [model, currentAspectRatio, handleCommonAspectRatioSelect]);

  // True for any of the "Auto" ratios (plain, 2K, 3K, 4K), which get the Auto icon instead of a shape.
  const isAutoRatio =
    useAspectRatio === CommonAspectRatio.Auto ||
    useAspectRatio === CommonAspectRatio.Auto2k ||
    useAspectRatio === CommonAspectRatio.Auto3k ||
    useAspectRatio === CommonAspectRatio.Auto4k;

  // Turns a clicked menu row back into a ratio value and passes it up.
  const handleSelectAdapter = (item: PopoverItem) => {
    const ratio = (item.action ?? item.label) as CommonAspectRatio;
    handleCommonAspectRatioSelect(ratio);
  };

  // Same check as isAutoRatio, but for any ratio passed in (used when building the menu rows).
  const isAutoAspectRatio = (ratio: CommonAspectRatio): boolean => {
    return (
      ratio === CommonAspectRatio.Auto ||
      ratio === CommonAspectRatio.Auto2k ||
      ratio === CommonAspectRatio.Auto3k ||
      ratio === CommonAspectRatio.Auto4k
    );
  };

  // The menu rows, built from the ratios this model supports.
  let aspectRatioList: PopoverItem[] = [];

  // One row per supported ratio: text label, the ratio as its action, whether it is the current one, and an icon.
  model.aspectRatios?.forEach((ratio: CommonAspectRatio) => {
    aspectRatioList.push({
      label: getAspectRatioTextLabel(ratio),
      action: ratio,
      selected: useAspectRatio === ratio,
      icon: isAutoAspectRatio(ratio) ? (
        <AutoIcon />
      ) : (
        <AspectRatioIcon commonAspectRatio={ratio} />
      ),
    });
  });

  // Draw a hover tooltip around a popover menu whose button shows the current ratio's icon.
  return (
    <>
      <Tooltip
        content="Aspect Ratio"
        position="top"
        className="z-50"
        closeOnClick={true}
      >
        <PopoverMenu
          items={aspectRatioList}
          onSelect={handleSelectAdapter}
          mode="toggle"
          panelTitle="Aspect Ratio"
          showIconsInList
          triggerIcon={
            isAutoRatio || !useAspectRatio ? (
              <AutoIcon />
            ) : (
              <AspectRatioIcon commonAspectRatio={useAspectRatio} />
            )
          }
        />
      </Tooltip>
    </>
  );
};

// Maps each ratio to the text shown in the menu (for example 16:9 (Wide)); unknown values show as they are.
const getAspectRatioTextLabel = (aspectRatio: CommonAspectRatio): string => {
  switch (aspectRatio) {
    case CommonAspectRatio.Auto:
      return "Auto";
    case CommonAspectRatio.Square:
      return "Square";

    // Wide
    case CommonAspectRatio.WideFiveByFour:
      return "5:4 (Wide)";
    case CommonAspectRatio.WideFourByThree:
      return "4:3 (Wide)";
    case CommonAspectRatio.WideThreeByTwo:
      return "3:2 (Wide)";
    case CommonAspectRatio.WideSixteenByNine:
      return "16:9 (Wide)";
    case CommonAspectRatio.WideTwentyOneByNine:
      return "21:9 (Wide)";

    // Tall
    case CommonAspectRatio.TallFourByFive:
      return "4:5 (Tall)";
    case CommonAspectRatio.TallThreeByFour:
      return "3:4 (Tall)";
    case CommonAspectRatio.TallTwoByThree:
      return "2:3 (Tall)";
    case CommonAspectRatio.TallNineBySixteen:
      return "9:16 (Tall)";
    case CommonAspectRatio.TallNineByTwentyOne:
      return "9:21 (Tall)";

    // With resolution baked in
    case CommonAspectRatio.Auto2k:
      return "Auto (2K)";
    case CommonAspectRatio.Auto3k:
      return "Auto (3K)";
    case CommonAspectRatio.Auto4k:
      return "Auto (4K)";
    case CommonAspectRatio.SquareHd:
      return "Square (HD)";

    // Semantic cases
    case CommonAspectRatio.Wide:
      return "Wide";
    case CommonAspectRatio.Tall:
      return "Tall";

    default:
      return aspectRatio;
  }
};
