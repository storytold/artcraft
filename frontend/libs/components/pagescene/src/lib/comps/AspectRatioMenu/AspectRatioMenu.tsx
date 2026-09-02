import { useContext } from "react";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { AspectRatioIcon } from "@storyteller/ui-promptbox";
import { CameraAspectRatio } from "../../enums";
import { setCameraAspect } from "../../actions";
import { usePageSceneStore } from "../../PageSceneStore";
import { EngineContext } from "../../contexts/EngineContext";

// Render-frame aspect ratio picker. Same popover pattern as the prompt
// boxes' AspectRatioPicker, but driving the 3D editor's camera letterbox
// (CameraAspectRatio) instead of a generation model's ratio list.

interface RatioOption {
  ratio: CameraAspectRatio;
  label: string;
  proportions: [number, number];
}

const RATIO_OPTIONS: RatioOption[] = [
  { ratio: CameraAspectRatio.HORIZONTAL_16_9, label: "16:9", proportions: [16, 9] },
  { ratio: CameraAspectRatio.HORIZONTAL_3_2, label: "3:2", proportions: [3, 2] },
  { ratio: CameraAspectRatio.SQUARE_1_1, label: "1:1", proportions: [1, 1] },
  { ratio: CameraAspectRatio.VERTICAL_2_3, label: "2:3", proportions: [2, 3] },
  { ratio: CameraAspectRatio.VERTICAL_9_16, label: "9:16", proportions: [9, 16] },
];

export const AspectRatioMenu = () => {
  const aspect = usePageSceneStore((s) => s.cameraAspectRatio);
  const editor = useContext(EngineContext);

  const current =
    RATIO_OPTIONS.find((o) => o.ratio === aspect) ?? RATIO_OPTIONS[0];

  const items: PopoverItem[] = RATIO_OPTIONS.map((option) => ({
    label: option.label,
    selected: option.ratio === aspect,
    icon: <AspectRatioIcon ratio={option.proportions} />,
  }));

  const handleSelect = (item: PopoverItem) => {
    const option = RATIO_OPTIONS.find((o) => o.label === item.label);
    if (option && editor) setCameraAspect(editor, option.ratio);
  };

  return (
    <Tooltip content="Aspect ratio" position="bottom" delay={300} closeOnClick>
      <PopoverMenu
        items={items}
        onSelect={handleSelect}
        mode="toggle"
        position="bottom"
        panelTitle="Aspect Ratio"
        showIconsInList
        buttonClassName="glass glass-no-hover h-[34px] px-3 text-xs font-medium"
        triggerIcon={<AspectRatioIcon ratio={current.proportions} />}
      />
    </Tooltip>
  );
};
