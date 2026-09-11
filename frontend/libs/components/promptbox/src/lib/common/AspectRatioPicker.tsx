import { useEffect } from "react";
import { CommonAspectRatio } from "@storyteller/model-list";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { ImageModel } from "@storyteller/model-list";
import { AspectRatioIcon, AutoIcon } from "./AspectRatioIcon";

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
export const AspectRatioPicker = ({
  model,
  currentAspectRatio,
  handleCommonAspectRatioSelect,
}: AspectRatioPickerProps) => {
  const useAspectRatio =
    currentAspectRatio ?? model.defaultAspectRatio ?? undefined;

  // If the stored ratio isn't supported by the current model (e.g. user picked
  // SquareHd on Imagen then switched to Flux Pro 1.1), reset to the model's
  // default. Otherwise PopoverMenu's toggle mode finds no selected item and
  // renders just the icon with no label.
  useEffect(() => {
    if (currentAspectRatio === undefined) return;
    if (model.aspectRatios?.includes(currentAspectRatio)) return;
    const def = model.defaultAspectRatio;
    if (!def) return;
    handleCommonAspectRatioSelect(def);
  }, [model, currentAspectRatio, handleCommonAspectRatioSelect]);

  const isAutoRatio =
    useAspectRatio === CommonAspectRatio.Auto ||
    useAspectRatio === CommonAspectRatio.Auto2k ||
    useAspectRatio === CommonAspectRatio.Auto3k ||
    useAspectRatio === CommonAspectRatio.Auto4k;

  const handleSelectAdapter = (item: PopoverItem) => {
    const ratio = (item.action ?? item.label) as CommonAspectRatio;
    handleCommonAspectRatioSelect(ratio);
  };

  const isAutoAspectRatio = (ratio: CommonAspectRatio): boolean => {
    return (
      ratio === CommonAspectRatio.Auto ||
      ratio === CommonAspectRatio.Auto2k ||
      ratio === CommonAspectRatio.Auto3k ||
      ratio === CommonAspectRatio.Auto4k
    );
  };

  let aspectRatioList: PopoverItem[] = [];

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
