// Minimum allowed scale for any element. Prevents pathological zero/
// negative scales from collapsing the bounding box and breaking the
// preview hit-test and resize handles.
export const MIN_TRANSFORM_SCALE = 0.01;
