import * as THREE from "three";
import { SplatMesh } from "@sparkjsdev/spark";
import type { EntranceHandle } from "./entrance/types";
import { buildMeshDrop } from "./entrance/meshDrop";
import { buildSplatSettle } from "./entrance/splatSettle";

// Drives entrance animations for newly dropped objects. Two techniques, picked
// by object type:
//   • Gaussian splats → a per-gaussian radial settle: gaussians rain in from a
//     height, center-out, built in Spark's dyno shader graph. See splatSettle.ts.
//   • Everything else → a transform-based drop with a rubbery landing squash.
//     See meshDrop.ts.
//
// Both expose the same EntranceHandle. This coordinator advances raw linear time
// 0..1 each frame (each technique applies its own easing) and snaps to "shown" on
// completion. Saves in this editor are explicit (user-triggered), so the
// animation window is never persisted.

// Base durations (seconds). The mesh drop reads best snappy (its physical bounce
// would feel sluggish drawn out); the splat rain wants room to breathe. The dev
// panel can still scale these live.
export const ENTRANCE_BASE_DURATIONS = { mesh: 0.75, splat: 4.0 };

// Dev-only live tuning knob, driven by EntranceDebugPanel (mounted only in DEV).
// Defaults to 1 so the baked timing above is what ships; the panel scales it for
// experimentation. Read at play() time, so it applies to the next drop.
export const entranceDebugSettings = { durationScale: 1 };

const MAX_DELTA = 1 / 30; // clamp per-frame step so a paused/resumed loop doesn't jump

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface Entry {
  object: THREE.Object3D;
  handle: EntranceHandle;
  elapsed: number;
  duration: number;
}

export class EntranceAnimator {
  private entries: Entry[] = [];

  /**
   * Begin an entrance for `object`, treating its current transform as final.
   * Call immediately after the object is positioned and added to the scene —
   * before the next render — so it's never shown fully-formed first. No-ops
   * (leaves the object shown) when the user prefers reduced motion.
   */
  play(object: THREE.Object3D): void {
    if (prefersReducedMotion()) return;

    const isSplat = object instanceof SplatMesh;
    const handle = isSplat
      ? buildSplatSettle(object)
      : buildMeshDrop(object);
    if (!handle) return;

    // Run the first frame hidden so nothing flashes at full size before the
    // render loop's first tick.
    handle.setProgress(0, 0);

    const base = isSplat
      ? ENTRANCE_BASE_DURATIONS.splat
      : ENTRANCE_BASE_DURATIONS.mesh;
    this.entries = this.entries.filter((entry) => entry.object !== object);
    this.entries.push({
      object,
      handle,
      elapsed: 0,
      duration: base * entranceDebugSettings.durationScale,
    });
  }

  /** Advance all active entrances. Call once per frame from the render loop. */
  tick(delta: number): void {
    if (this.entries.length === 0) return;
    const dt = Math.min(delta, MAX_DELTA);
    const remaining: Entry[] = [];

    for (const entry of this.entries) {
      entry.elapsed += dt;
      const t = Math.min(entry.elapsed / entry.duration, 1);
      // Pass raw linear time; each technique applies its own easing.
      entry.handle.setProgress(t, dt);
      if (t < 1) {
        remaining.push(entry);
      } else {
        entry.handle.finish();
      }
    }

    this.entries = remaining;
  }

  /** Finish an object's entrance immediately and stop tracking it. */
  cancel(object: THREE.Object3D): void {
    const entry = this.entries.find((candidate) => candidate.object === object);
    if (!entry) return;
    entry.handle.finish();
    this.entries = this.entries.filter((candidate) => candidate !== entry);
  }

  /** Finish all entrances (e.g. on scene clear/teardown). */
  clear(): void {
    for (const entry of this.entries) entry.handle.finish();
    this.entries = [];
  }
}
