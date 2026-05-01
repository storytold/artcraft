import * as THREE from "three";
import {
  ObjectSnap,
  TransformSnap,
  snapshotObject,
  snapshotTransform,
  transformsEqual,
} from "./actions/snapshots";

export type { ObjectSnap, TransformSnap };

// HistoryManager owns the undo/redo stack for the 3D editor.
//
// Architecture:
// - UndoableAction is the only interface this class knows about. Each
//   action kind is implemented as a self-contained class under
//   engine/editor/actions/ that captures its own state and dependencies.
// - The external API is `record(action)` + `undo()` + `redo()`. Adding
//   a new action kind never touches this file — it's a new class file
//   under actions/ that implements UndoableAction.
// - undo/redo serialize through a Promise chain so concurrent calls
//   (Ctrl+Z mash during async asset reloads) never interleave.
// - During replay, isReplaying suppresses all record() calls so that
//   side-effecting mutators invoked from inside apply/revert (e.g. an
//   undo-of-create reaching editor.deleteObject) don't poison the stack.
//
// Legacy `recordCreate / recordDelete / ...` and the HistoryContext-based
// HistoryEntry are kept as thin wrappers during the migration to action
// classes. They funnel through the same record() path and respect
// isReplaying.

export interface UndoableAction {
  readonly label: string;
  apply(): Promise<void> | void;   // do or redo
  revert(): Promise<void> | void;  // undo
}

// Legacy entry interface — kept for transition. See action classes
// under engine/editor/actions/ for the new shape; these get removed
// once all call sites have migrated.
export interface HistoryContext {
  recreateObject(snap: ObjectSnap): Promise<THREE.Object3D | undefined>;
  removeObject(uuid: string): Promise<void> | void;
  setTransform(uuid: string, t: TransformSnap): void;
  setColor(uuid: string, color: string): void;
  setLocked(uuid: string, locked: boolean): void;
  setVisible(uuid: string, visible: boolean): void;
  refreshOutliner(): void;
}

export interface HistoryEntry {
  readonly label: string;
  apply(ctx: HistoryContext): Promise<void> | void;
  revert(ctx: HistoryContext): Promise<void> | void;
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

  // Legacy: pending begin/end state for the per-kind transform recorder.
  // Removed once the gizmo handler migrates to TransformAction.
  private pendingTransform:
    | { uuid: string; before: TransformSnap }
    | undefined;

  private readonly capacity: number;
  private readonly onChange?: HistoryManagerOptions["onChange"];

  constructor(
    // Legacy ctx for the wrapper-based recordX methods. Removed once
    // call sites stop using them.
    private readonly ctx: HistoryContext,
    options: HistoryManagerOptions = {},
  ) {
    this.capacity = options.capacity ?? 64;
    this.onChange = options.onChange;
  }

  // ── External API ──────────────────────────────────────────────────

  record(action: UndoableAction): void {
    if (this.isReplaying) return;
    this.future.length = 0;
    this.past.push(action);
    if (this.past.length > this.capacity) this.past.shift();
    this.notifyChange();
  }

  canUndo(): boolean { return this.past.length > 0; }
  canRedo(): boolean { return this.future.length > 0; }

  clear(): void {
    this.past.length = 0;
    this.future.length = 0;
    this.pendingTransform = undefined;
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

  // ── Legacy per-kind recorders (transitional) ──────────────────────
  // These wrap a HistoryEntry into an UndoableAction by binding `ctx`.
  // Action sites should migrate to building action classes directly
  // and calling `record(new XAction(...))`. Removed once all call
  // sites have moved off these.

  recordCreate(obj: THREE.Object3D): void {
    this.record(wrap(createEntry(snapshotObject(obj)), this.ctx));
  }

  recordDelete(obj: THREE.Object3D): void {
    this.record(wrap(deleteEntry(snapshotObject(obj)), this.ctx));
  }

  beginTransform(obj: THREE.Object3D): void {
    this.pendingTransform = {
      uuid: obj.uuid,
      before: snapshotTransform(obj),
    };
  }

  endTransform(obj: THREE.Object3D): void {
    const p = this.pendingTransform;
    this.pendingTransform = undefined;
    if (!p || p.uuid !== obj.uuid) return;
    const after = snapshotTransform(obj);
    if (transformsEqual(p.before, after)) return;
    this.record(wrap(transformEntry(p.uuid, p.before, after), this.ctx));
  }

  recordSetColor(uuid: string, before: string, after: string): void {
    if (before === after) return;
    this.record(wrap(colorEntry(uuid, before, after), this.ctx));
  }

  recordSetLocked(uuid: string, before: boolean, after: boolean): void {
    if (before === after) return;
    this.record(wrap(lockedEntry(uuid, before, after), this.ctx));
  }

  recordSetVisible(uuid: string, before: boolean, after: boolean): void {
    if (before === after) return;
    this.record(wrap(visibleEntry(uuid, before, after), this.ctx));
  }

  // ── Internal ──────────────────────────────────────────────────────

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
    this.ctx.refreshOutliner();
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
    this.ctx.refreshOutliner();
    this.notifyChange();
  }

  private notifyChange(): void {
    this.onChange?.({ canUndo: this.canUndo(), canRedo: this.canRedo() });
  }
}

// Wrap a legacy HistoryEntry into an UndoableAction by binding ctx.
const wrap = (entry: HistoryEntry, ctx: HistoryContext): UndoableAction => ({
  label: entry.label,
  apply: () => entry.apply(ctx),
  revert: () => entry.revert(ctx),
});

// ── Legacy entry factories (transitional) ─────────────────────────
// These mirror the new action classes under engine/editor/actions/.
// Used by the legacy recordX methods above. Deleted once the recordX
// methods are removed.

const createEntry = (snap: ObjectSnap): HistoryEntry => ({
  label: `Create ${snap.name}`,
  apply: async (ctx) => {
    await ctx.recreateObject(snap);
  },
  revert: async (ctx) => {
    await ctx.removeObject(snap.uuid);
  },
});

const deleteEntry = (snap: ObjectSnap): HistoryEntry => ({
  label: `Delete ${snap.name}`,
  apply: async (ctx) => {
    await ctx.removeObject(snap.uuid);
  },
  revert: async (ctx) => {
    await ctx.recreateObject(snap);
  },
});

const transformEntry = (
  uuid: string,
  before: TransformSnap,
  after: TransformSnap,
): HistoryEntry => ({
  label: "Transform",
  apply: (ctx) => ctx.setTransform(uuid, after),
  revert: (ctx) => ctx.setTransform(uuid, before),
});

const colorEntry = (
  uuid: string,
  before: string,
  after: string,
): HistoryEntry => ({
  label: "Color",
  apply: (ctx) => ctx.setColor(uuid, after),
  revert: (ctx) => ctx.setColor(uuid, before),
});

const lockedEntry = (
  uuid: string,
  before: boolean,
  after: boolean,
): HistoryEntry => ({
  label: "Lock",
  apply: (ctx) => ctx.setLocked(uuid, after),
  revert: (ctx) => ctx.setLocked(uuid, before),
});

const visibleEntry = (
  uuid: string,
  before: boolean,
  after: boolean,
): HistoryEntry => ({
  label: "Visibility",
  apply: (ctx) => ctx.setVisible(uuid, after),
  revert: (ctx) => ctx.setVisible(uuid, before),
});
