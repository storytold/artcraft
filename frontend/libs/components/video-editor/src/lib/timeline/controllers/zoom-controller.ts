import type { WheelEvent as ReactWheelEvent } from "react";
import { TIMELINE_ZOOM_ANCHOR_PLAYHEAD_THRESHOLD } from "../components/interaction";
import { timelineTimeToPixels } from "../pixel-utils";
import { TIMELINE_ZOOM_MAX } from "../scale";
import { zoomToSlider } from "../zoom-utils";
import type { MediaTime } from "../../wasm";

// Zoom + scroll-anchor coordinator for the timeline ruler/tracks pair.
// Holds zoom-level state outside React so wheel zoom doesn't churn
// component renders. Subscribers opt in via `subscribe()`; they decide
// what (if anything) to re-render in response to a zoom change.

type ZoomUpdater = number | ((prev: number) => number);

export interface ZoomConfig {
  minZoom: number;
  getContainerEl: () => HTMLDivElement | null;
  getTracksScrollEl: () => HTMLDivElement | null;
  getRulerScrollEl: () => HTMLDivElement | null;
  getCurrentPlayheadTime: () => MediaTime;
  seek: (time: MediaTime) => void;
  setTimelineViewState: (viewState: {
    zoomLevel: number;
    scrollLeft: number;
    playheadTime: MediaTime;
  }) => void;
}

export interface ZoomConfigRef {
  readonly current: ZoomConfig;
}

function clampZoom({
  zoomLevel,
  minZoom,
}: {
  zoomLevel: number;
  minZoom: number;
}): number {
  return Math.max(minZoom, Math.min(TIMELINE_ZOOM_MAX, zoomLevel));
}

export class ZoomController {
  private readonly configRef: ZoomConfigRef;
  private readonly subscribers = new Set<() => void>();

  private zoomLevelValue: number;
  private hasInitialized = false;
  private hasRestoredPlayhead = false;
  private hasRestoredScroll = false;
  private previousZoom: number;
  private preZoomScrollLeft = 0;
  private prePlayheadAnchorScrollLeft = 0;
  private isInPlayheadAnchorMode = false;
  private scrollSaveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(deps: { configRef: ZoomConfigRef; initialZoom?: number }) {
    this.configRef = deps.configRef;

    const minZoom = this.config.minZoom;
    this.zoomLevelValue =
      deps.initialZoom !== undefined
        ? clampZoom({ zoomLevel: deps.initialZoom, minZoom })
        : minZoom;
    this.previousZoom = this.zoomLevelValue;
    this.hasInitialized = deps.initialZoom !== undefined;

    this.setZoomLevel = this.setZoomLevel.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.saveScrollPosition = this.saveScrollPosition.bind(this);
  }

  private get config(): ZoomConfig {
    return this.configRef.current;
  }

  get zoomLevel(): number {
    return this.zoomLevelValue;
  }

  subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  destroy(): void {
    if (this.scrollSaveTimeout) {
      clearTimeout(this.scrollSaveTimeout);
      this.scrollSaveTimeout = null;
    }
  }

  setZoomLevel(zoomLevelOrUpdater: ZoomUpdater): void {
    const scrollElement = this.config.getTracksScrollEl();
    if (scrollElement) {
      this.preZoomScrollLeft = scrollElement.scrollLeft;
    }

    const nextZoomRaw =
      typeof zoomLevelOrUpdater === "function"
        ? zoomLevelOrUpdater(this.zoomLevelValue)
        : zoomLevelOrUpdater;
    const nextZoom = clampZoom({
      zoomLevel: nextZoomRaw,
      minZoom: this.config.minZoom,
    });
    if (nextZoom === this.zoomLevelValue) return;

    this.zoomLevelValue = nextZoom;
    this.notify();
  }

  handleWheel(event: ReactWheelEvent): void {
    const isZoomGesture = event.ctrlKey || event.metaKey;
    const isHorizontalScrollGesture =
      event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);

    if (isHorizontalScrollGesture) {
      return;
    }

    if (isZoomGesture) {
      const normalizedDelta =
        event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const cappedDelta =
        Math.sign(normalizedDelta) * Math.min(Math.abs(normalizedDelta), 30);
      const zoomFactor = Math.exp(-cappedDelta / 300);
      this.setZoomLevel((prev) => prev * zoomFactor);
    }
  }

  reconcileInitialAndMinZoom({
    minZoom,
    initialZoom,
  }: {
    minZoom: number;
    initialZoom?: number;
  }): void {
    if (initialZoom !== undefined && !this.hasInitialized) {
      this.hasInitialized = true;
      this.setZoomLevel(clampZoom({ zoomLevel: initialZoom, minZoom }));
      return;
    }

    if (this.zoomLevelValue < minZoom) {
      this.setZoomLevel(minZoom);
    }
  }

  applyZoomLayout(zoomLevel: number): void {
    const previousZoom = this.previousZoom;
    if (previousZoom === zoomLevel) return;

    const scrollElement = this.config.getTracksScrollEl();
    if (!scrollElement) {
      this.previousZoom = zoomLevel;
      return;
    }

    const currentScrollLeft = this.preZoomScrollLeft;
    const playheadTime = this.config.getCurrentPlayheadTime();
    const sliderPercent = zoomToSlider({
      zoomLevel,
      minZoom: this.config.minZoom,
    });
    const previousSliderPercent = zoomToSlider({
      zoomLevel: previousZoom,
      minZoom: this.config.minZoom,
    });
    const isCrossingThresholdUp =
      previousSliderPercent < TIMELINE_ZOOM_ANCHOR_PLAYHEAD_THRESHOLD &&
      sliderPercent >= TIMELINE_ZOOM_ANCHOR_PLAYHEAD_THRESHOLD;
    const isCrossingThresholdDown =
      previousSliderPercent >= TIMELINE_ZOOM_ANCHOR_PLAYHEAD_THRESHOLD &&
      sliderPercent < TIMELINE_ZOOM_ANCHOR_PLAYHEAD_THRESHOLD;

    const syncScroll = (scrollLeft: number) => {
      scrollElement.scrollLeft = scrollLeft;
      const ruler = this.config.getRulerScrollEl();
      if (ruler) {
        ruler.scrollLeft = scrollLeft;
      }
    };

    const clampScrollLeft = (scrollLeft: number) => {
      const maxScrollLeft =
        scrollElement.scrollWidth - scrollElement.clientWidth;
      return Math.max(0, Math.min(maxScrollLeft, scrollLeft));
    };

    if (isCrossingThresholdUp) {
      this.prePlayheadAnchorScrollLeft = currentScrollLeft;
      this.isInPlayheadAnchorMode = true;
    }

    if (sliderPercent >= TIMELINE_ZOOM_ANCHOR_PLAYHEAD_THRESHOLD) {
      const playheadPixelsBefore = timelineTimeToPixels({
        time: playheadTime,
        zoomLevel: previousZoom,
      });
      const playheadPixelsAfter = timelineTimeToPixels({
        time: playheadTime,
        zoomLevel,
      });
      const viewportOffset = playheadPixelsBefore - currentScrollLeft;
      const nextScrollLeft = playheadPixelsAfter - viewportOffset;
      syncScroll(clampScrollLeft(nextScrollLeft));
    } else if (isCrossingThresholdDown && this.isInPlayheadAnchorMode) {
      syncScroll(clampScrollLeft(this.prePlayheadAnchorScrollLeft));
      this.isInPlayheadAnchorMode = false;
    }

    this.previousZoom = zoomLevel;

    this.config.setTimelineViewState({
      zoomLevel,
      scrollLeft: scrollElement.scrollLeft,
      playheadTime,
    });
  }

  saveScrollPosition(): void {
    if (this.scrollSaveTimeout) {
      clearTimeout(this.scrollSaveTimeout);
    }

    this.scrollSaveTimeout = setTimeout(() => {
      const scrollElement = this.config.getTracksScrollEl();
      if (!scrollElement) return;

      this.config.setTimelineViewState({
        zoomLevel: this.zoomLevelValue,
        scrollLeft: scrollElement.scrollLeft,
        playheadTime: this.config.getCurrentPlayheadTime(),
      });
    }, 300);
  }

  restoreInitialScrollIfNeeded(
    initialScrollLeft?: number,
  ): (() => void) | undefined {
    if (initialScrollLeft === undefined) return;
    if (this.hasRestoredScroll) return;

    const scrollElement = this.config.getTracksScrollEl();
    if (!scrollElement) return;

    const restoreScroll = () => {
      scrollElement.scrollLeft = initialScrollLeft;
      const ruler = this.config.getRulerScrollEl();
      if (ruler) {
        ruler.scrollLeft = initialScrollLeft;
      }
      this.hasRestoredScroll = true;
      this.preZoomScrollLeft = initialScrollLeft;
    };

    if (scrollElement.scrollWidth > 0) {
      restoreScroll();
      return;
    }

    const observer = new ResizeObserver(() => {
      if (scrollElement.scrollWidth > 0) {
        restoreScroll();
        observer.disconnect();
      }
    });
    observer.observe(scrollElement);
    return () => observer.disconnect();
  }

  restoreInitialPlayheadIfNeeded(initialPlayheadTime?: MediaTime): void {
    if (initialPlayheadTime === undefined) return;
    if (this.hasRestoredPlayhead) return;

    this.hasRestoredPlayhead = true;
    this.config.seek(initialPlayheadTime);
  }

  bindPreventBrowserZoom(): () => void {
    const preventZoom = (event: WheelEvent) => {
      const isZoomKeyPressed = event.ctrlKey || event.metaKey;
      const container = this.config.getContainerEl();
      const isInContainer = container?.contains(event.target as Node) ?? false;
      if (isZoomKeyPressed && isInContainer) {
        event.preventDefault();
      }
    };

    document.addEventListener("wheel", preventZoom, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("wheel", preventZoom, { capture: true });
    };
  }

  private notify(): void {
    for (const fn of this.subscribers) {
      fn();
    }
  }
}
