import { SlidersHorizontalIcon } from "lucide-react";
import { PopoverMenu } from "@storyteller/ui-popover";
import { SliderV2 } from "@storyteller/ui-sliderv2";

// Output-shaping controls for models that support them (Seed Audio):
// sample rate, playback speed, volume, and pitch. Ranges mirror the
// backend's validate_audio_request limits.
// Allowed ranges for each control; they mirror what the server accepts.
export const AUDIO_SPEED_MIN = 0.5;
export const AUDIO_SPEED_MAX = 2.0;
export const AUDIO_VOLUME_MIN = 0.5;
export const AUDIO_VOLUME_MAX = 2.0;
export const AUDIO_PITCH_MIN = -12;
export const AUDIO_PITCH_MAX = 12;

// Which controls to show, and for each one its current value and a callback for changes. All are optional.
export interface AudioTuningPopoverProps {
  // Sample rate section renders only when options are provided.
  sampleRateOptions?: number[] | null;
  sampleRateHz?: number | null;
  onSampleRateChange?: (hz: number) => void;
  showSpeed?: boolean;
  speed?: number;
  onSpeedChange?: (value: number) => void;
  showVolume?: boolean;
  volume?: number;
  onVolumeChange?: (value: number) => void;
  showPitch?: boolean;
  pitch?: number;
  onPitchChange?: (value: number) => void;
}

// The "Tuning" menu for audio models that let the user shape the output: sample rate, speed, volume and pitch.
export function AudioTuningPopover({
  sampleRateOptions,
  sampleRateHz,
  onSampleRateChange,
  showSpeed = false,
  speed = 1,
  onSpeedChange,
  showVolume = false,
  volume = 1,
  onVolumeChange,
  showPitch = false,
  pitch = 0,
  onPitchChange,
}: AudioTuningPopoverProps) {
  // Show the sample-rate buttons only when the model lists options and the parent can receive the choice.
  const showSampleRate =
    !!sampleRateOptions?.length && onSampleRateChange !== undefined;

  // A popover menu with a sliders icon; inside it, one block per control that is switched on.
  return (
    <PopoverMenu
      mode="default"
      panelTitle="Tuning"
      triggerIcon={<SlidersHorizontalIcon  className="h-3.5 w-3.5" />}
      triggerLabel="Tuning"
    >
      <div className="w-60 space-y-3.5 pb-0.5">
        {/* Sample rate: one button per allowed rate, with the current one highlighted. */}
        {showSampleRate && (
          <div>
            <div className="mb-1.5 text-xs font-medium text-base-fg/60">
              Sample rate
            </div>
            <div className="flex flex-wrap gap-1">
              {sampleRateOptions.map((hz) => (
                <button
                  key={hz}
                  type="button"
                  onClick={() => onSampleRateChange?.(hz)}
                  className={`rounded-[3px] border px-2 py-1 text-xs font-medium transition-colors ${
                    hz === sampleRateHz
                      ? "border-white/30 bg-white/15 text-base-fg"
                      : "border-transparent bg-white/5 text-base-fg/60 hover:bg-white/10 hover:text-base-fg"
                  }`}
                >
                  {formatSampleRateHz(hz)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Speed slider, shown as a multiplier such as 1.25×. */}
        {showSpeed && (
          <TuningSliderRow
            label="Speed"
            valueLabel={`${speed.toFixed(2)}×`}
            min={AUDIO_SPEED_MIN}
            max={AUDIO_SPEED_MAX}
            step={0.05}
            value={speed}
            onChange={(value) => onSpeedChange?.(value)}
          />
        )}

        {/* Volume slider, shown as a multiplier such as 1.50×. */}
        {showVolume && (
          <TuningSliderRow
            label="Volume"
            valueLabel={`${volume.toFixed(2)}×`}
            min={AUDIO_VOLUME_MIN}
            max={AUDIO_VOLUME_MAX}
            step={0.05}
            value={volume}
            onChange={(value) => onVolumeChange?.(value)}
          />
        )}

        {/* Pitch slider in semitones (st); a plus sign is added for positive values. */}
        {showPitch && (
          <TuningSliderRow
            label="Pitch"
            valueLabel={`${pitch > 0 ? "+" : ""}${pitch} st`}
            min={AUDIO_PITCH_MIN}
            max={AUDIO_PITCH_MAX}
            step={1}
            value={pitch}
            onChange={(value) => onPitchChange?.(value)}
          />
        )}
      </div>
    </PopoverMenu>
  );
}

// Settings for one labelled slider row.
interface TuningSliderRowProps {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

// One row: the label and current value on top, a slider underneath.
function TuningSliderRow({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: TuningSliderRowProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-base-fg/60">{label}</span>
        <span className="text-xs font-medium tabular-nums text-base-fg">
          {valueLabel}
        </span>
      </div>
      <SliderV2
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        variant="filled"
      />
    </div>
  );
}

// Formats a rate in Hz as kilohertz: 44100 becomes "44.1 kHz" and 48000 becomes "48 kHz".
export function formatSampleRateHz(hz: number): string {
  const kilohertz = hz / 1000;
  const label = Number.isInteger(kilohertz)
    ? kilohertz.toString()
    : kilohertz.toFixed(1);
  return `${label} kHz`;
}
