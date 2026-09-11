import type { EditorCore } from "../index";
import type { Command, CommandResult } from "../../commands";
import type { EditorSelectionSnapshot } from "../../selection/editor-selection";
import { applyRippleAdjustments, computeRippleAdjustments } from "../../ripple";
import type { SceneTracks } from "../../timeline/types";

interface CommandHistoryEntry {
  command: Command;
  previousSelection: EditorSelectionSnapshot;
  selectionOverride?: EditorSelectionSnapshot;
}

export class CommandManager {
  public isRippleEnabled = false;
  private history: CommandHistoryEntry[] = [];
  private redoStack: CommandHistoryEntry[] = [];
  private reactors: Array<() => void> = [];

  constructor(private editor: EditorCore) {}

  execute({ command }: { command: Command }): Command {
    const beforeTracks = this.isRippleEnabled
      ? (this.editor.scenes.getActiveSceneOrNull()?.tracks ?? null)
      : null;
    const previousSelection = this.getSelectionSnapshot();
    const result = command.execute();
    this.applyRippleIfEnabled({ beforeTracks });
    const selectionOverride = this.applySelectionOverride(result);
    this.runReactors();
    this.history.push({
      command,
      previousSelection,
      selectionOverride,
    });
    this.redoStack = [];
    return command;
  }

  push({ command }: { command: Command }): void {
    this.history.push({
      command,
      previousSelection: this.getSelectionSnapshot(),
    });
    this.redoStack = [];
  }

  registerReactor(reactor: () => void): void {
    this.reactors.push(reactor);
  }

  undo(): void {
    if (this.history.length === 0) return;
    const entry = this.history.pop();
    entry?.command.undo();
    if (entry) {
      if (entry.selectionOverride !== undefined) {
        this.editor.selection.restoreSnapshot({
          snapshot: entry.previousSelection,
        });
      }
      this.redoStack.push(entry);
    }
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    const entry = this.redoStack.pop();
    if (!entry) {
      return;
    }

    const beforeTracks = this.isRippleEnabled
      ? (this.editor.scenes.getActiveSceneOrNull()?.tracks ?? null)
      : null;
    const previousSelection = this.getSelectionSnapshot();
    const result = entry.command.redo();
    this.applyRippleIfEnabled({ beforeTracks });
    const selectionOverride = this.applySelectionOverride(result);
    this.runReactors();

    this.history.push({
      command: entry.command,
      previousSelection,
      selectionOverride,
    });
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.history = [];
    this.redoStack = [];
  }

  private getSelectionSnapshot(): EditorSelectionSnapshot {
    return this.editor.selection.getSnapshot();
  }

  private applySelectionOverride(
    result: CommandResult | undefined,
  ): EditorSelectionSnapshot | undefined {
    if (!result?.selection) {
      return undefined;
    }
    return this.editor.selection.applySelectionPatch({
      patch: result.selection,
    });
  }

  private runReactors(): void {
    for (const reactor of this.reactors) {
      reactor();
    }
  }

  private applyRippleIfEnabled({
    beforeTracks,
  }: {
    beforeTracks: SceneTracks | null;
  }): void {
    if (!this.isRippleEnabled || !beforeTracks) {
      return;
    }

    const afterTracks = this.editor.scenes.getActiveSceneOrNull()?.tracks;
    if (!afterTracks) {
      return;
    }
    const adjustments = computeRippleAdjustments({
      beforeTracks,
      afterTracks,
    });
    if (adjustments.length === 0) {
      return;
    }

    const tracksWithRipple = applyRippleAdjustments({
      tracks: afterTracks,
      adjustments,
    });
    this.editor.timeline.updateTracks(tracksWithRipple);
  }
}
