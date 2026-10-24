import { DrumIcon } from "lucide-react";
import { PopoverMenu } from "@storyteller/ui-popover";
import { SliderV2 } from "@storyteller/ui-sliderv2";

// UI-only bounds; the server accepts any u16 BPM.
// Slider limits for tempo (beats per minute). They only shape the control; the server accepts any whole number up to 65535.
export const AUDIO_BPM_MIN = 40;
export const AUDIO_BPM_MAX = 240;
// Where the slider handle sits while tempo is on Auto.
const DEFAULT_BPM = 120;

// Musical keys for audio generation (eg. Suno Sounds).
// NB: There are intentionally no E keys, per product spec.
// The keys the user can pick (the value sent, the long label, the short label on the button).
export const MUSICAL_KEYS: Array<{
  value: string;
  label: string;
  shortLabel: string;
}> = [
  { value: "auto", label: "Auto", shortLabel: "Auto" },
  { value: "c_major", label: "C Major", shortLabel: "C" },
  { value: "c_minor", label: "C Minor", shortLabel: "Cm" },
  { value: "d_major", label: "D Major", shortLabel: "D" },
  { value: "d_minor", label: "D Minor", shortLabel: "Dm" },
  { value: "f_major", label: "F Major", shortLabel: "F" },
  { value: "f_minor", label: "F Minor", shortLabel: "Fm" },
  { value: "g_major", label: "G Major", shortLabel: "G" },
  { value: "g_minor", label: "G Minor", shortLabel: "Gm" },
  { value: "a_major", label: "A Major", shortLabel: "A" },
  { value: "a_minor", label: "A Minor", shortLabel: "Am" },
  { value: "b_major", label: "B Major", shortLabel: "B" },
  { value: "b_minor", label: "B Minor", shortLabel: "Bm" },
];

// Which controls to show, and for each one its current value and a callback for changes. All are optional.
export interface SoundsSettingsPopoverProps {
  showBpm?: boolean;
  // Null means "let the model decide" — the field is omitted from the request.
  bpm?: number | null;
  onBpmChange?: (bpm: number | null) => void;
  showMusicalKey?: boolean;
  musicalKey?: string;
  onMusicalKeyChange?: (key: string) => void;
}

// The "Beat & Key" menu for sound-effect and loop models: tempo and musical key.
export function SoundsSettingsPopover({
  showBpm = false,
  bpm = null,
  onBpmChange,
  showMusicalKey = false,
  musicalKey = "auto",
  onMusicalKeyChange,
}: SoundsSettingsPopoverProps) {
  // Short name of the chosen key for the button label, falling back to Auto for an unknown value.
  const keyLabel =
    MUSICAL_KEYS.find((entry) => entry.value === musicalKey)?.shortLabel ??
    "Auto";
  // Text on the menu button, for example "120 BPM · Am", built from the controls that are switched on.
  const triggerLabel = [
    showBpm ? (bpm === null ? "Auto BPM" : `${bpm} BPM`) : null,
    showMusicalKey ? keyLabel : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // A popover menu with a drum icon; inside it, a tempo block and a key block, each shown only when switched on.
  return (
    <PopoverMenu
      mode="default"
      panelTitle="Beat & Key"
      triggerIcon={<DrumIcon  className="h-3.5 w-3.5" />}
      triggerLabel={triggerLabel || "Beat"}
    >
      <div className="w-60 space-y-3.5 pb-0.5">
        {/* Tempo: a slider plus a small Auto button that clears the value back to null. */}
        {showBpm && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-base-fg/60">BPM</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium tabular-nums text-base-fg">
                  {bpm === null ? "Auto" : bpm}
                </span>
                {bpm !== null && (
                  <button
                    type="button"
                    onClick={() => onBpmChange?.(null)}
                    className="rounded-[3px] bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-base-fg/60 transition-colors hover:bg-white/10 hover:text-base-fg"
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>
            <SliderV2
              min={AUDIO_BPM_MIN}
              max={AUDIO_BPM_MAX}
              step={1}
              value={bpm ?? DEFAULT_BPM}
              onChange={(value) => onBpmChange?.(value)}
              variant="filled"
            />
          </div>
        )}

        {/* Key: a grid of buttons with the current one highlighted; Auto spans the full first row. */}
        {showMusicalKey && (
          <div>
            <div className="mb-1.5 text-xs font-medium text-base-fg/60">
              Musical key
            </div>
            <div className="grid grid-cols-4 gap-1">
              {MUSICAL_KEYS.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  title={entry.label}
                  onClick={() => onMusicalKeyChange?.(entry.value)}
                  className={`rounded-[3px] border px-1.5 py-1 text-xs font-medium transition-colors ${
                    entry.value === musicalKey
                      ? "border-white/30 bg-white/15 text-base-fg"
                      : "border-transparent bg-white/5 text-base-fg/60 hover:bg-white/10 hover:text-base-fg"
                  } ${entry.value === "auto" ? "col-span-4" : ""}`}
                >
                  {entry.shortLabel}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PopoverMenu>
  );
}
