import type { EditorSelectionPatch } from "../selection/editor-selection";
import type { ElementRef } from "../timeline/types";

// Command pattern foundation. Subclasses override `execute()` and
// `undo()` for their domain operation, and optionally `redo()` if it
// must differ from execute (rare). The CommandResult.selection patch
// lets a command request a selection change as part of its execution
// without coupling to SelectionManager directly — the command queue
// applies the patch after the command runs.

export interface CommandResult {
  selection?: EditorSelectionPatch;
}

export function createElementSelectionResult(
  selectedElements: ElementRef[],
): CommandResult {
  return {
    selection: {
      selectedElements,
      selectedKeyframes: [],
      keyframeSelectionAnchor: null,
      selectedMaskPoints: null,
    },
  };
}

export abstract class Command {
  abstract execute(): CommandResult | undefined;

  undo(): void {
    throw new Error("Undo not implemented for this command");
  }

  redo(): CommandResult | undefined {
    return this.execute();
  }
}
