// Public API for @storyteller/ui-video-editor.
//
// Surface grows as the OpenCut Classic port lands. Each section below
// reflects which folders are real (ported from opencut-classic) vs
// still placeholder (only VideoEditor + adapters are visible from
// host code until the panels port lands).

// --- Top-level component (placeholder until panels port lands) ---
export { VideoEditor } from "./lib/VideoEditor";
export type { VideoEditorProps } from "./lib/VideoEditor";

// --- Provider + hook (use only when mounting the inner shell directly) ---
export { EditorProvider, useEditorAdapters } from "./lib/EditorProvider";
export type { EditorProviderProps } from "./lib/EditorProvider";

// --- Adapter interfaces — hosts implement these ---
export type {
  MediaKind,
  MediaHandle,
  MediaProbe,
  ResolvedMedia,
  ProjectMeta,
  EditorProject,
  AuthUser,
  ExportArtifact,
  ProjectStorageAdapter,
  MediaSourceAdapter,
  AssetGalleryAdapter,
  AuthUserAdapter,
  ExportSinkAdapter,
  VideoEditorAdapters,
} from "./lib/adapters";

// --- Default adapters ---
// Useful for tests and as a baseline for hosts that want to mix in
// just one Artcraft-specific implementation.
export {
  createDefaultAdapters,
  createIndexedDBProjectStorage,
  createLocalFileMediaSource,
  anonymousAuthUser,
  downloadExportSink,
} from "./lib/adapters/default";

// --- MediaTime + frame math (the wasm boundary) ---
export {
  TICKS_PER_SECOND,
  ZERO_MEDIA_TIME,
  mediaTime,
  roundMediaTime,
  mediaTimeFromSeconds,
  mediaTimeToSeconds,
  addMediaTime,
  subMediaTime,
  maxMediaTime,
  minMediaTime,
  clampMediaTime,
  roundFrameTime,
  roundFrameTicks,
  snapSeekMediaTime,
  lastFrameMediaTime,
  parseMediaTimecode,
} from "./lib/wasm";
export type { MediaTime } from "./lib/wasm";

// --- Timeline math + scale ---
export {
  BASE_TIMELINE_PIXELS_PER_SECOND,
  TIMELINE_ZOOM_MIN,
  TIMELINE_ZOOM_MAX,
} from "./lib/timeline/scale";
export {
  TIMELINE_INDICATOR_LINE_WIDTH_PX,
  getTimelinePixelsPerSecond,
  timelineTimeToPixels,
  snapPixelToDeviceGrid,
  timelineTimeToSnappedPixels,
  getCenteredLineLeft,
} from "./lib/timeline/pixel-utils";
export {
  getTimelineZoomMin,
  getTimelinePaddingPx,
  getZoomPercent,
  sliderToZoom,
  zoomToSlider,
} from "./lib/timeline/zoom-utils";

// --- Timeline controllers — the smoothness-critical layer ---
// Each takes a *ConfigRef whose `.current` the host updates on each
// render. The controllers attach window-level mousemove/mouseup during
// active sessions and write playhead position imperatively. Do not
// wrap the scrub callbacks with React state writes — break the
// contract and scrubbing visibly stutters.
export { SeekController } from "./lib/timeline/controllers/seek-controller";
export type {
  SeekConfig,
  SeekConfigRef,
} from "./lib/timeline/controllers/seek-controller";
export { ZoomController } from "./lib/timeline/controllers/zoom-controller";
export type {
  ZoomConfig,
  ZoomConfigRef,
} from "./lib/timeline/controllers/zoom-controller";
export { PlayheadController } from "./lib/timeline/controllers/playhead-controller";
export type {
  PlayheadConfig,
  PlayheadConfigRef,
} from "./lib/timeline/controllers/playhead-controller";

// --- Timeline snapping ---
export {
  buildTimelineSnapPoints,
  resolveTimelineSnap,
  getTimelineSnapThresholdInTicks,
} from "./lib/timeline/snapping";
export type {
  SnapPoint,
  SnapPointType,
  SnapResult,
  TimelineSnapPointSource,
} from "./lib/timeline/snapping";

// --- Editor stores ---
export { useEditorStore } from "./lib/editor/editor-store";
export { usePanelStore } from "./lib/editor/panel-store";
export type { PanelSizes, PanelId } from "./lib/editor/panel-store";
export {
  registerCanceller,
  cancelInteraction,
} from "./lib/editor/cancel-interaction";
