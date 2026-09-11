import * as THREE from "three";
import type { EntranceHandle } from "./types";
import { clamp01, easeInQuart, easeOutBack, easeOutCubic, lerp } from "./easing";

// Transform-based "drop onto the ground" entrance for non-splat objects (GLB
// models, primitives, image planes). Replaces the earlier fragment-clip reveal,
// which mis-clipped non-convex shapes (e.g. a torus). The object pops into
// existence slightly raised, then falls and lands with a soft rubbery vertical
// squash — as if it were physically dropped into place. Only the object's
// transform is touched (no shaders), so it works for any object uniformly.

// Phase boundaries on linear time (0..1):
const POP_END = 0.22; // appear + rise finishes here
const IMPACT = 0.55; // object reaches the ground here; squash begins
// Squash/recover runs from IMPACT → 1.

const POP_START_SCALE = 0.45; // appears at this fraction of full size, then pops up
const SQUASH_AMOUNT = 0.12; // peak vertical compression (0.12 = 12%); kept subtle
const SQUASH_DECAY = 3.6; // how fast the rubbery wobble dies out
const SQUASH_FREQ = 6.5; // wobble frequency (one squash + a small rebound)

export function buildMeshDrop(object: THREE.Object3D): EntranceHandle | null {
  const finalPos = object.position.clone();
  const finalScale = object.scale.clone();

  // Size drives the hop height and the ground-anchor compensation so the motion
  // reads the same for a teacup and a building.
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const halfHeight = Math.max(size.y * 0.5, 1e-3);
  const peak = THREE.MathUtils.clamp(0.22 * maxDim, 0.08, 0.45);

  return {
    setProgress: (t) => {
      const pop = popScale(t);
      const yHop = hopOffset(t, peak);
      const { sy, sxz } = squash(t);

      // Keep the base planted while it squashes: a center-pivot scaleY<1 lifts
      // the bottom by (1-sy)*halfHeight, so push the object down to compensate.
      const groundComp = -(1 - sy) * halfHeight * pop;

      object.position.set(
        finalPos.x,
        finalPos.y + yHop + groundComp,
        finalPos.z,
      );
      object.scale.set(
        finalScale.x * pop * sxz,
        finalScale.y * pop * sy,
        finalScale.z * pop * sxz,
      );
    },
    finish: () => {
      object.position.copy(finalPos);
      object.scale.copy(finalScale);
    },
  };
}

/** Appear with an overshooting pop, then hold at full size. */
function popScale(t: number): number {
  const appear = easeOutBack(clamp01(t / POP_END), 2.2);
  return lerp(POP_START_SCALE, 1, appear);
}

/** Rise up from the ground as it pops in, then fall back down under gravity. */
function hopOffset(t: number, peak: number): number {
  if (t <= POP_END) {
    // Lift off the ground while it materializes, so the rise is visible.
    return peak * easeOutCubic(t / POP_END);
  }
  if (t < IMPACT) {
    // Accelerating fall down to the ground.
    return peak * (1 - easeInQuart((t - POP_END) / (IMPACT - POP_END)));
  }
  return 0;
}

/** Rubbery vertical squash-and-stretch that fires on landing and settles out. */
function squash(t: number): { sy: number; sxz: number } {
  if (t < IMPACT) return { sy: 1, sxz: 1 };
  const u = clamp01((t - IMPACT) / (1 - IMPACT));
  // sin starts at 0 (no jump at the instant of contact), swells to a squash,
  // then a damped rebound — a single bouncy wobble that decays to rest.
  const wobble = Math.exp(-SQUASH_DECAY * u) * Math.sin(SQUASH_FREQ * u);
  return {
    sy: 1 - SQUASH_AMOUNT * wobble,
    sxz: 1 + SQUASH_AMOUNT * 0.6 * wobble,
  };
}
