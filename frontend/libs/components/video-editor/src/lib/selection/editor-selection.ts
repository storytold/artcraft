import type { SelectedKeyframeRef } from "../animation/types";
import type { ElementRef } from "../timeline/types";

// Three orthogonal selection slots that the SelectionManager owns at
// once. The UI never asks "which one is active" directly — it asks
// `getActiveSelectionKind()` which returns the priority kind given the
// concurrent state. mask-points > keyframes > elements.

export interface SelectedMaskPointSelection {
  trackId: string;
  elementId: string;
  maskId: string;
  pointIds: string[];
}

export interface EditorSelectionSnapshot {
  selectedElements: ElementRef[];
  selectedKeyframes: SelectedKeyframeRef[];
  keyframeSelectionAnchor: SelectedKeyframeRef | null;
  selectedMaskPoints: SelectedMaskPointSelection | null;
}

// Patch shape used by Commands' CommandResult — every field optional,
// so a command only touches the slots it cares about.
export interface EditorSelectionPatch {
  selectedElements?: ElementRef[];
  selectedKeyframes?: SelectedKeyframeRef[];
  keyframeSelectionAnchor?: SelectedKeyframeRef | null;
  selectedMaskPoints?: SelectedMaskPointSelection | null;
}

export type EditorSelectionKind = "mask-points" | "keyframes" | "elements";
