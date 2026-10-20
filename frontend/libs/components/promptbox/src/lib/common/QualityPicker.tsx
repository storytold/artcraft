import { GemIcon } from "lucide-react";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";
import { CommonQuality, ImageModel } from "@storyteller/model-list";

// The chosen model, the quality picked so far, and a callback for a new pick.
interface QualityPickerProps {
  model: ImageModel;
  currentQuality?: CommonQuality;
  handleCommonQualitySelect: (selected: CommonQuality) => void;
}

// The text shown for each quality level.
const QUALITY_LABELS: Record<CommonQuality, string> = {
  [CommonQuality.Auto]: "Auto",
  [CommonQuality.Max]: "Max",
  [CommonQuality.XHigh]: "Extra high",
  [CommonQuality.High]: "High",
  [CommonQuality.Medium]: "Medium",
  [CommonQuality.Low]: "Low",
};

/**
 * Stateless picker for image generation "quality" (used by OpenAI image
 * models, including GPT Image 2.5). Models that don't
 * declare `qualities` should not render this picker.
 */
// The quality menu (only for models that offer quality levels).
export const QualityPicker = ({
  model,
  currentQuality,
  handleCommonQualitySelect,
}: QualityPickerProps) => {
  // The quality to show as selected: the pick if the model allows it, otherwise the model's own fallback.
  const useQuality = model.resolveQuality(currentQuality);

  // Turns a clicked row back into a quality value and passes it up.
  const handleSelectAdapter = (item: PopoverItem) => {
    const quality = (item.action ?? item.label) as CommonQuality;
    if (quality) handleCommonQualitySelect(quality);
  };

  // One menu row per quality the model offers.
  const qualityList: PopoverItem[] = model.qualityOptions.map((q) => ({
    label: QUALITY_LABELS[q] ?? q,
    action: q,
    selected: useQuality === q,
  }));

  // A hover tooltip around a popover menu with a gem icon as its button.
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
