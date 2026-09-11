import type { EditorCore } from "../index";
import type { SelectedKeyframeRef } from "../../animation/types";
import type {
  EditorSelectionKind,
  EditorSelectionPatch,
  EditorSelectionSnapshot,
  SelectedMaskPointSelection,
} from "../../selection/editor-selection";
import type { ElementRef } from "../../timeline/types";

// Owns the three orthogonal selection slots (elements, keyframes,
// mask-points). Only one slot is "active" at a time — see
// getActiveSelectionKind for the priority order. Setters that target
// one slot blank the others so the UI never has to choose between
// concurrent selections.
//
// applySelectionPatch is the integration point with the Command queue:
// CommandResult.selection rides through it, so any command can request
// a selection change without coupling to this manager directly.

export class SelectionManager {
  private selectedElements: ElementRef[] = [];
  private selectedKeyframes: SelectedKeyframeRef[] = [];
  private keyframeSelectionAnchor: SelectedKeyframeRef | null = null;
  private selectedMaskPoints: SelectedMaskPointSelection | null = null;
  private listeners = new Set<() => void>();

  constructor(editor: EditorCore) {
    void editor;
  }

  getSelectedElements(): ElementRef[] {
    return this.selectedElements;
  }

  getSelectedKeyframes(): SelectedKeyframeRef[] {
    return this.selectedKeyframes;
  }

  getKeyframeSelectionAnchor(): SelectedKeyframeRef | null {
    return this.keyframeSelectionAnchor;
  }

  getSelectedMaskPointSelection(): SelectedMaskPointSelection | null {
    return this.selectedMaskPoints;
  }

  getActiveSelectionKind(): EditorSelectionKind | null {
    if ((this.selectedMaskPoints?.pointIds.length ?? 0) > 0) {
      return "mask-points";
    }
    if (this.selectedKeyframes.length > 0) {
      return "keyframes";
    }
    if (this.selectedElements.length > 0) {
      return "elements";
    }
    return null;
  }

  getSnapshot(): EditorSelectionSnapshot {
    return {
      selectedElements: [...this.selectedElements],
      selectedKeyframes: [...this.selectedKeyframes],
      keyframeSelectionAnchor: this.keyframeSelectionAnchor,
      selectedMaskPoints: this.selectedMaskPoints
        ? {
            ...this.selectedMaskPoints,
            pointIds: [...this.selectedMaskPoints.pointIds],
          }
        : null,
    };
  }

  setSelectedElements({ elements }: { elements: ElementRef[] }): void {
    this.selectedElements = elements;
    this.selectedKeyframes = [];
    this.keyframeSelectionAnchor = null;
    this.selectedMaskPoints = null;
    this.notify();
  }

  setSelectedKeyframes({
    keyframes,
    anchorKeyframe,
  }: {
    keyframes: SelectedKeyframeRef[];
    anchorKeyframe?: SelectedKeyframeRef | null;
  }): void {
    this.selectedKeyframes = keyframes;
    if (anchorKeyframe !== undefined) {
      this.keyframeSelectionAnchor = anchorKeyframe;
    } else if (keyframes.length === 0) {
      this.keyframeSelectionAnchor = null;
    }
    this.selectedMaskPoints = null;
    this.notify();
  }

  setSelectedMaskPoints({
    selection,
  }: {
    selection: SelectedMaskPointSelection | null;
  }): void {
    this.selectedMaskPoints =
      selection && selection.pointIds.length > 0
        ? {
            ...selection,
            pointIds: [...selection.pointIds],
          }
        : null;
    this.selectedKeyframes = [];
    this.keyframeSelectionAnchor = null;
    this.notify();
  }

  clearSelection(): void {
    this.selectedElements = [];
    this.selectedKeyframes = [];
    this.keyframeSelectionAnchor = null;
    this.selectedMaskPoints = null;
    this.notify();
  }

  clearKeyframeSelection(): void {
    this.selectedKeyframes = [];
    this.keyframeSelectionAnchor = null;
    this.notify();
  }

  clearMaskPointSelection(): void {
    if (!this.selectedMaskPoints) {
      return;
    }
    this.selectedMaskPoints = null;
    this.notify();
  }

  // Esc-key behaviour: clears the most specific selection slot first
  // (mask points before keyframes before elements). Returns true iff
  // something was actually cleared so the caller can decide whether to
  // fall through to other Esc handlers.
  clearMostSpecificSelection(): boolean {
    const activeSelectionKind = this.getActiveSelectionKind();
    if (activeSelectionKind === "mask-points") {
      this.clearMaskPointSelection();
      return true;
    }
    if (activeSelectionKind === "keyframes") {
      this.clearKeyframeSelection();
      return true;
    }
    if (activeSelectionKind === "elements") {
      this.setSelectedElements({ elements: [] });
      return true;
    }
    return false;
  }

  applySelectionPatch({
    patch,
  }: {
    patch: EditorSelectionPatch;
  }): EditorSelectionSnapshot {
    if (patch.selectedElements !== undefined) {
      this.selectedElements = [...patch.selectedElements];
    }
    if (patch.selectedKeyframes !== undefined) {
      this.selectedKeyframes = [...patch.selectedKeyframes];
    }
    if (patch.keyframeSelectionAnchor !== undefined) {
      this.keyframeSelectionAnchor = patch.keyframeSelectionAnchor;
    }
    if (patch.selectedMaskPoints !== undefined) {
      this.selectedMaskPoints = patch.selectedMaskPoints
        ? {
            ...patch.selectedMaskPoints,
            pointIds: [...patch.selectedMaskPoints.pointIds],
          }
        : null;
    }
    this.notify();
    return this.getSnapshot();
  }

  restoreSnapshot({ snapshot }: { snapshot: EditorSelectionSnapshot }): void {
    this.selectedElements = [...snapshot.selectedElements];
    this.selectedKeyframes = [...snapshot.selectedKeyframes];
    this.keyframeSelectionAnchor = snapshot.keyframeSelectionAnchor;
    this.selectedMaskPoints = snapshot.selectedMaskPoints
      ? {
          ...snapshot.selectedMaskPoints,
          pointIds: [...snapshot.selectedMaskPoints.pointIds],
        }
      : null;
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      fn();
    });
  }
}
