import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGem } from "@fortawesome/pro-solid-svg-icons";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";

interface QualityPickerProps {
  qualityOptions: string[];
  defaultQuality?: string;
  currentQuality?: string;
  handleQualitySelect: (selected: string) => void;
}

const QUALITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const LABEL_TO_QUALITY: Record<string, string> = Object.fromEntries(
  Object.entries(QUALITY_LABELS).map(([k, v]) => [v, k]),
);

export const QualityPicker = ({
  qualityOptions,
  defaultQuality,
  currentQuality,
  handleQualitySelect,
}: QualityPickerProps) => {
  const activeQuality = currentQuality ?? defaultQuality ?? undefined;

  const handleSelectAdapter = (item: PopoverItem) => {
    const quality = LABEL_TO_QUALITY[item.label];
    if (quality) handleQualitySelect(quality);
  };

  const qualityList: PopoverItem[] = qualityOptions.map((q) => ({
    label: QUALITY_LABELS[q] ?? q,
    selected: activeQuality === q,
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
        triggerIcon={
          <FontAwesomeIcon icon={faGem} className="h-3.5 w-3.5" />
        }
      />
    </Tooltip>
  );
};
