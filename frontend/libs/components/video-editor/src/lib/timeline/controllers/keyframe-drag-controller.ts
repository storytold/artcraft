import type { MouseEvent as ReactMouseEvent } from "react";
import type { FrameRate } from "opencut-wasm";
import { BASE_TIMELINE_PIXELS_PER_SECOND } from "../scale";
import {
  addMediaTime,
  clampMediaTime,
  type MediaTime,
  mediaTime,
  roundFrameTicks,
  snapSeekMediaTime,
  TICKS_PER_SECOND,
  ZERO_MEDIA_TIME,
} from "../../wasm";
import { TIMELINE_DRAG_THRESHOLD_PX } from "../components/interaction";
import { timelineTimeToSnappedPixels } from "../pixel-utils";
import { getKeyframeById } from "../../animation";
import { RetimeKeyframeCommand } from "../../commands/timeline";
import { BatchCommand } from "../../commands";
import type { SelectedKeyframeRef } from "../../animation/types";
import type { TimelineElement } from "../types";
import type { Command } from "../../commands/base-command";

// --- Session ---

interface PendingSession {
  kind: "pending";
  keyframeRefs: SelectedKeyframeRef[];
  startMouseX: number;
}

interface ActiveSession {
  kind: "active";
  keyframeRefs: SelectedKeyframeRef[];
  startMouseX: number;
  deltaTicks: number;
}

type Session = { kind: "idle" } | PendingSession | ActiveSession;

// --- Public state ---

export interface KeyframeDragState {
  isDragging: boolean;
  draggingKeyframeIds: Set<string>;
  deltaTicks: number;
}

const IDLE_DRAG_STATE: KeyframeDragState = {
  isDragging: false,
  draggingKeyframeIds: new Set(),
  deltaTicks: 0,
};

// --- Config ---

export interface KeyframeDragConfig {
  zoomLevel: number;
  getFps: () => FrameRate | null;
  element: TimelineElement;
  displayedStartTime: MediaTime;
  selectedKeyframes: SelectedKeyframeRef[];
  isKeyframeSelected: (args: { keyframe: SelectedKeyframeRef }) => boolean;
  setKeyframeSelection: (args: { keyframes: SelectedKeyframeRef[] }) => void;
  toggleKeyframeSelection: (args: {
    keyframes: SelectedKeyframeRef[];
    isMultiKey: boolean;
  }) => void;
  selectKeyframeRange: (args: {
    orderedKeyframes: SelectedKeyframeRef[];
    targetKeyframes: SelectedKeyframeRef[];
    isAdditive: boolean;
  }) => void;
  executeCommand: (command: Command) => void;
  seek: (args: { time: MediaTime }) => void;
  getTotalDuration: () => MediaTime;
}

export interface KeyframeDragConfigRef {
  readonly current: KeyframeDragConfig;
}

// --- Controller ---

export class KeyframeDragController {
  private session: Session = { kind: "idle" };
  // Persists through mouseup so the click handler can detect drag vs click
  private mouseDownX: number | null = null;
  private readonly subscribers = new Set<() => void>();
  private readonly configRef: KeyframeDragConfigRef;

  constructor(deps: { configRef: KeyframeDragConfigRef }) {
    this.configRef = deps.configRef;
    this.onKeyframeMouseDown = this.onKeyframeMouseDown.bind(this);
    this.onKeyframeClick = this.onKeyframeClick.bind(this);
    this.getVisualOffsetPx = this.getVisualOffsetPx.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  private get config(): KeyframeDragConfig {
    return this.configRef.current;
  }

  get isActive(): boolean {
    return this.session.kind !== "idle";
  }

  get keyframeDragState(): KeyframeDragState {
    if (this.session.kind !== "active") return IDLE_DRAG_STATE;
    return {
      isDragging: true,
      draggingKeyframeIds: new Set(
        this.session.keyframeRefs.map((kf) => kf.keyframeId),
      ),
      deltaTicks: this.session.deltaTicks,
    };
  }

  subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  cancel(): void {
    this.mouseDownX = null;
    this.finishSession();
  }

  destroy(): void {
    this.deactivate();
    this.subscribers.clear();
  }

  onKeyframeMouseDown({
    event,
    keyframes,
  }: {
    event: ReactMouseEvent;
    keyframes: SelectedKeyframeRef[];
  }): void {
    event.preventDefault();
    event.stopPropagation();

    this.mouseDownX = event.clientX;

    const anySelected = keyframes.some((kf) =>
      this.config.isKeyframeSelected({ keyframe: kf }),
    );
    const isModifierKey = event.shiftKey || event.metaKey || event.ctrlKey;

    if (!anySelected && !isModifierKey) {
      this.config.setKeyframeSelection({ keyframes });
    }

    this.session = {
      kind: "pending",
      keyframeRefs: anySelected ? this.config.selectedKeyframes : keyframes,
      startMouseX: event.clientX,
    };
    this.activate();
    this.notify();
  }

  onKeyframeClick({
    event,
    keyframes,
    orderedKeyframes,
    indicatorTime,
  }: {
    event: ReactMouseEvent;
    keyframes: SelectedKeyframeRef[];
    orderedKeyframes: SelectedKeyframeRef[];
    indicatorTime: MediaTime;
  }): void {
    event.stopPropagation();

    const wasDrag =
      this.mouseDownX !== null &&
      Math.abs(event.clientX - this.mouseDownX) > TIMELINE_DRAG_THRESHOLD_PX;
    this.mouseDownX = null;

    if (wasDrag) return;

    const { displayedStartTime, getFps, getTotalDuration, seek } = this.config;
    const fps = getFps();
    const absoluteIndicatorTime = addMediaTime({
      a: displayedStartTime,
      b: indicatorTime,
    });
    const seekTime =
      fps != null
        ? snapSeekMediaTime({
            time: absoluteIndicatorTime,
            duration: getTotalDuration(),
            fps,
          })
        : absoluteIndicatorTime;
    seek({ time: seekTime });

    if (event.shiftKey) {
      this.config.selectKeyframeRange({
        orderedKeyframes,
        targetKeyframes: keyframes,
        isAdditive: event.metaKey || event.ctrlKey,
      });
      return;
    }

    this.config.toggleKeyframeSelection({
      keyframes,
      isMultiKey: event.metaKey || event.ctrlKey,
    });
  }

  getVisualOffsetPx({
    indicatorTime,
    indicatorOffsetPx,
    isBeingDragged,
    displayedStartTime,
    elementLeft,
  }: {
    indicatorTime: MediaTime;
    indicatorOffsetPx: number;
    isBeingDragged: boolean;
    displayedStartTime: MediaTime;
    elementLeft: number;
  }): number {
    if (!isBeingDragged || this.session.kind !== "active")
      return indicatorOffsetPx;
    const deltaTime = mediaTime({ ticks: this.session.deltaTicks });
    const clampedTime = clampMediaTime({
      time: addMediaTime({ a: indicatorTime, b: deltaTime }),
      min: ZERO_MEDIA_TIME,
      max: this.config.element.duration,
    });
    return (
      timelineTimeToSnappedPixels({
        time: addMediaTime({ a: displayedStartTime, b: clampedTime }),
        zoomLevel: this.config.zoomLevel,
      }) - elementLeft
    );
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
    this.notify();
  }

  private commitDrag({
    keyframeRefs,
    deltaTicks,
  }: {
    keyframeRefs: SelectedKeyframeRef[];
    deltaTicks: number;
  }): void {
    const { element } = this.config;
    const commands: Command[] = keyframeRefs.flatMap((ref) => {
      const keyframe = getKeyframeById({
        animations: element.animations,
        propertyPath: ref.propertyPath,
        keyframeId: ref.keyframeId,
      });
      if (!keyframe) return [];
      return [
        new RetimeKeyframeCommand({
          trackId: ref.trackId,
          elementId: ref.elementId,
          propertyPath: ref.propertyPath,
          keyframeId: ref.keyframeId,
          nextTime: clampMediaTime({
            time: addMediaTime({
              a: keyframe.time,
              b: mediaTime({ ticks: deltaTicks }),
            }),
            min: ZERO_MEDIA_TIME,
            max: element.duration,
          }),
        }),
      ];
    });

    const [first, ...rest] = commands;
    if (!first) return;
    if (rest.length === 0) {
      this.config.executeCommand(first);
    } else {
      this.config.executeCommand(new BatchCommand([first, ...rest]));
    }
  }

  private handleMouseMove({ clientX }: MouseEvent): void {
    if (this.session.kind === "pending") {
      const deltaX = Math.abs(clientX - this.session.startMouseX);
      if (deltaX <= TIMELINE_DRAG_THRESHOLD_PX) return;

      this.session = {
        kind: "active",
        keyframeRefs: this.session.keyframeRefs,
        startMouseX: this.session.startMouseX,
        deltaTicks: 0,
      };
      this.notify();
      return;
    }

    if (this.session.kind !== "active") return;

    const fps = this.config.getFps();
    if (!fps) return;

    const pixelsPerSecond =
      BASE_TIMELINE_PIXELS_PER_SECOND * this.config.zoomLevel;
    const rawDeltaTicks = Math.round(
      ((clientX - this.session.startMouseX) / pixelsPerSecond) *
        TICKS_PER_SECOND,
    );
    this.session.deltaTicks = roundFrameTicks({ ticks: rawDeltaTicks, fps });
    this.notify();
  }

  private handleMouseUp(): void {
    if (this.session.kind === "pending") {
      this.finishSession();
      return;
    }

    if (this.session.kind !== "active") return;

    const { selectedKeyframes, element } = this.config;
    const { keyframeRefs, deltaTicks } = this.session;
    const draggingIds = new Set(keyframeRefs.map((r) => r.keyframeId));
    const draggingRefs = selectedKeyframes.filter(
      (kf) => kf.elementId === element.id && draggingIds.has(kf.keyframeId),
    );

    if (draggingRefs.length > 0 && deltaTicks !== 0) {
      this.commitDrag({ keyframeRefs: draggingRefs, deltaTicks });
    }

    this.finishSession();
  }
}
