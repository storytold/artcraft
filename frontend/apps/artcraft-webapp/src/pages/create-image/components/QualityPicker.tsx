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

export function qualityFromLabel(label: string): string | undefined {
  return LABEL_TO_QUALITY[label];
}

// Shared by the desktop popover and the mobile settings field.
export function buildQualityItems(
  qualityOptions: string[],
  selected?: string,
): PopoverItem[] {
  return qualityOptions.map((q) => ({
    label: QUALITY_LABELS[q] ?? q,
    selected: selected === q,
  }));
}

export const QualityPicker = ({
  qualityOptions,
  defaultQuality,
  currentQuality,
  handleQualitySelect,
}: QualityPickerProps) => {
  const activeQuality = currentQuality ?? defaultQuality ?? undefined;

  const handleSelectAdapter = (item: PopoverItem) => {
    const quality = qualityFromLabel(item.label);
    if (quality) handleQualitySelect(quality);
  };

  const qualityList = buildQualityItems(qualityOptions, activeQuality);

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
