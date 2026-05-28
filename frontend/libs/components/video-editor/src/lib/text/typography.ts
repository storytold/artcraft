export const MIN_FONT_SIZE = 5;
export const MAX_FONT_SIZE = 300;
export const DEFAULT_TEXT_COLOR = "#000000";

// FONT_SIZE_SCALE_REFERENCE maps `params.fontSize` (user-meaningful
// pt-ish units) onto a canvas-pixel size proportional to the canvas
// height. A higher reference value means the same fontSize renders
// smaller on the canvas — the value matches OpenCut's CapCut-derived
// default and shouldn't be changed without re-validating every
// existing project's text sizing.
export const FONT_SIZE_SCALE_REFERENCE = 90;
