import type {
  AnimationPath,
  ElementAnimations,
} from "../../animation/types";
import type { TimelineTrack } from "../types";
import { getElementKeyframes } from "../../animation";
import { KEYFRAME_LANE_HEIGHT_PX } from "./layout";

export interface ExpandedRow {
  propertyPath: AnimationPath;
  label: string;
}

interface PropertyGroupDefinition {
  matchesPath: (path: AnimationPath) => boolean;
}

const PROPERTY_GROUPS: PropertyGroupDefinition[] = [
  { matchesPath: (path) => path.startsWith("transform.") || path === "opacity" },
  { matchesPath: (path) => path === "volume" || path === "color" },
  { matchesPath: (path) => path.startsWith("background.") },
  { matchesPath: (path) => path.startsWith("params.") },
  { matchesPath: (path) => path.startsWith("effects.") },
];

const PROPERTY_LABELS: Partial<Record<string, string>> = {
  "transform.positionX": "Position X",
  "transform.positionY": "Position Y",
  "transform.scaleX": "Scale X",
  "transform.scaleY": "Scale Y",
  "transform.rotate": "Rotation",
  opacity: "Opacity",
  volume: "Volume",
  color: "Color",
  "background.color": "BG Color",
  "background.paddingX": "BG Pad X",
  "background.paddingY": "BG Pad Y",
  "background.offsetX": "BG Offset X",
  "background.offsetY": "BG Offset Y",
  "background.cornerRadius": "Corner Radius",
};

export function getPropertyLabel(path: AnimationPath): string {
  if (PROPERTY_LABELS[path]) return PROPERTY_LABELS[path];
  if (path.startsWith("params.")) return path.slice("params.".length);
  if (path.startsWith("effects.")) {
    const parts = path.split(".");
    return parts[parts.length - 1];
  }
  return path;
}

export function getExpandedRows({
  animations,
}: {
  animations: ElementAnimations | undefined;
}): ExpandedRow[] {
  const keyframes = getElementKeyframes({ animations });
  const propertyPaths = [...new Set(keyframes.map((kf) => kf.propertyPath))];
  if (propertyPaths.length === 0) return [];

  const rows: ExpandedRow[] = [];

  for (const group of PROPERTY_GROUPS) {
    const groupPaths = propertyPaths.filter((path) =>
      group.matchesPath(path),
    );
    for (const path of groupPaths) {
      rows.push({ propertyPath: path, label: getPropertyLabel(path) });
    }
  }

  return rows;
}

export function getExpansionHeight({ rows }: { rows: ExpandedRow[] }): number {
  return rows.length * KEYFRAME_LANE_HEIGHT_PX;
}

export function computeTrackExpansionHeight({
  track,
  expandedElementIds,
}: {
  track: TimelineTrack;
  expandedElementIds: Set<string>;
}): number {
  let maxHeight = 0;
  for (const element of track.elements) {
    if (!expandedElementIds.has(element.id)) continue;
    const rows = getExpandedRows({ animations: element.animations });
    maxHeight = Math.max(maxHeight, getExpansionHeight({ rows }));
  }
  return maxHeight;
}

export function getTrackExpandedRows({
  track,
  expandedElementIds,
}: {
  track: TimelineTrack;
  expandedElementIds: Set<string>;
}): ExpandedRow[] {
  let maxHeight = 0;
  let maxRows: ExpandedRow[] = [];

  for (const element of track.elements) {
    if (!expandedElementIds.has(element.id)) continue;
    const rows = getExpandedRows({ animations: element.animations });
    const height = getExpansionHeight({ rows });
    if (height > maxHeight) {
      maxHeight = height;
      maxRows = rows;
    }
  }

  return maxRows;
}
