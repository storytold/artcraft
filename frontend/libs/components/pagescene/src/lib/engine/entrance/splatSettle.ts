import * as THREE from "three";
import { SplatMesh, dyno } from "@sparkjsdev/spark";
import type { EntranceHandle } from "./types";
import { easeInOutCubic } from "./easing";

// Per-gaussian "radial settle" entrance for gaussian splats. Each gaussian rains
// down from a height and arrives as a center-out wave: gaussians near the splat's
// centroid fall in and fade up first, the farthest ones last. Done in Spark's
// `dyno` shader graph via an objectModifier — the only way to touch gaussians
// individually.
//
// The wave is driven by one float uniform (`uProgress`) we advance each frame
// from the editor render loop, so it doesn't depend on Spark's internal time
// ticker (which isn't wired up here — SparkRenderer is unused).

// Wide wavefront so each gaussian fades and falls over a leisurely window rather
// than snapping in — the fade should read as a clear alpha ramp during the rain.
const SOFT_EDGE = 0.38; // width of the reveal wavefront, as a fraction of radius
const MIN_SCALE = 0.25; // gaussians start at this fraction of their size, then pop to full
const DROP_FACTOR = 0.5; // fall height as a multiple of the splat radius

export function buildSplatSettle(splat: SplatMesh): EntranceHandle | null {
  // Normalize per-gaussian distance by the splat radius so the wave covers the
  // whole cloud regardless of scale.
  let radius = 1;
  try {
    const box = splat.getBoundingBox(true);
    const size = box.getSize(new THREE.Vector3());
    radius = 0.5 * Math.max(size.x, size.y, size.z);
  } catch {
    radius = 1;
  }
  if (!(radius > 0) || !Number.isFinite(radius)) radius = 1;

  // World "up" expressed in the splat's local frame, so gaussians fall from
  // straight above regardless of the splat's orientation (splats are loaded with
  // a 180° flip, so local +Y is not world up).
  splat.updateWorldMatrix(true, false);
  const worldQuat = splat.getWorldQuaternion(new THREE.Quaternion());
  const upLocal = new THREE.Vector3(0, 1, 0).applyQuaternion(worldQuat.invert());

  const uProgress = dyno.dynoFloat(0);
  const previousModifier = splat.objectModifier;

  const modifier = dyno.dynoBlock(
    { gsplat: dyno.Gsplat },
    { gsplat: dyno.Gsplat },
    ({ gsplat }) => {
      if (!gsplat) throw new Error("splat settle: gsplat undefined");
      const split = dyno.splitGsplat(gsplat);
      const center = split.outputs.center; // vec3, object space
      const opacity = split.outputs.opacity; // float
      const scales = split.outputs.scales; // vec3

      // Normalized distance of this gaussian from the splat centroid (0..~1).
      const nd = dyno.div(dyno.length(center), dyno.dynoFloat(radius));

      // Reveal wavefront: gaussians with normalized distance below the growing
      // threshold are settled. `reveal` goes 1 (arrived) → 0 (not yet).
      const edge0 = dyno.sub(uProgress, dyno.dynoFloat(SOFT_EDGE));
      const reveal = dyno.sub(
        dyno.dynoFloat(1),
        dyno.smoothstep(edge0, uProgress, nd),
      );
      const notArrived = dyno.sub(dyno.dynoFloat(1), reveal);

      // Height drop: un-arrived gaussians sit `DROP_FACTOR * radius` above their
      // home along world-up, and fall into place as they reveal.
      const fall = dyno.mul(
        dyno.dynoVec3(upLocal),
        dyno.mul(dyno.dynoFloat(radius * DROP_FACTOR), notArrived),
      );
      const newCenter = dyno.add(center, fall);

      const newOpacity = dyno.mul(opacity, reveal);
      const popScale = dyno.clamp(
        reveal,
        dyno.dynoFloat(MIN_SCALE),
        dyno.dynoFloat(1),
      );
      const newScales = dyno.mul(scales, popScale);

      return {
        gsplat: dyno.combineGsplat({
          gsplat,
          center: newCenter,
          opacity: newOpacity,
          scales: newScales,
        }),
      };
    },
  );

  splat.objectModifier = modifier;
  splat.updateGenerator();

  return {
    setProgress: (t) => {
      // Ease the wavefront so it settles softly, and push a touch past 1 so the
      // outermost gaussians (nd ≈ 1) fully arrive by the end.
      uProgress.value = easeInOutCubic(t) * (1 + SOFT_EDGE);
      splat.updateGenerator();
    },
    finish: () => {
      splat.objectModifier = previousModifier;
      splat.updateGenerator();
    },
  };
}
