import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Line,
  Image,
  RegularPolygon,
  Transformer,
} from "react-konva";
import Konva from "konva"; // Import Konva namespace for types

// https://github.com/SaladTechnologies/comfyui-api

import { ActiveEditTool, useEditStore } from "./stores/EditState";
import SplitPane from "../PageDraw/components/ui/SplitPane";
import { useStageCentering } from "../PageDraw/hooks/useCenteredStage";
import { useGlobalMouseUp } from "../PageDraw/hooks/useGlobalMouseUp";
import { useRightPanelLayoutManagement } from "../PageDraw/hooks/useRightPanelLayoutManagement";
import { LineNode } from "../PageDraw/stores/SceneState";
import { Node } from "../PageDraw/Node";
import { checkerboard } from "@storyteller/common";
import { loadImageFromUrl } from "~/Helpers/ImageHelpers";
import { Vector2d } from "konva/lib/types";

export interface DragState extends Vector2d {
  anchorX: number;
  anchorY: number;
}

export type EditPaintSurfaceProps = {
  nodes: Node[];
  selectedNodeIds: string[];
  onCanvasSizeChange?: (width: number, height: number) => void;
  //fillColor?: string;
  activeTool?: ActiveEditTool;
  brushColor?: string;
  brushSize?: number;
  markerBrushSize?: number;
  eraserBrushSize?: number;
  markerColor?: string;
  onSelectionChange?: (isSelecting: boolean) => void;
  stageRef: React.RefObject<Konva.Stage>;
  transformerRefs: React.RefObject<{ [key: string]: Konva.Transformer }>;
  leftPanelRef: React.RefObject<Konva.Layer>;
  baseImageRef: React.RefObject<Konva.Image>;
};

export const EditPaintSurface = ({
  nodes,
  selectedNodeIds,
  onCanvasSizeChange,
  //fillColor,
  activeTool = "select",
  brushColor = "#000000",
  brushSize = 5,
  markerBrushSize = 5,
  eraserBrushSize = 25,
  markerColor = "#FF0000",
  onSelectionChange,
  stageRef,
  transformerRefs,
  leftPanelRef,
  baseImageRef,
}: EditPaintSurfaceProps) => {
  // switch off to be preview panel mode.
  const singlePaneMode = true;

  const store = useEditStore(); // Use store directly
  const imageRef = React.useRef<Konva.Image>(null);
  // Snapshot image state used in other components
  const [snapshotImage] = useState<HTMLImageElement | null>(null);
  // TODO: Polish this by using canvas graphics instead of a bitmap
  // Or at least manually do the pattern fill to avoid image interpolation
  const [checkerImage, setCheckerImage] = useState<HTMLImageElement | null>(
    null,
  );
  const rightContainerRef = React.useRef<HTMLDivElement>(null);
  const cursorLayerRef = React.useRef<Konva.Layer>(null);
  const cursorShapeRef = React.useRef<Konva.Circle>(null);
  // Removed generating border refs

  // Layout dimensions
  const leftPanelWidth = 1024;
  const leftPanelHeight = 1024;
  const rightPanelWidth = 1024;
  const rightPanelHeight = 1024;

  /* 1️⃣ Track SplitPane percent so we can re-measure */
  const [leftPct, setLeftPct] = useState(singlePaneMode ? 100 : 50);
  const [isDrawing, setIsDrawing] = useState(false);
  const [, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const selectionRectRef = React.useRef<Konva.Rect>(null);
  const [selectionRect, setSelectionRect] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDragging, setIsDragging] = useState<DragState | undefined>(
    undefined,
  );
  // Add a ref to track if we're currently selecting
  const isSelectingRef = React.useRef(false);

  // Add state to track the current line being drawn
  const [currentLineId, setCurrentLineId] = useState<string | null>(null);
  const stagePosition = useStageCentering(
    stageRef,
    leftPct,
    leftPanelWidth,
    leftPanelHeight,
  );

  const NATURAL_WIDTH = rightPanelWidth;
  const NATURAL_HEIGHT = rightPanelHeight;

  // transform variables
  const multiSelectTransformerRef = React.useRef<Konva.Transformer>(null);

  // better to double buffer and use a queue and submit to a queue
  // useStageSnapshot(
  //   stageRef,
  //   imageRef,
  //   isSelectingRef,
  //   transformerRefs
  // );

  const previewScale = useRightPanelLayoutManagement(
    rightContainerRef,
    NATURAL_WIDTH,
    NATURAL_HEIGHT,
    leftPct,
    onCanvasSizeChange,
  );

  useGlobalMouseUp(
    setIsDragging,
    setIsDrawing,
    setCurrentLineId,
    setIsSelecting,
    isSelectingRef,
    setSelectionRect,
    setLastPoint,
    onSelectionChange,
  );

  const clampToLeftPanel = (point: {
    x: number;
    y: number;
  }): { x: number; y: number } => {
    return {
      x: Math.max(0, Math.min(point.x, store.getAspectRatioDimensions().width)), //leftPanelWidth)),
      y: Math.max(
        0,
        Math.min(point.y, store.getAspectRatioDimensions().height),
      ), //leftPanelHeight)),
    };
  };

  const isWithinLeftPanel = (point: { x: number; y: number }): boolean => {
    return (
      point.x >= 0 &&
      point.x <= store.getAspectRatioDimensions().width && //leftPanelWidth &&
      point.y >= 0 &&
      point.y <= store.getAspectRatioDimensions().height // leftPanelHeight
    );
  };

  // Helper function to determine if nodes should be draggable
  const draggableIfToolsNotActive = (
    activeTool: string,
    nodeDraggable: boolean,
  ): boolean => {
    return (
      activeTool !== "edit" &&
      activeTool !== "marker" &&
      activeTool !== "eraser" &&
      nodeDraggable &&
      !isMiddleMousePressed
    );
  };

  // Add state for middle mouse button
  const [isMiddleMousePressed, setIsMiddleMousePressed] = useState(false);

  // Combined mouse handlers
  const handleStageMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const stage = stageRef.current;
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;

    const stagePoint = {
      x: (point.x - stage.x()) / stage.scaleX(),
      y: (point.y - stage.y()) / stage.scaleY(),
    };

    // Check if the target is a transformer or its children (handles)
    const isTransformerTarget =
      e.target.getClassName() === "Transformer" ||
      e.target.getParent()?.getClassName() === "Transformer" ||
      e.target.name()?.includes("_anchor") ||
      e.target.name()?.includes("rotater");

    if (!isWithinLeftPanel(stagePoint) && !isTransformerTarget) {
      setIsDragging({ ...point, anchorX: stage.x(), anchorY: stage.y() });
      return;
    }

    // Improved handling for mouse buttons
    if ("button" in e.evt) {
      const mouseEvent = e.evt as MouseEvent;

      if (mouseEvent.button === 1) {
        // Middle mouse button
        setIsMiddleMousePressed(true);
        setIsDragging({ ...point, anchorX: stage.x(), anchorY: stage.y() });
        return;
      }

      if (mouseEvent.button === 2) {
        // Right mouse button
        if (!isTransformerTarget) {
          setIsDragging({ ...point, anchorX: stage.x(), anchorY: stage.y() });
        }
        return;
      }
    }

    // Handle drawing tools - only start if within bounds
    if (
      (activeTool === "edit" ||
        activeTool === "marker" ||
        activeTool === "eraser") &&
      isWithinLeftPanel(stagePoint)
    ) {
      const lineId = `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const opacity = activeTool === "edit" ? store.brushOpacity : 1;
      const composite =
        activeTool === "eraser"
          ? "destination-out"
          : activeTool === "marker"
            ? "source-over"
            : store.editOperation === "add"
              ? "source-over"
              : "destination-out";
      const strokeColor =
        activeTool === "eraser"
          ? "#FFFFFF"
          : activeTool === "marker"
            ? markerColor
            : store.editOperation === "add"
              ? brushColor
              : "#FFFFFF";

      const lineStrokeWidth =
        activeTool === "eraser"
          ? eraserBrushSize / stage.scaleX()
          : activeTool === "marker"
            ? markerBrushSize / stage.scaleX()
            : brushSize / stage.scaleX();

      const newLineNode: LineNode = {
        id: lineId,
        type: "line",
        points: [stagePoint.x, stagePoint.y],
        stroke: strokeColor,
        strokeWidth: lineStrokeWidth,
        draggable: activeTool === "marker",
        opacity: opacity,
        locked: false,
        zIndex: 0,
        globalCompositeOperation: composite,
      };
      store.selectNode(null);
      store.addLineNode(newLineNode, false);
      setCurrentLineId(lineId);
      setIsDrawing(true);
      setLastPoint(stagePoint);
      return;
    }

    // Handle selection rectangle
    if (activeTool === "select" && e.target === e.target.getStage()) {
      const stage = stageRef.current;
      if (!stage) return;
      const point = stage.getPointerPosition();
      if (!point) return;

      const stagePoint = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      // Clamp the starting point to left panel bounds
      const clampedPoint = clampToLeftPanel(stagePoint);

      setIsSelecting(true);
      isSelectingRef.current = true;
      onSelectionChange?.(true);
      setSelectionRect({
        startX: clampedPoint.x,
        startY: clampedPoint.y,
        endX: clampedPoint.x,
        endY: clampedPoint.y,
      });
    }
  };

  const handleStageMouseMove = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      const stagePoint = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };

      const isWithinCanvas = isWithinLeftPanel(stagePoint);

      // Update cursor position and visibility based on tool and canvas position
      if (
        activeTool === "edit" ||
        activeTool === "marker" ||
        activeTool === "eraser"
      ) {
        if (isWithinCanvas || isDrawing) {
          stage.container().style.cursor = "none";

          // Update cursor directly without triggering React re-render
          const cursorNode = cursorShapeRef.current;
          const cursorLayer = cursorLayerRef.current;
          if (cursorNode && cursorLayer) {
            const stageX = stage.x();
            const stageY = stage.y();
            const scaleX = stage.scaleX();
            const scaleY = stage.scaleY();

            cursorLayer.x(-stageX / scaleX);
            cursorLayer.y(-stageY / scaleY);
            cursorLayer.scaleX(1 / scaleX);
            cursorLayer.scaleY(1 / scaleY);

            cursorNode.visible(true);
            cursorNode.position(pointer);

            const cursorRadius =
              activeTool === "eraser"
                ? eraserBrushSize / 2
                : activeTool === "marker"
                  ? markerBrushSize / 2
                  : brushSize / 2;
            cursorNode.radius(cursorRadius);

            if (activeTool === "marker") {
              cursorNode.fill(markerColor);
              cursorNode.stroke("rgba(255, 255, 255, 0.7)");
              cursorNode.strokeWidth(1);
            } else if (activeTool === "eraser") {
              cursorNode.fill("rgba(255, 255, 255, 0.3)");
              cursorNode.stroke("rgba(0, 0, 0, 0.7)");
              cursorNode.strokeWidth(1);
            } else if (store.editOperation === "add") {
              cursorNode.fill(brushColor);
              cursorNode.stroke("rgba(255, 255, 255, 0.7)");
              cursorNode.strokeWidth(1);
            } else {
              cursorNode.fill("rgba(255, 255, 255, 0.3)");
              cursorNode.stroke("rgba(0, 0, 0, 0.7)");
              cursorNode.strokeWidth(1);
            }

            cursorLayer.batchDraw();
          }
        } else {
          stage.container().style.cursor = "grab";
          const cursorNode = cursorShapeRef.current;
          const cursorLayer = cursorLayerRef.current;
          if (cursorNode && cursorLayer) {
            cursorNode.visible(false);
            cursorLayer.batchDraw();
          }
        }
      } else {
        if (isWithinCanvas) {
          stage.container().style.cursor = "default";
        } else {
          stage.container().style.cursor = "grab";
        }
        const cursorNode = cursorShapeRef.current;
        const cursorLayer = cursorLayerRef.current;
        if (cursorNode && cursorLayer) {
          cursorNode.visible(false);
          cursorLayer.batchDraw();
        }
      }

      // Handle panning with improved dragging
      if (isDragging) {
        const currentStage = e.target.getStage();
        if (!currentStage) return;

        currentStage.container().style.cursor = "grabbing";

        const displacement = {
          x: pointer.x - isDragging.x,
          y: pointer.y - isDragging.y,
        };
        const newPos = {
          x: isDragging.anchorX + displacement.x,
          y: isDragging.anchorY + displacement.y,
        };
        console.log(isDragging, displacement, newPos);
        currentStage.position(newPos);

        return;
      }
    }

    // Handle drawing - only add points if within bounds
    if (
      isDrawing &&
      currentLineId &&
      (activeTool === "edit" ||
        activeTool === "marker" ||
        activeTool === "eraser")
    ) {
      const point = stage.getPointerPosition();
      if (!point) return;

      const stagePoint = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      // Update line directly on the Konva layer without React
      const lineNode = stage.findOne(`#${currentLineId}`) as Konva.Line;
      if (lineNode) {
        const currentPoints = lineNode.points();
        currentPoints.push(stagePoint.x, stagePoint.y);
        lineNode.points(currentPoints);
        lineNode.getLayer()?.batchDraw();
      }

      setLastPoint(stagePoint);
    }

    // Handle selection rectangle - Update directly through Konva
    if (isSelecting && selectionRectRef.current) {
      const point = stage.getPointerPosition();
      if (!point) return;
      const stagePoint = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      // Clamp the current point to left panel bounds
      const clampedPoint = clampToLeftPanel(stagePoint);

      // Update the rectangle directly through Konva without React state
      if (selectionRect) {
        selectionRectRef.current.setAttrs({
          x: Math.min(selectionRect.startX, clampedPoint.x),
          y: Math.min(selectionRect.startY, clampedPoint.y),
          width: Math.abs(clampedPoint.x - selectionRect.startX),
          height: Math.abs(clampedPoint.y - selectionRect.startY),
        });
      }

      // Only update React state for the end points (needed for selection logic)
      setSelectionRect((prev) =>
        prev
          ? {
              // Ensure prev is not null
              ...prev,
              endX: clampedPoint.x,
              endY: clampedPoint.y,
            }
          : null,
      );
    }
  };

  const handleStageMouseUp = () => {
    if (isDrawing && currentLineId) {
      // Update store with final line points after drawing is complete
      const stage = stageRef.current;
      if (stage) {
        const lineNode = stage.findOne(`#${currentLineId}`) as Konva.Line;
        if (lineNode) {
          const finalPoints = lineNode.points();
          store.updateLineNode(currentLineId, { points: finalPoints }, false);
        }
      }
      store.saveState(); // Save state only when the stroke is complete
    }

    if (isSelecting && selectionRect) {
      // Calculate the bounds of the selection rectangle
      const left = Math.min(selectionRect.startX, selectionRect.endX);
      const right = Math.max(selectionRect.startX, selectionRect.endX);
      const top = Math.min(selectionRect.startY, selectionRect.endY);
      const bottom = Math.max(selectionRect.startY, selectionRect.endY);

      // Find all nodes that intersect with the selection rectangle
      const selectedIds: string[] = [];

      // Check regular nodes
      nodes.forEach((node) => {
        if (
          node.x + node.width >= left &&
          node.x <= right &&
          node.y + node.height >= top &&
          node.y <= bottom
        ) {
          selectedIds.push(node.id);
        }
      });

      // Check line nodes
      store.lineNodes.forEach((node) => {
        // Check if any point of the line is within the selection rectangle
        const isInSelection = node.points.some((point, index) => {
          if (index % 2 === 0) {
            // x coordinate
            const x = point;
            const y = node.points[index + 1];
            return x >= left && x <= right && y >= top && y <= bottom;
          }
          return false;
        });

        if (isInSelection) {
          selectedIds.push(node.id);
        }
      });

      // Select all found nodes
      if (selectedIds.length > 0) {
        store.selectNode(selectedIds[0], true);
        selectedIds.slice(1).forEach((id) => {
          store.selectNode(id, true);
        });
      }
    }

    // Always reset all states
    setIsDragging(undefined);
    setIsDrawing(false);
    setCurrentLineId(null); // Clear the current line ID
    setIsSelecting(false);
    isSelectingRef.current = false;
    onSelectionChange?.(false);
    setSelectionRect(null);
    setLastPoint(null);
    setIsMiddleMousePressed(false); // Reset middle mouse state
  };

  const handleStageWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // Improved zoom handling with better precision
    const isPinchGesture = e.evt.ctrlKey;
    const deltaY = e.evt.deltaY;
    const absDelta = Math.abs(deltaY);

    const isMac = navigator.userAgent.includes("Mac");
    const isMacTrackpadScroll =
      isMac && !isPinchGesture && e.evt.deltaMode === 0 && absDelta <= 10;

    let zoomFactor;

    if (isPinchGesture) {
      const pinchSensitivity = 0.2;
      zoomFactor = 1 + deltaY * pinchSensitivity * -0.01;
    } else if (isMacTrackpadScroll) {
      return;
    } else {
      const mouseSensitivity = 0.0005;
      zoomFactor = Math.exp(-deltaY * mouseSensitivity);
    }

    const newScale = Math.max(0.1, Math.min(10, oldScale * zoomFactor));

    if (newScale !== oldScale) {
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
    }
  };

  // Add click handler for the stage to clear selection
  const handleStageClick = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    // Only clear selection if clicking directly on the stage
    if (e.target === e.target.getStage()) {
      store.selectNode(null);
    }
  };

  // End Node Callbacks

  // Add hover handlers
  const handleNodeMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === "select") {
      const container = e.target.getStage()?.container();
      if (container) container.style.cursor = "move";
    }
  };

  const handleNodeMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (!container) return;
    const defaultCursor =
      activeTool === "edit" ||
      activeTool === "marker" ||
      activeTool === "eraser"
        ? "none"
        : activeTool === "select"
          ? "grab"
          : "default";
    container.style.cursor = defaultCursor;
  };

  // Add stage hover handlers
  const handleStageMouseEnter = () => {
    const stage = stageRef.current;
    if (!stage) {
      console.error("Stage reference is not available");
      return;
    }

    if (
      activeTool === "edit" ||
      activeTool === "marker" ||
      activeTool === "eraser"
    ) {
      stage.container().style.cursor = "none";
    } else {
      stage.container().style.cursor = "default";
    }
  };

  const handleStageMouseLeave = () => {
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = "default";
    }
    const cursorNode = cursorShapeRef.current;
    const cursorLayer = cursorLayerRef.current;
    if (cursorNode && cursorLayer) {
      cursorNode.visible(false);
      cursorLayer.batchDraw();
    }
  };

  // Update cursor appearance
  // Adding touch-related state
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(
    null,
  );
  const [isPinching, setIsPinching] = useState(false);

  // Touch helper functions
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2),
    );
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // Touch event handlers
  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length === 2) {
      setIsPinching(true);
      setLastPinchDistance(getTouchDistance(touches));
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length === 2 && isPinching && lastPinchDistance) {
      e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;

      const currentDistance = getTouchDistance(touches);
      const center = getTouchCenter(touches);
      if (!center) return;

      const oldScale = stage.scaleX();
      const scaleChange = currentDistance / lastPinchDistance;

      const newScale = Math.max(0.1, Math.min(10, oldScale * scaleChange));

      if (newScale !== oldScale) {
        const stageCenter = {
          x: (center.x - stage.x()) / oldScale,
          y: (center.y - stage.y()) / oldScale,
        };

        const newPos = {
          x: center.x - stageCenter.x * newScale,
          y: center.y - stageCenter.y * newScale,
        };

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
      }

      setLastPinchDistance(currentDistance);
    }
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length < 2) {
      setIsPinching(false);
      setLastPinchDistance(null);
    }
  };

  // Only update cursor appearance when tool or size changes, not on every mouse move
  useLayoutEffect(() => {
    const cursorNode = cursorShapeRef.current;
    const cursorLayer = cursorLayerRef.current;
    if (!cursorNode || !cursorLayer) return;

    const cursorRadius =
      activeTool === "eraser"
        ? eraserBrushSize / 2
        : activeTool === "marker"
          ? markerBrushSize / 2
          : brushSize / 2;
    cursorNode.radius(cursorRadius);

    if (activeTool === "marker") {
      cursorNode.fill(markerColor);
      cursorNode.stroke("rgba(255, 255, 255, 0.7)");
      cursorNode.strokeWidth(1);
    } else if (activeTool === "eraser") {
      cursorNode.fill("rgba(255, 255, 255, 0.3)");
      cursorNode.stroke("rgba(0, 0, 0, 0.7)");
      cursorNode.strokeWidth(1);
    } else if (store.editOperation === "add") {
      cursorNode.fill(brushColor);
      cursorNode.stroke("rgba(255, 255, 255, 0.7)");
      cursorNode.strokeWidth(1);
    } else {
      cursorNode.fill("rgba(255, 255, 255, 0.3)");
      cursorNode.stroke("rgba(0, 0, 0, 0.7)");
      cursorNode.strokeWidth(1);
    }

    if (cursorNode.visible()) {
      cursorLayer.batchDraw();
    }
  }, [
    activeTool,
    brushColor,
    brushSize,
    markerBrushSize,
    eraserBrushSize,
    markerColor,
    store.editOperation,
  ]);

  const renderNode = (node: Node | LineNode) => {
    // Node Callbacks
    const handleNodeMouseDown = (
      e: Konva.KonvaEventObject<Event>,
      nodeId: string,
    ) => {
      // Don't select nodes when edit, marker, or eraser tool is active
      if (
        activeTool === "edit" ||
        activeTool === "marker" ||
        activeTool === "eraser"
      ) {
        return;
      }

      // Prevent middle mouse button from interacting with nodes (canvas panning only)
      if ("button" in e.evt && (e.evt as MouseEvent).button === 1) {
        setIsMiddleMousePressed(true);
        return;
      }

      // Handle right click for context menu or selection
      if ("button" in e.evt && (e.evt as MouseEvent).button === 2) {
        const node = store.nodes.find((n) => n.id === nodeId);
        const lineNode = store.lineNodes.find((n) => n.id === nodeId);
        const isLocked = (node?.locked || lineNode?.locked) ?? false;

        // If locked, only allow selection for context menu
        if (isLocked) {
          store.selectNode(nodeId);
          return;
        }
      }

      // Don't select locked nodes
      const node =
        nodes.find((n) => n.id === nodeId) ||
        store.lineNodes.find((n) => n.id === nodeId);
      if (node?.locked) {
        return;
      }

      // Check if Ctrl/Cmd key is pressed
      const isMultiSelect =
        "ctrlKey" in e.evt
          ? (e.evt as MouseEvent).ctrlKey || (e.evt as MouseEvent).metaKey
          : false;

      // If clicking directly on the stage, clear selection
      if (e.target === e.target.getStage()) {
        store.selectNode(null);
        return;
      }

      // If the node is already selected and we're not multi-selecting, preserve the current selection
      const isAlreadySelected = selectedNodeIds.includes(nodeId);
      if (isAlreadySelected && !isMultiSelect && selectedNodeIds.length > 1) {
        // Don't change selection - preserve multi-select for dragging
        return;
      }

      store.selectNode(nodeId, isMultiSelect);
    };

    const handleNodeDragStart = (
      e: Konva.KonvaEventObject<Event>,
      nodeId: string,
    ) => {
      const targetNode = e.target as Konva.Node & {
        lastX?: number;
        lastY?: number;
      };
      targetNode.lastX = targetNode.x();
      targetNode.lastY = targetNode.y();

      store.moveNode(nodeId, targetNode.x(), targetNode.y(), 0, 0, false);
    };

    const handleNodeDragMove = (
      e: Konva.KonvaEventObject<Event>,
      nodeId: string,
    ) => {
      const targetNode = e.target as Konva.Node & {
        lastX?: number;
        lastY?: number;
      };

      // Calculate the movement delta
      const dx = targetNode.x() - (targetNode.lastX || targetNode.x());
      const dy = targetNode.y() - (targetNode.lastY || targetNode.y());

      // Update the last position
      targetNode.lastX = targetNode.x();
      targetNode.lastY = targetNode.y();

      store.moveNode(nodeId, targetNode.x(), targetNode.y(), dx, dy, false);
    };

    const handleNodeDragEnd = (
      e: Konva.KonvaEventObject<Event>,
      nodeId: string,
    ) => {
      const targetNode = e.target as Konva.Node & {
        lastX?: number;
        lastY?: number;
      };
      targetNode.lastX = targetNode.x();
      targetNode.lastY = targetNode.y();

      store.moveNode(nodeId, targetNode.x(), targetNode.y(), 0, 0, true);
    };

    const isSelected = selectedNodeIds.includes(node.id);

    const renderTransformer = () => {
      if (isSelected) {
        return (
          <Transformer
            ref={(ref: Konva.Transformer | null) => {
              // Added type for ref
              if (ref) {
                transformerRefs.current[node.id] = ref;
              }
            }}
            boundBoxFunc={(oldBox, newBox) => {
              const minSize = 5;
              const maxSize = Math.max(leftPanelWidth, leftPanelHeight);

              if (
                newBox.width < minSize ||
                newBox.height < minSize ||
                newBox.width > maxSize ||
                newBox.height > maxSize
              ) {
                return oldBox;
              }
              return newBox;
            }}
            enabledAnchors={[
              "top-left",
              "top-center",
              "top-right",
              "middle-right",
              "middle-left",
              "bottom-left",
              "bottom-center",
              "bottom-right",
            ]}
            rotateEnabled={true}
            keepRatio={true}
            centeredScaling={true}
            padding={5}
            shiftBehavior="inverted"
            ignoreStroke={true}
            onTransformEnd={(e: Konva.KonvaEventObject<Event>) => {
              // Cast not needed as we're not using event properties that differ between MouseEvent and TouchEvent
              // Typed event
              const konvaNode = e.target;
              const nodeId = konvaNode.id();

              // Get all transformation values including anchor points
              const finalRotation = konvaNode.rotation();
              const finalScaleX = konvaNode.scaleX();
              const finalScaleY = konvaNode.scaleY();
              const finalX = konvaNode.x();
              const finalY = konvaNode.y();
              const finalOffsetX = konvaNode.offsetX();
              const finalOffsetY = konvaNode.offsetY();

              const isLineNode = store.lineNodes.find((ln) => ln.id === nodeId);

              // Save all transformation values to the store
              if (isLineNode) {
                store.updateLineNode(
                  nodeId,
                  {
                    x: finalX,
                    y: finalY,
                    rotation: finalRotation,
                    scaleX: finalScaleX,
                    scaleY: finalScaleY,
                    offsetX: finalOffsetX,
                    offsetY: finalOffsetY,
                  },
                  true,
                );
              } else {
                store.updateNode(
                  nodeId,
                  {
                    x: finalX,
                    y: finalY,
                    rotation: finalRotation,
                    scaleX: finalScaleX,
                    scaleY: finalScaleY,
                    offsetX: finalOffsetX,
                    offsetY: finalOffsetY,
                  },
                  true,
                ); // Assuming shouldSaveState is true for regular nodes
              }
            }}
          />
        );
      }
      return null;
    };

    if (node.type === "line") {
      const lineNode = node as LineNode;

      const handleLineDragStart = (
        e: Konva.KonvaEventObject<Event>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _nodeId: string, // NodeId is not used but kept for function signature compatibility
      ) => {
        const targetNode = e.target as Konva.Node & {
          lastX?: number;
          lastY?: number;
        };
        targetNode.lastX = targetNode.x();
        targetNode.lastY = targetNode.y();
      };
      const handleLineDragMove = (
        e: Konva.KonvaEventObject<Event>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _nodeId: string, // NodeId is not used but kept for function signature compatibility
      ) => {
        const targetNode = e.target as Konva.Node & {
          lastX?: number;
          lastY?: number;
        };
        targetNode.lastX = targetNode.x(); // This doesn't seem to be used for lines to calculate dx/dy
        targetNode.lastY = targetNode.y(); // but is set for consistency or future use
      };
      const handleLineDragEnd = (
        e: Konva.KonvaEventObject<Event>,
        nodeId: string,
      ) => {
        // Move the line node in the store
        const targetNode = e.target as Konva.Node;
        const finalX = targetNode.x();
        const finalY = targetNode.y();
        const finalOffsetX = targetNode.offsetX(); // Konva might adjust offsetX/Y
        const finalOffsetY = targetNode.offsetY();

        // Update the line node in the store with its final position and transformation
        store.updateLineNode(
          nodeId,
          {
            x: finalX,
            y: finalY,
            offsetX: finalOffsetX,
            offsetY: finalOffsetY,
          },
          true,
        );
      };

      return (
        <React.Fragment key={lineNode.id}>
          <Line
            id={lineNode.id}
            points={lineNode.points}
            stroke={lineNode.stroke}
            opacity={lineNode.opacity ?? 1} // Use the line node's opacity or default to 1
            strokeWidth={
              isSelected
                ? (lineNode.strokeWidth || 0) + 2
                : lineNode.strokeWidth
            }
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            onMouseDown={(e) => handleNodeMouseDown(e, lineNode.id)}
            onTap={(e) => handleNodeMouseDown(e, lineNode.id)}
            onMouseEnter={(e) => handleNodeMouseEnter(e)}
            onMouseLeave={(e) => handleNodeMouseLeave(e)}
            draggable={draggableIfToolsNotActive(
              activeTool,
              lineNode.draggable && lineNode.locked == false,
            )}
            onDragMove={(e) => handleLineDragMove(e, lineNode.id)}
            onDragStart={(e) => handleLineDragStart(e, lineNode.id)}
            onDragEnd={(e) => handleLineDragEnd(e, lineNode.id)}
            x={lineNode.x || 0}
            y={lineNode.y || 0}
            scaleX={lineNode.scaleX || 1}
            scaleY={lineNode.scaleY || 1}
            rotation={lineNode.rotation || 0}
            offsetX={lineNode.offsetX || 0}
            offsetY={lineNode.offsetY || 0}
            zIndex={lineNode.zIndex}
            // @ts-expect-error: We don't have globalCompositeOperation in the type definition
            globalCompositeOperation={
              lineNode.globalCompositeOperation || "source-over"
            }
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    if (node.type === "circle") {
      return (
        <React.Fragment key={node.id}>
          <Circle
            id={node.id}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            fill={node.fill}
            stroke={node.stroke}
            strokeWidth={0}
            rotation={node.rotation || 0}
            scaleX={node.scaleX || 1}
            scaleY={node.scaleY || 1}
            offsetX={node.offsetX || 0}
            offsetY={node.offsetY || 0}
            zIndex={node.zIndex}
            draggable={draggableIfToolsNotActive(
              activeTool,
              node.draggable && node.locked == false,
            )}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onTap={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={(e) => handleNodeMouseEnter(e)}
            onMouseLeave={(e) => handleNodeMouseLeave(e)}
            onDragMove={(e) => handleNodeDragMove(e, node.id)}
            onDragStart={(e) => handleNodeDragStart(e, node.id)}
            onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    if (node.type === "rectangle") {
      return (
        <React.Fragment key={node.id}>
          <Rect
            id={node.id}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            fill={node.fill}
            stroke={node.stroke}
            strokeWidth={0}
            rotation={node.rotation || 0}
            scaleX={node.scaleX || 1}
            scaleY={node.scaleY || 1}
            offsetX={node.offsetX || 0}
            offsetY={node.offsetY || 0}
            zIndex={node.zIndex}
            draggable={draggableIfToolsNotActive(
              activeTool,
              node.draggable && node.locked == false,
            )}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onTap={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={(e) => handleNodeMouseEnter(e)}
            onMouseLeave={(e) => handleNodeMouseLeave(e)}
            onDragMove={(e) => handleNodeDragMove(e, node.id)}
            onDragStart={(e) => handleNodeDragStart(e, node.id)}
            onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    if (node.type === "triangle") {
      return (
        <React.Fragment key={node.id}>
          <RegularPolygon
            id={node.id}
            x={node.x}
            y={node.y}
            sides={3}
            radius={Math.min(node.width, node.height) / 2}
            fill={node.fill}
            stroke={node.stroke}
            strokeWidth={0}
            rotation={node.rotation || 0}
            scaleX={node.scaleX || 1}
            scaleY={node.scaleY || 1}
            offsetX={node.offsetX || 0}
            offsetY={node.offsetY || 0}
            zIndex={node.zIndex}
            draggable={draggableIfToolsNotActive(
              activeTool,
              node.draggable && node.locked == false,
            )}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onTap={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={(e) => handleNodeMouseEnter(e)}
            onMouseLeave={(e) => handleNodeMouseLeave(e)}
            onDragMove={(e) => handleNodeDragMove(e, node.id)}
            onDragStart={(e) => handleNodeDragStart(e, node.id)}
            onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    if (node.type === "image") {
      return (
        <React.Fragment key={node.id}>
          {/* Render background rectangle if backgroundColor is set */}
          {node.backgroundColor && node.backgroundColor !== "transparent" && (
            <Rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              fill={node.backgroundColor}
              stroke={node.stroke}
              strokeWidth={node.strokeWidth}
              rotation={node.rotation || 0}
              scaleX={node.scaleX || 1}
              scaleY={node.scaleY || 1}
              offsetX={node.offsetX || 0}
              offsetY={node.offsetY || 0}
              listening={false}
              zIndex={node.zIndex}
            />
          )}
          <Image
            id={node.id}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            image={node.imageElement || undefined}
            rotation={node.rotation || 0}
            scaleX={node.scaleX || 1}
            scaleY={node.scaleY || 1}
            offsetX={node.offsetX || 0}
            offsetY={node.offsetY || 0}
            draggable={draggableIfToolsNotActive(
              activeTool,
              node.draggable && node.locked == false,
            )}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onTap={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={(e) => handleNodeMouseEnter(e)}
            onMouseLeave={(e) => handleNodeMouseLeave(e)}
            onDragMove={(e) => handleNodeDragMove(e, node.id)}
            onDragStart={(e) => handleNodeDragStart(e, node.id)}
            onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    return null;
  };

  // TODO refactor this out into zustand? and render the draw ?
  useEffect(() => {
    if (!stageRef.current) return;
    // Update individual transformers
    Object.entries(transformerRefs.current).forEach(([nodeId, transformer]) => {
      if (!transformer) return; // Transformer might be null if ref was cleared

      const isSelected = selectedNodeIds.includes(nodeId);
      transformer.visible(isSelected);

      if (isSelected) {
        const node = stageRef.current!.findOne(`#${nodeId}`); // stageRef.current is checked
        if (node) {
          transformer.nodes([node]);
          transformer.getLayer()?.batchDraw();
        }
      }
    });

    // Update multi-select transformer
    if (multiSelectTransformerRef.current && selectedNodeIds.length > 1) {
      const nodes = selectedNodeIds
        .map((id) => stageRef.current.findOne(`#${id}`))
        .filter(Boolean) as Konva.Node[];
      if (nodes.length > 0) {
        multiSelectTransformerRef.current.nodes(nodes);
        multiSelectTransformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedNodeIds, stageRef, transformerRefs]);

  // Load the checkboard image for transparency background
  useEffect(() => {
    loadImageFromUrl(checkerboard).then(setCheckerImage);
  }, []);

  // Smooth fade transition when base image changes
  useEffect(() => {
    if (!store.baseImageBitmap) return;

    const imageNode = baseImageRef.current;
    if (!imageNode) return;

    // Fade out
    const fadeOut = new Konva.Tween({
      node: imageNode,
      opacity: 0,
      duration: 0.08,
      onFinish: () => {
        // Fade in
        const fadeIn = new Konva.Tween({
          node: imageNode,
          opacity: 1,
          duration: 0.15,
        });
        fadeIn.play();
      },
    });

    fadeOut.play();

    return () => {
      fadeOut.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.baseImageBitmap]);

  return (
    <SplitPane
      singlePaneMode={singlePaneMode}
      initialPercent={singlePaneMode ? 100 : 50}
      onChange={setLeftPct}
      left={
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          <div
            style={{
              width: window.innerWidth * (leftPct / 100),
              height: window.innerHeight,
            }}
          >
            <Stage
              ref={stageRef}
              width={window.innerWidth * (leftPct / 100)}
              height={window.innerHeight}
              scaleX={1} // Initial scale, controlled by wheel/zoom
              scaleY={1} // Initial scale, controlled by wheel/zoom
              style={{
                // display: "block",
                background: "transparent", // Or use fillColor if stage background is desired directly
              }}
              x={stagePosition.x} // Set the x position
              y={stagePosition.y} // Set the y position
              onWheel={handleStageWheel}
              onMouseDown={handleStageMouseDown}
              onMouseMove={handleStageMouseMove}
              onMouseUp={handleStageMouseUp}
              onClick={handleStageClick}
              onMouseEnter={handleStageMouseEnter}
              onMouseLeave={handleStageMouseLeave}
              // Touch events
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Layer
                clipFunc={(ctx) => {
                  ctx.rect(
                    0,
                    0,
                    store.getAspectRatioDimensions().width,
                    store.getAspectRatioDimensions().height,
                  ); // leftPanelWidth, leftPanelHeight);
                }}
                imageSmoothingEnabled={false} // Disable image smoothing for pixel art
              >
                <Rect
                  x={0}
                  y={0}
                  fillPatternImage={checkerImage || undefined}
                  fillPatternRepeat="repeat"
                  fillPatternScaleX={window.devicePixelRatio}
                  fillPatternScaleY={window.devicePixelRatio}
                  width={store.getAspectRatioDimensions().width}
                  height={store.getAspectRatioDimensions().height}
                  listening={false}
                  zIndex={-2}
                  imageSmoothingEnabled={false} // Disable image smoothing for pixel art
                />
              </Layer>
              <Layer
                clipFunc={(ctx) => {
                  ctx.rect(
                    0,
                    0,
                    store.getAspectRatioDimensions().width,
                    store.getAspectRatioDimensions().height,
                  ); // leftPanelWidth, leftPanelHeight);
                }}
                imageSmoothingEnabled={false} // Disable image smoothing for pixel art
              >
                <Rect
                  x={0}
                  y={0}
                  fillPatternImage={checkerImage || undefined}
                  fillPatternRepeat="repeat"
                  fillPatternScaleX={window.devicePixelRatio}
                  fillPatternScaleY={window.devicePixelRatio}
                  width={store.getAspectRatioDimensions().width}
                  height={store.getAspectRatioDimensions().height}
                  listening={false}
                  zIndex={-2}
                  imageSmoothingEnabled={false} // Disable image smoothing for pixel art
                />
              </Layer>
              <Layer
                clipFunc={(ctx) => {
                  ctx.rect(
                    0,
                    0,
                    store.getAspectRatioDimensions().width,
                    store.getAspectRatioDimensions().height,
                  ); // leftPanelWidth, leftPanelHeight);
                }}
              >
                <Image
                  ref={baseImageRef}
                  x={0}
                  y={0}
                  image={store.baseImageBitmap || undefined}
                  width={store.getAspectRatioDimensions().width}
                  height={store.getAspectRatioDimensions().height}
                  listening={false}
                  zIndex={-1}
                />
              </Layer>
              {/* Left Panel */}
              <Layer
                ref={leftPanelRef}
                clipFunc={(ctx) => {
                  ctx.rect(
                    0,
                    0,
                    store.getAspectRatioDimensions().width,
                    store.getAspectRatioDimensions().height,
                  ); // leftPanelWidth, leftPanelHeight);
                }}
              >
                {/* Render all nodes including line nodes */}
                {[...nodes, ...store.lineNodes]
                  .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                  .map((node) => {
                    // console.log("Rendering node:", node);
                    return renderNode(node);
                  })}

                {/* Render selection rectangle */}
                {selectionRect && (
                  <Rect
                    ref={selectionRectRef}
                    x={Math.min(selectionRect.startX, selectionRect.endX)}
                    y={Math.min(selectionRect.startY, selectionRect.endY)}
                    width={Math.abs(selectionRect.endX - selectionRect.startX)}
                    height={Math.abs(selectionRect.endY - selectionRect.startY)}
                    fill="rgba(0, 161, 255, 0.1)"
                    stroke="rgb(0, 161, 255)"
                    strokeWidth={1}
                    listening={false}
                    cornerRadius={2}
                  />
                )}
              </Layer>
              <Layer ref={cursorLayerRef} listening={false} draggable={false}>
                <Circle ref={cursorShapeRef} visible={false} />
              </Layer>
            </Stage>
          </div>
        </div>
      }
      right={
        <div
          ref={rightContainerRef}
          className="flex h-full w-full items-center justify-center overflow-hidden p-4"
        >
          <Stage
            width={NATURAL_WIDTH * previewScale}
            height={NATURAL_HEIGHT * previewScale}
            scaleX={previewScale}
            scaleY={previewScale}
            x={0}
            y={0}
            // style={{
            //   background: '#f5f5f5',
            //   border: '1px solid #ddd',
            //   borderRadius: '8px',
            // }}
          >
            <Layer>
              <Image
                ref={imageRef}
                image={snapshotImage || undefined}
                x={0}
                y={0}
                width={rightPanelWidth}
                height={rightPanelHeight}
                fill="white" //"red"
                listening={false}
                zIndex={-1}
              />
            </Layer>
          </Stage>
        </div>
      }
    />
  );
};
