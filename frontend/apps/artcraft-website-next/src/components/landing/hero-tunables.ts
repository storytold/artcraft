// Every tweakable constant of the hero render wall, registered with the dev
// tuner (see TUNER.md). Defaults here ARE the shipped values — tune live,
// copy the JSON from the panel, then update the defaults.

import { defineTunables } from "@/lib/tuner";

// Wall structure — moving these rebuilds the panel layout (debounced).
export const wallLayoutTuner = defineTunables("wallLayout", "Wall layout", {
  rowHeight: {
    label: "Near row × vh",
    min: 0.14,
    max: 0.42,
    step: 0.01,
    default: 0.31,
  },
  rowScale: {
    label: "Row shrink",
    min: 0.5,
    max: 1,
    step: 0.01,
    default: 0.78,
  },
  gap: { label: "Gap px", min: 8, max: 80, step: 1, default: 22 },
  zStep: { label: "Row z step px", min: 0, max: 400, step: 5, default: 170 },
  yNear: {
    label: "Near row y × vh",
    min: -0.5,
    max: 0.5,
    step: 0.01,
    default: -0.17,
  },
  yMid: {
    label: "Mid row y × vh",
    min: -0.5,
    max: 0.5,
    step: 0.01,
    default: 0.17,
  },
});

export const wallMotionTuner = defineTunables("wallMotion", "Wall motion", {
  yawDeg: { label: "Yaw °", min: -35, max: 35, step: 0.5, default: -11 },
  pitchDeg: { label: "Pitch °", min: -12, max: 12, step: 0.25, default: 2.5 },
  speed: { label: "Drift px/s", min: 0, max: 240, step: 2, default: 42 },
  speedStep: {
    label: "Row parallax",
    min: 0.3,
    max: 1,
    step: 0.02,
    default: 0.62,
  },
  dragMax: {
    label: "Max throw px/s",
    min: 400,
    max: 6000,
    step: 100,
    default: 2400,
  },
  introBurst: { label: "Intro burst ×", min: 1, max: 40, step: 1, default: 16 },
  parallax: {
    label: "Pointer tilt rad",
    min: 0,
    max: 0.09,
    step: 0.002,
    default: 0.024,
  },
});

export const wallLookTuner = defineTunables("wallLook", "Wall look", {
  dimNear: { label: "Near row dim", min: 0, max: 1, step: 0.02, default: 0.86 },
  dimMid: { label: "Mid row dim", min: 0, max: 1, step: 0.02, default: 0.7 },
  washLight: { label: "Light wash", min: 0, max: 1, step: 0.02, default: 0.15 },
  edgeFade: { label: "Edge fade", min: 0, max: 1, step: 0.02, default: 0.65 },
  frameAlpha: {
    label: "Frame alpha",
    min: 0,
    max: 1,
    step: 0.02,
    default: 0.9,
  },
});
