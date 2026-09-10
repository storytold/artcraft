// Every tweakable constant of the hero render wall, registered with the dev
// tuner (see TUNER.md). Defaults here ARE the shipped values — tune live,
// copy the JSON from the panel, then update the defaults.

import { defineTunables } from "@/lib/tuner";

// Wall structure — moving these rebuilds the panel layout (debounced).
export const wallLayoutTuner = defineTunables("wallLayout", "Wall layout", {
  rowHeight: {
    label: "Near row × vh",
    min: 0.14,
    max: 0.55,
    step: 0.01,
    default: 0.33,
    info: "Panel height of the near row, as a fraction of the viewport height.",
  },
  rowScale: {
    label: "Row shrink",
    min: 0.5,
    max: 1,
    step: 0.01,
    default: 0.73,
    info: "How much each deeper row's panels shrink relative to the row in front.",
  },
  gap: {
    label: "Gap px",
    min: 8,
    max: 80,
    step: 1,
    default: 25,
    info: "Horizontal gap between panels within a row.",
  },
  zStep: {
    label: "Row z step px",
    min: 0,
    max: 400,
    step: 5,
    default: 170,
    info: "Depth distance between successive rows of the wall.",
  },
  yNear: {
    label: "Near row y × vh",
    min: -0.5,
    max: 0.5,
    step: 0.01,
    default: -0.17,
    info: "Vertical position of the near row, in viewport heights from center.",
  },
  yMid: {
    label: "Mid row y × vh",
    min: -0.5,
    max: 0.5,
    step: 0.01,
    default: 0.17,
    info: "Vertical position of the mid row, in viewport heights from center.",
  },
});

export const wallMotionTuner = defineTunables("wallMotion", "Wall motion", {
  yawDeg: {
    label: "Yaw °",
    min: -35,
    max: 35,
    step: 0.5,
    default: -11,
    info: "Resting sideways rotation of the whole wall.",
  },
  pitchDeg: {
    label: "Pitch °",
    min: -12,
    max: 12,
    step: 0.25,
    default: 2.5,
    info: "Resting up/down rotation of the whole wall.",
  },
  speed: {
    label: "Drift px/s",
    min: 0,
    max: 240,
    step: 2,
    default: 42,
    info: "Unattended sideways drift speed of the near row.",
  },
  speedStep: {
    label: "Row parallax",
    min: 0.3,
    max: 1,
    step: 0.02,
    default: 0.62,
    info: "Depth parallax: each deeper row moves this fraction of the row in front.",
  },
  dragMax: {
    label: "Max throw px/s",
    min: 400,
    max: 6000,
    step: 100,
    default: 2400,
    info: "Speed cap on the momentum a drag can throw the wall with.",
  },
  introBurst: {
    label: "Intro burst ×",
    min: 1,
    max: 40,
    step: 1,
    default: 16,
    info: "Multiple of the drift speed the wall sweeps in with on load before easing down.",
  },
  parallax: {
    label: "Pointer tilt rad",
    min: 0,
    max: 0.09,
    step: 0.002,
    default: 0.024,
    info: "How far the pointer position tilts the whole wall.",
  },
});

export const wallLookTuner = defineTunables("wallLook", "Wall look", {
  dimNear: {
    label: "Near row dim",
    min: 0,
    max: 1,
    step: 0.02,
    default: 0.86,
    info: "Brightness of the near row's footage (1 = full strength).",
  },
  dimMid: {
    label: "Mid row dim",
    min: 0,
    max: 1,
    step: 0.02,
    default: 0.7,
    info: "Brightness of the mid row's footage — deeper rows recede into the background.",
  },
  washLight: {
    label: "Light wash",
    min: 0,
    max: 1,
    step: 0.02,
    default: 0.15,
    info: "Light theme only: how much deeper rows wash toward the paper via opacity.",
  },
  edgeFade: {
    label: "Edge fade",
    min: 0,
    max: 1,
    step: 0.02,
    default: 0.65,
    info: "How strongly panels vignette out toward the viewport's left/right edges.",
  },
  frameAlpha: {
    label: "Frame alpha",
    min: 0,
    max: 1,
    step: 0.02,
    default: 0.18,
    info: "Opacity of the hairline frames around each panel.",
  },
});
