import type { MouseEvent as ReactMouseEvent } from "react";
import type { FrameRate } from "opencut-wasm";
import { BASE_TIMELINE_PIXELS_PER_SECOND } from "../scale";
import { mediaTime, snapSeekMediaTime, TICKS_PER_SECOND, type MediaTime } from "../../wasm";

// Click-vs-drag arbiter for the timeline ruler and tracks area. Owns
// "pending" mouse-down state; the actual scrubbing-while-dragging path
// lives in PlayheadController. SeekController only handles the
// click-to-seek case (mouse-down without significant movement).
//
// Critical performance contract — this class side-steps React state
// entirely. All gesture state is held on `this`, and the only outward
// signal is the callback set in SeekConfig. Do not introduce setState
// or store writes in the hot path.

type SeekSource = "ruler" | "tracks";

interface PendingSeekSession {
  kind: "pending";
  source: SeekSource;
  downX: number;
  downY: number;
  downTime: number;
}

type Session = { kind: "idle" } | PendingSeekSession;

export interface SeekConfig {
  zoomLevel: number;
  duration: MediaTime;
  isSelecting: boolean;
  getPlayheadEl: () => HTMLDivElement | null;
  getTrackLabelsEl: () => HTMLDivElement | null;
  getRulerScrollEl: () => HTMLDivElement | null;
  getTracksScrollEl: () => HTMLDivElement | null;
  getActiveProjectFps: () => FrameRate | null;
  clearSelectedElements: () => void;
  seek: (time: MediaTime) => void;
  setTimelineViewState: (viewState: {
    zoomLevel: number;
    scrollLeft: number;
    playheadTime: MediaTime;
  }) => void;
}

// Mutable ref so the controller always reads the latest config without
// re-binding listeners on each render. Hosts mount the controller once
// per timeline and feed it a stable ref whose `.current` they update.
export interface SeekConfigRef {
  readonly current: SeekConfig;
}

function pixelToTime({
  clientX,
  scrollContainer,
  zoomLevel,
  duration,
}: {
  clientX: number;
  scrollContainer: HTMLDivElement;
  zoomLevel: number;
  duration: MediaTime;
}): MediaTime {
  const rect = scrollContainer.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const scrollLeft = scrollContainer.scrollLeft;

  const rawTimeSeconds = Math.max(
    0,
    Math.min(
      duration / TICKS_PER_SECOND,
      (mouseX + scrollLeft) / (BASE_TIMELINE_PIXELS_PER_SECOND * zoomLevel),
    ),
  );

  return mediaTime({ ticks: Math.round(rawTimeSeconds * TICKS_PER_SECOND) });
}

function isClickGesture({
  event,
  session,
}: {
  event: ReactMouseEvent;
  session: PendingSeekSession;
}): boolean {
  const deltaX = Math.abs(event.clientX - session.downX);
  const deltaY = Math.abs(event.clientY - session.downY);
  const deltaTime = event.timeStamp - session.downTime;

  return deltaX <= 5 && deltaY <= 5 && deltaTime <= 500;
}

export class SeekController {
  private session: Session = { kind: "idle" };
  private readonly configRef: SeekConfigRef;

  constructor(deps: { configRef: SeekConfigRef }) {
    this.configRef = deps.configRef;
    this.onTracksMouseDown = this.onTracksMouseDown.bind(this);
    this.onRulerMouseDown = this.onRulerMouseDown.bind(this);
    this.onTracksClick = this.onTracksClick.bind(this);
    this.onRulerClick = this.onRulerClick.bind(this);
  }

  private get config(): SeekConfig {
    return this.configRef.current;
  }

  destroy(): void {
    this.session = { kind: "idle" };
  }

  onTracksMouseDown(event: ReactMouseEvent): void {
    this.beginPendingSeek({ event, source: "tracks" });
  }

  onRulerMouseDown(event: ReactMouseEvent): void {
    this.beginPendingSeek({ event, source: "ruler" });
  }

  onTracksClick(event: ReactMouseEvent): void {
    this.handleClick({ event, source: "tracks" });
  }

  onRulerClick(event: ReactMouseEvent): void {
    this.handleClick({ event, source: "ruler" });
  }

  private beginPendingSeek({
    event,
    source,
  }: {
    event: ReactMouseEvent;
    source: SeekSource;
  }): void {
    if (event.button !== 0) return;

    this.session = {
      kind: "pending",
      source,
      downX: event.clientX,
      downY: event.clientY,
      downTime: event.timeStamp,
    };
  }

  private handleClick({
    event,
    source,
  }: {
    event: ReactMouseEvent;
    source: SeekSource;
  }): void {
    const shouldProcess = this.shouldProcessClick({ event, source });
    this.session = { kind: "idle" };

    if (!shouldProcess) return;

    this.config.clearSelectedElements();
    this.seekFromEvent({ event, source });
  }

  private shouldProcessClick({
    event,
    source,
  }: {
    event: ReactMouseEvent;
    source: SeekSource;
  }): boolean {
    if (this.session.kind !== "pending") return false;
    if (this.session.source !== source) return false;
    if (!isClickGesture({ event, session: this.session })) return false;
    if (this.config.isSelecting) return false;

    const target = event.target as HTMLElement;
    if (this.config.getPlayheadEl()?.contains(target)) return false;

    if (this.config.getTrackLabelsEl()?.contains(target)) {
      this.config.clearSelectedElements();
      return false;
    }

    return true;
  }

  private seekFromEvent({
    event,
    source,
  }: {
    event: ReactMouseEvent;
    source: SeekSource;
  }): void {
    const scrollContainer =
      source === "ruler"
        ? this.config.getRulerScrollEl()
        : this.config.getTracksScrollEl();
    if (!scrollContainer) return;

    const rawTime = pixelToTime({
      clientX: event.clientX,
      scrollContainer,
      zoomLevel: this.config.zoomLevel,
      duration: this.config.duration,
    });

    const fps = this.config.getActiveProjectFps();
    const time =
      fps != null
        ? snapSeekMediaTime({
            time: rawTime,
            duration: this.config.duration,
            fps,
          })
        : rawTime;

    this.config.seek(time);
    this.config.setTimelineViewState({
      zoomLevel: this.config.zoomLevel,
      scrollLeft: scrollContainer.scrollLeft,
      playheadTime: time,
    });
  }
}
