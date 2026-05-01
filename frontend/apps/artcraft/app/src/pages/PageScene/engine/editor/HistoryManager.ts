import * as THREE from "three";

// HistoryManager owns the undo/redo stack for the 3D editor.
//
// Design:
// - Pure-data HistoryEntry: { label, apply(ctx), revert(ctx) }. Entries
//   don't hold subsystem references — they receive a narrow
//   HistoryContext when replayed, so they survive subsystem re-creation
//   and stay easy to test in isolation.
// - The external API is the recordX methods on this class. Mutation
//   sites call ONE method; entry construction + push lives here.
//   Adding a new action = add an entry factory + a recordX method.
// - undo/redo serialize through a Promise chain so concurrent calls
//   (Ctrl+Z mash during async asset reloads) never interleave.

export interface TransformSnap {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

// Enough state to fully reconstruct any object: primitive shape,
// image plane, GLB, MMD. Captured at create- and delete-time so undo
// of either operation works the same way.
export interface ObjectSnap {
  uuid: string;
  name: string;
  media_id: string;
  transform: TransformSnap;
  userData: Record<string, unknown>;
}

// What HistoryEntry implementations need from the engine. Built inline
// by Editor as a deps object (Phase 2 idiom — same shape as
// CameraControllerDeps, GizmoControllerDeps, SelectionBridgeDeps).
export interface HistoryContext {
  recreateObject(snap: ObjectSnap): Promise<THREE.Object3D | undefined>;
  removeObject(uuid: string): Promise<void> | void;
  setTransform(uuid: string, t: TransformSnap): void;
  setColor(uuid: string, color: string): void;
  setLocked(uuid: string, locked: boolean): void;
  setVisible(uuid: string, visible: boolean): void;
  // Called by the manager after every apply/revert so the outliner +
  // selection UI re-render. Entry impls don't have to remember.
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
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private serializing: Promise<void> = Promise.resolve();
  private pendingTransform:
    | { uuid: string; before: TransformSnap }
    | undefined;

  private readonly capacity: number;
  private readonly onChange?: HistoryManagerOptions["onChange"];

  constructor(
    private readonly ctx: HistoryContext,
    options: HistoryManagerOptions = {},
  ) {
    this.capacity = options.capacity ?? 64;
    this.onChange = options.onChange;
  }

  // ── Reading state ─────────────────────────────────────────────────

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past.length = 0;
    this.future.length = 0;
    this.pendingTransform = undefined;
    this.notifyChange();
  }

  // ── Recording (the external API) ──────────────────────────────────
  // Each mutation site calls one method here. No HistoryEntry
  // construction at the action layer.

  recordCreate(obj: THREE.Object3D): void {
    this.push(createEntry(snapshotObject(obj)));
  }

  recordDelete(obj: THREE.Object3D): void {
    this.push(deleteEntry(snapshotObject(obj)));
  }

  // Transform recording is paired: begin captures the before-state,
  // end commits one entry with the after-state. No-op moves are
  // dropped. A second begin without a matching end replaces the
  // pending snapshot — harmless if the caller short-circuits.
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
    this.push(transformEntry(p.uuid, p.before, after));
  }

  recordSetColor(uuid: string, before: string, after: string): void {
    if (before === after) return;
    this.push(colorEntry(uuid, before, after));
  }

  recordSetLocked(uuid: string, before: boolean, after: boolean): void {
    if (before === after) return;
    this.push(lockedEntry(uuid, before, after));
  }

  recordSetVisible(uuid: string, before: boolean, after: boolean): void {
    if (before === after) return;
    this.push(visibleEntry(uuid, before, after));
  }

  // ── Replay ────────────────────────────────────────────────────────

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

  // ── Internal ──────────────────────────────────────────────────────

  private async undoInternal(): Promise<void> {
    const entry = this.past.pop();
    if (!entry) return;
    await entry.revert(this.ctx);
    this.future.push(entry);
    this.ctx.refreshOutliner();
    this.notifyChange();
  }

  private async redoInternal(): Promise<void> {
    const entry = this.future.pop();
    if (!entry) return;
    await entry.apply(this.ctx);
    this.past.push(entry);
    this.ctx.refreshOutliner();
    this.notifyChange();
  }

  private push(entry: HistoryEntry): void {
    // A new mutation invalidates the redo branch.
    this.future.length = 0;
    this.past.push(entry);
    if (this.past.length > this.capacity) this.past.shift();
    this.notifyChange();
  }

  private notifyChange(): void {
    this.onChange?.({ canUndo: this.canUndo(), canRedo: this.canRedo() });
  }
}

// ── Snapshots ───────────────────────────────────────────────────────

export const snapshotTransform = (obj: THREE.Object3D): TransformSnap => ({
  position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
  rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
  scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
});

export const snapshotObject = (obj: THREE.Object3D): ObjectSnap => ({
  uuid: obj.uuid,
  name: obj.name,
  media_id: (obj.userData.media_id as string) ?? "Parim",
  transform: snapshotTransform(obj),
  userData: { ...obj.userData },
});

// ── Entry factories ─────────────────────────────────────────────────
// Adding a new action = add a factory here + a recordX above. Factories
// are pure data over snapshots — no closures over engine state, no
// subsystem refs.

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

const transformsEqual = (a: TransformSnap, b: TransformSnap): boolean =>
  a.position.x === b.position.x &&
  a.position.y === b.position.y &&
  a.position.z === b.position.z &&
  a.rotation.x === b.rotation.x &&
  a.rotation.y === b.rotation.y &&
  a.rotation.z === b.rotation.z &&
  a.scale.x === b.scale.x &&
  a.scale.y === b.scale.y &&
  a.scale.z === b.scale.z;
