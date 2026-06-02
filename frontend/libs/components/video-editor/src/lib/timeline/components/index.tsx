"use client";

import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Delete02Icon,
  MagicWand05Icon,
  MusicNote03Icon,
  TaskAdd02Icon,
  TextIcon,
  ViewIcon,
  ViewOffSlashIcon,
  VolumeHighIcon,
  VolumeOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { OcShapesIcon, OcVideoIcon } from "../../components/icons";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../components/ui/context-menu";
import { useTimelineZoom } from "../hooks/use-timeline-zoom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useContainerSize } from "../../hooks/use-container-size";
import type { MediaTime } from "../../wasm";
import type { ElementDragView, DropTarget } from "../types";
import { TimelineTrackContent } from "./timeline-track";
import { TimelinePlayhead } from "./timeline-playhead";
import { SelectionBox } from "../../selection/selection-box";
import { useBoxSelect } from "../../selection/hooks/use-box-select";
import { SnapIndicator } from "./snap-indicator";
import type { SnapPoint } from "../snapping";
import type { TimelineTrack } from "../types";
import {
  TIMELINE_SCROLLBAR_SIZE_PX,
  TIMELINE_CONTENT_TOP_PADDING_PX,
  TIMELINE_TRACK_GAP_PX,
  TIMELINE_TRACK_LABELS_COLUMN_WIDTH_PX,
  KEYFRAME_LANE_HEIGHT_PX,
} from "./layout";
import { useElementInteraction } from "../hooks/element/use-element-interaction";
import { canTrackHaveAudio, canTrackBeHidden } from "../track-capabilities";
import { getTimelineZoomMin, getTimelinePaddingPx } from "../zoom-utils";
import { timelineTimeToPixels } from "../pixel-utils";
import {
  getTrackHeight,
  getCumulativeHeightBefore,
  getTotalTracksHeight,
} from "./track-layout";
import { SELECTED_TRACK_ROW_CLASS } from "./theme";
import {
  computeTrackExpansionHeight,
  getTrackExpandedRows,
  getPropertyLabel,
  type ExpandedRow,
} from "./expanded-layout";
import { TIMELINE_HORIZONTAL_WHEEL_STEP_PX } from "./interaction";
import { TimelineToolbar } from "./timeline-toolbar";
import { useElementSelection } from "../hooks/element/use-element-selection";
import { useTimelineSeek } from "../hooks/use-timeline-seek";
import { useTimelineDragDrop } from "../hooks/use-timeline-drag-drop";
import { TimelineRuler } from "./timeline-ruler";
import { TimelineBookmarksRow, useBookmarkDrag } from "../bookmarks/index";
import { useEdgeAutoScroll } from "../hooks/use-edge-auto-scroll";
import { useInitialScrollBottom } from "../hooks/use-initial-scroll-bottom";
import { useTimelineResize } from "../hooks/use-timeline-resize";
import { useTimelineStore } from "../timeline-store";
import { useEditor } from "../../editor/use-editor";
import { useScrollPosition } from "../hooks/use-scroll-position";
import { useTimelinePlayhead } from "../hooks/use-timeline-playhead";
import { DragLine } from "./drag-line";
import { invokeAction } from "../../actions";
import { resolveTimelineElementIntersections } from "./selection-hit-testing";
import { cn } from "../../utils/ui";

const TRACKS_CONTAINER_MAX_HEIGHT = 800;
const FALLBACK_CONTAINER_WIDTH = 1000;
const TRACKS_CONTAINER_HEIGHT = { min: 0, max: TRACKS_CONTAINER_MAX_HEIGHT };
const TRACK_ICONS: Record<TimelineTrack["type"], ReactNode> = {
  video: <OcVideoIcon className="text-muted-foreground size-4 shrink-0" />,
  text: (
    <HugeiconsIcon
      icon={TextIcon}
      className="text-muted-foreground size-4 shrink-0"
    />
  ),
  audio: (
    <HugeiconsIcon
      icon={MusicNote03Icon}
      className="text-muted-foreground size-4 shrink-0"
    />
  ),
  graphic: <OcShapesIcon className="text-muted-foreground size-4 shrink-0" />,
  effect: (
    <HugeiconsIcon
      icon={MagicWand05Icon}
      className="text-muted-foreground size-4 shrink-0"
    />
  ),
};

export function Timeline() {
  const snappingEnabled = useTimelineStore((s) => s.snappingEnabled);
  const {
    selectedElements,
    clearElementSelection,
    setElementSelection,
    mergeElementsIntoSelection,
  } = useElementSelection();
  const editor = useEditor();
  const timeline = editor.timeline;
  const scene = useEditor((currentEditor) =>
    currentEditor.scenes.getActiveSceneOrNull(),
  );
  const tracks = useMemo<TimelineTrack[]>(
    () =>
      scene
        ? [...scene.tracks.overlay, scene.tracks.main, ...scene.tracks.audio]
        : [],
    [scene],
  );
  const mainTrackId = scene?.tracks.main.id ?? null;
  const seek = (time: MediaTime) => editor.playback.seek({ time });

  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);
  const trackLabelsRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const trackLabelsScrollRef = useRef<HTMLDivElement>(null);

  const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint | null>(
    null,
  );
  const { width: tracksContainerWidth } = useContainerSize({
    containerRef: tracksContainerRef,
  });
  const { height: timelineHeaderHeightValue } = useContainerSize({
    containerRef: timelineHeaderRef,
  });
  const { viewportWidth: tracksViewportWidth } = useScrollPosition({
    scrollRef: tracksScrollRef,
  });

  const handleSnapPointChange = useCallback((snapPoint: SnapPoint | null) => {
    setCurrentSnapPoint(snapPoint);
  }, []);

  const timelineDuration = timeline.getTotalDuration() || 0;
  const containerWidth = tracksContainerWidth || FALLBACK_CONTAINER_WIDTH;
  const minZoomLevel = getTimelineZoomMin({
    duration: timelineDuration,
    containerWidth,
  });

  const savedViewState = editor.project.getTimelineViewState();

  const { zoomLevel, setZoomLevel, handleWheel, saveScrollPosition } =
    useTimelineZoom({
      containerRef: timelineRef,
      minZoom: minZoomLevel,
      initialZoom: savedViewState?.zoomLevel,
      initialScrollLeft: savedViewState?.scrollLeft,
      initialPlayheadTime: savedViewState?.playheadTime,
      tracksScrollRef,
      rulerScrollRef,
    });
  const { isResizing, handleResizeStart } = useTimelineResize({
    zoomLevel,
    onSnapPointChange: handleSnapPointChange,
  });

  const expandedElementIds = useTimelineStore((s) => s.expandedElementIds);

  const getTrackExpansionHeight = useCallback(
    (trackIndex: number) => {
      const track = tracks[trackIndex];
      if (!track) return 0;
      return computeTrackExpansionHeight({ track, expandedElementIds });
    },
    [tracks, expandedElementIds],
  );

  // Stable refs so the wheel listener never goes stale
  const setZoomLevelRef = useRef(setZoomLevel);
  useEffect(() => {
    setZoomLevelRef.current = setZoomLevel;
  }, [setZoomLevel]);

  const saveScrollPositionRef = useRef(saveScrollPosition);
  useEffect(() => {
    saveScrollPositionRef.current = saveScrollPosition;
  }, [saveScrollPosition]);

  const minZoomLevelRef = useRef(minZoomLevel);
  useEffect(() => {
    minZoomLevelRef.current = minZoomLevel;
  }, [minZoomLevel]);

  // Pushes tracks scroll position to the two overflow:hidden followers
  // (ruler and track labels). Called from the wheel handler (before paint,
  // zero lag) and from onScroll on the tracks area (covers scrollbar drag).
  const syncFollowers = useCallback(() => {
    const tracks = tracksScrollRef.current;
    if (!tracks) return;
    if (rulerScrollRef.current) {
      rulerScrollRef.current.scrollLeft = tracks.scrollLeft;
    }
    if (trackLabelsScrollRef.current) {
      trackLabelsScrollRef.current.scrollTop = tracks.scrollTop;
    }
  }, []);

  // Single non-passive capture listener owns all wheel input. Prevents any
  // native scroll or browser zoom from firing inside the timeline.
  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;

    let pendingZoomDelta = 0;
    let zoomRafId: ReturnType<typeof requestAnimationFrame> | null = null;

    const onWheel = (e: WheelEvent) => {
      const isZoom = e.ctrlKey || e.metaKey;

      if (isZoom) {
        e.preventDefault();
        const normalizedDelta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        pendingZoomDelta += normalizedDelta;

        if (zoomRafId === null) {
          zoomRafId = requestAnimationFrame(() => {
            const frameRawDelta = pendingZoomDelta;
            const cappedDelta =
              Math.sign(frameRawDelta) * Math.min(Math.abs(frameRawDelta), 30);
            const zoomFactor = Math.exp(-cappedDelta / 300);
            setZoomLevelRef.current((prev) => prev * zoomFactor);
            pendingZoomDelta = 0;
            zoomRafId = null;
          });
        }
        return;
      }

      const tracks = tracksScrollRef.current;
      if (!tracks) return;

      const isHorizontal =
        e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);

      e.preventDefault();

      if (isHorizontal) {
        const raw =
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const clamped =
          Math.sign(raw) *
          Math.min(Math.abs(raw), TIMELINE_HORIZONTAL_WHEEL_STEP_PX);
        tracks.scrollLeft = Math.max(0, tracks.scrollLeft + clamped);
      } else {
        tracks.scrollTop = Math.max(0, tracks.scrollTop + e.deltaY);
      }

      syncFollowers();
      saveScrollPositionRef.current();
    };

    container.addEventListener("wheel", onWheel, {
      passive: false,
      capture: true,
    });
    return () => {
      container.removeEventListener("wheel", onWheel, { capture: true });
      if (zoomRafId !== null) cancelAnimationFrame(zoomRafId);
    };
  }, [syncFollowers]);

  useInitialScrollBottom({
    tracksScrollRef,
    trackLabelsScrollRef,
    onAfterScroll: () => saveScrollPositionRef.current(),
    isReady: tracks.length > 0,
  });

  const { dragView, handleElementMouseDown, handleElementClick } =
    useElementInteraction({
      zoomLevel,
      tracksContainerRef,
      tracksScrollRef,
      snappingEnabled,
      onSnapPointChange: handleSnapPointChange,
    });
  const isElementDragging = dragView.kind === "dragging";

  const {
    dragState: bookmarkDragState,
    handleBookmarkMouseDown,
    lastMouseXRef: bookmarkLastMouseXRef,
  } = useBookmarkDrag({
    zoomLevel,
    scrollRef: tracksScrollRef,
    snappingEnabled,
    onSnapPointChange: handleSnapPointChange,
  });

  const { handleRulerMouseDown: handlePlayheadRulerMouseDown } =
    useTimelinePlayhead({
      zoomLevel,
      rulerRef,
      rulerScrollRef,
      tracksScrollRef,
      playheadRef,
    });

  const { isDragOver, dropTarget, dragProps } = useTimelineDragDrop({
    containerRef: tracksContainerRef,
    tracksScrollRef,
    zoomLevel,
  });

  const {
    selectionBox,
    handleMouseDown: handleSelectionMouseDown,
    isSelecting,
    shouldIgnoreClick,
  } = useBoxSelect({
    containerRef: tracksContainerRef,
    selectedIds: selectedElements,
    anchorId: null,
    getIsAdditiveSelection: (event) =>
      event.shiftKey || event.ctrlKey || event.metaKey,
    resolveIntersections: ({ startPos, currentPos }) => {
      if (!tracksContainerRef.current) {
        return [];
      }

      return resolveTimelineElementIntersections({
        container: tracksContainerRef.current,
        scrollContainer: tracksScrollRef.current,
        tracks,
        zoomLevel,
        startPos,
        currentPos,
      });
    },
    onSelectionChange: ({ intersectedIds, isAdditive }) => {
      if (isAdditive) {
        mergeElementsIntoSelection({ elements: intersectedIds });
      } else {
        setElementSelection({ elements: intersectedIds });
      }
    },
  });

  const contentWidth = timelineTimeToPixels({
    time: timelineDuration,
    zoomLevel,
  });
  const paddingPx = getTimelinePaddingPx({
    containerWidth,
    zoomLevel,
    minZoom: minZoomLevel,
  });
  const dynamicTimelineWidth = Math.max(
    contentWidth + paddingPx,
    containerWidth,
  );
  const hasHorizontalScrollbar =
    dynamicTimelineWidth > (tracksViewportWidth || containerWidth);

  useEdgeAutoScroll({
    isActive: bookmarkDragState.isDragging,
    getMouseClientX: () => bookmarkLastMouseXRef.current,
    rulerScrollRef,
    tracksScrollRef,
    contentWidth: dynamicTimelineWidth,
  });

  useEdgeAutoScroll({
    isActive: isElementDragging,
    getMouseClientX: () =>
      dragView.kind === "dragging" ? dragView.currentMouseX : 0,
    rulerScrollRef,
    tracksScrollRef,
    contentWidth: dynamicTimelineWidth,
  });

  const showSnapIndicator =
    snappingEnabled &&
    currentSnapPoint !== null &&
    (isElementDragging || bookmarkDragState.isDragging || isResizing);

  const {
    handleTracksMouseDown,
    handleTracksClick,
    handleRulerMouseDown,
    handleRulerClick,
  } = useTimelineSeek({
    playheadRef,
    trackLabelsRef,
    rulerScrollRef,
    tracksScrollRef,
    zoomLevel,
    duration: timeline.getTotalDuration(),
    isSelecting,
    clearSelectedElements: clearElementSelection,
    seek,
  });

  const timelineHeaderHeight =
    timelineHeaderHeightValue + TIMELINE_CONTENT_TOP_PADDING_PX;

  return (
    <section
      className={
        "panel bg-background relative flex h-full flex-col overflow-hidden rounded-lg border border-ui-panel-border"
      }
      {...dragProps}
      aria-label="Timeline"
    >
      <TimelineToolbar
        zoomLevel={zoomLevel}
        minZoom={minZoomLevel}
        setZoomLevel={({ zoom }) => setZoomLevel(zoom)}
      />

      <div className="relative flex flex-1 overflow-hidden" ref={timelineRef}>
        <TrackLabelsPanel
          trackLabelsRef={trackLabelsRef}
          trackLabelsScrollRef={trackLabelsScrollRef}
          timelineHeaderHeight={timelineHeaderHeight}
          hasHorizontalScrollbar={hasHorizontalScrollbar}
          getTrackExpansionHeight={getTrackExpansionHeight}
        />

        <div
          className="relative isolate flex flex-1 flex-col overflow-hidden"
          ref={tracksContainerRef}
        >
          <SelectionBox bounds={selectionBox?.bounds ?? null} />
          <DragLine
            dropTarget={dropTarget}
            tracks={tracks}
            isVisible={isDragOver && !dropTarget?.targetElement}
            headerHeight={timelineHeaderHeight}
          />
          <DragLine
            dropTarget={isElementDragging ? dragView.dropTarget : null}
            tracks={tracks}
            isVisible={isElementDragging}
            headerHeight={timelineHeaderHeight}
          />

          <div ref={rulerScrollRef} className="shrink-0 overflow-hidden">
            <div
              ref={timelineHeaderRef}
              className="flex flex-col"
              style={{ width: `${dynamicTimelineWidth}px` }}
            >
              <TimelineRuler
                zoomLevel={zoomLevel}
                dynamicTimelineWidth={dynamicTimelineWidth}
                rulerRef={rulerRef}
                tracksScrollRef={rulerScrollRef}
                handleWheel={handleWheel}
                handleTimelineContentClick={handleRulerClick}
                handleRulerTrackingMouseDown={handleRulerMouseDown}
                handleRulerMouseDown={handlePlayheadRulerMouseDown}
              />
              <TimelineBookmarksRow
                zoomLevel={zoomLevel}
                dynamicTimelineWidth={dynamicTimelineWidth}
                dragState={bookmarkDragState}
                onBookmarkMouseDown={handleBookmarkMouseDown}
                handleWheel={handleWheel}
                handleTimelineContentClick={handleRulerClick}
                handleRulerTrackingMouseDown={handleRulerMouseDown}
                handleRulerMouseDown={handlePlayheadRulerMouseDown}
              />
            </div>
          </div>

          <ScrollArea
            className="flex-1"
            ref={tracksScrollRef}
            onScroll={() => {
              syncFollowers();
              saveScrollPosition();
            }}
          >
            <div
              className="flex min-h-full flex-col"
              style={{ width: `${dynamicTimelineWidth}px` }}
            >
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- spatial gesture surface (tracks container background); direct-target clicks here originate box-select or clear selection. Keyboard control is global timeline shortcuts. */}
              <div
                className="relative shrink-0"
                style={{
                  height: `${
                    Math.max(
                      TRACKS_CONTAINER_HEIGHT.min,
                      Math.min(
                        TRACKS_CONTAINER_HEIGHT.max,
                        getTotalTracksHeight({
                          tracks,
                          getExtraHeight: getTrackExpansionHeight,
                        }),
                      ),
                    ) + TIMELINE_CONTENT_TOP_PADDING_PX
                  }px`,
                }}
                onMouseDown={(event) => {
                  const isDirectTarget = event.target === event.currentTarget;
                  if (!isDirectTarget) return;
                  event.stopPropagation();
                  handleTracksMouseDown(event);
                  handleSelectionMouseDown(event);
                }}
                onClick={(event) => {
                  const isDirectTarget = event.target === event.currentTarget;
                  if (!isDirectTarget) return;
                  event.stopPropagation();
                  handleTracksClick(event);
                }}
              >
                {tracks.length > 0 && (
                  <TimelineTrackRows
                    mainTrackId={mainTrackId}
                    zoomLevel={zoomLevel}
                    dragView={dragView}
                    onResizeStart={handleResizeStart}
                    onElementMouseDown={handleElementMouseDown}
                    onElementClick={handleElementClick}
                    onTrackMouseDown={(event) => {
                      handleSelectionMouseDown(event);
                      handleTracksMouseDown(event);
                    }}
                    onTrackMouseUp={handleTracksClick}
                    shouldIgnoreClick={shouldIgnoreClick}
                    isDragOver={isDragOver}
                    dropTarget={dropTarget}
                  />
                )}
              </div>
              <TimelineGutter
                onMouseDown={(event) => {
                  handleTracksMouseDown(event);
                  handleSelectionMouseDown(event);
                }}
                onClick={handleTracksClick}
              />
            </div>
          </ScrollArea>

          <TimelinePlayhead
            zoomLevel={zoomLevel}
            hasHorizontalScrollbar={hasHorizontalScrollbar}
            rulerRef={rulerRef}
            rulerScrollRef={rulerScrollRef}
            tracksScrollRef={tracksScrollRef}
            timelineRef={timelineRef}
            playheadRef={playheadRef}
            isSnappingToPlayhead={
              showSnapIndicator && currentSnapPoint?.type === "playhead"
            }
          />
        </div>
        <SnapIndicator
          snapPoint={currentSnapPoint}
          zoomLevel={zoomLevel}
          timelineRef={timelineRef}
          tracksScrollRef={tracksScrollRef}
          isVisible={showSnapIndicator}
        />
      </div>
    </section>
  );
}

function TrackLabelsPanel({
  trackLabelsRef,
  trackLabelsScrollRef,
  timelineHeaderHeight,
  hasHorizontalScrollbar,
  getTrackExpansionHeight,
}: {
  trackLabelsRef: React.RefObject<HTMLDivElement | null>;
  trackLabelsScrollRef: React.RefObject<HTMLDivElement | null>;
  timelineHeaderHeight: number;
  hasHorizontalScrollbar: boolean;
  getTrackExpansionHeight: (trackIndex: number) => number;
}) {
  const editor = useEditor();
  const scene = useEditor((e) => e.scenes.getActiveSceneOrNull());
  const tracks = useMemo<TimelineTrack[]>(
    () =>
      scene
        ? [...scene.tracks.overlay, scene.tracks.main, ...scene.tracks.audio]
        : [],
    [scene],
  );
  const { selectedElements } = useElementSelection();
  const tracksWithSelection = useMemo(
    () => new Set(selectedElements.map((el) => el.trackId)),
    [selectedElements],
  );

  const expandedElementIds = useTimelineStore((s) => s.expandedElementIds);
  const trackExpandedRowsMap = useMemo(
    () =>
      tracks.map((track) =>
        getTrackExpandedRows({ track, expandedElementIds }),
      ),
    [tracks, expandedElementIds],
  );

  return (
    <div
      className="flex shrink-0 flex-col border-r border-ui-panel"
      style={{ width: `${TIMELINE_TRACK_LABELS_COLUMN_WIDTH_PX}px` }}
    >
      <div
        className="shrink-0"
        style={{ height: timelineHeaderHeight || 48 }}
      />
      <div ref={trackLabelsRef} className="flex-1 overflow-hidden">
        <div ref={trackLabelsScrollRef} className="size-full overflow-hidden">
          {tracks.length > 0 && (
            <div
              className="flex flex-col"
              style={{ gap: `${TIMELINE_TRACK_GAP_PX}px` }}
            >
              {tracks.map((track, index) => {
                const expandedRows = trackExpandedRowsMap[index];
                const baseHeight = getTrackHeight({ type: track.type });

                return (
                  <div
                    key={track.id}
                    className={cn(
                      "group flex flex-col",
                      tracksWithSelection.has(track.id) &&
                        SELECTED_TRACK_ROW_CLASS,
                    )}
                    style={{
                      height: `${baseHeight + getTrackExpansionHeight(index)}px`,
                    }}
                  >
                    <div
                      className="flex shrink-0 items-center justify-end gap-2 px-3"
                      style={{ height: `${baseHeight}px` }}
                    >
                      {canTrackHaveAudio(track) && (
                        <TrackToggleIcon
                          isOff={track.muted}
                          icons={{
                            on: VolumeHighIcon,
                            off: VolumeOffIcon,
                          }}
                          onClick={() =>
                            editor.timeline.toggleTrackMute({
                              trackId: track.id,
                            })
                          }
                        />
                      )}
                      {canTrackBeHidden(track) && (
                        <TrackToggleIcon
                          isOff={track.hidden}
                          icons={{
                            on: ViewIcon,
                            off: ViewOffSlashIcon,
                          }}
                          onClick={() =>
                            editor.timeline.toggleTrackVisibility({
                              trackId: track.id,
                            })
                          }
                        />
                      )}
                      <TrackIcon track={track} />
                    </div>
                    {expandedRows.length > 0 && (
                      <PropertyTree rows={expandedRows} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div
        className="bg-background shrink-0"
        style={{
          height: hasHorizontalScrollbar ? TIMELINE_SCROLLBAR_SIZE_PX : 0,
        }}
      />
    </div>
  );
}

function TimelineTrackRows({
  mainTrackId,
  zoomLevel,
  dragView,
  onResizeStart,
  onElementMouseDown,
  onElementClick,
  onTrackMouseDown,
  onTrackMouseUp,
  shouldIgnoreClick,
  isDragOver,
  dropTarget,
}: {
  mainTrackId: string | null;
  zoomLevel: number;
  dragView: ElementDragView;
  onResizeStart: React.ComponentProps<
    typeof TimelineTrackContent
  >["onResizeStart"];
  onElementMouseDown: React.ComponentProps<
    typeof TimelineTrackContent
  >["onElementMouseDown"];
  onElementClick: React.ComponentProps<
    typeof TimelineTrackContent
  >["onElementClick"];
  onTrackMouseDown: (event: React.MouseEvent) => void;
  onTrackMouseUp: (event: React.MouseEvent) => void;
  shouldIgnoreClick: () => boolean;
  isDragOver: boolean;
  dropTarget: DropTarget | null;
}) {
  const timeline = useEditor((e) => e.timeline);
  const scene = useEditor((e) => e.scenes.getActiveSceneOrNull());
  const tracks = useMemo<TimelineTrack[]>(
    () =>
      scene
        ? [...scene.tracks.overlay, scene.tracks.main, ...scene.tracks.audio]
        : [],
    [scene],
  );
  const { selectedElements } = useElementSelection();
  const tracksWithSelection = useMemo(
    () => new Set(selectedElements.map((el) => el.trackId)),
    [selectedElements],
  );

  const expandedElementIds = useTimelineStore((s) => s.expandedElementIds);

  const getTrackExpansionHeight = useCallback(
    (trackIndex: number) => {
      const track = tracks[trackIndex];
      if (!track) return 0;
      return computeTrackExpansionHeight({ track, expandedElementIds });
    },
    [tracks, expandedElementIds],
  );

  const draggingElementIds = useMemo(
    () =>
      dragView.kind === "dragging"
        ? dragView.memberTimeOffsets
        : (null as ReadonlyMap<string, MediaTime> | null),
    [dragView],
  );
  const sortedTracks = useMemo(() => {
    if (!draggingElementIds)
      return tracks.map((track, index) => ({ track, index }));
    return [...tracks]
      .map((track, index) => ({ track, index }))
      .sort((a, b) => {
        const aHasDragged = a.track.elements.some((element) =>
          draggingElementIds.has(element.id),
        );
        const bHasDragged = b.track.elements.some((element) =>
          draggingElementIds.has(element.id),
        );
        if (aHasDragged) return 1;
        if (bHasDragged) return -1;
        return 0;
      });
  }, [tracks, draggingElementIds]);

  return (
    <>
      {sortedTracks.map(({ track, index }) => (
        <ContextMenu key={track.id}>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "absolute right-0 left-0 transition-colors",
                tracksWithSelection.has(track.id) && SELECTED_TRACK_ROW_CLASS,
              )}
              style={{
                top: `${TIMELINE_CONTENT_TOP_PADDING_PX + getCumulativeHeightBefore({ tracks, trackIndex: index, getExtraHeight: getTrackExpansionHeight })}px`,
                height: `${getTrackHeight({ type: track.type }) + getTrackExpansionHeight(index)}px`,
              }}
            >
              <TimelineTrackContent
                track={track}
                zoomLevel={zoomLevel}
                dragView={dragView}
                onResizeStart={onResizeStart}
                onElementMouseDown={onElementMouseDown}
                onElementClick={onElementClick}
                onTrackMouseDown={onTrackMouseDown}
                onTrackMouseUp={onTrackMouseUp}
                shouldIgnoreClick={shouldIgnoreClick}
                targetElementId={
                  isDragOver
                    ? (dropTarget?.targetElement?.elementId ?? null)
                    : null
                }
              />
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-40">
            <ContextMenuItem
              icon={<HugeiconsIcon icon={TaskAdd02Icon} />}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                invokeAction("paste-copied");
              }}
            >
              Paste elements
            </ContextMenuItem>
            <ContextMenuItem
              icon={<HugeiconsIcon icon={VolumeHighIcon} />}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                timeline.toggleTrackMute({ trackId: track.id });
              }}
            >
              {canTrackHaveAudio(track) && track.muted
                ? "Unmute track"
                : "Mute track"}
            </ContextMenuItem>
            <ContextMenuItem
              icon={<HugeiconsIcon icon={ViewIcon} />}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                timeline.toggleTrackVisibility({ trackId: track.id });
              }}
            >
              {canTrackBeHidden(track) && track.hidden
                ? "Show track"
                : "Hide track"}
            </ContextMenuItem>
            {track.id !== mainTrackId && (
              <ContextMenuItem
                icon={<HugeiconsIcon icon={Delete02Icon} />}
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  timeline.removeTrack({ trackId: track.id });
                }}
                variant="destructive"
              >
                Delete track
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </>
  );
}

function TimelineGutter({
  onMouseDown,
  onClick,
}: {
  onMouseDown: (event: React.MouseEvent) => void;
  onClick: (event: React.MouseEvent) => void;
}) {
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- spatial gesture surface (empty space below tracks); clicks here clear selection. Keyboard control is global timeline shortcuts.
    <div className="flex-1" onMouseDown={onMouseDown} onClick={onClick} />
  );
}

function TrackIcon({ track }: { track: TimelineTrack }) {
  return <>{TRACK_ICONS[track.type]}</>;
}

function TrackToggleIcon({
  isOff,
  icons,
  onClick,
}: {
  isOff: boolean;
  icons: {
    on: IconSvgElement;
    off: IconSvgElement;
  };
  onClick: () => void;
}) {
  return (
    <>
      {isOff ? (
        <HugeiconsIcon
          icon={icons.off}
          className="text-destructive size-4 cursor-pointer"
          onClick={onClick}
        />
      ) : (
        <HugeiconsIcon
          icon={icons.on}
          className="text-muted-foreground size-4 cursor-pointer"
          onClick={onClick}
        />
      )}
    </>
  );
}

function PropertyTree({ rows }: { rows: ExpandedRow[] }) {
  return (
    <div className="flex flex-col overflow-hidden">
      {rows.map((row) => (
        <div
          key={row.propertyPath}
          className={cn("flex shrink-0 items-center px-3 bg-muted/50")}
          style={{ height: `${KEYFRAME_LANE_HEIGHT_PX}px` }}
        >
          <span className="text-muted-foreground truncate text-xs leading-none">
            {getPropertyLabel(row.propertyPath)}
          </span>
        </div>
      ))}
    </div>
  );
}
