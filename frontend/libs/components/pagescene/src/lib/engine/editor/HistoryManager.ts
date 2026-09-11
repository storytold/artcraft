// HistoryManager owns the undo/redo stack for the 3D editor.
//
// Architecture (Command pattern):
// - UndoableAction is the only interface this class knows about. Each
//   action kind is implemented as a self-contained class under
//   engine/editor/actions/ that captures its own state and dependencies.
// - The external API is record(action) + undo() + redo(). Adding a new
//   action kind never touches this file — it's a new class file under
//   actions/ that implements UndoableAction.
// - undo/redo serialize through a Promise chain so concurrent calls
//   (Ctrl+Z mash during async asset reloads) never interleave.
// - During replay, isReplaying suppresses record() calls so any
//   side-effecting mutator invoked from inside apply/revert (e.g. an
//   undo-of-create reaching editor.deleteObject which records a delete)
//   can't poison the stack.

export interface UndoableAction {
  readonly label: string;
  apply(): Promise<void> | void; // do or redo
  revert(): Promise<void> | void; // undo
}

export interface HistoryManagerOptions {
  capacity?: number;
  onChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

export class HistoryManager {
  private past: UndoableAction[] = [];
  private future: UndoableAction[] = [];
  private isReplaying = false;
  private serializing: Promise<void> = Promise.resolve();

  private readonly capacity: number;
  private readonly onChange?: HistoryManagerOptions["onChange"];

  constructor(options: HistoryManagerOptions = {}) {
    this.capacity = options.capacity ?? 64;
    this.onChange = options.onChange;
  }

  record(action: UndoableAction): void {
    if (this.isReplaying) return;
    this.future.length = 0;
    this.past.push(action);
    if (this.past.length > this.capacity) this.past.shift();
    this.notifyChange();
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past.length = 0;
    this.future.length = 0;
    this.notifyChange();
  }

  async undo(): Promise<void> {
    return (this.serializing = this.serializing.then(() =>
      this.undoInternal(),
    ));
  }

  async redo(): Promise<void> {
    return (this.serializing = this.serializing.then(() =>
      this.redoInternal(),
    ));
  }

  private async undoInternal(): Promise<void> {
    const action = this.past.pop();
    if (!action) return;
    this.isReplaying = true;
    try {
      await action.revert();
    } finally {
      this.isReplaying = false;
    }
    this.future.push(action);
    this.notifyChange();
  }

  private async redoInternal(): Promise<void> {
    const action = this.future.pop();
    if (!action) return;
    this.isReplaying = true;
    try {
      await action.apply();
    } finally {
      this.isReplaying = false;
    }
    this.past.push(action);
    this.notifyChange();
  }

  private notifyChange(): void {
    this.onChange?.({ canUndo: this.canUndo(), canRedo: this.canRedo() });
  }
}
