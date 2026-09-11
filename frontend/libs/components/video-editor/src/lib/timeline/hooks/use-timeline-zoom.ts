import {
  type WheelEvent as ReactWheelEvent,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useReducer,
  useState,
} from "react";
import { useEditor } from "../../editor/use-editor";
import { useCommittedRef } from "../../hooks/use-committed-ref";
import { TIMELINE_ZOOM_MIN } from "../scale";
import {
  ZoomController,
  type ZoomConfig,
} from "../controllers/zoom-controller";
import type { MediaTime } from "../../wasm";

interface UseTimelineZoomProps {
  containerRef: RefObject<HTMLDivElement | null>;
  minZoom?: number;
  initialZoom?: number;
  initialScrollLeft?: number;
  initialPlayheadTime?: MediaTime;
  tracksScrollRef: RefObject<HTMLDivElement | null>;
  rulerScrollRef: RefObject<HTMLDivElement | null>;
}

interface UseTimelineZoomReturn {
  zoomLevel: number;
  setZoomLevel: (zoomLevel: number | ((prev: number) => number)) => void;
  handleWheel: (event: ReactWheelEvent) => void;
  saveScrollPosition: () => void;
}

export function useTimelineZoom({
  containerRef,
  minZoom = TIMELINE_ZOOM_MIN,
  initialZoom,
  initialScrollLeft,
  initialPlayheadTime,
  tracksScrollRef,
  rulerScrollRef,
}: UseTimelineZoomProps): UseTimelineZoomReturn {
  const editor = useEditor();
  const config: ZoomConfig = {
    minZoom,
    getContainerEl: () => containerRef.current,
    getTracksScrollEl: () => tracksScrollRef.current,
    getRulerScrollEl: () => rulerScrollRef.current,
    getCurrentPlayheadTime: () => editor.playback.getCurrentTime(),
    seek: (time) => editor.playback.seek({ time }),
    setTimelineViewState: ({ zoomLevel, scrollLeft, playheadTime }) =>
      editor.project.setTimelineViewState({
        timelineViewState: {
          zoomLevel,
          scrollLeft,
          playheadTime,
        },
      }),
  };
  const configRef = useCommittedRef(config);
  const [controller] = useState(
    () => new ZoomController({ configRef, initialZoom }),
  );
  const zoomLevel = controller.zoomLevel;

  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => controller.subscribe(rerender), [controller]);

  useEffect(() => {
    controller.reconcileInitialAndMinZoom({ minZoom, initialZoom });
  }, [controller, minZoom, initialZoom]);

  useLayoutEffect(() => {
    controller.applyZoomLayout(zoomLevel);
  }, [controller, zoomLevel]);

  useEffect(() => {
    return controller.restoreInitialScrollIfNeeded(initialScrollLeft);
  }, [controller, initialScrollLeft]);

  useEffect(() => {
    controller.restoreInitialPlayheadIfNeeded(initialPlayheadTime);
  }, [controller, initialPlayheadTime]);

  useEffect(() => controller.bindPreventBrowserZoom(), [controller]);

  useEffect(() => () => controller.destroy(), [controller]);

  return {
    zoomLevel,
    setZoomLevel: controller.setZoomLevel,
    handleWheel: controller.handleWheel,
    saveScrollPosition: controller.saveScrollPosition,
  };
}
