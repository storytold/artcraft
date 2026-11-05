// Barrel file: re-exports everything the 3D upload dialog's helper files offer, so the rest of the
// library can write `from "./utilities"` instead of naming each file. It holds no logic of its own.
// FBX → GLB conversion (runs the worker in `convertFbxToGlb.worker.ts` off the main thread).
export * from "./convertFbxToGlb";
// Draws a 3D/splat file into a canvas for the preview and cover image.
export * from "./loadPreviewOnCanvas";
// Reads the longest animation clip of a GLB (needed for animation-category uploads).
export * from "./readGlbAnimationDuration";
// Small helpers for making and uploading the cover thumbnail.
export * from "./thumbnailHelpers";
// Uploads a single file (and its cover) to the backend.
export * from "./uploadAsset";
// Single-file 3D upload flow (the dialog's one-file path).
export * from "./upload3DObjects";
// Multi-file 3D upload flow (the picker's batch path).
export * from "./upload3DObjectsBatch";
