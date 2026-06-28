// Instancing scatter expansion. A `scatter` spec (count/area/seed/…) is the
// LLM-friendly way to ask for "a forest" without emitting N transforms; we
// expand it deterministically here so apply just consumes a flat instance
// list. Same seed → same layout (reproducible across export/apply/undo).

import * as THREE from "three";
import {
  DescriptorInstancing,
  InstanceTransform,
  InstancingScatter,
} from "./scene_descriptor";

// Return a spec with concrete `instances`. Explicit instances win; a
// scatter spec is expanded; otherwise the spec is returned as-is. The base
// color (the entity's color) seeds per-instance color jitter.
export function resolveInstancing(
  spec: DescriptorInstancing | undefined,
  baseColor?: string,
): DescriptorInstancing | undefined {
  if (!spec) return spec;
  if (spec.instances && spec.instances.length > 0) return spec;
  if (spec.scatter) {
    return {
      base: spec.base,
      instances: scatterInstances(spec.scatter, baseColor),
      wind: spec.wind,
    };
  }
  return spec;
}

function scatterInstances(
  s: InstancingScatter,
  baseColor?: string,
): InstanceTransform[] {
  const rng = mulberry32(s.seed ?? 1);
  const yaw = s.yJitterDeg ?? 360;
  const tilt = s.tiltDeg ?? 0;
  const jitter = s.colorJitter ?? 0;
  const [sMin, sMax] = s.scaleRange ?? [1, 1];
  const count = Math.max(0, Math.floor(s.count));

  // Per-instance color is derived from the base color in HSL so the field
  // reads as one species with natural shade-to-shade variation.
  const base = jitter > 0 && baseColor ? new THREE.Color(baseColor) : null;
  const hsl = { h: 0, s: 0, l: 0 };
  if (base) base.getHSL(hsl);

  const out: InstanceTransform[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * s.area.x;
    const z = (rng() - 0.5) * s.area.z;
    const ry = (rng() - 0.5) * yaw;
    const tx = (rng() - 0.5) * tilt;
    const tz = (rng() - 0.5) * tilt;
    const sc = sMin + rng() * (sMax - sMin);

    const inst: InstanceTransform = {
      position: { x: round(x), y: 0, z: round(z) },
      rotationDeg: { x: round(tx), y: round(ry), z: round(tz) },
      scale: { x: round(sc), y: round(sc), z: round(sc) },
    };
    if (base) {
      const h = (hsl.h + (rng() - 0.5) * jitter * 0.1 + 1) % 1;
      const l = clamp01(hsl.l + (rng() - 0.5) * jitter);
      inst.color = "#" + new THREE.Color().setHSL(h, hsl.s, l).getHexString();
    }
    out.push(inst);
  }
  return out;
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
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
