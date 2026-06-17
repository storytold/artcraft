// Shared contract for the two entrance-animation techniques (mesh mask-reveal,
// splat radial-settle). The coordinator drives `setProgress` each frame and
// calls `finish` once when the animation completes.

export interface EntranceHandle {
  /**
   * Advance the animation. `progress` is the eased 0..1 completion; `dt` is the
   * frame delta in seconds (some techniques need it, some ignore it).
   */
  setProgress(progress: number, dt: number): void;

  /** Snap to fully-shown and release any temporary resources (clones, modifiers). */
  finish(): void;
}
