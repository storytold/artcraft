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

// --- Timeline element constructors + type guards ---
// Hosts that want to inject elements directly (drag-and-drop from the
// Artcraft gallery, etc.) build CreateTimelineElement values via these
// helpers, then dispatch them through the EditorCore.timeline manager
// (once that lands) or directly into the store.
export {
  canElementHaveAudio,
  isVisualElement,
  isMaskableElement,
  isRetimableElement,
  canElementBeHidden,
  hasElementEffects,
  hasMediaId,
  requiresMediaId,
  buildTextElement,
  buildEffectElement,
  buildStickerElement,
  buildGraphicElement,
  buildElementFromMedia,
  buildLibraryAudioElement,
  getElementsAtTime,
  getElementFontFamilies,
} from "./lib/timeline/element-utils";

// --- Scenes ---
export {
  getMainScene,
  ensureMainScene,
  buildDefaultScene,
  canDeleteScene,
  getFallbackSceneAfterDelete,
  findCurrentScene,
  getProjectDurationFromScenes,
  updateSceneInArray,
} from "./lib/timeline/scenes";
export { calculateTotalDuration } from "./lib/timeline/calculate-duration";

// --- Effects + Graphics + Animation registries ---
// Hosts that want to register custom effects or graphics call into
// these registries at startup. The default sets land via
// registerDefaultEffects / registerDefaultGraphics (called from
// EditorCore once that ports; safe to call manually before then).
export {
  effectsRegistry,
  registerDefaultEffects,
  resolveEffectPasses,
  buildDefaultEffectInstance,
  EFFECT_TARGET_ELEMENT_TYPES,
} from "./lib/effects";
export type {
  Effect,
  EffectDefinition,
  EffectPass,
  EffectPassTemplate,
  EffectRendererConfig,
  EffectUniformValue,
} from "./lib/effects/types";

export {
  graphicsRegistry,
  registerDefaultGraphics,
  getGraphicDefinition,
  buildDefaultGraphicInstance,
  resolveGraphicParams,
  resolveGraphicElementParamsAtTime,
  buildGraphicPreviewUrl,
  DEFAULT_GRAPHIC_SOURCE_SIZE,
  rectangleGraphicDefinition,
  ellipseGraphicDefinition,
  polygonGraphicDefinition,
  starGraphicDefinition,
} from "./lib/graphics";
export type {
  GraphicDefinition,
  GraphicInstance,
  GraphicRenderContext,
} from "./lib/graphics/types";

// --- Animation surface ---
export {
  getChannelValueAtTime,
  resolveAnimationPathValueAtTime,
  getElementLocalTime,
  getElementKeyframes,
  upsertPathKeyframe,
  removeElementKeyframe,
  retimeElementKeyframe,
  cloneAnimations,
  splitAnimationsAtTime,
  clampAnimationsToDuration,
  isAnimationPath,
  isAnimationPropertyPath,
} from "./lib/animation";
export type {
  ElementAnimations,
  ElementKeyframe,
  AnimationChannel,
  AnimationPath,
  AnimationPropertyPath,
  ScalarAnimationChannel,
  ScalarAnimationKey,
} from "./lib/animation/types";

// --- Rendering primitives ---
export {
  buildTransformFromParams,
  readOpacityFromParams,
  readBlendModeFromParams,
} from "./lib/rendering";
export { resolveTransformAtTime } from "./lib/rendering/animation-values";
export type { Transform, BlendMode } from "./lib/rendering";

// --- Params + registry ---
export type {
  ParamValue,
  ParamValues,
  ParamDefinition,
  ParamChannelLayout,
  LinearRgba,
} from "./lib/params";
export {
  buildDefaultParamValues,
  getElementParams,
  getBuiltInElementParams,
  readElementParamValue,
  writeElementParamValue,
  buildElementParamValues,
} from "./lib/params/registry";

// --- Timeline domain types ---
export type {
  TimelineElement,
  TimelineTrack,
  SceneTracks,
  TScene,
  Bookmark,
  ElementRef,
  ElementType,
  TrackType,
  VideoElement,
  ImageElement,
  AudioElement,
  TextElement,
  GraphicElement,
  StickerElement,
  EffectElement,
  VisualElement,
  MaskableElement,
  RetimableElement,
  DropTarget,
  ComputeDropTargetParams,
  ClipboardItem,
  CreateTimelineElement,
} from "./lib/timeline/types";
export type {
  TProject,
  TProjectMetadata,
  TProjectSettings,
  TCanvasSize,
  TBackground,
  TTimelineViewState,
} from "./lib/project/types";
