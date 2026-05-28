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
  ToastAdapter,
  ToastOptions,
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
  consoleToast,
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

// --- Masks ---
// Full mask subsystem (including freeform pen tool). Hosts can list
// definitions via getMaskDefinitionsForMenu, register their own via
// masksRegistry.registerMask, or build a mask instance via
// buildDefaultMaskInstance + the mask shape's params.
export {
  masksRegistry,
  registerDefaultMasks,
  getMaskDefinition,
  getMaskDefinitionsForMenu,
  buildDefaultMaskInstance,
} from "./lib/masks";
export type {
  Mask,
  MaskType,
  MaskDefinition,
  MaskInteractionDefinition,
  MaskInteractionResult,
  MaskHandlePosition,
  MaskHandleId,
  MaskOverlay,
  MaskRenderer,
  MaskFeatures,
  MaskSnapArgs,
  MaskSnapResult,
  MaskParamUpdateArgs,
  BaseMaskParams,
  RectangleMaskParams,
  SplitMaskParams,
  TextMaskParams,
  FreeformPathPoint,
} from "./lib/masks/types";

// --- Preview canvas math ---
export {
  getVisibleElementsWithBounds,
  getCornerPosition,
  getEdgeHandlePosition,
  ROTATION_HANDLE_OFFSET,
} from "./lib/preview/element-bounds";
export type {
  ElementBounds,
  ElementWithBounds,
  Corner,
  Edge,
} from "./lib/preview/element-bounds";
export { hitTest, getHitElements, resolvePreferredHit } from "./lib/preview/hit-test";
export {
  snapPosition,
  snapScale,
  snapScaleAxes,
  snapRotation,
  MIN_SCALE,
  SNAP_THRESHOLD_SCREEN_PIXELS,
} from "./lib/preview/preview-snap";
export type {
  SnapLine,
  ScaleEdgePreference,
  SnapResult as PreviewSnapResult,
  ScaleSnapResult,
  AxisSnapResult,
  RotationSnapResult,
} from "./lib/preview/preview-snap";

// --- Retime (audio mastering) ---
export {
  DEFAULT_RETIME_RATE,
  MIN_RETIME_RATE,
  MAX_RETIME_RATE,
  clampRetimeRate,
  buildConstantRetime,
  getSourceTimeAtClipTime,
  getClipTimeAtSourceTime,
  getEffectiveRateAt,
  getTimelineDurationForSourceSpan,
  getSourceSpanAtClipTime,
  renderRetimedBuffer,
} from "./lib/retime";
export type { RetimeConfig } from "./lib/timeline/types";

// --- Audio state (gain/mute/volume animation) ---
export {
  clampDb,
  dBToLinear,
  getElementVolume,
  isElementMuted,
  hasAnimatedVolume,
  resolveEffectiveAudioGain,
  buildWaveformGainSamples,
  buildAudioGainAutomation,
} from "./lib/timeline/audio-state";
export { VOLUME_DB_MIN, VOLUME_DB_MAX } from "./lib/timeline/audio-constants";

// --- Timeline placement ---
export {
  resolveTrackPlacement,
  applyPlacement,
  canElementGoOnTrack,
  validateElementTrackCompatibility,
  buildEmptyTrack,
  MAIN_TRACK_NAME,
  enforceMainTrackStart,
  getEarliestMainTrackElement,
} from "./lib/timeline/placement";
export type {
  PlacementResult,
  PlacementStrategy,
  PlacementSubject,
  PlacementTimeSpan,
} from "./lib/timeline/placement";

// --- Group move + resize solvers ---
export {
  buildMoveGroup,
  resolveGroupMove,
  snapGroupEdges,
} from "./lib/timeline/group-move";
export type {
  MoveGroup,
  GroupMember,
  GroupMoveResult,
  GroupTrackSection,
  PlannedElementMove,
  PlannedTrackCreation,
} from "./lib/timeline/group-move";
export { computeGroupResize } from "./lib/timeline/group-resize";
export type {
  ComputeGroupResizeArgs,
  GroupResizeMember,
  GroupResizeResult,
  GroupResizeUpdate,
  ResizeSide,
} from "./lib/timeline/group-resize";

// --- Timeline animation targets + update pipeline ---
export {
  resolveAnimationTarget,
} from "./lib/timeline/animation-targets";
export type { AnimationPathDescriptor } from "./lib/timeline/animation-targets";
export { applyElementUpdate } from "./lib/timeline/update-pipeline";
export type { ElementUpdateContext } from "./lib/timeline/update-pipeline";

// --- Audio separation (extract / recover source audio) ---
export {
  isSourceAudioEnabled,
  isSourceAudioSeparated,
  canExtractSourceAudio,
  canRecoverSourceAudio,
  canToggleSourceAudio,
  doesElementHaveEnabledAudio,
  buildSeparatedAudioElement,
  getSourceAudioActionLabel,
} from "./lib/timeline/audio-separation";

// --- Ripple (gap-closing after deletes/shrinks) ---
export {
  applyRippleAdjustments,
  computeRippleAdjustments,
  rippleShiftElements,
} from "./lib/ripple";
export type { RippleAdjustment } from "./lib/ripple";

// --- Commands base + clipboard types ---
export { Command } from "./lib/commands/base-command";
export { BatchCommand } from "./lib/commands/batch-command";
export { PreviewTracker } from "./lib/commands/preview-tracker";
export type { CommandResult } from "./lib/commands/base-command";

// --- Timeline commands ---
export {
  TracksSnapshotCommand,
  // Element commands
  InsertElementCommand,
  DeleteElementsCommand,
  DuplicateElementsCommand,
  SplitElementsCommand,
  UpdateElementsCommand,
  ToggleSourceAudioSeparationCommand,
  MoveElementCommand,
  // Effect commands
  AddClipEffectCommand,
  RemoveClipEffectCommand,
  ToggleClipEffectCommand,
  UpdateClipEffectParamsCommand,
  ReorderClipEffectsCommand,
  // Keyframe commands
  RemoveEffectParamKeyframeCommand,
  RemoveKeyframeCommand,
  RetimeKeyframeCommand,
  UpdateScalarKeyframeCurveCommand,
  UpsertEffectParamKeyframeCommand,
  UpsertKeyframeCommand,
  // Mask commands
  DeleteFreeformPathMaskPointsCommand,
  InsertFreeformPathMaskPointCommand,
  RemoveMaskCommand,
  ToggleMaskInvertedCommand,
  // Track commands
  AddTrackCommand,
  RemoveTrackCommand,
  ToggleTrackMuteCommand,
  ToggleTrackVisibilityCommand,
  // Clipboard commands
  PasteCommand,
  PasteKeyframesCommand,
} from "./lib/commands/timeline";
export type {
  ClipboardEntry,
  ClipboardEntryType,
  ClipboardEntryByType,
  ClipboardHandler,
  ClipboardHandlerMap,
  CopyContext,
  PasteContext,
  ElementClipboardItem,
  ElementsClipboardEntry,
  KeyframeClipboardItem,
  KeyframesClipboardEntry,
} from "./lib/clipboard/types";

// --- Selection types ---
export type {
  EditorSelectionPatch,
  EditorSelectionSnapshot,
  EditorSelectionKind,
  SelectedMaskPointSelection,
} from "./lib/selection/editor-selection";

// --- Media runtime (audio decode + mixing, waveform sampling) ---
export {
  createAudioContext,
  decodeAudioToFloat32,
  collectAudibleCandidates,
  collectAudioElements,
  collectAudioMixSources,
  collectAudioClips,
  createTimelineAudioBuffer,
  timelineHasAudio,
  extractPeakRange,
  extractRmsRange,
  extractRmsBuckets,
  getSampleBucketRange,
} from "./lib/media/audio";
export type {
  CollectedAudioElement,
  DecodedAudio,
  AudibleElementCandidate,
  AudioClipSource,
} from "./lib/media/audio";
export {
  buildSourceWaveformSummary,
  buildWaveformSampleBuckets,
  sampleSourceWaveformSummary,
  computeRmsBuckets,
} from "./lib/media/waveform-summary";
export type {
  SourceWaveformSummary,
  SampleBucket,
} from "./lib/media/waveform-summary";
export {
  applyAudioMasteringToBuffer,
  createAudioMasteringChain,
  getAudioBufferPeak,
} from "./lib/media/audio-mastering";
export {
  getMediaTypeFromFile,
  mediaSupportsAudio,
  SUPPORTS_AUDIO,
} from "./lib/media/media-utils";
export type { MediaAsset, MediaType } from "./lib/media/types";

// --- Caching services (decoded video frames + waveform summaries) ---
export { VideoCache, videoCache } from "./lib/services/video-cache";
export { WaveformCache, waveformCache } from "./lib/services/waveform-cache";
