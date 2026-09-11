import { GemIcon } from "lucide-react";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { CommonQuality, ImageModel } from "@storyteller/model-list";

interface QualityPickerProps {
  model: ImageModel;
  currentQuality?: CommonQuality;
  handleCommonQualitySelect: (selected: CommonQuality) => void;
}

const QUALITY_LABELS: Record<CommonQuality, string> = {
  [CommonQuality.High]: "High",
  [CommonQuality.Medium]: "Medium",
  [CommonQuality.Low]: "Low",
};

/**
 * Stateless picker for image generation "quality" (used by OpenAI image
 * models — gpt_image_1, gpt_image_1p5, gpt_image_2). Models that don't
 * declare `qualities` should not render this picker.
 */
export const QualityPicker = ({
  model,
  currentQuality,
  handleCommonQualitySelect,
}: QualityPickerProps) => {
  const useQuality = currentQuality ?? model.defaultQuality ?? undefined;

  const handleSelectAdapter = (item: PopoverItem) => {
    const quality = (item.action ?? item.label) as CommonQuality;
    if (quality) handleCommonQualitySelect(quality);
  };

  const qualityList: PopoverItem[] = model.qualityOptions.map((q) => ({
    label: QUALITY_LABELS[q] ?? q,
    action: q,
    selected: useQuality === q,
  }));

  return (
    <Tooltip
      content="Quality"
      position="top"
      className="z-50"
      closeOnClick={true}
    >
      <PopoverMenu
        items={qualityList}
        onSelect={handleSelectAdapter}
        mode="toggle"
        panelTitle="Quality"
        triggerIcon={<GemIcon  className="h-3.5 w-3.5" />}
      />
    </Tooltip>
  );
};
