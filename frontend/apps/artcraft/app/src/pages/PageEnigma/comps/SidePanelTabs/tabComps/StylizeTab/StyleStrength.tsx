import { Label } from "@storyteller/ui-label";
import { SliderV2 as Slider } from "@storyteller/ui-sliderv2";
import { NumberInput } from "@storyteller/ui-input";
import { useShallow } from "zustand/shallow";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";

export function StyleStrength() {
  const { styleStrength, setStyleStrength } = usePageEnigmaStore(
    useShallow((s) => ({
      styleStrength: s.styleStrength,
      setStyleStrength: s.setStyleStrength,
    })),
  );

  const sliderChanged = (value: number | number[]) =>
    setStyleStrength((value as number) / 100);
  const handleNumberInputChange = (value: number) =>
    setStyleStrength(value / 100);

  return (
    <div className="flex w-full flex-col justify-center gap-4 rounded-b-lg bg-ui-panel">
      <div className="w-full">
        <div>
          <Label>
            <div className="mb-1 leading-tight">Set the Style Strength (%)</div>
          </Label>
          <div className="mb-4 text-xs text-white/70">
            (The higher the value the more the style will be applied, the lower
            the value the closer to source.)
          </div>

          <div className="mb-2 flex items-center gap-3.5">
            <NumberInput
              value={styleStrength * 100}
              onChange={handleNumberInputChange}
            />
            <Slider
              value={styleStrength * 100}
              min={0}
              max={100}
              step={1}
              onChange={sliderChanged}
              showTooltip={true}
              suffix="%"
              className="mr-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
