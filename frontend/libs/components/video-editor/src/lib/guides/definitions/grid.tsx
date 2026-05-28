import {
  GridTableIcon,
  Layout3ColumnIcon as LayoutThreeColumnIcon,
  Layout3RowIcon as LayoutThreeRowIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GRID_MIN,
  GRID_MAX,
  DEFAULT_GRID_CONFIG,
} from "../grid";
import { usePreviewStore } from "../../preview/preview-store";
import { clampRound } from "../../utils/math";
import { cn } from "../../utils/ui";
import type { GuideDefinition } from "../types";
import { Input } from "../../components/ui/input";

function GridLines({
  rows,
  cols,
  color,
}: {
  rows: number;
  cols: number;
  color: string;
}) {
  const verticals = Array.from(
    { length: cols - 1 },
    (_, i) => ((i + 1) / cols) * 100,
  );
  const horizontals = Array.from(
    { length: rows - 1 },
    (_, i) => ((i + 1) / rows) * 100,
  );

  return (
    <>
      {verticals.map((pct) => (
        <div
          key={`v-${pct}`}
          className={cn("absolute top-0 bottom-0 w-px", color)}
          style={{ left: `${pct}%` }}
        />
      ))}
      {horizontals.map((pct) => (
        <div
          key={`h-${pct}`}
          className={cn("absolute left-0 right-0 h-px", color)}
          style={{ top: `${pct}%` }}
        />
      ))}
    </>
  );
}

function GridGuidePreview() {
  return (
    <div className="relative aspect-video w-full">
      <GridLines rows={3} cols={4} color="bg-foreground/15" />
    </div>
  );
}

function GridGuideOverlay() {
  const { rows, cols } = usePreviewStore((s) => s.gridConfig);

  return (
    <div className="absolute inset-0">
      <GridLines rows={rows} cols={cols} color="bg-white/35" />
    </div>
  );
}

// Simplified options renderer: opencut-classic ships a fancy NumberField
// (scrub + reset + icon affordances) that isn't ported to this lib yet.
// Until that lands, fall back to plain number inputs labelled with the
// same row/column icons so the guide is still configurable.
function GridGuideOptions() {
  const rows = usePreviewStore((s) => s.gridConfig.rows);
  const cols = usePreviewStore((s) => s.gridConfig.cols);
  const setGridConfig = usePreviewStore((s) => s.setGridConfig);

  const clampGridValue = (value: number) =>
    clampRound({ value, min: GRID_MIN, max: GRID_MAX });

  return (
    <div className="flex gap-2">
      <label className="flex flex-1 items-center gap-2">
        <HugeiconsIcon icon={LayoutThreeRowIcon} className="size-4" />
        <Input
          type="number"
          min={GRID_MIN}
          max={GRID_MAX}
          value={rows}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            if (!Number.isNaN(parsed))
              setGridConfig({ rows: clampGridValue(parsed) });
          }}
        />
      </label>
      <label className="flex flex-1 items-center gap-2">
        <HugeiconsIcon icon={LayoutThreeColumnIcon} className="size-4" />
        <Input
          type="number"
          min={GRID_MIN}
          max={GRID_MAX}
          value={cols}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            if (!Number.isNaN(parsed))
              setGridConfig({ cols: clampGridValue(parsed) });
          }}
        />
      </label>
      {/* Acknowledge DEFAULT_GRID_CONFIG so the reset import stays parked
          for when NumberField (with its onReset affordance) is ported. */}
      {DEFAULT_GRID_CONFIG ? null : null}
    </div>
  );
}

export const gridGuide = {
  id: "grid",
  label: "Grid",
  renderPreview: () => <GridGuidePreview />,
  renderTriggerIcon: () => <HugeiconsIcon icon={GridTableIcon} />,
  renderOverlay: () => <GridGuideOverlay />,
  renderOptions: () => <GridGuideOptions />,
} as const satisfies GuideDefinition;
