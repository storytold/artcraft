"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCommittedRef } from "../../hooks/use-committed-ref";
import {
  canvasToOverlay,
  getDisplayScale,
  positionToOverlay,
  screenPixelsToLogicalThreshold,
  screenToCanvas,
} from "../preview-coords";
import { clamp, isNearlyEqual } from "../../utils/math";
import { PREVIEW_ZOOM } from "../zoom";

const MIDDLE_MOUSE_BUTTON = 1;
const IS_AT_FIT_EPSILON = 0.001;
const IS_AT_ACTUAL_SIZE_EPSILON = 0.01;

interface PreviewViewportContextValue {
  canPan: boolean;
  isAtFit: boolean;
  isAtActualSize: boolean;
  isPanning: boolean;
  sceneHeight: number;
  sceneLeft: number;
  sceneTop: number;
  sceneWidth: number;
  zoomPercent: number;
  canvasToOverlay: ({
    canvasX,
    canvasY,
  }: {
    canvasX: number;
    canvasY: number;
  }) => { x: number; y: number };
  fitToScreen: () => void;
  getDisplayScale: () => { x: number; y: number };
  handlePanPointerDown: ({ event }: { event: React.PointerEvent }) => boolean;
  handlePanPointerMove: ({ event }: { event: React.PointerEvent }) => boolean;
  handlePanPointerUp: ({ event }: { event: React.PointerEvent }) => boolean;
  positionToOverlay: ({
    positionX,
    positionY,
  }: {
    positionX: number;
    positionY: number;
  }) => { x: number; y: number };
  panByScreenDelta: ({
    deltaX,
    deltaY,
  }: {
    deltaX: number;
    deltaY: number;
  }) => void;
  resetPan: () => void;
  scaleZoom: ({ factor }: { factor: number }) => void;
  screenPixelsToLogicalThreshold: ({
    screenPixels,
  }: {
    screenPixels: number;
  }) => { x: number; y: number };
  screenToCanvas: ({
    clientX,
    clientY,
  }: {
    clientX: number;
    clientY: number;
  }) => { x: number; y: number } | null;
  setActualSize: () => void;
  setViewportPercent: ({ percent }: { percent: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const PreviewViewportContext =
  createContext<PreviewViewportContextValue | null>(null);

interface PreviewViewportProviderProps {
  children: React.ReactNode;
  value: PreviewViewportContextValue;
}

interface PreviewViewportStateOptions {
  canvasHeight: number;
  canvasWidth: number;
  viewportHeight: number;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  viewportWidth: number;
}

interface PanSession {
  centerX: number;
  centerY: number;
  clientX: number;
  clientY: number;
  pointerId: number;
}

function getClampedCenterAxis({
  axisSize,
  center,
  scale,
  viewportSize,
}: {
  axisSize: number;
  center: number;
  scale: number;
  viewportSize: number;
}): number {
  if (axisSize <= 0 || scale <= 0 || viewportSize <= 0) {
    return axisSize / 2;
  }

  const visibleHalfSpan = viewportSize / (2 * scale);
  if (visibleHalfSpan >= axisSize / 2) {
    return axisSize / 2;
  }

  return clamp({
    value: center,
    min: visibleHalfSpan,
    max: axisSize - visibleHalfSpan,
  });
}

function clampViewportCenter({
  canvasHeight,
  canvasWidth,
  centerX,
  centerY,
  scale,
  viewportHeight,
  viewportWidth,
}: {
  canvasHeight: number;
  canvasWidth: number;
  centerX: number;
  centerY: number;
  scale: number;
  viewportHeight: number;
  viewportWidth: number;
}): { x: number; y: number } {
  return {
    x: getClampedCenterAxis({
      center: centerX,
      axisSize: canvasWidth,
      scale,
      viewportSize: viewportWidth,
    }),
    y: getClampedCenterAxis({
      center: centerY,
      axisSize: canvasHeight,
      scale,
      viewportSize: viewportHeight,
    }),
  };
}

function getFitScale({
  canvasHeight,
  canvasWidth,
  viewportHeight,
  viewportWidth,
}: {
  canvasHeight: number;
  canvasWidth: number;
  viewportHeight: number;
  viewportWidth: number;
}): number {
  if (
    canvasHeight <= 0 ||
    canvasWidth <= 0 ||
    viewportHeight <= 0 ||
    viewportWidth <= 0
  ) {
    return 1;
  }

  return Math.min(viewportWidth / canvasWidth, viewportHeight / canvasHeight);
}

function getClampedZoom({ zoom }: { zoom: number }): number {
  return clamp({
    value: zoom,
    min: PREVIEW_ZOOM.min,
    max: PREVIEW_ZOOM.max,
  });
}

export function PreviewViewportProvider({
  children,
  value,
}: PreviewViewportProviderProps) {
  return (
    <PreviewViewportContext.Provider value={value}>
      {children}
    </PreviewViewportContext.Provider>
  );
}

export function usePreviewViewportState({
  canvasHeight,
  canvasWidth,
  viewportHeight,
  viewportRef,
  viewportWidth,
}: PreviewViewportStateOptions): PreviewViewportContextValue {
  const [zoom, setZoomState] = useState(1);
  const [center, setCenter] = useState(() => ({
    x: canvasWidth / 2,
    y: canvasHeight / 2,
  }));
  const [isPanning, setIsPanning] = useState(false);
  const panSessionRef = useRef<PanSession | null>(null);
  const centerRef = useCommittedRef(center);

  const fitScale = useMemo(
    () =>
      getFitScale({
        canvasHeight,
        canvasWidth,
        viewportHeight,
        viewportWidth,
      }),
    [canvasHeight, canvasWidth, viewportHeight, viewportWidth],
  );
  const viewportScale = fitScale * zoom;
  const geometry = useMemo(
    () => ({
      canvasHeight,
      canvasWidth,
      centerX: center.x,
      centerY: center.y,
      scale: viewportScale,
      viewportHeight,
      viewportWidth,
    }),
    [
      canvasHeight,
      canvasWidth,
      center.x,
      center.y,
      viewportHeight,
      viewportScale,
      viewportWidth,
    ],
  );

  const scaleZoom = useCallback(({ factor }: { factor: number }) => {
    setZoomState((previousZoom) =>
      getClampedZoom({
        zoom: previousZoom * factor,
      }),
    );
  }, []);

  const panByScreenDelta = useCallback(
    ({ deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
      if (zoom <= 1 || (deltaX === 0 && deltaY === 0)) {
        return;
      }

      setCenter((previousCenter) =>
        clampViewportCenter({
          canvasHeight,
          canvasWidth,
          centerX: previousCenter.x + deltaX / viewportScale,
          centerY: previousCenter.y + deltaY / viewportScale,
          scale: viewportScale,
          viewportHeight,
          viewportWidth,
        }),
      );
    },
    [
      canvasHeight,
      canvasWidth,
      viewportHeight,
      viewportScale,
      viewportWidth,
      zoom,
    ],
  );

  const resetPan = useCallback(() => {
    setCenter({
      x: canvasWidth / 2,
      y: canvasHeight / 2,
    });
  }, [canvasHeight, canvasWidth]);

  const fitToScreen = useCallback(() => {
    setZoomState(1);
    setCenter({
      x: canvasWidth / 2,
      y: canvasHeight / 2,
    });
  }, [canvasHeight, canvasWidth]);

  const zoomIn = useCallback(() => {
    setZoomState((previousZoom) =>
      getClampedZoom({
        zoom: previousZoom * PREVIEW_ZOOM.step,
      }),
    );
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((previousZoom) =>
      getClampedZoom({
        zoom: previousZoom / PREVIEW_ZOOM.step,
      }),
    );
  }, []);

  const setActualSize = useCallback(() => {
    const actualSizeZoom = fitScale > 0 ? 1 / fitScale : 1;
    setZoomState(
      getClampedZoom({
        zoom: actualSizeZoom,
      }),
    );
  }, [fitScale]);

  const setViewportPercent = useCallback(
    ({ percent }: { percent: number }) => {
      const targetZoom = fitScale > 0 ? percent / 100 / fitScale : 1;
      setZoomState(getClampedZoom({ zoom: targetZoom }));
    },
    [fitScale],
  );

  const getViewportRect = useCallback(
    () => viewportRef.current?.getBoundingClientRect() ?? null,
    [viewportRef],
  );

  const screenToCanvasWithViewport = useCallback(
    ({ clientX, clientY }: { clientX: number; clientY: number }) => {
      const viewportRect = getViewportRect();
      if (!viewportRect) return null;

      return screenToCanvas({
        clientX,
        clientY,
        geometry,
        viewportRect,
      });
    },
    [getViewportRect, geometry],
  );

  const canvasToOverlayWithViewport = useCallback(
    ({ canvasX, canvasY }: { canvasX: number; canvasY: number }) =>
      canvasToOverlay({
        canvasX,
        canvasY,
        geometry,
      }),
    [geometry],
  );

  const positionToOverlayWithViewport = useCallback(
    ({ positionX, positionY }: { positionX: number; positionY: number }) =>
      positionToOverlay({
        geometry,
        positionX,
        positionY,
      }),
    [geometry],
  );

  const getDisplayScaleWithViewport = useCallback(
    () => getDisplayScale({ geometry }),
    [geometry],
  );

  const getLogicalThresholdForScreenPixels = useCallback(
    ({ screenPixels }: { screenPixels: number }) =>
      screenPixelsToLogicalThreshold({
        geometry,
        screenPixels,
      }),
    [geometry],
  );

  const handlePanPointerDown = useCallback(
    ({ event }: { event: React.PointerEvent }) => {
      if (event.button !== MIDDLE_MOUSE_BUTTON || zoom <= 1) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();

      panSessionRef.current = {
        centerX: centerRef.current.x,
        centerY: centerRef.current.y,
        clientX: event.clientX,
        clientY: event.clientY,
        pointerId: event.pointerId,
      };
      setIsPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      return true;
    },
    [centerRef, zoom],
  );

  const handlePanPointerMove = useCallback(
    ({ event }: { event: React.PointerEvent }) => {
      const panSession = panSessionRef.current;
      if (!panSession) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();

      const deltaX = event.clientX - panSession.clientX;
      const deltaY = event.clientY - panSession.clientY;
      const nextCenter = clampViewportCenter({
        canvasHeight,
        canvasWidth,
        centerX: panSession.centerX - deltaX / viewportScale,
        centerY: panSession.centerY - deltaY / viewportScale,
        scale: viewportScale,
        viewportHeight,
        viewportWidth,
      });

      setCenter(nextCenter);
      return true;
    },
    [canvasHeight, canvasWidth, viewportHeight, viewportScale, viewportWidth],
  );

  const handlePanPointerUp = useCallback(
    ({ event }: { event: React.PointerEvent }) => {
      const panSession = panSessionRef.current;
      if (!panSession) {
        return false;
      }

      if (
        event.currentTarget.hasPointerCapture(panSession.pointerId)
      ) {
        event.currentTarget.releasePointerCapture(panSession.pointerId);
      }

      panSessionRef.current = null;
      setIsPanning(false);
      return true;
    },
    [],
  );

  useEffect(() => {
    setZoomState(1);
    setCenter({
      x: canvasWidth / 2,
      y: canvasHeight / 2,
    });
    panSessionRef.current = null;
    setIsPanning(false);
  }, [canvasHeight, canvasWidth]);

  useEffect(() => {
    setCenter((previousCenter) =>
      clampViewportCenter({
        canvasHeight,
        canvasWidth,
        centerX: previousCenter.x,
        centerY: previousCenter.y,
        scale: viewportScale,
        viewportHeight,
        viewportWidth,
      }),
    );
  }, [canvasHeight, canvasWidth, viewportHeight, viewportScale, viewportWidth]);

  const sceneWidth = canvasWidth * viewportScale;
  const sceneHeight = canvasHeight * viewportScale;
  const sceneLeft = viewportWidth / 2 - center.x * viewportScale;
  const sceneTop = viewportHeight / 2 - center.y * viewportScale;
  const canPan = zoom > 1;
  const zoomPercent = Math.round(viewportScale * 100);

  return useMemo(
    () => ({
      canPan,
      isAtActualSize: isNearlyEqual({
        leftValue: viewportScale,
        rightValue: 1,
        epsilon: IS_AT_ACTUAL_SIZE_EPSILON,
      }),
      isAtFit: isNearlyEqual({
        leftValue: zoom,
        rightValue: 1,
        epsilon: IS_AT_FIT_EPSILON,
      }),
      isPanning,
      sceneHeight,
      sceneLeft,
      sceneTop,
      sceneWidth,
      zoomPercent,
      canvasToOverlay: canvasToOverlayWithViewport,
      fitToScreen,
      getDisplayScale: getDisplayScaleWithViewport,
      handlePanPointerDown,
      handlePanPointerMove,
      handlePanPointerUp,
      panByScreenDelta,
      positionToOverlay: positionToOverlayWithViewport,
      resetPan,
      scaleZoom,
      screenPixelsToLogicalThreshold: getLogicalThresholdForScreenPixels,
      screenToCanvas: screenToCanvasWithViewport,
      setActualSize,
      setViewportPercent,
      zoomIn,
      zoomOut,
    }),
    [
      canPan,
      viewportScale,
      zoom,
      isPanning,
      sceneHeight,
      sceneLeft,
      sceneTop,
      sceneWidth,
      zoomPercent,
      canvasToOverlayWithViewport,
      fitToScreen,
      getDisplayScaleWithViewport,
      handlePanPointerDown,
      handlePanPointerMove,
      handlePanPointerUp,
      panByScreenDelta,
      positionToOverlayWithViewport,
      resetPan,
      scaleZoom,
      getLogicalThresholdForScreenPixels,
      screenToCanvasWithViewport,
      setActualSize,
      setViewportPercent,
      zoomIn,
      zoomOut,
    ],
  );
}

export function usePreviewViewport() {
  const context = useContext(PreviewViewportContext);
  if (!context) {
    throw new Error(
      "usePreviewViewport must be used within PreviewViewportProvider",
    );
  }

  return context;
}
