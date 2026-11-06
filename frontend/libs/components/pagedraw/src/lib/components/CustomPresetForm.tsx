import { useMemo, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import {
  customPresetProblems,
  type CanvasSizePreset,
  type CustomCanvasPresetInput,
  type Margins,
} from "@storyteller/common";
import { useCanvasPresetsStore } from "../stores/CanvasPresetsStore";

const SIDES: (keyof Margins)[] = ["top", "right", "bottom", "left"];

interface CustomPresetFormProps {
  onSaved: (preset: CanvasSizePreset) => void;
  onCancel: () => void;
}

/** What the user is typing; numbers stay strings until the preset is saved. */
interface SafeZoneDraft {
  name: string;
  margins: Record<keyof Margins, string>;
}

/** Saves a canvas size to "My presets", with any number of named safe zones. */
export const CustomPresetForm = ({
  onSaved,
  onCancel,
}: CustomPresetFormProps) => {
  const addCustomPreset = useCanvasPresetsStore((s) => s.addCustomPreset);
  const [name, setName] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [safeZones, setSafeZones] = useState<SafeZoneDraft[]>([]);
  const [showProblems, setShowProblems] = useState(false);

  const input: CustomCanvasPresetInput = useMemo(
    () => ({
      name,
      width: toNumber(width),
      height: toNumber(height),
      safeZones: safeZones.map((zone) => ({
        name: zone.name,
        margins: {
          top: toNumber(zone.margins.top),
          right: toNumber(zone.margins.right),
          bottom: toNumber(zone.margins.bottom),
          left: toNumber(zone.margins.left),
        },
      })),
    }),
    [name, width, height, safeZones],
  );
  const problems = customPresetProblems(input);

  const updateSafeZone = (index: number, change: Partial<SafeZoneDraft>) =>
    setSafeZones((zones) =>
      zones.map((zone, i) => (i === index ? { ...zone, ...change } : zone)),
    );

  const handleSave = () => {
    if (problems.length > 0) {
      setShowProblems(true);
      return;
    }
    onSaved(addCustomPreset(input));
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        id="custom-preset-name"
        label="Name"
        placeholder="Client story"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="flex gap-3">
        <Input
          id="custom-preset-width"
          label="Width (px)"
          type="number"
          className="flex-1"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
        />
        <Input
          id="custom-preset-height"
          label="Height (px)"
          type="number"
          className="flex-1"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-base-fg/50">
            Safe zones
          </p>
          <p className="mt-1 text-xs text-base-fg/60">
            Margins in pixels of this size: how far the platform's interface
            reaches in from each edge. A safe zone shows on any canvas with
            exactly this aspect ratio.
          </p>
        </div>
        {safeZones.map((zone, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-xl border border-ui-panel-border p-3"
          >
            <div className="flex items-end gap-2">
              <Input
                id={`custom-preset-zone-${index}-name`}
                label={`Safe zone ${index + 1}`}
                placeholder="Logo bar"
                className="flex-1"
                value={zone.name}
                onChange={(e) =>
                  updateSafeZone(index, { name: e.target.value })
                }
              />
              <Button
                variant="ghost"
                icon={Trash2Icon}
                aria-label={`Remove safe zone ${index + 1}`}
                onClick={() =>
                  setSafeZones((zones) => zones.filter((_, i) => i !== index))
                }
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SIDES.map((side) => (
                <Input
                  key={side}
                  id={`custom-preset-zone-${index}-${side}`}
                  label={side[0].toUpperCase() + side.slice(1)}
                  type="number"
                  min={0}
                  value={zone.margins[side]}
                  onChange={(e) =>
                    updateSafeZone(index, {
                      margins: { ...zone.margins, [side]: e.target.value },
                    })
                  }
                />
              ))}
            </div>
          </div>
        ))}
        <Button
          variant="secondary"
          icon={PlusIcon}
          className="self-start"
          onClick={() =>
            setSafeZones((zones) => [
              ...zones,
              {
                name: "",
                margins: { top: "0", right: "0", bottom: "0", left: "0" },
              },
            ])
          }
        >
          Add safe zone
        </Button>
      </div>

      {showProblems && problems.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-red-400">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="action" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save preset
        </Button>
      </div>
    </div>
  );
};

// An empty field is not a number; a margin left at 0 is.
function toNumber(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}
