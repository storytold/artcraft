import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { AspectRatioIcon, AutoIcon } from "./AspectRatioIcon";

interface AspectRatioPickerProps {
  aspectRatioOptions: string[];
  defaultAspectRatio?: string;
  currentAspectRatio?: string;
  handleAspectRatioSelect: (selected: string) => void;
}

const AUTO_RATIOS = new Set(["auto", "auto_2k", "auto_4k"]);

export const AspectRatioPicker = ({
  aspectRatioOptions,
  defaultAspectRatio,
  currentAspectRatio,
  handleAspectRatioSelect,
}: AspectRatioPickerProps) => {
  const useAspectRatio = currentAspectRatio ?? defaultAspectRatio ?? undefined;
  const isAutoRatio = !!useAspectRatio && AUTO_RATIOS.has(useAspectRatio);

  const handleSelectAdapter = (item: PopoverItem) => {
    const ratio = labelToAspectRatio(item.label);
    if (ratio) handleAspectRatioSelect(ratio);
  };

  const aspectRatioList: PopoverItem[] = aspectRatioOptions.map((ratio) => ({
    label: getAspectRatioTextLabel(ratio),
    selected: useAspectRatio === ratio,
    icon: AUTO_RATIOS.has(ratio) ? (
      <AutoIcon />
    ) : (
      <AspectRatioIcon commonAspectRatio={ratio} />
    ),
  }));

  return (
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
  );
};

const ASPECT_RATIO_LABELS: Record<string, string> = {
  auto: "Auto",
  square: "Square",
  wide_five_by_four: "5:4 (Wide)",
  wide_four_by_three: "4:3 (Wide)",
  wide_three_by_two: "3:2 (Wide)",
  wide_sixteen_by_nine: "16:9 (Wide)",
  wide_twenty_one_by_nine: "21:9 (Wide)",
  tall_four_by_five: "4:5 (Tall)",
  tall_three_by_four: "3:4 (Tall)",
  tall_two_by_three: "2:3 (Tall)",
  tall_nine_by_sixteen: "9:16 (Tall)",
  tall_nine_by_twenty_one: "9:21 (Tall)",
  auto_2k: "Auto (2K)",
  auto_4k: "Auto (4K)",
  square_hd: "Square (HD)",
  wide: "Wide",
  tall: "Tall",
};

const LABEL_TO_RATIO: Record<string, string> = Object.fromEntries(
  Object.entries(ASPECT_RATIO_LABELS).map(([k, v]) => [v, k]),
);

function getAspectRatioTextLabel(ratio: string): string {
  return ASPECT_RATIO_LABELS[ratio] ?? ratio;
}

function labelToAspectRatio(label: string): string | undefined {
  return LABEL_TO_RATIO[label];
}
