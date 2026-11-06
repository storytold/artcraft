import { useState } from "react";
import { PlusIcon, ScanIcon, XIcon } from "lucide-react";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { TabSelector } from "@storyteller/ui-tab-selector";
import {
  BUILT_IN_CANVAS_PRESETS,
  CUSTOM_CHANNEL,
  type CanvasSizePreset,
} from "@storyteller/common";
import { twMerge } from "tailwind-merge";
import { useCanvasPresetsStore } from "./stores/CanvasPresetsStore";
import { CustomPresetForm } from "./components/CustomPresetForm";

const PREVIEW_MAX_WIDTH = 56;
const PREVIEW_MAX_HEIGHT = 36;

// One tab per channel: Standard, then the canvas size library's (Social…),
// then the user's own presets.
const BUILT_IN_CHANNELS = [
  ...new Set(BUILT_IN_CANVAS_PRESETS.map((preset) => preset.channel)),
];
const TABS = [...BUILT_IN_CHANNELS, CUSTOM_CHANNEL].map((channel) => ({
  id: channel,
  label: channel,
}));

interface BlankCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** `safeZoneId` is the chosen preset's default safe zone, if it has any. */
  onConfirm: (width: number, height: number, safeZoneId?: string) => void;
}

export const BlankCanvasModal = ({
  isOpen,
  onClose,
  onConfirm,
}: BlankCanvasModalProps) => {
  const customPresets = useCanvasPresetsStore((s) => s.customPresets);
  const removeCustomPreset = useCanvasPresetsStore((s) => s.removeCustomPreset);
  const [channel, setChannel] = useState(BUILT_IN_CHANNELS[0]);
  const [selected, setSelected] = useState<CanvasSizePreset | null>(null);
  const [isAddingPreset, setIsAddingPreset] = useState(false);

  const isCustomTab = channel === CUSTOM_CHANNEL;
  const presets = isCustomTab
    ? customPresets
    : BUILT_IN_CANVAS_PRESETS.filter((preset) => preset.channel === channel);

  const reset = () => {
    setSelected(null);
    setIsAddingPreset(false);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected.width, selected.height, selected.safeZones[0]?.id);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDelete = (preset: CanvasSizePreset) => {
    removeCustomPreset(preset.id);
    if (selected?.id === preset.id) {
      setSelected(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Choose Canvas Size"
      onClose={handleClose}
      width={620}
    >
      <div className="flex flex-col gap-4 p-1">
        <TabSelector
          tabs={TABS}
          activeTab={channel}
          onTabChange={(id) => {
            setChannel(id);
            setIsAddingPreset(false);
          }}
        />

        <div className="max-h-[55vh] min-h-[180px] overflow-y-auto pr-1">
          {isCustomTab && isAddingPreset ? (
            <CustomPresetForm
              onSaved={(preset) => {
                setSelected(preset);
                setIsAddingPreset(false);
              }}
              onCancel={() => setIsAddingPreset(false)}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {groupPresets(presets).map(({ group, items }) => (
                <div key={group}>
                  {!isCustomTab && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-base-fg/50">
                      {group}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {items.map((preset) => (
                      <PresetTile
                        key={preset.id}
                        preset={preset}
                        isSelected={selected?.id === preset.id}
                        onSelect={() => setSelected(preset)}
                        onDelete={
                          isCustomTab ? () => handleDelete(preset) : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
              {isCustomTab && (
                <div className="flex flex-col items-start gap-2">
                  {customPresets.length === 0 && (
                    <p className="text-sm text-base-fg/60">
                      Save the sizes you use often, with safe zones of your own.
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    icon={PlusIcon}
                    onClick={() => setIsAddingPreset(true)}
                  >
                    New preset
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {!isAddingPreset && (
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="action" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!selected}
            >
              Create Canvas
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

interface PresetTileProps {
  preset: CanvasSizePreset;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

const PresetTile = ({
  preset,
  isSelected,
  onSelect,
  onDelete,
}: PresetTileProps) => {
  const scale = Math.min(
    PREVIEW_MAX_WIDTH / preset.width,
    PREVIEW_MAX_HEIGHT / preset.height,
  );
  const safeZoneNames = preset.safeZones.map((zone) => zone.label).join(", ");
  const size = `${preset.width} × ${preset.height}`;

  return (
    <div className="relative">
      <button
        onClick={onSelect}
        title={safeZoneNames ? `Safe zones: ${safeZoneNames}` : undefined}
        className={twMerge(
          "relative flex min-w-[96px] flex-col items-center gap-2 rounded-xl border-2 bg-ui-panel px-4 py-3 text-sm font-medium text-base-fg transition-colors hover:border-primary/60",
          isSelected
            ? "border-primary bg-primary/10"
            : "border-ui-panel-border",
        )}
      >
        {safeZoneNames && (
          <ScanIcon
            aria-label="Has safe zones"
            className="absolute right-2 top-2 h-3.5 w-3.5 text-yellow-300"
          />
        )}
        <div
          className="rounded-sm border border-base-fg/20 bg-white"
          style={{
            width: Math.round(preset.width * scale),
            height: Math.round(preset.height * scale),
          }}
        />
        {preset.name && (
          <span className="whitespace-nowrap text-xs">{preset.name}</span>
        )}
        <span
          className={twMerge(
            "whitespace-nowrap text-xs",
            preset.name && "text-base-fg/60",
          )}
        >
          {size}
        </span>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`Delete ${preset.name ?? size}`}
          title="Delete preset"
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-ui-panel-border bg-ui-panel text-base-fg/70 transition-colors hover:bg-red hover:text-white"
        >
          <XIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

/** Presets under their headings, in the order they come. */
function groupPresets(
  presets: CanvasSizePreset[],
): { group: string; items: CanvasSizePreset[] }[] {
  const groups: { group: string; items: CanvasSizePreset[] }[] = [];
  for (const preset of presets) {
    const last = groups[groups.length - 1];
    if (last?.group === preset.group) {
      last.items.push(preset);
    } else {
      groups.push({ group: preset.group, items: [preset] });
    }
  }
  return groups;
}
