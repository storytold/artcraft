import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDrum } from "@fortawesome/pro-solid-svg-icons";
import { PopoverMenu } from "@storyteller/ui-popover";
import { SliderV2 } from "@storyteller/ui-sliderv2";

// UI-only bounds; the server accepts any u16 BPM.
export const AUDIO_BPM_MIN = 40;
export const AUDIO_BPM_MAX = 240;
const DEFAULT_BPM = 120;

// Musical keys for audio generation (eg. Suno Sounds).
// NB: There are intentionally no E keys, per product spec.
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

export interface SoundsSettingsPopoverProps {
  showBpm?: boolean;
  // Null means "let the model decide" — the field is omitted from the request.
  bpm?: number | null;
  onBpmChange?: (bpm: number | null) => void;
  showMusicalKey?: boolean;
  musicalKey?: string;
  onMusicalKeyChange?: (key: string) => void;
}

export function SoundsSettingsPopover({
  showBpm = false,
  bpm = null,
  onBpmChange,
  showMusicalKey = false,
  musicalKey = "auto",
  onMusicalKeyChange,
}: SoundsSettingsPopoverProps) {
  const keyLabel =
    MUSICAL_KEYS.find((entry) => entry.value === musicalKey)?.shortLabel ??
    "Auto";
  const triggerLabel = [
    showBpm ? (bpm === null ? "Auto BPM" : `${bpm} BPM`) : null,
    showMusicalKey ? keyLabel : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PopoverMenu
      mode="default"
      panelTitle="Beat & Key"
      triggerIcon={<FontAwesomeIcon icon={faDrum} className="h-3.5 w-3.5" />}
      triggerLabel={triggerLabel || "Beat"}
    >
      <div className="w-60 space-y-3.5 pb-0.5">
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
                    className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-base-fg/60 transition-colors hover:bg-white/10 hover:text-base-fg"
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
                  className={`rounded-md border px-1.5 py-1 text-xs font-medium transition-colors ${
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
