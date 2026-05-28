import type { MouseEvent as ReactMouseEvent } from "react";
import { BASE_TIMELINE_PIXELS_PER_SECOND } from "../scale";
import {
  addMediaTime,
  maxMediaTime,
  type MediaTime,
  mediaTime,
  minMediaTime,
  subMediaTime,
  TICKS_PER_SECOND,
} from "../../wasm";
import {
  computeGroupResize,
  type GroupResizeMember,
  type GroupResizeResult,
  type GroupResizeUpdate,
  type ResizeSide,
} from "../group-resize";
import {
  buildTimelineSnapPoints,
  getTimelineSnapThresholdInTicks,
  resolveTimelineSnap,
  type SnapPoint,
} from "../snapping";
import { getElementEdgeSnapPoints } from "../element-snap-source";
import { getPlayheadSnapPoints } from "../playhead-snap-source";
import { getAnimationKeyframeSnapPointsForTimeline } from "../animation-snap-points";
import { isRetimableElement } from "../element-utils";
import type {
  ElementRef,
  SceneTracks,
  TimelineElement,
  TimelineTrack,
} from "../types";
import type { FrameRate } from "opencut-wasm";

// --- Session ---

interface ResizeSession {
  kind: "active";
  side: ResizeSide;
  startX: number;
  fps: FrameRate;
  members: GroupResizeMember[];
  result: GroupResizeResult | null;
}

type Session = { kind: "idle" } | ResizeSession;

// --- Config ---

export interface ResizeConfig {
  zoomLevel: number;
  snappingEnabled: boolean;
  isShiftHeld: () => boolean;
  getSceneTracks: () => SceneTracks;
  getCurrentPlayheadTime: () => MediaTime;
  getActiveProjectFps: () => FrameRate | null;
  selectedElements: ElementRef[];
  discardPreview: () => void;
  previewElements: (updates: GroupResizeUpdate[]) => void;
  commitElements: (updates: GroupResizeUpdate[]) => void;
  onSnapPointChange?: (snapPoint: SnapPoint | null) => void;
}

export interface ResizeConfigRef {
  readonly current: ResizeConfig;
}

// --- Pure helpers ---

export function buildResizeMembers({
  tracks,
  selectedElements,
}: {
  tracks: SceneTracks;
  selectedElements: ElementRef[];
}): GroupResizeMember[] {
  const selectedElementIds = new Set(
    selectedElements.map((el) => el.elementId),
  );
  const trackMap = new Map(
    [...tracks.overlay, tracks.main, ...tracks.audio].map((track) => [
      track.id,
      track,
    ]),
  );

  return selectedElements.flatMap(({ trackId, elementId }) => {
    const track = trackMap.get(trackId);
    const element = track?.elements.find((el) => el.id === elementId);
    if (!track || !element) return [];

    const otherElements = track.elements.filter(
      (el) => !selectedElementIds.has(el.id),
    );
    const leftNeighborBound = otherElements
      .filter(
        (el) =>
          addMediaTime({ a: el.startTime, b: el.duration }) <=
          element.startTime,
      )
      .reduce<MediaTime | null>((bound, el) => {
        const elementEnd = addMediaTime({
          a: el.startTime,
          b: el.duration,
        });
        return bound === null
          ? elementEnd
          : maxMediaTime({ a: bound, b: elementEnd });
      }, null);
    const rightNeighborBound = otherElements
      .filter(
        (el) =>
          el.startTime >= addMediaTime({ a: element.startTime, b: element.duration }),
      )
      .reduce<MediaTime | null>(
        (bound, el) =>
          bound === null
            ? el.startTime
            : minMediaTime({ a: bound, b: el.startTime }),
        null,
      );

    return [
      {
        trackId,
        elementId,
        startTime: element.startTime,
        duration: element.duration,
        trimStart: element.trimStart,
        trimEnd: element.trimEnd,
        sourceDuration: element.sourceDuration,
        retime: isRetimableElement(element) ? element.retime : undefined,
        leftNeighborBound,
        rightNeighborBound,
      },
    ];
  });
}

function hasResizeChanges({
  members,
  result,
}: {
  members: GroupResizeMember[];
  result: GroupResizeResult;
}): boolean {
  return result.updates.some((update) => {
    const member = members.find((m) => m.elementId === update.elementId);
    return (
      member?.trimStart !== update.patch.trimStart ||
      member?.trimEnd !== update.patch.trimEnd ||
      member?.startTime !== update.patch.startTime ||
      member?.duration !== update.patch.duration
    );
  });
}

// --- Controller ---

export class ResizeController {
  private session: Session = { kind: "idle" };
  private readonly subscribers = new Set<() => void>();
  private readonly configRef: ResizeConfigRef;

  constructor(deps: { configRef: ResizeConfigRef }) {
    this.configRef = deps.configRef;
    this.onResizeStart = this.onResizeStart.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  private get config(): ResizeConfig {
    return this.configRef.current;
  }

  get isResizing(): boolean {
    return this.session.kind === "active";
  }

  subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  cancel(): void {
    this.config.discardPreview();
    this.finishSession();
  }

  destroy(): void {
    this.deactivate();
    this.subscribers.clear();
  }

  onResizeStart({
    event,
    element,
    track,
    side,
  }: {
    event: ReactMouseEvent;
    element: TimelineElement;
    track: TimelineTrack;
    side: ResizeSide;
  }): void {
    event.stopPropagation();
    event.preventDefault();

    // UI should prevent this, but be explicit: a new resize start
    // means the previous one is abandoned, not silently replaced.
    if (this.session.kind === "active") this.cancel();

    const fps = this.config.getActiveProjectFps();
    if (!fps) return;

    const ref = { trackId: track.id, elementId: element.id };
    const activeSelection = this.config.selectedElements.some(
      (el) => el.trackId === track.id && el.elementId === element.id,
    )
      ? this.config.selectedElements
      : [ref];

    const members = buildResizeMembers({
      tracks: this.config.getSceneTracks(),
      selectedElements: activeSelection,
    });
    if (members.length === 0) return;

    this.config.discardPreview();

    this.session = {
      kind: "active",
      side,
      startX: event.clientX,
      fps,
      members,
      result: null,
    };
    this.activate();
    this.notify();
  }

  private activate(): void {
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  private deactivate(): void {
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  private notify(): void {
    for (const fn of this.subscribers) fn();
  }

  private finishSession(): void {
    this.session = { kind: "idle" };
    this.deactivate();
    this.config.onSnapPointChange?.(null);
    this.notify();
  }

  private snappedDelta({
    session,
    rawDeltaTime,
  }: {
    session: ResizeSession;
    rawDeltaTime: MediaTime;
  }): MediaTime {
    const { snappingEnabled, isShiftHeld, zoomLevel } = this.config;

    if (!snappingEnabled || isShiftHeld()) {
      this.config.onSnapPointChange?.(null);
      return rawDeltaTime;
    }

    const tracks = this.config.getSceneTracks();
    const playheadTime = this.config.getCurrentPlayheadTime();
    const excludeElementIds = new Set(session.members.map((m) => m.elementId));

    const snapPoints = buildTimelineSnapPoints({
      sources: [
        () => getElementEdgeSnapPoints({ tracks, excludeElementIds }),
        () => getPlayheadSnapPoints({ playheadTime }),
        () =>
          getAnimationKeyframeSnapPointsForTimeline({
            tracks,
            excludeElementIds,
          }),
      ],
    });
    const maxSnapDistance = getTimelineSnapThresholdInTicks({ zoomLevel });

    let closestSnapPoint: SnapPoint | null = null;
    let closestSnapDistance = Infinity;
    let deltaTime = rawDeltaTime;

    for (const member of session.members) {
      const baseEdgeTime =
        session.side === "left"
          ? member.startTime
          : addMediaTime({ a: member.startTime, b: member.duration });
      const snapResult = resolveTimelineSnap({
        targetTime: addMediaTime({ a: baseEdgeTime, b: rawDeltaTime }),
        snapPoints,
        maxSnapDistance,
      });
      if (
        snapResult.snapPoint &&
        snapResult.snapDistance < closestSnapDistance
      ) {
        closestSnapDistance = snapResult.snapDistance;
        closestSnapPoint = snapResult.snapPoint;
        deltaTime = subMediaTime({ a: snapResult.snappedTime, b: baseEdgeTime });
      }
    }

    this.config.onSnapPointChange?.(closestSnapPoint);
    return deltaTime;
  }

  private handleMouseMove({ clientX }: MouseEvent): void {
    if (this.session.kind !== "active") return;
    const session = this.session;

    const rawDeltaTime = mediaTime({
      ticks: Math.round(
        ((clientX - session.startX) /
          (BASE_TIMELINE_PIXELS_PER_SECOND * this.config.zoomLevel)) *
          TICKS_PER_SECOND,
      ),
    });
    const deltaTime = this.snappedDelta({ session, rawDeltaTime });
    const result = computeGroupResize({
      members: session.members,
      side: session.side,
      deltaTime,
      fps: session.fps,
    });

    session.result = result;
    this.config.previewElements(result.updates);
  }

  private handleMouseUp(): void {
    if (this.session.kind !== "active") return;
    const session = this.session;

    this.config.discardPreview();

    if (
      session.result &&
      hasResizeChanges({ members: session.members, result: session.result })
    ) {
      this.config.commitElements(session.result.updates);
    }

    this.finishSession();
  }
}
