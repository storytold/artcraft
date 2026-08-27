// Every tweakable constant of the hero wordmark, registered with the dev
// tuner (see TUNER.md). Defaults here ARE the shipped values — tune live,
// copy the JSON from the panel, then update the defaults.

import { defineTunables } from "@/lib/tuner";

// Settled-pile ball formation — the shipped wordmark look.
export const formationTuner = defineTunables("formation", "Formation", {
  ballScale: { label: "Ball scale", min: 0.5, max: 2.5, step: 0.05, default: 1 },
  sizeMin: { label: "Size min ×", min: 0.05, max: 0.6, step: 0.01, default: 0.18 },
  sizeMax: { label: "Size max ×", min: 0.2, max: 1.4, step: 0.01, default: 0.66 },
  sizeNoiseScale: { label: "Size noise px", min: 30, max: 400, step: 5, default: 130 },
  sizeRoughen: { label: "Size roughen", min: 0, max: 1, step: 0.02, default: 0.4 },
  gap: { label: "Gap px", min: 0, max: 6, step: 0.1, default: 0.6 },
  depth: { label: "Depth ×", min: 0.2, max: 5, step: 0.1, default: 1.9 },
  density: { label: "Fill density", min: 0.2, max: 3, step: 0.05, default: 1 },
  edgeMargin: { label: "Edge margin", min: 0, max: 1, step: 0.05, default: 0.55 },
  seed: { label: "Seed", min: 1, max: 9999, step: 1, default: 1013 },
});

export const physicsTuner = defineTunables("physics", "Physics", {
  spring: { label: "Spring", min: 5, max: 140, step: 1, default: 46 },
  damping: { label: "Damping", min: 1, max: 14, step: 0.1, default: 5.2 },
  pushRadius: { label: "Push radius", min: 40, max: 450, step: 5, default: 180 },
  pushStrength: { label: "Push strength", min: 1000, max: 80000, step: 500, default: 23000 },
  swirl: { label: "Swirl", min: 0, max: 1.5, step: 0.05, default: 0.55 },
  popZ: { label: "Pop toward viewer", min: 0, max: 2, step: 0.05, default: 0.6 },
  bobAmp: { label: "Idle bob px", min: 0, max: 8, step: 0.1, default: 1.4 },
  scatter: { label: "Intro scatter px", min: 0, max: 1400, step: 20, default: 480 },
});

export const lightTuner = defineTunables("light", "Cursor & Light", {
  intensityDark: { label: "Cursor int (dark)", min: 0, max: 220000, step: 1000, default: 30000 },
  intensityLight: { label: "Cursor int (light)", min: 0, max: 220000, step: 1000, default: 30000 },
  idleDim: { label: "Idle dim", min: 0, max: 1, step: 0.05, default: 0.3 },
  lightZ: { label: "Light z", min: 30, max: 500, step: 5, default: 130 },
  lightRange: { label: "Light range", min: 100, max: 3000, step: 50, default: 900 },
  keyIntensity: { label: "Key (dark)", min: 0, max: 8, step: 0.1, default: 1.05 },
  counterIntensity: { label: "Counter rim (dark)", min: 0, max: 4, step: 0.05, default: 0.7 },
  frontFill: { label: "Front fill (dark)", min: 0, max: 1, step: 0.01, default: 0.3 },
  ambientDark: { label: "Ambient (dark)", min: 0, max: 1, step: 0.01, default: 0.5 },
  ambientLight: { label: "Ambient (light)", min: 0, max: 2, step: 0.05, default: 0.55 },
  dirLight: { label: "Key (light)", min: 0, max: 3, step: 0.05, default: 0.75 },
});

export const materialTuner = defineTunables("material", "Material", {
  roughnessDark: { label: "Roughness (dark)", min: 0, max: 1, step: 0.02, default: 0.35 },
  metalnessDark: { label: "Metalness (dark)", min: 0, max: 1, step: 0.02, default: 0 },
  clearcoat: { label: "Clearcoat (dark)", min: 0, max: 1, step: 0.02, default: 0.9 },
  clearcoatRoughness: { label: "Coat rough (dark)", min: 0, max: 1, step: 0.02, default: 0.2 },
  roughnessLight: { label: "Roughness (light)", min: 0, max: 1, step: 0.02, default: 0.3 },
  metalnessLight: { label: "Metalness (light)", min: 0, max: 1, step: 0.02, default: 0.15 },
  envLight: { label: "Env int (light)", min: 0, max: 2, step: 0.05, default: 0.55 },
  accentShare: { label: "Accent share", min: 0, max: 0.3, step: 0.005, default: 0.05 },
});

export const haloTuner = defineTunables("halo", "Halo", {
  size: { label: "Size px", min: 200, max: 1800, step: 20, default: 720 },
  alphaDark: { label: "Alpha (dark)", min: 0, max: 1, step: 0.02, default: 0.1 },
  alphaLight: { label: "Alpha (light)", min: 0, max: 0.6, step: 0.01, default: 0.08 },
  z: { label: "Z offset", min: -400, max: 0, step: 5, default: -90 },
  falloff: { label: "Falloff", min: 0.5, max: 6, step: 0.1, default: 2.6 },
});
