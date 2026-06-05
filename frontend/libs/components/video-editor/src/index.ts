// Public API for @storyteller/ui-video-editor.

// --- Top-level component ---
// The bundled editor shell: provider + header + assets / preview /
// properties / timeline split + onboarding + mobile gate. Most hosts
// just mount <VideoEditor>; those that want their own shell can
// compose with <EditorProvider> and the individual panel exports below.
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
  MediaPickerSelection,
  AuthUserAdapter,
  ExportSinkAdapter,
  ExportSinkOptions,
  ExportSinkProgressEvent,
  ExportDestination,
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

// --- Adapter helpers ---
// Small utilities every MediaSourceAdapter implementation needs;
// exposed so hosts don't re-implement them inconsistently.
export { kindFromMime } from "./lib/adapters";

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

// --- Remaining timeline controllers ---
// Same smoothness contract as the controllers above — class-based,
// configRef pattern, window-level mousemove/mouseup during active
// sessions, no React state in the hot path.
export { DragDropController } from "./lib/timeline/controllers/drag-drop-controller";
export type {
  DragDropConfig,
  DragDropConfigRef,
  ProcessedMediaAsset,
} from "./lib/timeline/controllers/drag-drop-controller";
export { ElementInteractionController } from "./lib/timeline/controllers/element-interaction-controller";
export type {
  ElementInteractionDeps,
  ElementInteractionDepsRef,
  ViewportAdapter,
  InputAdapter,
  SceneReader,
  ElementSelectionApi,
  PlaybackReader,
  TimelineOps,
  SnapConfig,
} from "./lib/timeline/controllers/element-interaction-controller";
export { KeyframeDragController } from "./lib/timeline/controllers/keyframe-drag-controller";
export type {
  KeyframeDragConfig,
  KeyframeDragConfigRef,
  KeyframeDragState,
} from "./lib/timeline/controllers/keyframe-drag-controller";
export { ResizeController } from "./lib/timeline/controllers/resize-controller";
export type {
  ResizeConfig,
  ResizeConfigRef,
} from "./lib/timeline/controllers/resize-controller";

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

// --- EditorCore + managers ---
// Hosts that need direct access (e.g. command palette wiring,
// keyboard shortcuts) call EditorCore.getInstance(). The instance is
// created on first access with bundled default adapters; the
// EditorProvider re-initializes it with the host's adapters on mount.
export { EditorCore } from "./lib/core";
export { CommandManager } from "./lib/core/managers/commands";
export { TimelineManager } from "./lib/core/managers/timeline-manager";
export { PlaybackManager } from "./lib/core/managers/playback-manager";
export { ScenesManager } from "./lib/core/managers/scenes-manager";
export { ProjectManager } from "./lib/core/managers/project-manager";
export { MediaManager } from "./lib/core/managers/media-manager";
export { RendererManager } from "./lib/core/managers/renderer-manager";
export { SaveManager } from "./lib/core/managers/save-manager";
export { AudioManager } from "./lib/core/managers/audio-manager";
export { SelectionManager } from "./lib/core/managers/selection-manager";
export { ClipboardManager } from "./lib/core/managers/clipboard-manager";
export { DiagnosticsManager } from "./lib/core/managers/diagnostics-manager";

// --- Clipboard handlers ---
export {
  clipboardHandlers,
  clipboardCopyHandlers,
  copyClipboardEntry,
  buildPasteClipboardCommand,
} from "./lib/clipboard/handlers";

// --- Rendering subsystem ---
// CanvasRenderer + SceneExporter wrap the wasm compositor; buildScene
// turns timeline state into the RootNode tree the renderer consumes.
// Node classes are exported for hosts that need to construct render
// trees manually (e.g. preview composites or custom export pipelines).
export { CanvasRenderer } from "./lib/services/renderer/canvas-renderer";
export type { CanvasRendererParams } from "./lib/services/renderer/canvas-renderer";
export { SceneExporter } from "./lib/services/renderer/scene-exporter";
export type { SceneExporterEvents } from "./lib/services/renderer/scene-exporter";
export { buildScene } from "./lib/services/renderer/scene-builder";
export type { BuildSceneParams } from "./lib/services/renderer/scene-builder";
export { BaseNode } from "./lib/services/renderer/nodes/base-node";
export type { AnyBaseNode, BaseNodeParams } from "./lib/services/renderer/nodes/base-node";
export { RootNode } from "./lib/services/renderer/nodes/root-node";
export type { RootNodeParams } from "./lib/services/renderer/nodes/root-node";
export { ColorNode } from "./lib/services/renderer/nodes/color-node";
export type { ColorNodeParams } from "./lib/services/renderer/nodes/color-node";
export { VideoNode } from "./lib/services/renderer/nodes/video-node";
export type { VideoNodeParams } from "./lib/services/renderer/nodes/video-node";
export { ImageNode, loadImageSource } from "./lib/services/renderer/nodes/image-node";
export type {
  ImageNodeParams,
  CachedImageSource,
} from "./lib/services/renderer/nodes/image-node";
export { StickerNode, loadStickerSource } from "./lib/services/renderer/nodes/sticker-node";
export type { StickerNodeParams } from "./lib/services/renderer/nodes/sticker-node";
export { GraphicNode } from "./lib/services/renderer/nodes/graphic-node";
export type {
  GraphicNodeParams,
  ResolvedGraphicNodeState,
} from "./lib/services/renderer/nodes/graphic-node";
export { TextNode, renderTextToContext } from "./lib/services/renderer/nodes/text-node";
export type {
  TextNodeParams,
  ResolvedTextNodeState,
} from "./lib/services/renderer/nodes/text-node";
export { BlurBackgroundNode } from "./lib/services/renderer/nodes/blur-background-node";
export type {
  BlurBackgroundNodeParams,
  BackdropSource,
  ResolvedBlurBackgroundNodeState,
} from "./lib/services/renderer/nodes/blur-background-node";
export { EffectLayerNode } from "./lib/services/renderer/nodes/effect-layer-node";
export type {
  EffectLayerNodeParams,
  ResolvedEffectLayerNodeState,
} from "./lib/services/renderer/nodes/effect-layer-node";
export { VisualNode } from "./lib/services/renderer/nodes/visual-node";
export type {
  VisualNodeParams,
  ResolvedVisualNodeState,
  ResolvedVisualSourceNodeState,
} from "./lib/services/renderer/nodes/visual-node";
export { effectPreviewService } from "./lib/services/renderer/effect-preview";
export {
  gpuRenderer,
  initializeGpuRenderer,
  isGpuAvailable,
} from "./lib/services/renderer/gpu-renderer";
export { applyMaskFeather } from "./lib/services/renderer/mask-feather";
export { createCanvasSurface } from "./lib/services/renderer/canvas-utils";

// --- Export module ---
export {
  EXPORT_FORMAT_VALUES,
  EXPORT_QUALITY_VALUES,
  getExportFileExtension,
  getExportMimeType,
  downloadBuffer,
} from "./lib/export";
export type {
  ExportFormat,
  ExportQuality,
  ExportOptions,
  ExportResult,
  ExportState,
} from "./lib/export";
export { DEFAULT_EXPORT_OPTIONS } from "./lib/export/defaults";
export { EXPORT_MIME_TYPES } from "./lib/export/mime-types";

// --- Gradients ---
export { drawCssBackground, parseGradient, GradientParser } from "./lib/gradients";
export type {
  GradientAst,
  GradientOrientation,
  Color,
  ColorStop,
} from "./lib/gradients";

// --- Background defaults ---
export {
  BACKGROUND_BLUR_INTENSITY_PRESETS,
  DEFAULT_BACKGROUND_BLUR_INTENSITY,
} from "./lib/background/blur";
export { DEFAULT_BACKGROUND_COLOR } from "./lib/background/color";

// --- Timeline UI ---
// The full Timeline subsystem ported from opencut-classic: ruler, tracks,
// elements, playhead, snap indicator, audio waveform/volume line, drag line,
// toolbar (zoom slider, snap/ripple toggles, graph editor popover), and the
// timeline-store for UI prefs (snapping, ripple, expanded keyframe lanes).
//
// Hosts mount <Timeline /> below an <EditorProvider> wrapping their state
// managers. The component is the single render surface for the timeline panel.
export { Timeline } from "./lib/timeline/components";
export { TimelineToolbar } from "./lib/timeline/components/timeline-toolbar";
export { TimelinePlayhead } from "./lib/timeline/components/timeline-playhead";
export { TimelineElement as TimelineElementView } from "./lib/timeline/components/timeline-element";
export { AudioWaveform } from "./lib/timeline/components/audio-waveform";
export { AudioVolumeLine } from "./lib/timeline/components/audio-volume-line";
export { SnapIndicator } from "./lib/timeline/components/snap-indicator";
export { GraphEditorPopover } from "./lib/timeline/components/graph-editor/popover";
export { useGraphEditorController } from "./lib/timeline/components/graph-editor/use-controller";
export { TimelineTick } from "./lib/timeline/components/timeline-tick";
export { DragLine } from "./lib/timeline/components/drag-line";
export { BezierGraph, BEZIER_GRAPH_MIN_HEIGHT } from "./lib/timeline/components/graph-editor/bezier-graph";

// --- Timeline UI store (snapping + ripple toggles, expanded keyframe IDs) ---
export { useTimelineStore } from "./lib/timeline/timeline-store";

// --- Timeline component layout constants + helpers ---
// Re-exported so hosts can lay out custom timeline-adjacent UI consistently.
export {
  TIMELINE_TRACK_HEIGHTS_PX,
  KEYFRAME_LANE_HEIGHT_PX,
  KEYFRAME_DIAMOND_SIZE_PX,
  EXPANDED_GROUP_HEADER_HEIGHT_PX,
  TIMELINE_TRACK_GAP_PX,
  TIMELINE_TRACK_LABELS_COLUMN_WIDTH_PX,
  TIMELINE_RULER_HEIGHT_PX,
  TIMELINE_BOOKMARK_ROW_HEIGHT_PX,
  TIMELINE_SCROLLBAR_SIZE_PX,
  TIMELINE_CONTENT_TOP_PADDING_PX,
} from "./lib/timeline/components/layout";
export {
  getTrackHeight,
  getExpandedTrackHeight,
  getCumulativeHeightBefore,
  getTotalTracksHeight,
} from "./lib/timeline/components/track-layout";
export { TIMELINE_LAYERS } from "./lib/timeline/components/layers";
export {
  TIMELINE_TRACK_THEME,
  TIMELINE_AUDIO_WAVEFORM_COLOR,
  SELECTED_TRACK_ROW_CLASS,
  DEFAULT_TIMELINE_BOOKMARK_COLOR,
  getTimelineElementClassName,
} from "./lib/timeline/components/theme";
export {
  TIMELINE_DRAG_THRESHOLD_PX,
  TIMELINE_HORIZONTAL_WHEEL_STEP_PX,
  TIMELINE_ZOOM_BUTTON_FACTOR,
  TIMELINE_ZOOM_ANCHOR_PLAYHEAD_THRESHOLD,
} from "./lib/timeline/components/interaction";
export {
  computeTrackExpansionHeight,
  getTrackExpandedRows,
  getExpandedRows,
  getExpansionHeight,
  getPropertyLabel,
} from "./lib/timeline/components/expanded-layout";
export type { ExpandedRow } from "./lib/timeline/components/expanded-layout";
export {
  computeDropTarget,
  getDropLineY,
} from "./lib/timeline/components/drop-target";
export { resolveTimelineElementIntersections } from "./lib/timeline/components/selection-hit-testing";

// --- Audio display curves (db ↔ line-position mapping for AudioVolumeLine) ---
export {
  getLinePosFromDb,
  getDbFromLinePos,
  getBarFractionFromOutputAmplitude,
} from "./lib/timeline/audio-display";

// --- Timeline bookmarks ---
export {
  TimelineBookmarksRow,
  useBookmarkDrag,
  findBookmarkIndex,
  isBookmarkAtTime,
  toggleBookmarkInArray,
  removeBookmarkFromArray,
  updateBookmarkInArray,
  moveBookmarkInArray,
  getFrameTime,
  getBookmarkAtTime,
  getBookmarksActiveAtTime,
  getBookmarkSnapPoints,
  bookmarkNotesPreviewOverlay,
  getBookmarkPreviewOverlaySource,
} from "./lib/timeline/bookmarks";
export type { BookmarkDragState } from "./lib/timeline/bookmarks";

// --- Graph editor (curve editor popover for keyframe easing) ---
export {
  BUILTIN_PRESETS,
  PRESET_MATCH_TOLERANCE,
} from "./lib/timeline/components/graph-editor/easing-presets";
export type { EasingPreset } from "./lib/timeline/components/graph-editor/easing-presets";
export {
  useCustomPresets,
  savePreset,
  removePreset,
} from "./lib/timeline/components/graph-editor/custom-presets-store";


// --- PreviewPanel + preview canvas surface ---
// The PreviewPanel is the main top component for the preview viewport. It
// owns the compositor canvas, the transform/mask handle overlays, the
// snap-guide overlay, the zoom/pan gestures, and the right-click context
// menu. Mount it inside <EditorProvider> and pass it the overlay catalog
// (definitions + instances) plus a visibility callback — the lib reads
// overlay visibility state from `usePreviewStore`. PreviewViewport is
// exposed for hosts that want to construct a custom outer shell without
// re-implementing the zoom/pan/cursor math; usePreviewViewport gives
// access to the same context value inside child trees.
export { PreviewPanel } from "./lib/preview/components";
export {
  PreviewViewportProvider,
  usePreviewViewport,
  usePreviewViewportState,
} from "./lib/preview/components/preview-viewport";
export { PreviewOverlayLayer } from "./lib/preview/components/overlay-layer";
export { PreviewInteractionOverlay } from "./lib/preview/components/preview-interaction-overlay";
export { TransformHandles } from "./lib/preview/components/transform-handles";
export { MaskHandles } from "./lib/preview/components/mask-handles";
export { SnapGuides } from "./lib/preview/components/snap-guides";
export { TextEditOverlay } from "./lib/preview/components/text-edit-overlay";
export { PreviewToolbar } from "./lib/preview/components/toolbar";
export { PreviewContextMenu } from "./lib/preview/components/context-menu";
export { GridPopover } from "./lib/preview/components/guide-popover";
export { PEN_CURSOR } from "./lib/preview/components/cursors";

// Preview store (Zustand) — tracks the active guide, grid config, and
// overlay visibility. Hosts that mount their own preview shell can read
// `state.overlays[overlayId]` and pipe overlay control checkboxes through
// `setOverlayVisibility`.
export { usePreviewStore } from "./lib/preview/preview-store";

// Preview interaction hooks. Pointer + transform-handle controllers wrap
// the smoothness-critical drag/scale/rotate gestures. These are useful for
// hosts that want a custom preview shell but keep the canonical gesture
// stack. Both call `useEditor()` internally and write through the
// EditorCore managers — no extra wiring beyond <EditorProvider>.
export { usePreviewInteraction } from "./lib/preview/hooks/use-preview-interaction";
export type { OnSnapLinesChange } from "./lib/preview/hooks/use-preview-interaction";
export { useTransformHandles } from "./lib/preview/hooks/use-transform-handles";

// Preview interaction controllers (class-based, same smoothness contract
// as the timeline controllers). Hosts building entirely custom React
// glue can drive these directly with their own depsRef.
export { PreviewInteractionController } from "./lib/preview/controllers/preview-interaction-controller";
export type {
  PreviewInteractionDeps,
  PreviewInteractionDepsRef,
  EditingTextState,
  PreviewViewportAdapter as PreviewInteractionViewportAdapter,
} from "./lib/preview/controllers/preview-interaction-controller";
export { TransformHandleController } from "./lib/preview/controllers/transform-handle-controller";
export type {
  TransformHandleDeps,
  TransformHandleDepsRef,
  PreviewViewportAdapter as TransformHandleViewportAdapter,
} from "./lib/preview/controllers/transform-handle-controller";

// Preview coords (logical-canvas <-> screen-overlay math) and zoom presets.
export {
  screenToCanvas,
  canvasToOverlay,
  positionToOverlay,
  getDisplayScale,
  screenPixelsToLogicalThreshold,
} from "./lib/preview/preview-coords";
export type { PreviewViewportGeometry } from "./lib/preview/preview-coords";
export { PREVIEW_ZOOM, PREVIEW_ZOOM_PRESETS } from "./lib/preview/zoom";

// Preview overlays — registry types for hosts that want to publish
// overlay instances (e.g. an export-progress HUD, a custom guide overlay)
// into the preview surface.
export {
  EMPTY_PREVIEW_OVERLAY_SOURCE_RESULT,
  isPreviewOverlayVisible,
  createPreviewOverlayControl,
  mergePreviewOverlaySources,
} from "./lib/preview/overlays";
export type {
  PreviewOverlayHudAnchor,
  PreviewOverlayMount,
  PreviewOverlayPlane,
  PreviewOverlayRenderContext,
  PreviewOverlayInstance,
  PreviewOverlayDefinition,
  PreviewOverlayControl,
  PreviewOverlaySourceResult,
} from "./lib/preview/overlays";

// Visual handle primitives — exported so hosts building bespoke overlays
// (e.g. a third-party mask renderer) can reuse the same look + hit areas.
export {
  HandleButton,
  CornerHandle,
  CircleHandle,
  EdgeHandle,
  IconHandle,
  BoundingBoxOutline,
  ShapeOutline,
  CanvasPathOutline,
  LineOverlay,
  getResizeCursor,
  HANDLE_SIZE,
  HANDLE_HIT_AREA_SIZE,
  ICON_HANDLE_RADIUS,
  EDGE_HANDLE_THIN_SIZE,
  EDGE_HANDLE_THICK_SIZE,
  LINE_HIT_AREA_SIZE,
} from "./lib/preview/components/handle-primitives";

// Editor + interaction hooks now reachable from the public surface so
// hosts can subscribe to EditorCore changes the same way the lib does.
export { useEditor } from "./lib/editor/use-editor";
export { useCommittedRef } from "./lib/hooks/use-committed-ref";
export { useShiftKey } from "./lib/hooks/use-shift-key";
export { useRafLoop } from "./lib/hooks/use-raf-loop";
export { useContainerSize } from "./lib/hooks/use-container-size";
export { useResizeObserver } from "./lib/hooks/use-resize-observer";
export { useFullscreen } from "./lib/hooks/use-fullscreen";

// --- PropertiesPanel ---
// The full PropertiesPanel subsystem ported from opencut-classic. Owns the
// element-type-to-tab registry (transform/blending/audio/speed/text/etc.),
// the per-param input rendering pipeline (NumberField / Switch / ColorPicker
// / Select / Textarea), the keyframe toggle, and the per-element animated
// param channel logic (preview/commit + upsert-keyframe-at-playhead).
//
// All five tab content builders (MasksTab, SpeedTab, GraphicTab,
// ClipEffectsTab, StandaloneEffectTab) are now wired through the
// registry. PropertiesPanel reads selection via useElementSelection.
//
// Mount inside <EditorProvider>; the panel reads/writes its UI prefs through
// `usePropertiesStore` (active-tab-per-element-type, transform scale lock).
export { PropertiesPanel } from "./lib/panels/properties";
export { usePropertiesStore } from "./lib/panels/properties/stores/properties-store";
export {
  getPropertiesConfig,
} from "./lib/panels/properties/registry";
export type {
  TabContentProps,
  PropertiesTabDef,
  ElementPropertiesConfig,
} from "./lib/panels/properties/registry";
export { PropertyParamField } from "./lib/panels/properties/components/property-param-field";
export { KeyframeToggle } from "./lib/panels/properties/components/keyframe-toggle";
export { ElementParamsTab } from "./lib/panels/properties/components/element-params-tab";
export { EmptyView as PropertiesEmptyView } from "./lib/panels/properties/empty-view";
export { useElementPlayhead } from "./lib/panels/properties/hooks/use-element-playhead";
export {
  useKeyframedParamProperty,
} from "./lib/panels/properties/hooks/use-keyframed-param-property";
export type {
  KeyframedParamPropertyResult,
} from "./lib/panels/properties/hooks/use-keyframed-param-property";
export { usePropertyDraft } from "./lib/panels/properties/hooks/use-property-draft";

// --- Section primitive (used by PropertiesPanel + future tab content) ---
export {
  Section,
  SectionHeader,
  SectionTitle,
  SectionFields,
  SectionField,
  SectionContent,
} from "./lib/components/section";

// --- Extra UI primitives ported for PropertiesPanel ---
export { NumberField } from "./lib/components/ui/number-field";
export { Switch } from "./lib/components/ui/switch";
export { Textarea } from "./lib/components/ui/textarea";

// --- Masks: pointer/handle interaction hook (unblocks PreviewPanel's
// mask-handles overlay; PreviewPanel now drives the real MaskHandles
// component end-to-end). ---
export { useMaskHandles } from "./lib/masks/use-mask-handles";
export { useFocusLock } from "./lib/hooks/use-focus-lock";

// --- Editor shell ---
// The chrome around the editor surface ported from opencut-classic:
// header (project menu + editable name + export button), the export
// popover, the mobile-blocker gate, the first-run onboarding dialog,
// and the scene switcher sheet. Hosts that want a turnkey shell can
// mount these directly; hosts that ship their own chrome can pick
// individual pieces.
export { EditorHeader } from "./lib/components/editor/editor-header";
export { ExportButton } from "./lib/components/editor/export-button";
export { MobileGate } from "./lib/components/editor/mobile-gate";
export { Onboarding } from "./lib/components/editor/onboarding";
export { ScenesView } from "./lib/components/editor/scenes-view";

// --- Actions subsystem ---
// Registry + dispatcher for editor-wide commands. `invokeAction` fires
// a registered handler (split, undo, toggle-play, etc.) without
// coupling the caller to the manager that performs the work.
// `useEditorActions` wires the canonical handler set against
// EditorCore; `useKeybindingsListener` attaches the global keydown
// dispatcher. Both are mounted automatically by <VideoEditor>. Hosts
// that compose their own shell with <EditorProvider> directly must
// call them inside that tree; hosts that want a subset of handlers
// can call `useActionHandler` directly instead.
export {
  invokeAction,
  bindAction,
  unbindAction,
  ACTIONS,
  getActionDefinition,
  getDefaultShortcuts,
} from "./lib/actions";
export type {
  TAction,
  TActionArgsMap,
  TActionWithArgs,
  TActionWithNoArgs,
  TActionWithOptionalArgs,
  TActionFunc,
  TActionHandlerOptions,
  TActionDefinition,
  TActionBaseDefinition,
  TActionCategory,
  TArgOfAction,
  TInvocationTrigger,
} from "./lib/actions";
export { useEditorActions } from "./lib/actions/use-editor-actions";
export { useActionHandler } from "./lib/actions/use-action-handler";
export { useKeybindingsListener } from "./lib/actions/use-keybindings";
export { useKeybindingsStore } from "./lib/actions/keybindings-store";
export type { KeybindingConflict } from "./lib/actions/keybindings-store";
export {
  useKeyboardShortcutsHelp,
} from "./lib/actions/use-keyboard-shortcuts-help";
export type { KeyboardShortcut } from "./lib/actions/use-keyboard-shortcuts-help";
export { ShortcutsDialog } from "./lib/actions/shortcuts-dialog";
export {
  isKey,
} from "./lib/actions/keybinding";
export type {
  Key,
  KeybindingConfig,
  ModifierKeys,
  ModifierBasedShortcutKey,
  ShortcutKey,
  SingleCharacterShortcutKey,
} from "./lib/actions/keybinding";

// --- Selection scope (escape-key cancellation registry shared by
// editor-actions and timeline selection scopes) ---
export {
  activateScope,
  clearActiveScope,
} from "./lib/selection/scope";
export type { ScopeEntry } from "./lib/selection/scope";

// --- AssetsPanel ---
// The full AssetsPanel subsystem ported from opencut-classic. Renders
// the left-rail tab bar (media/sounds/text/stickers/effects/captions/
// settings), the media gallery view (grid or list, sortable, with
// drag-to-import + context-menu deletion), the project settings view
// (frame rate, aspect ratio, custom canvas size), and the background
// settings view (blur previews + solid colors + pattern-craft +
// syntax-ui gradient swatches).
//
// Captions still renders a "coming soon" placeholder — depends on the
// transcription subsystem (deferred per port scope).
//
// Mount inside <EditorProvider>; the panel reads/writes its UI prefs
// (active tab, media view mode, sort order) through `useAssetsPanelStore`.
export { AssetsPanel } from "./lib/panels/assets";
export { TabBar as AssetsPanelTabBar } from "./lib/panels/assets/tabbar";
export { MediaDragOverlay } from "./lib/panels/assets/drag-overlay";
export { DraggableItem } from "./lib/panels/assets/draggable-item";
export type { DraggableItemProps } from "./lib/panels/assets/draggable-item";
export {
  TAB_KEYS as ASSETS_PANEL_TAB_KEYS,
  tabs as assetsPanelTabs,
  useAssetsPanelStore,
} from "./lib/panels/assets/assets-panel-store";
export type {
  Tab as AssetsPanelTab,
  MediaViewMode,
  MediaSortKey,
  MediaSortOrder,
} from "./lib/panels/assets/assets-panel-store";

// --- Fonts ---
// Atlas-backed Google Fonts picker ported from opencut-classic. The
// FontPicker drives masks/text-mask params today and the upcoming
// TextView once that lands. Hosts that need to preload a Google font
// outside the picker (e.g. before rendering an export frame) call
// loadFullFont / loadFonts directly. SYSTEM_FONTS is the bundled
// short-list that never needs network loading.
export { FontPicker } from "./lib/components/ui/font-picker";
export {
  SYSTEM_FONTS,
  useFontAtlas,
  loadFontAtlas,
  getCachedFontAtlas,
  clearFontAtlasCache,
  loadFullFont,
  loadFonts,
} from "./lib/fonts";
export type {
  FontOption,
  GoogleFontMeta,
  FontAtlas,
  FontAtlasEntry,
} from "./lib/fonts";

// --- Text view ---
// AssetsPanel "Text" tab content. Drags a default text element onto the
// active scene's timeline at the current playhead time.
export { TextView } from "./lib/text/components/assets-view";

// --- Effects view ---
// AssetsPanel "Effects" tab content. Renders a grid of effect previews
// (live-rendered via effectPreviewService) drawn from effectsRegistry.
// Each item is draggable onto the timeline as a standalone effect clip.
export { EffectsView } from "./lib/effects/components/assets-view";

// --- Project dialogs ---
// Confirmation dialogs ported from opencut-classic. RenameProjectDialog
// drives the rename flow; DeleteProjectDialog drives single- and
// multi-project delete confirmation. Both are wired into EditorHeader's
// ProjectDropdown via the `openDialog` state.
export { RenameProjectDialog } from "./lib/project/components/rename-project-dialog";
export { DeleteProjectDialog } from "./lib/project/components/delete-project-dialog";

// --- Sounds ---
// AssetsPanel "Sounds" tab content. SoundsView renders the sound-effects
// + saved-sounds tabs with search, infinite scroll, previewing, and
// timeline insertion. Data flows through SoundsAdapter — the lib ships
// an emptySoundsAdapter default; hosts wire their own search / saved-
// sound backend (Artcraft routes through the storyteller-web sounds
// proxy).
export { SoundsView } from "./lib/sounds/components/assets-view";
export { useSoundsStore } from "./lib/sounds/sounds-store";
export { useSoundSearch } from "./lib/sounds/use-sound-search";
export type {
  SoundEffect,
  SavedSound,
  SavedSoundsData,
} from "./lib/sounds/types";
export type { SoundsAdapter, SoundsSearchResult } from "./lib/adapters";
export { emptySoundsAdapter } from "./lib/adapters/default";

// --- Stickers ---
// AssetsPanel "Stickers" tab content. StickersView renders the
// category-grouped browse view (Shapes drives the only non-empty
// category today; Logos is intentionally empty) plus a search box.
// Items are inserted onto the timeline via DraggableItem (graphic for
// shapes, sticker for non-shape providers). Hosts that need direct
// access to the provider registry can register their own providers
// via `stickersRegistry.register({ key, definition })` before mounting.
export { StickersView } from "./lib/stickers/components/assets-view";
export { useStickersStore } from "./lib/stickers/stickers-store";
export {
  STICKER_CATEGORIES,
} from "./lib/stickers/categories";
export {
  searchStickers,
  searchAll,
  browseAll,
  browseCategory,
  resolveStickerIntrinsicSize,
  resolveStickerId,
  registerDefaultStickerProviders,
  stickersRegistry,
  StickersRegistry,
  STICKER_INTRINSIC_SIZE_FALLBACK,
  parseStickerId,
  buildStickerId,
} from "./lib/stickers";
export { shapesProvider, parseShapeStickerId } from "./lib/stickers/providers/shapes";
export { logosProvider } from "./lib/stickers/providers/logos";
export type {
  StickerBrowseResult,
  StickerBrowseSection,
  StickerCategory,
  StickerItem,
  StickerProvider,
  StickerProviderBrowseOptions,
  StickerProviderSearchOptions,
  StickerResolveOptions,
  StickerSearchResult,
} from "./lib/stickers";
