// Holds a deep-cloned snapshot of state while a preview gesture is
// active. Used by TimelineManager's previewElements flow — at gesture
// start it `begin`s the tracker with the current state; mousemoves
// update the live state freely; gesture end either commits (the live
// state stays) or rolls back to the snapshot (via `end`).
//
// `structuredClone` deep-copies, so the snapshot is independent of any
// later in-place mutation of the live state. Type T is unconstrained
// because callers parametrize on whatever state they're tracking
// (SceneTracks, ElementAnimations, etc.).
export class PreviewTracker<T> {
  private snapshot: T | null = null;

  begin({ state }: { state: T }): void {
    if (this.snapshot === null) {
      this.snapshot = structuredClone(state);
    }
  }

  isActive(): boolean {
    return this.snapshot !== null;
  }

  getSnapshot(): T | null {
    return this.snapshot;
  }

  end(): T | null {
    const snapshot = this.snapshot;
    this.snapshot = null;
    return snapshot;
  }
}
