import { BoxIcon, GemIcon, GroupIcon, ImageIcon, WandSparklesIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { Tooltip } from "@storyteller/ui-tooltip";

// ── Enum label maps (backend value → human label) ──────────────────────────

const MESH_OUTPUT_TYPE_LABELS: Record<string, string> = {
  normal: "Standard",
  low_poly: "Low Poly",
  geometry: "Geometry only",
};

const POLYGON_TYPE_LABELS: Record<string, string> = {
  triangle: "Triangle",
  quad: "Quad",
};

const MESH_QUALITY_LABELS: Record<string, string> = {
  standard: "Standard",
  detailed: "Detailed",
};

// Preset target face counts (poly budget). Backend accepts any u64; these are
// sensible presets exposed in the UI.
const FACE_COUNT_PRESETS: number[] = [10000, 30000, 50000, 100000, 200000];

// ── Generic enum picker ────────────────────────────────────────────────────

interface EnumPickerProps {
  options: string[];
  current?: string;
  onSelect: (value: string) => void;
  labels: Record<string, string>;
  tooltip: string;
  panelTitle: string;
  icon: LucideIcon;
}

function EnumPicker({
  options,
  current,
  onSelect,
  labels,
  tooltip,
  panelTitle,
  icon,
}: EnumPickerProps) {
  const labelToValue: Record<string, string> = Object.fromEntries(
    options.map((v) => [labels[v] ?? v, v]),
  );

  const items: PopoverItem[] = options.map((v) => ({
    label: labels[v] ?? v,
    selected: current === v,
  }));

  return (
    <Tooltip content={tooltip} position="top" className="z-50" closeOnClick>
      <PopoverMenu
        items={items}
        onSelect={(item) => {
          const value = labelToValue[item.label];
          if (value) onSelect(value);
        }}
        mode="toggle"
        panelTitle={panelTitle}
        triggerIcon={<DynamicIcon icon={icon} className="h-3.5 w-3.5" />}
      />
    </Tooltip>
  );
}

// ── Concrete pickers ───────────────────────────────────────────────────────

export const MeshOutputTypePicker = (props: {
  options: string[];
  current?: string;
  onSelect: (value: string) => void;
}) => (
  <EnumPicker
    {...props}
    labels={MESH_OUTPUT_TYPE_LABELS}
    tooltip="Output type"
    panelTitle="Output type"
    icon={BoxIcon}
  />
);

export const PolygonTypePicker = (props: {
  options: string[];
  current?: string;
  onSelect: (value: string) => void;
}) => (
  <EnumPicker
    {...props}
    labels={POLYGON_TYPE_LABELS}
    tooltip="Polygon type"
    panelTitle="Polygon type"
    icon={GroupIcon}
  />
);

export const GeometryQualityPicker = (props: {
  options: string[];
  current?: string;
  onSelect: (value: string) => void;
}) => (
  <EnumPicker
    {...props}
    labels={MESH_QUALITY_LABELS}
    tooltip="Geometry quality"
    panelTitle="Geometry quality"
    icon={WandSparklesIcon}
  />
);

export const TextureQualityPicker = (props: {
  options: string[];
  current?: string;
  onSelect: (value: string) => void;
}) => (
  <EnumPicker
    {...props}
    labels={MESH_QUALITY_LABELS}
    tooltip="Texture quality"
    panelTitle="Texture quality"
    icon={ImageIcon}
  />
);

// Standard two-value quality option lists ("standard" / "detailed").
export const QUALITY_OPTIONS = ["standard", "detailed"];

export const FaceCountPicker = ({
  current,
  onSelect,
}: {
  current?: number;
  onSelect: (value: number | undefined) => void;
}) => {
  const items: PopoverItem[] = [
    { label: "Auto", selected: current == null },
    ...FACE_COUNT_PRESETS.map((n) => ({
      label: `${n / 1000}k`,
      selected: current === n,
    })),
  ];

  return (
    <Tooltip content="Face count" position="top" className="z-50" closeOnClick>
      <PopoverMenu
        items={items}
        onSelect={(item) => {
          if (item.label === "Auto") {
            onSelect(undefined);
            return;
          }
          const n = parseFloat(item.label) * 1000;
          if (!Number.isNaN(n)) onSelect(n);
        }}
        mode="toggle"
        panelTitle="Face count"
        triggerIcon={<GemIcon  className="h-3.5 w-3.5" />}
      />
    </Tooltip>
  );
};
