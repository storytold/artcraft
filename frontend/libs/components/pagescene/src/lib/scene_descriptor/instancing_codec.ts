// Instancing scatter expansion. A `scatter` spec (count/area/seed/…) is the
// LLM-friendly way to ask for "a forest" without emitting N transforms; we
// expand it deterministically here so apply just consumes a flat instance
// list. Same seed → same layout (reproducible across export/apply/undo).

import {
  DescriptorInstancing,
  InstanceTransform,
  InstancingScatter,
} from "./scene_descriptor";

// Return a spec with concrete `instances`. Explicit instances win; a
// scatter spec is expanded; otherwise the spec is returned as-is.
export function resolveInstancing(
  spec: DescriptorInstancing | undefined,
): DescriptorInstancing | undefined {
  if (!spec) return spec;
  if (spec.instances && spec.instances.length > 0) return spec;
  if (spec.scatter) {
    return { base: spec.base, instances: scatterInstances(spec.scatter) };
  }
  return spec;
}

function scatterInstances(s: InstancingScatter): InstanceTransform[] {
  const rng = mulberry32(s.seed ?? 1);
  const yaw = s.yJitterDeg ?? 360;
  const [sMin, sMax] = s.scaleRange ?? [1, 1];
  const count = Math.max(0, Math.floor(s.count));
  const out: InstanceTransform[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * s.area.x;
    const z = (rng() - 0.5) * s.area.z;
    const ry = (rng() - 0.5) * yaw;
    const sc = sMin + rng() * (sMax - sMin);
    out.push({
      position: { x: round(x), y: 0, z: round(z) },
      rotationDeg: { x: 0, y: round(ry), z: 0 },
      scale: { x: round(sc), y: round(sc), z: round(sc) },
    });
  }
  return out;
}

// Small, fast, seedable PRNG (mulberry32) — deterministic per seed.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e4) / 1e4;
}
