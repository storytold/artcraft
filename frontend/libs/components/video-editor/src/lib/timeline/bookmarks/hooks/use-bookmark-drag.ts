import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type RefObject,
} from "react";
import { useEditor } from "../../../editor/use-editor";
import { useShiftKey } from "../../../hooks/use-shift-key";
import { TIMELINE_DRAG_THRESHOLD_PX } from "../../components/interaction";
import { getMouseTimeFromClientX } from "../../drag-utils";
import {
  buildTimelineSnapPoints,
  getTimelineSnapThresholdInTicks,
  resolveTimelineSnap,
  type SnapPoint,
} from "../../snapping";
import { getBookmarkSnapPoints } from "../snap-source";
import { getElementEdgeSnapPoints } from "../../element-snap-source";
import { getPlayheadSnapPoints } from "../../playhead-snap-source";
import { getAnimationKeyframeSnapPointsForTimeline } from "../../animation-snap-points";
import type { Bookmark } from "../../types";
import { roundFrameTime, type MediaTime, ZERO_MEDIA_TIME } from "../../../wasm";

export interface BookmarkDragState {
  isDragging: boolean;
  bookmarkTime: MediaTime | null;
  currentTime: MediaTime;
}

interface PendingBookmarkDrag {
  bookmarkTime: MediaTime;
  startMouseX: number;
  startMouseY: number;
}

interface UseBookmarkDragProps {
  zoomLevel: number;
  scrollRef: RefObject<HTMLElement | null>;
  snappingEnabled: boolean;
  onSnapPointChange?: (snapPoint: SnapPoint | null) => void;
}

export function useBookmarkDrag({
  zoomLevel,
  scrollRef,
  snappingEnabled,
  onSnapPointChange,
}: UseBookmarkDragProps) {
  const editor = useEditor();
  const isShiftHeldRef = useShiftKey();
  const tracks = editor.scenes.getActiveScene().tracks;
  const activeScene = editor.scenes.getActiveScene();
  const bookmarks = activeScene?.bookmarks ?? [];
  const playheadTime = editor.playback.getCurrentTime();
  const duration = editor.timeline.getTotalDuration();

  const [dragState, setDragState] = useState<BookmarkDragState>({
    isDragging: false,
    bookmarkTime: null,
    currentTime: ZERO_MEDIA_TIME,
  });
  const [isPendingDrag, setIsPendingDrag] = useState(false);
  const pendingDragRef = useRef<PendingBookmarkDrag | null>(null);
  const lastMouseXRef = useRef(0);

  const startDrag = useCallback(
    ({
      bookmarkTime,
      initialCurrentTime,
    }: {
      bookmarkTime: MediaTime;
      initialCurrentTime: MediaTime;
    }) => {
      setDragState({
        isDragging: true,
        bookmarkTime,
        currentTime: initialCurrentTime,
      });
    },
    [],
  );

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      bookmarkTime: null,
      currentTime: ZERO_MEDIA_TIME,
    });
  }, []);

  const getSnapResult = useCallback(
    ({
      rawTime,
      excludeBookmarkTime,
    }: {
      rawTime: MediaTime;
      excludeBookmarkTime: MediaTime;
    }): { snappedTime: MediaTime; snapPoint: SnapPoint | null } => {
      const shouldSnap = snappingEnabled && !isShiftHeldRef.current;
      if (!shouldSnap) {
        return { snappedTime: rawTime, snapPoint: null };
      }

      const snapPoints = buildTimelineSnapPoints({
        sources: [
          () => getElementEdgeSnapPoints({ tracks }),
          () => getPlayheadSnapPoints({ playheadTime }),
          () => getBookmarkSnapPoints({ bookmarks, excludeBookmarkTime }),
          () => getAnimationKeyframeSnapPointsForTimeline({ tracks }),
        ],
      });
      const result = resolveTimelineSnap({
        targetTime: rawTime,
        snapPoints,
        maxSnapDistance: getTimelineSnapThresholdInTicks({ zoomLevel }),
      });
      return {
        snappedTime: result.snappedTime,
        snapPoint: result.snapPoint,
      };
    },
    [
      snappingEnabled,
      tracks,
      playheadTime,
      bookmarks,
      zoomLevel,
      isShiftHeldRef,
    ],
  );

  useEffect(() => {
    if (!dragState.isDragging && !isPendingDrag) return;

    const handleMouseMove = (event: MouseEvent) => {
      lastMouseXRef.current = event.clientX;

      const scrollContainer = scrollRef.current;
      if (!scrollContainer) return;

      if (isPendingDrag && pendingDragRef.current) {
        const { startMouseX, startMouseY, bookmarkTime } =
          pendingDragRef.current;
        const deltaX = Math.abs(event.clientX - startMouseX);
        const deltaY = Math.abs(event.clientY - startMouseY);

        if (
          deltaX <= TIMELINE_DRAG_THRESHOLD_PX &&
          deltaY <= TIMELINE_DRAG_THRESHOLD_PX
        ) {
          return;
        }

        const activeProject = editor.project.getActive();
        if (!activeProject) return;

        const scrollLeft = scrollContainer.scrollLeft;
        const mouseTime = getMouseTimeFromClientX({
          clientX: event.clientX,
          containerRect: scrollContainer.getBoundingClientRect(),
          zoomLevel,
          scrollLeft,
        });
        const clampedTime =
          mouseTime > duration ? duration : mouseTime;
        const frameSnappedTime = roundFrameTime({
          time: clampedTime,
          fps: activeProject.settings.fps,
        });
        const { snappedTime: initialTime } = getSnapResult({
          rawTime: frameSnappedTime,
          excludeBookmarkTime: bookmarkTime,
        });

        startDrag({
          bookmarkTime,
          initialCurrentTime: initialTime,
        });
        pendingDragRef.current = null;
        setIsPendingDrag(false);
        return;
      }

      if (!dragState.isDragging || dragState.bookmarkTime === null) return;

      const activeProject = editor.project.getActive();
      if (!activeProject) return;

      const scrollLeft = scrollContainer.scrollLeft;
      const mouseTime = getMouseTimeFromClientX({
        clientX: event.clientX,
        containerRect: scrollContainer.getBoundingClientRect(),
        zoomLevel,
        scrollLeft,
      });
      const clampedTime =
        mouseTime > duration ? duration : mouseTime;
      const frameSnappedTime = roundFrameTime({
        time: clampedTime,
        fps: activeProject.settings.fps,
      });
      const snapResult = getSnapResult({
        rawTime: frameSnappedTime,
        excludeBookmarkTime: dragState.bookmarkTime,
      });

      setDragState((previousDragState) => ({
        ...previousDragState,
        currentTime: snapResult.snappedTime,
      }));
      onSnapPointChange?.(snapResult.snapPoint);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [
    dragState.isDragging,
    dragState.bookmarkTime,
    zoomLevel,
    duration,
    editor.project,
    scrollRef,
    isPendingDrag,
    startDrag,
    getSnapResult,
    onSnapPointChange,
  ]);

  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseUp = () => {
      if (dragState.bookmarkTime === null) {
        endDrag();
        onSnapPointChange?.(null);
        return;
      }

      const clampedTime =
        dragState.currentTime > duration ? duration : dragState.currentTime;

      editor.scenes.moveBookmark({
        fromTime: dragState.bookmarkTime,
        toTime: clampedTime,
      });

      endDrag();
      onSnapPointChange?.(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [
    dragState.isDragging,
    dragState.bookmarkTime,
    dragState.currentTime,
    duration,
    endDrag,
    onSnapPointChange,
    editor.scenes,
  ]);

  useEffect(() => {
    if (!isPendingDrag) return;

    const handleMouseUp = () => {
      pendingDragRef.current = null;
      setIsPendingDrag(false);
      onSnapPointChange?.(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [isPendingDrag, onSnapPointChange]);

  const handleBookmarkMouseDown = useCallback(
    ({ event, bookmark }: { event: React.MouseEvent; bookmark: Bookmark }) => {
      if (event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();

      pendingDragRef.current = {
        bookmarkTime: bookmark.time,
        startMouseX: event.clientX,
        startMouseY: event.clientY,
      };
      setIsPendingDrag(true);
    },
    [],
  );

  return {
    dragState,
    handleBookmarkMouseDown,
    lastMouseXRef,
  };
}
