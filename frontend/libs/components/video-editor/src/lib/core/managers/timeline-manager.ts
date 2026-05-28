import type { EditorCore } from "../index";
import type { ElementBounds } from "../../preview/element-bounds";
import type { ParamValues, ParamValue } from "../../params";
import type {
  SceneTracks,
  TrackType,
  TimelineTrack,
  TimelineElement,
  RetimeConfig,
} from "../../timeline/types";
import { calculateTotalDuration } from "../../timeline/calculate-duration";
import { TimelineDragSource } from "../../timeline/drag-source";
import { findTrackInSceneTracks } from "../../timeline/track-element-update";
import { lastFrameMediaTime, type MediaTime, ZERO_MEDIA_TIME } from "../../wasm";
import {
  canElementBeHidden,
  canElementHaveAudio,
} from "../../timeline/element-utils";
import { isElementMuted } from "../../timeline/audio-state";
import type {
  AnimationPath,
  AnimationInterpolation,
  ScalarCurveKeyframePatch,
} from "../../animation/types";
import {
  getElementLocalTime,
  resolveAnimationPathValueAtTime,
} from "../../animation";
import { resolveAnimationTarget } from "../../timeline/animation-targets";
import { BatchCommand } from "../../commands";
import {
  AddTrackCommand,
  RemoveTrackCommand,
  ToggleTrackMuteCommand,
  ToggleTrackVisibilityCommand,
  InsertElementCommand,
  DeleteElementsCommand,
  DuplicateElementsCommand,
  UpdateElementsCommand,
  SplitElementsCommand,
  MoveElementCommand,
  TracksSnapshotCommand,
  UpsertKeyframeCommand,
  RemoveKeyframeCommand,
  RetimeKeyframeCommand,
  UpdateScalarKeyframeCurveCommand,
  AddClipEffectCommand,
  DeleteFreeformPathMaskPointsCommand,
  InsertFreeformPathMaskPointCommand,
  RemoveClipEffectCommand,
  UpdateClipEffectParamsCommand,
  ToggleClipEffectCommand,
  ReorderClipEffectsCommand,
  RemoveMaskCommand,
  ToggleMaskInvertedCommand,
  UpsertEffectParamKeyframeCommand,
  RemoveEffectParamKeyframeCommand,
  ToggleSourceAudioSeparationCommand,
} from "../../commands/timeline";
import type { InsertElementParams } from "../../commands/timeline/element/insert-element";
import type {
  PlannedElementMove,
  PlannedTrackCreation,
} from "../../timeline/group-move";

export class TimelineManager {
  private listeners = new Set<() => void>();
  private previewOverlay = new Map<string, Partial<TimelineElement>>();
  private previewTracks: SceneTracks | null = null;
  public readonly dragSource = new TimelineDragSource();

  constructor(private editor: EditorCore) {}

  addTrack({ type, index }: { type: TrackType; index?: number }): string {
    const command = new AddTrackCommand({ type, index });
    this.editor.command.execute({ command });
    return command.getTrackId();
  }

  removeTrack({ trackId }: { trackId: string }): void {
    const command = new RemoveTrackCommand(trackId);
    this.editor.command.execute({ command });
  }

  insertElement({ element, placement }: InsertElementParams): void {
    const command = new InsertElementCommand({ element, placement });
    this.editor.command.execute({ command });
  }

  updateElementTrim({
    elementId,
    trimStart,
    trimEnd,
    startTime,
    duration,
    pushHistory = true,
  }: {
    elementId: string;
    trimStart: MediaTime;
    trimEnd: MediaTime;
    startTime?: MediaTime;
    duration?: MediaTime;
    pushHistory?: boolean;
  }): void {
    const trackId = this.findTrackIdForElement({ elementId });
    if (!trackId) {
      return;
    }

    const nextUpdates: Partial<TimelineElement> = {
      trimStart,
      trimEnd,
    };
    if (startTime !== undefined) {
      nextUpdates.startTime = startTime;
    }
    if (duration !== undefined) {
      nextUpdates.duration = duration;
    }

    this.updateElements({
      updates: [
        {
          trackId,
          elementId,
          patch: nextUpdates,
        },
      ],
      pushHistory,
    });
  }

  updateElementRetime({
    trackId,
    elementId,
    retime,
    pushHistory = true,
  }: {
    trackId: string;
    elementId: string;
    retime?: RetimeConfig;
    pushHistory?: boolean;
  }): void {
    this.updateElements({
      updates: [
        {
          trackId,
          elementId,
          patch: {
            retime,
          },
        },
      ],
      pushHistory,
    });
  }

  moveElements({
    moves,
    createTracks,
  }: {
    moves: PlannedElementMove[];
    createTracks?: PlannedTrackCreation[];
  }): void {
    if (moves.length === 0) {
      return;
    }

    const command = new MoveElementCommand({
      moves,
      createTracks,
    });
    this.editor.command.execute({ command });
  }

  toggleTrackMute({ trackId }: { trackId: string }): void {
    const command = new ToggleTrackMuteCommand(trackId);
    this.editor.command.execute({ command });
  }

  toggleTrackVisibility({ trackId }: { trackId: string }): void {
    const command = new ToggleTrackVisibilityCommand(trackId);
    this.editor.command.execute({ command });
  }

  splitElements({
    elements,
    splitTime,
    retainSide = "both",
  }: {
    elements: { trackId: string; elementId: string }[];
    splitTime: MediaTime;
    retainSide?: "both" | "left" | "right";
  }): { trackId: string; elementId: string }[] {
    const command = new SplitElementsCommand({
      elements,
      splitTime,
      retainSide,
    });
    this.editor.command.execute({ command });
    return command.getRightSideElements();
  }

  getTotalDuration(): MediaTime {
    const activeScene = this.editor.scenes.getActiveSceneOrNull();
    if (!activeScene) {
      return ZERO_MEDIA_TIME;
    }

    return calculateTotalDuration({ tracks: activeScene.tracks });
  }

  getLastFrameTime(): MediaTime {
    const duration = this.getTotalDuration();
    const fps = this.editor.project.getActive()?.settings.fps;
    if (!fps || duration <= 0) return duration;
    return lastFrameMediaTime({ duration, fps });
  }

  getTrackById({ trackId }: { trackId: string }): TimelineTrack | null {
    const activeScene = this.editor.scenes.getActiveSceneOrNull();
    if (!activeScene) {
      return null;
    }

    return findTrackInSceneTracks({ tracks: activeScene.tracks, trackId });
  }

  getElementsWithTracks({
    elements,
  }: {
    elements: { trackId: string; elementId: string }[];
  }): Array<{ track: TimelineTrack; element: TimelineElement }> {
    const result: Array<{ track: TimelineTrack; element: TimelineElement }> =
      [];

    for (const { trackId, elementId } of elements) {
      const track = this.getTrackById({ trackId });
      const element = track?.elements.find(
        (trackElement) => trackElement.id === elementId,
      );

      if (track && element) {
        result.push({ track, element });
      }
    }

    return result;
  }

  deleteElements({
    elements,
  }: {
    elements: { trackId: string; elementId: string }[];
  }): void {
    const command = new DeleteElementsCommand({ elements });
    this.editor.command.execute({ command });
  }

  toggleSourceAudioSeparation({
    trackId,
    elementId,
  }: {
    trackId: string;
    elementId: string;
  }): void {
    const command = new ToggleSourceAudioSeparationCommand({
      trackId,
      elementId,
    });
    this.editor.command.execute({ command });
  }

  updateElements({
    updates,
    pushHistory = true,
  }: {
    updates: Array<{
      trackId: string;
      elementId: string;
      patch: Partial<TimelineElement>;
    }>;
    pushHistory?: boolean;
  }): void {
    if (updates.length === 0) {
      return;
    }

    const command = new UpdateElementsCommand({
      updates,
    });
    if (pushHistory) {
      this.editor.command.execute({ command });
    } else {
      command.execute();
    }
  }

  addClipEffect({
    trackId,
    elementId,
    effectType,
  }: {
    trackId: string;
    elementId: string;
    effectType: string;
  }): string {
    const command = new AddClipEffectCommand({
      trackId,
      elementId,
      effectType,
    });
    this.editor.command.execute({ command });
    return command.getEffectId() ?? "";
  }

  removeClipEffect({
    trackId,
    elementId,
    effectId,
  }: {
    trackId: string;
    elementId: string;
    effectId: string;
  }): void {
    const command = new RemoveClipEffectCommand({
      trackId,
      elementId,
      effectId,
    });
    this.editor.command.execute({ command });
  }

  removeMask({
    trackId,
    elementId,
    maskId,
  }: {
    trackId: string;
    elementId: string;
    maskId: string;
  }): void {
    const command = new RemoveMaskCommand({
      trackId,
      elementId,
      maskId,
    });
    this.editor.command.execute({ command });
  }

  deleteFreeformPathMaskPoints({
    trackId,
    elementId,
    maskId,
    pointIds,
  }: {
    trackId: string;
    elementId: string;
    maskId: string;
    pointIds: string[];
  }): void {
    if (pointIds.length === 0) {
      return;
    }
    const command = new DeleteFreeformPathMaskPointsCommand({
      trackId,
      elementId,
      maskId,
      pointIds,
    });
    this.editor.command.execute({ command });
  }

  insertFreeformPathMaskPoint({
    trackId,
    elementId,
    maskId,
    segmentIndex,
    canvasPoint,
    bounds,
  }: {
    trackId: string;
    elementId: string;
    maskId: string;
    segmentIndex: number;
    canvasPoint: { x: number; y: number };
    bounds: ElementBounds;
  }): void {
    const command = new InsertFreeformPathMaskPointCommand({
      trackId,
      elementId,
      maskId,
      segmentIndex,
      canvasPoint,
      bounds,
    });
    this.editor.command.execute({ command });
  }

  updateClipEffectParams({
    trackId,
    elementId,
    effectId,
    params,
    pushHistory = true,
  }: {
    trackId: string;
    elementId: string;
    effectId: string;
    params: Partial<ParamValues>;
    pushHistory?: boolean;
  }): void {
    const command = new UpdateClipEffectParamsCommand({
      trackId,
      elementId,
      effectId,
      params,
    });
    if (pushHistory) {
      this.editor.command.execute({ command });
    } else {
      command.execute();
    }
  }

  toggleClipEffect({
    trackId,
    elementId,
    effectId,
  }: {
    trackId: string;
    elementId: string;
    effectId: string;
  }): void {
    const command = new ToggleClipEffectCommand({
      trackId,
      elementId,
      effectId,
    });
    this.editor.command.execute({ command });
  }

  toggleMaskInverted({
    trackId,
    elementId,
    maskId,
  }: {
    trackId: string;
    elementId: string;
    maskId: string;
  }): void {
    const command = new ToggleMaskInvertedCommand({
      trackId,
      elementId,
      maskId,
    });
    this.editor.command.execute({ command });
  }

  reorderClipEffects({
    trackId,
    elementId,
    fromIndex,
    toIndex,
  }: {
    trackId: string;
    elementId: string;
    fromIndex: number;
    toIndex: number;
  }): void {
    const command = new ReorderClipEffectsCommand({
      trackId,
      elementId,
      fromIndex,
      toIndex,
    });
    this.editor.command.execute({ command });
  }

  upsertKeyframes({
    keyframes,
  }: {
    keyframes: Array<{
      trackId: string;
      elementId: string;
      propertyPath: AnimationPath;
      time: MediaTime;
      value: ParamValue;
      interpolation?: AnimationInterpolation;
      keyframeId?: string;
    }>;
  }): void {
    if (keyframes.length === 0) {
      return;
    }

    const commands = keyframes.map(
      ({
        trackId,
        elementId,
        propertyPath,
        time,
        value,
        interpolation,
        keyframeId,
      }) =>
        new UpsertKeyframeCommand({
          trackId,
          elementId,
          propertyPath,
          time,
          value,
          interpolation,
          keyframeId,
        }),
    );
    const command =
      commands.length === 1 ? commands[0] : new BatchCommand(commands);
    this.editor.command.execute({ command });
  }

  removeKeyframes({
    keyframes,
  }: {
    keyframes: Array<{
      trackId: string;
      elementId: string;
      propertyPath: AnimationPath;
      keyframeId: string;
    }>;
  }): void {
    if (keyframes.length === 0) {
      return;
    }

    const playheadTime = this.editor.playback.getCurrentTime();
    const valueAtPlayheadMap = new Map<string, ParamValue | null>();

    for (const { trackId, elementId, propertyPath } of keyframes) {
      const key = `${elementId}:${propertyPath}`;
      if (valueAtPlayheadMap.has(key)) {
        continue;
      }

      const element = this.getElementByRef({ trackId, elementId });
      if (!element) {
        valueAtPlayheadMap.set(key, null);
        continue;
      }

      const localTime = getElementLocalTime({
        timelineTime: playheadTime,
        elementStartTime: element.startTime,
        elementDuration: element.duration,
      });

      const target = resolveAnimationTarget({ element, path: propertyPath });
      const baseValue = target?.getBaseValue() ?? null;
      if (baseValue === null) {
        valueAtPlayheadMap.set(key, null);
        continue;
      }

      const value = resolveAnimationPathValueAtTime({
        animations: element.animations,
        propertyPath,
        localTime,
        fallbackValue: baseValue,
      });
      valueAtPlayheadMap.set(key, value);
    }

    const commands = keyframes.map(
      ({ trackId, elementId, propertyPath, keyframeId }) =>
        new RemoveKeyframeCommand({
          trackId,
          elementId,
          propertyPath,
          keyframeId,
          valueAtPlayhead:
            valueAtPlayheadMap.get(`${elementId}:${propertyPath}`) ?? null,
        }),
    );
    const command =
      commands.length === 1 ? commands[0] : new BatchCommand(commands);
    this.editor.command.execute({ command });
  }

  retimeKeyframe({
    trackId,
    elementId,
    propertyPath,
    keyframeId,
    time,
  }: {
    trackId: string;
    elementId: string;
    propertyPath: AnimationPath;
    keyframeId: string;
    time: MediaTime;
  }): void {
    const command = new RetimeKeyframeCommand({
      trackId,
      elementId,
      propertyPath,
      keyframeId,
      nextTime: time,
    });
    this.editor.command.execute({ command });
  }

  updateKeyframeCurves({
    keyframes,
  }: {
    keyframes: Array<{
      trackId: string;
      elementId: string;
      propertyPath: AnimationPath;
      componentKey: string;
      keyframeId: string;
      patch: ScalarCurveKeyframePatch;
    }>;
  }): void {
    if (keyframes.length === 0) {
      return;
    }

    const commands = keyframes.map(
      ({ trackId, elementId, propertyPath, componentKey, keyframeId, patch }) =>
        new UpdateScalarKeyframeCurveCommand({
          trackId,
          elementId,
          propertyPath,
          componentKey,
          keyframeId,
          patch,
        }),
    );
    const command =
      commands.length === 1 ? commands[0] : new BatchCommand(commands);
    this.editor.command.execute({ command });
  }

  upsertEffectParamKeyframe({
    trackId,
    elementId,
    effectId,
    paramKey,
    time,
    value,
    interpolation,
    keyframeId,
  }: {
    trackId: string;
    elementId: string;
    effectId: string;
    paramKey: string;
    time: MediaTime;
    value: number;
    interpolation?: "linear" | "hold";
    keyframeId?: string;
  }): void {
    const command = new UpsertEffectParamKeyframeCommand({
      trackId,
      elementId,
      effectId,
      paramKey,
      time,
      value,
      interpolation,
      keyframeId,
    });
    this.editor.command.execute({ command });
  }

  removeEffectParamKeyframe({
    trackId,
    elementId,
    effectId,
    paramKey,
    keyframeId,
  }: {
    trackId: string;
    elementId: string;
    effectId: string;
    paramKey: string;
    keyframeId: string;
  }): void {
    const command = new RemoveEffectParamKeyframeCommand({
      trackId,
      elementId,
      effectId,
      paramKey,
      keyframeId,
    });
    this.editor.command.execute({ command });
  }

  isPreviewActive(): boolean {
    return this.previewOverlay.size > 0;
  }

  previewElements({
    updates,
  }: {
    updates: readonly {
      trackId: string;
      elementId: string;
      updates: Partial<TimelineElement>;
    }[];
  }): void {
    let changedOverlayCount = 0;
    for (const { elementId, updates: elementUpdates } of updates) {
      const existingOverlay = this.previewOverlay.get(elementId);
      const changed = Object.entries(elementUpdates).some(([key, value]) => {
        return !Object.is(
          existingOverlay?.[key as keyof TimelineElement],
          value,
        );
      });
      if (changed) {
        changedOverlayCount += 1;
        const mergedOverlay = {
          ...existingOverlay,
          ...elementUpdates,
        } as Partial<TimelineElement>;
        this.previewOverlay.set(elementId, mergedOverlay);
      }
    }
    const committedTracks = this.editor.scenes.getActiveSceneOrNull()?.tracks;
    if (!committedTracks) {
      return;
    }
    if (changedOverlayCount === 0) {
      return;
    }
    this.previewTracks = this.applyPreviewOverlay(committedTracks);
    this.notify();
  }

  commitPreview(): void {
    if (this.previewOverlay.size === 0) return;
    const committedTracks = this.editor.scenes.getActiveSceneOrNull()?.tracks;
    if (!committedTracks) {
      return;
    }
    const afterTracks =
      this.previewTracks ?? this.applyPreviewOverlay(committedTracks);
    const command = new TracksSnapshotCommand({
      before: committedTracks,
      after: afterTracks,
    });
    this.editor.command.push({ command });
    this.previewOverlay.clear();
    this.previewTracks = null;
    this.updateTracks(afterTracks);
  }

  discardPreview(): void {
    if (this.previewOverlay.size === 0) return;
    this.previewOverlay.clear();
    this.previewTracks = null;
    this.notify();
  }

  duplicateElements({
    elements,
  }: {
    elements: { trackId: string; elementId: string }[];
  }): { trackId: string; elementId: string }[] {
    const command = new DuplicateElementsCommand({ elements });
    this.editor.command.execute({ command });
    return command.getDuplicatedElements();
  }

  toggleElementsVisibility({
    elements,
  }: {
    elements: { trackId: string; elementId: string }[];
  }): void {
    const shouldHide = elements.some(({ trackId, elementId }) => {
      const element = this.getElementByRef({ trackId, elementId });
      return element && canElementBeHidden(element) && !element.hidden;
    });

    const nextUpdates = elements.flatMap(({ trackId, elementId }) => {
      const element = this.getElementByRef({ trackId, elementId });
      if (!element || !canElementBeHidden(element)) {
        return [];
      }

      return [
        {
          trackId,
          elementId,
          patch: { hidden: shouldHide },
        },
      ];
    });

    this.updateElements({ updates: nextUpdates });
  }

  toggleElementsMuted({
    elements,
  }: {
    elements: { trackId: string; elementId: string }[];
  }): void {
    const shouldMute = elements.some(({ trackId, elementId }) => {
      const element = this.getElementByRef({ trackId, elementId });
      return element && canElementHaveAudio(element) && !isElementMuted({ element });
    });

    const nextUpdates = elements.flatMap(({ trackId, elementId }) => {
      const element = this.getElementByRef({ trackId, elementId });
      if (!element || !canElementHaveAudio(element)) {
        return [];
      }

      return [
        {
          trackId,
          elementId,
          patch: { params: { muted: shouldMute } },
        },
      ];
    });

    this.updateElements({ updates: nextUpdates });
  }

  getPreviewTracks(): SceneTracks | null {
    return (
      this.previewTracks ??
      this.editor.scenes.getActiveSceneOrNull()?.tracks ??
      null
    );
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  updateTracks(newTracks: SceneTracks): void {
    this.previewOverlay.clear();
    this.previewTracks = null;
    this.editor.scenes.updateSceneTracks({ tracks: newTracks });
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      fn();
    });
  }

  private getElementByRef({
    trackId,
    elementId,
  }: {
    trackId: string;
    elementId: string;
  }): TimelineElement | undefined {
    return this.getTrackById({ trackId })?.elements.find(
      (element) => element.id === elementId,
    );
  }

  private findTrackIdForElement({
    elementId,
  }: {
    elementId: string;
  }): string | null {
    const activeScene = this.editor.scenes.getActiveSceneOrNull();
    if (!activeScene) {
      return null;
    }

    if (
      activeScene.tracks.main.elements.some(
        (element) => element.id === elementId,
      )
    ) {
      return activeScene.tracks.main.id;
    }

    for (const track of activeScene.tracks.overlay) {
      if (track.elements.some((element) => element.id === elementId)) {
        return track.id;
      }
    }

    for (const track of activeScene.tracks.audio) {
      if (track.elements.some((element) => element.id === elementId)) {
        return track.id;
      }
    }

    return null;
  }

  private applyPreviewOverlay(tracks: SceneTracks): SceneTracks {
    if (this.previewOverlay.size === 0) return tracks;

    const applyTrackOverlay = <TTrack extends TimelineTrack>(
      track: TTrack,
    ): TTrack => {
      const hasOverlay = track.elements.some((element) =>
        this.previewOverlay.has(element.id),
      );
      if (!hasOverlay) {
        return track;
      }

      const nextElements = track.elements.map((element) => {
        const overlay = this.previewOverlay.get(element.id);
        return overlay
          ? ({ ...element, ...overlay } as TimelineElement)
          : element;
      });

      return { ...track, elements: nextElements } as TTrack;
    };

    return {
      overlay: tracks.overlay.map((track) => applyTrackOverlay(track)),
      main: applyTrackOverlay(tracks.main),
      audio: tracks.audio.map((track) => applyTrackOverlay(track)),
    };
  }
}
