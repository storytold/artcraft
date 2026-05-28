"use client";

import { useState } from "react";
import { Popover, PopoverContent } from "../../../components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../utils/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Delete02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { getBezierPoint } from "../../../animation/bezier";
import type { NormalizedCubicBezier } from "../../../animation/types";
import type { GraphEditorComponentOption } from "./session";
import {
  BUILTIN_PRESETS,
  PRESET_MATCH_TOLERANCE,
  type EasingPreset,
} from "./easing-presets";
import { removePreset, savePreset, useCustomPresets } from "./custom-presets-store";
import { BezierGraph, BEZIER_GRAPH_MIN_HEIGHT } from "./bezier-graph";

const COLLAPSED_MAX = 6;
const THUMB_SEGMENTS = 24;
const THUMB_WIDTH = 40;
const THUMB_HEIGHT = 22;
const THUMB_PADDING_X = 4;
const THUMB_PADDING_Y = 3;
const COLLAPSED_GRID_MAX_HEIGHT = 120;
const EXPANDED_GRID_MAX_HEIGHT = 240;

export function GraphEditorPopover({
  children,
  side,
  open,
  onOpenChange,
  value,
  message,
  componentOptions,
  activeComponentKey,
  onActiveComponentKeyChange,
  onPreviewValue,
  onCommitValue,
  onCancelPreview,
}: {
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value: NormalizedCubicBezier | null;
  message: string;
  componentOptions: GraphEditorComponentOption[];
  activeComponentKey: string | null;
  onActiveComponentKeyChange?: (componentKey: string) => void;
  onPreviewValue?: (value: NormalizedCubicBezier) => void;
  onCommitValue?: (value: NormalizedCubicBezier) => void;
  onCancelPreview?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const custom = useCustomPresets();
  const allPresets = [...BUILTIN_PRESETS, ...custom];
  const canEdit = value !== null;
  const activePresetId =
    value == null
      ? null
      : (allPresets.find((preset) =>
          preset.value.every(
            (presetValue, index) =>
              Math.abs(presetValue - value[index]) < PRESET_MATCH_TOLERANCE,
          ),
        )?.id ?? null);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancelPreview?.();
        }
        onOpenChange?.(nextOpen);
      }}
    >
      {children}
      <PopoverContent
        side={side}
        sideOffset={8}
        className="w-60 overflow-hidden px-0"
      >
        {componentOptions.length > 1 && (
          <div className="border-b px-3 py-2">
            <div className="bg-muted/40 inline-flex rounded-md p-0.5">
              {componentOptions.map((component) => (
                <button
                  key={component.key}
                  type="button"
                  onClick={() => onActiveComponentKeyChange?.(component.key)}
                  className={cn(
                    "cursor-pointer rounded-sm px-2 py-1 text-xs font-medium",
                    activeComponentKey === component.key
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {component.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-3 py-3">
          {value ? (
            <BezierGraph
              value={value}
              onChange={onPreviewValue}
              onChangeEnd={onCommitValue}
              onCancel={onCancelPreview}
            />
          ) : (
            <GraphEditorEmptyState message={message} />
          )}
        </div>

        <Tabs variant="underline" defaultValue="presets" className="flex flex-col gap-2">
          <TabsList className="px-3">
            <TabsTrigger value="presets" className="text-xs">
              Presets
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-xs">
              Saved
            </TabsTrigger>
          </TabsList>
          <TabsContent value="presets" className="px-3 pb-0">
            <ExpandableGrid
              isExpanded={isExpanded}
              shouldExpand={BUILTIN_PRESETS.length > COLLAPSED_MAX}
              onExpand={() => setIsExpanded(true)}
            >
              {BUILTIN_PRESETS.map((preset) => (
                <PresetItem
                  key={preset.id}
                  preset={preset}
                  isActive={activePresetId === preset.id}
                  disabled={!canEdit}
                  onSelect={() => onCommitValue?.(preset.value)}
                />
              ))}
            </ExpandableGrid>
          </TabsContent>
          <TabsContent value="saved" className="px-3">
            <div className="grid grid-cols-3 gap-1">
              {custom.map((preset) => (
                <PresetItem
                  key={preset.id}
                  preset={preset}
                  isActive={activePresetId === preset.id}
                  disabled={!canEdit}
                  onSelect={() => onCommitValue?.(preset.value)}
                  onDelete={() => removePreset({ id: preset.id })}
                />
              ))}
              <button
                type="button"
                onClick={() => value && savePreset({ value })}
                disabled={!canEdit}
                className={cn(
                  "text-muted-foreground flex flex-col items-center justify-center gap-1 rounded-sm px-1 py-1",
                  canEdit
                    ? "hover:bg-foreground/5 cursor-pointer"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                <div className="border-foreground/10 flex aspect-video w-full items-center justify-center rounded-sm border border-dashed">
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    className="size-3.5 opacity-40"
                  />
                </div>
                <span className="text-[10px] leading-tight">Save</span>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function GraphEditorEmptyState({ message }: { message: string }) {
  return (
    <div
      style={{ minHeight: BEZIER_GRAPH_MIN_HEIGHT }}
      className="bg-muted/20 text-muted-foreground flex items-center justify-center rounded-sm border border-dashed px-3 text-center text-xs leading-relaxed"
    >
      {message}
    </div>
  );
}

function ExpandableGrid({
  children,
  isExpanded,
  shouldExpand,
  onExpand,
}: {
  children: React.ReactNode;
  isExpanded: boolean;
  shouldExpand: boolean;
  onExpand: () => void;
}) {
  const gridStyle = shouldExpand
    ? isExpanded
      ? { maxHeight: EXPANDED_GRID_MAX_HEIGHT, overflowY: "auto" as const }
      : { maxHeight: COLLAPSED_GRID_MAX_HEIGHT, overflow: "hidden" as const }
    : undefined;

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-1" style={gridStyle}>
        {children}
      </div>
      {!isExpanded && shouldExpand && (
        <div className="from-popover/0 to-popover absolute inset-x-0 bottom-0 flex h-8 items-center justify-center bg-linear-to-b">
          <Button
            variant="ghost"
            size="icon"
            className="size-5"
            onClick={onExpand}
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className="text-muted-foreground size-3"
            />
          </Button>
        </div>
      )}
    </div>
  );
}

function PresetItem({
  preset,
  isActive,
  onSelect,
  onDelete,
  disabled,
}: {
  preset: EasingPreset;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-sm px-1 py-1",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-foreground/5 cursor-pointer",
        isActive && "bg-primary/5! text-primary",
      )}
    >
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-sm bg-foreground/5",
          isActive && "bg-primary/5!",
        )}
      >
        <CurveThumb value={preset.value} />
      </div>
      <span
        className={cn(
          "text-[10px] leading-tight",
          isActive ? "text-primary" : "text-muted-foreground",
        )}
      >
        {preset.label}
      </span>
      {onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -right-0.5 -top-0.5 hidden size-4.5 rounded-full [&_svg]:size-3 group-hover:flex"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <HugeiconsIcon icon={Delete02Icon} />
        </Button>
      )}
    </button>
  );
}

function toThumbX({ value }: { value: number }) {
  return THUMB_PADDING_X + value * (THUMB_WIDTH - THUMB_PADDING_X * 2);
}

function toThumbY({ value }: { value: number }) {
  return THUMB_PADDING_Y + (1 - value) * (THUMB_HEIGHT - THUMB_PADDING_Y * 2);
}

function CurveThumb({ value }: { value: NormalizedCubicBezier }) {
  const points: string[] = [];
  for (let i = 0; i <= THUMB_SEGMENTS; i++) {
    const progress = i / THUMB_SEGMENTS;
    const x = toThumbX({ value: getBezierPoint({ progress, p0: 0, p1: value[0], p2: value[2], p3: 1 }) });
    const y = toThumbY({ value: getBezierPoint({ progress, p0: 0, p1: value[1], p2: value[3], p3: 1 }) });
    points.push(`${x},${y}`);
  }
  return (
    <svg
      width={THUMB_WIDTH}
      height={THUMB_HEIGHT}
      viewBox={`0 0 ${THUMB_WIDTH} ${THUMB_HEIGHT}`}
    >
      <title>Curve preset preview</title>
      <path
        d={`M${points.join("L")}`}
        fill="none"
        className="stroke-current"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
