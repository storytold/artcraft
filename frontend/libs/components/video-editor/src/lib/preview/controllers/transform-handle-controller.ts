import type { PointerEvent as ReactPointerEvent } from "react";
import type { MediaAsset } from "../../media/types";
import {
  getVisibleElementsWithBounds,
  type Corner,
  type Edge,
  type ElementBounds,
  type ElementWithBounds,
} from "../element-bounds";
import {
  MIN_SCALE,
  SNAP_THRESHOLD_SCREEN_PIXELS,
  snapRotation,
  snapScale,
  snapScaleAxes,
  type ScaleEdgePreference,
  type SnapLine,
} from "../preview-snap";
import { isVisualElement } from "../../timeline/element-utils";
import {
  getElementLocalTime,
  hasKeyframesForPath,
  setChannel,
} from "../../animation";
import type { ElementAnimations } from "../../animation/types";
import type { ParamValues } from "../../params";
import { buildTransformFromParams, type Transform } from "../../rendering";
import { resolveTransformAtTime } from "../../rendering/animation-values";
import type {
  ElementRef,
  SceneTracks,
  TimelineElement,
  VisualElement,
} from "../../timeline/types";

type Point = { readonly x: number; readonly y: number };
type CanvasSize = { readonly width: number; readonly height: number };
type HandleType = Corner | Edge | "rotation";

interface CapturedPointerState {
  readonly pointerId: number;
  readonly captureTarget: HTMLElement;
}

interface CornerScaleSession extends CapturedPointerState {
  readonly kind: "corner-scale";
  readonly corner: Corner;
  readonly trackId: string;
  readonly elementId: string;
  readonly initialTransform: Transform;
  readonly initialParams: ParamValues;
  readonly initialDistance: number;
  readonly initialBoundsCx: number;
  readonly initialBoundsCy: number;
  readonly baseWidth: number;
  readonly baseHeight: number;
  readonly shouldClearScaleAnimation: boolean;
  readonly animationsWithoutScale: ElementAnimations | undefined;
}

interface EdgeScaleSession extends CapturedPointerState {
  readonly kind: "edge-scale";
  readonly edge: Edge;
  readonly trackId: string;
  readonly elementId: string;
  readonly initialTransform: Transform;
  readonly initialParams: ParamValues;
  readonly initialBoundsCx: number;
  readonly initialBoundsCy: number;
  readonly baseWidth: number;
  readonly baseHeight: number;
  readonly rotationRad: number;
  readonly shouldClearScaleAnimation: boolean;
  readonly animationsWithoutScale: ElementAnimations | undefined;
}

interface RotationSession extends CapturedPointerState {
  readonly kind: "rotation";
  readonly trackId: string;
  readonly elementId: string;
  readonly initialTransform: Transform;
  readonly initialParams: ParamValues;
  readonly initialAngle: number;
  readonly initialBoundsCx: number;
  readonly initialBoundsCy: number;
}

type TransformSession =
  | { readonly kind: "idle" }
  | CornerScaleSession
  | EdgeScaleSession
  | RotationSession;

const IDLE_SESSION: TransformSession = { kind: "idle" };

interface VisualSelectionContext {
  readonly trackId: string;
  readonly elementId: string;
  readonly element: VisualElement;
  readonly bounds: ElementBounds;
  readonly resolvedTransform: Transform;
}

export interface PreviewViewportAdapter {
  screenToCanvas: ({
    clientX,
    clientY,
  }: {
    clientX: number;
    clientY: number;
  }) => Point | null;
  screenPixelsToLogicalThreshold: ({
    screenPixels,
  }: {
    screenPixels: number;
  }) => Point;
}

export interface InputAdapter {
  isShiftHeld: () => boolean;
}

export interface SceneReader {
  getSelectedElements: () => readonly ElementRef[];
  getTracks: () => SceneTracks;
  getCurrentTime: () => number;
  getMediaAssets: () => MediaAsset[];
  getCanvasSize: () => CanvasSize;
}

export interface TimelinePreviewUpdate {
  readonly trackId: string;
  readonly elementId: string;
  readonly updates: Partial<TimelineElement>;
}

export interface TimelineOps {
  previewElements: (updates: readonly TimelinePreviewUpdate[]) => void;
  commitPreview: () => void;
  discardPreview: () => void;
}

export interface PreviewOptions {
  onSnapLinesChange?: (lines: SnapLine[]) => void;
}

export interface TransformHandleDeps {
  viewport: PreviewViewportAdapter;
  input: InputAdapter;
  scene: SceneReader;
  timeline: TimelineOps;
  preview: PreviewOptions;
}

export interface TransformHandleDepsRef {
  readonly current: TransformHandleDeps;
}

function getPreferredEdge({ edge }: { edge: Edge }): ScaleEdgePreference {
  return edge === "right"
    ? { right: true }
    : edge === "left"
      ? { left: true }
      : { bottom: true };
}

function clampScaleNonZero(scale: number): number {
  if (Math.abs(scale) < MIN_SCALE) {
    return scale < 0 ? -MIN_SCALE : MIN_SCALE;
  }
  return scale;
}

function getCornerDistance({
  bounds,
  corner,
}: {
  bounds: ElementBounds;
  corner: Corner;
}): number {
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;
  const angleRad = (bounds.rotation * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const localX =
    corner === "top-left" || corner === "bottom-left" ? -halfWidth : halfWidth;
  const localY =
    corner === "top-left" || corner === "top-right" ? -halfHeight : halfHeight;

  const rotatedX = localX * cos - localY * sin;
  const rotatedY = localX * sin + localY * cos;
  return Math.sqrt(rotatedX * rotatedX + rotatedY * rotatedY) || 1;
}

function buildSelectedWithBounds({
  selectedElements,
  elementsWithBounds,
}: {
  selectedElements: readonly ElementRef[];
  elementsWithBounds: readonly ElementWithBounds[];
}): ElementWithBounds | null {
  if (selectedElements.length !== 1) return null;

  return (
    elementsWithBounds.find(
      (entry) =>
        entry.trackId === selectedElements[0].trackId &&
        entry.elementId === selectedElements[0].elementId,
    ) ?? null
  );
}

function buildCornerScaleAnimationReset({
  animations,
}: {
  animations: ElementAnimations | undefined;
}): {
  shouldClearScaleAnimation: boolean;
  animationsWithoutScale: ElementAnimations | undefined;
} {
  const shouldClearScaleAnimation =
    hasKeyframesForPath({
      animations,
      propertyPath: "transform.scaleX",
    }) ||
    hasKeyframesForPath({
      animations,
      propertyPath: "transform.scaleY",
    });

  return {
    shouldClearScaleAnimation,
    animationsWithoutScale: shouldClearScaleAnimation
      ? setChannel({
          animations: setChannel({
            animations,
            propertyPath: "transform.scaleX",
            channel: undefined,
          }),
          propertyPath: "transform.scaleY",
          channel: undefined,
        })
      : animations,
  };
}

function buildEdgeScaleAnimationReset({
  animations,
  edge,
}: {
  animations: ElementAnimations | undefined;
  edge: Edge;
}): {
  shouldClearScaleAnimation: boolean;
  animationsWithoutScale: ElementAnimations | undefined;
} {
  const propertyPath =
    edge === "right" || edge === "left"
      ? "transform.scaleX"
      : "transform.scaleY";

  const shouldClearScaleAnimation = hasKeyframesForPath({
    animations,
    propertyPath,
  });

  return {
    shouldClearScaleAnimation,
    animationsWithoutScale: shouldClearScaleAnimation
      ? setChannel({
          animations,
          propertyPath,
          channel: undefined,
        })
      : animations,
  };
}

export class TransformHandleController {
  private readonly depsRef: TransformHandleDepsRef;
  private readonly subscribers = new Set<() => void>();

  private session: TransformSession = IDLE_SESSION;

  constructor({ depsRef }: { depsRef: TransformHandleDepsRef }) {
    this.depsRef = depsRef;

    this.onCornerPointerDown = this.onCornerPointerDown.bind(this);
    this.onEdgePointerDown = this.onEdgePointerDown.bind(this);
    this.onRotationPointerDown = this.onRotationPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  private get deps(): TransformHandleDeps {
    return this.depsRef.current;
  }

  get selectedWithBounds(): ElementWithBounds | null {
    return buildSelectedWithBounds({
      selectedElements: this.deps.scene.getSelectedElements(),
      elementsWithBounds: this.getVisibleElementsWithBounds(),
    });
  }

  get activeHandle(): HandleType | null {
    switch (this.session.kind) {
      case "corner-scale":
        return this.session.corner;
      case "edge-scale":
        return this.session.edge;
      case "rotation":
        return "rotation";
      default:
        return null;
    }
  }

  get isActive(): boolean {
    return this.session.kind !== "idle";
  }

  subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  destroy(): void {
    if (this.session.kind !== "idle") {
      const session = this.session;
      this.session = IDLE_SESSION;
      this.deps.timeline.discardPreview();
      this.clearSnapLines();
      this.releaseCapturedPointer(session);
    }

    this.subscribers.clear();
  }

  cancel(): void {
    if (this.session.kind === "idle") return;

    const session = this.session;
    this.session = IDLE_SESSION;
    this.deps.timeline.discardPreview();
    this.clearSnapLines();
    this.releaseCapturedPointer(session);
    this.notify();
  }

  onCornerPointerDown({
    event,
    corner,
  }: {
    event: ReactPointerEvent;
    corner: Corner;
  }): void {
    const context = this.getSelectedVisualContext();
    if (!context) return;

    event.stopPropagation();

    const { shouldClearScaleAnimation, animationsWithoutScale } =
      buildCornerScaleAnimationReset({
        animations: context.element.animations,
      });

    this.session = {
      kind: "corner-scale",
      corner,
      trackId: context.trackId,
      elementId: context.elementId,
      initialTransform: context.resolvedTransform,
      initialParams: context.element.params,
      initialDistance: getCornerDistance({
        bounds: context.bounds,
        corner,
      }),
      initialBoundsCx: context.bounds.cx,
      initialBoundsCy: context.bounds.cy,
      baseWidth: context.bounds.width / context.resolvedTransform.scaleX,
      baseHeight: context.bounds.height / context.resolvedTransform.scaleY,
      shouldClearScaleAnimation,
      animationsWithoutScale,
      pointerId: event.pointerId,
      captureTarget: this.capturePointer({
        target: event.currentTarget as HTMLElement,
        pointerId: event.pointerId,
      }),
    };

    this.notify();
  }

  onRotationPointerDown({ event }: { event: ReactPointerEvent }): void {
    const context = this.getSelectedVisualContext();
    if (!context) return;

    event.stopPropagation();

    const position = this.deps.viewport.screenToCanvas({
      clientX: event.clientX,
      clientY: event.clientY,
    });
    if (!position) return;

    const deltaX = position.x - context.bounds.cx;
    const deltaY = position.y - context.bounds.cy;
    const initialAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

    this.session = {
      kind: "rotation",
      trackId: context.trackId,
      elementId: context.elementId,
      initialTransform: context.resolvedTransform,
      initialParams: context.element.params,
      initialAngle,
      initialBoundsCx: context.bounds.cx,
      initialBoundsCy: context.bounds.cy,
      pointerId: event.pointerId,
      captureTarget: this.capturePointer({
        target: event.currentTarget as HTMLElement,
        pointerId: event.pointerId,
      }),
    };

    this.notify();
  }

  onEdgePointerDown({
    event,
    edge,
  }: {
    event: ReactPointerEvent;
    edge: Edge;
  }): void {
    const context = this.getSelectedVisualContext();
    if (!context) return;

    event.stopPropagation();

    const { shouldClearScaleAnimation, animationsWithoutScale } =
      buildEdgeScaleAnimationReset({
        animations: context.element.animations,
        edge,
      });

    this.session = {
      kind: "edge-scale",
      edge,
      trackId: context.trackId,
      elementId: context.elementId,
      initialTransform: context.resolvedTransform,
      initialParams: context.element.params,
      initialBoundsCx: context.bounds.cx,
      initialBoundsCy: context.bounds.cy,
      baseWidth: context.bounds.width / context.resolvedTransform.scaleX,
      baseHeight: context.bounds.height / context.resolvedTransform.scaleY,
      rotationRad: (context.bounds.rotation * Math.PI) / 180,
      shouldClearScaleAnimation,
      animationsWithoutScale,
      pointerId: event.pointerId,
      captureTarget: this.capturePointer({
        target: event.currentTarget as HTMLElement,
        pointerId: event.pointerId,
      }),
    };

    this.notify();
  }

  onPointerMove({ event }: { event: ReactPointerEvent }): void {
    if (this.session.kind === "idle") return;

    const position = this.deps.viewport.screenToCanvas({
      clientX: event.clientX,
      clientY: event.clientY,
    });
    if (!position) return;

    switch (this.session.kind) {
      case "corner-scale":
        this.previewCornerScale({
          session: this.session,
          position,
        });
        return;
      case "edge-scale":
        this.previewEdgeScale({
          session: this.session,
          position,
        });
        return;
      case "rotation":
        this.previewRotation({
          session: this.session,
          position,
        });
        return;
      default:
        return;
    }
  }

  onPointerUp(): void {
    if (this.session.kind === "idle") return;

    const session = this.session;
    this.session = IDLE_SESSION;
    this.deps.timeline.commitPreview();
    this.clearSnapLines();
    this.releaseCapturedPointer(session);
    this.notify();
  }

  private notify(): void {
    for (const fn of this.subscribers) fn();
  }

  private clearSnapLines(): void {
    this.deps.preview.onSnapLinesChange?.([]);
  }

  private capturePointer({
    target,
    pointerId,
  }: {
    target: HTMLElement;
    pointerId: number;
  }): HTMLElement {
    target.setPointerCapture(pointerId);
    return target;
  }

  private releaseCapturedPointer(pointerState: CapturedPointerState): void {
    if (!pointerState.captureTarget.hasPointerCapture(pointerState.pointerId)) {
      return;
    }

    pointerState.captureTarget.releasePointerCapture(pointerState.pointerId);
  }

  private getVisibleElementsWithBounds(): ElementWithBounds[] {
    return getVisibleElementsWithBounds({
      tracks: this.deps.scene.getTracks(),
      currentTime: this.deps.scene.getCurrentTime(),
      canvasSize: this.deps.scene.getCanvasSize(),
      mediaAssets: this.deps.scene.getMediaAssets(),
    });
  }

  private getSelectedVisualContext(): VisualSelectionContext | null {
    const selectedWithBounds = this.selectedWithBounds;
    if (!selectedWithBounds) return null;
    if (!isVisualElement(selectedWithBounds.element)) return null;

    const localTime = getElementLocalTime({
      timelineTime: this.deps.scene.getCurrentTime(),
      elementStartTime: selectedWithBounds.element.startTime,
      elementDuration: selectedWithBounds.element.duration,
    });

    return {
      trackId: selectedWithBounds.trackId,
      elementId: selectedWithBounds.elementId,
      element: selectedWithBounds.element,
      bounds: selectedWithBounds.bounds,
      resolvedTransform: resolveTransformAtTime({
        baseTransform: buildTransformFromParams({
          params: selectedWithBounds.element.params,
        }),
        animations: selectedWithBounds.element.animations,
        localTime,
      }),
    };
  }

  private previewCornerScale({
    session,
    position,
  }: {
    session: CornerScaleSession;
    position: Point;
  }): void {
    const deltaX = position.x - session.initialBoundsCx;
    const deltaY = position.y - session.initialBoundsCy;
    const currentDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
    const scaleFactor = currentDistance / session.initialDistance;

    // Use actual element dimensions (base * current scale) so snapping is
    // computed from the rendered geometry when scaleX != scaleY.
    const effectiveWidth = session.baseWidth * session.initialTransform.scaleX;
    const effectiveHeight =
      session.baseHeight * session.initialTransform.scaleY;

    const snapThreshold = this.deps.viewport.screenPixelsToLogicalThreshold({
      screenPixels: SNAP_THRESHOLD_SCREEN_PIXELS,
    });
    const { snappedScale, activeLines } = this.deps.input.isShiftHeld()
      ? { snappedScale: scaleFactor, activeLines: [] as SnapLine[] }
      : snapScale({
          proposedScale: scaleFactor,
          position: session.initialTransform.position,
          baseWidth: effectiveWidth,
          baseHeight: effectiveHeight,
          rotation: session.initialTransform.rotate,
          canvasSize: this.deps.scene.getCanvasSize(),
          snapThreshold,
        });

    this.deps.preview.onSnapLinesChange?.(activeLines);

    this.deps.timeline.previewElements([
      {
        trackId: session.trackId,
        elementId: session.elementId,
        updates: {
          params: buildParamsWithTransform({
            params: session.initialParams,
            transform: {
              ...session.initialTransform,
              scaleX: clampScaleNonZero(
                session.initialTransform.scaleX * snappedScale,
              ),
              scaleY: clampScaleNonZero(
                session.initialTransform.scaleY * snappedScale,
              ),
            },
          }),
          ...(session.shouldClearScaleAnimation && {
            animations: session.animationsWithoutScale,
          }),
        },
      },
    ]);
  }

  private previewEdgeScale({
    session,
    position,
  }: {
    session: EdgeScaleSession;
    position: Point;
  }): void {
    const deltaX = position.x - session.initialBoundsCx;
    const deltaY = position.y - session.initialBoundsCy;
    const xProjection =
      deltaX * Math.cos(session.rotationRad) +
      deltaY * Math.sin(session.rotationRad);
    const yProjection =
      -deltaX * Math.sin(session.rotationRad) +
      deltaY * Math.cos(session.rotationRad);
    const projection =
      session.edge === "right"
        ? xProjection
        : session.edge === "left"
          ? -xProjection
          : yProjection;

    const baseAxisHalf =
      session.edge === "right" || session.edge === "left"
        ? session.baseWidth / 2
        : session.baseHeight / 2;
    const proposedScale = clampScaleNonZero(projection / baseAxisHalf);

    const proposedScaleX =
      session.edge === "right" || session.edge === "left"
        ? proposedScale
        : session.initialTransform.scaleX;
    const proposedScaleY =
      session.edge === "bottom"
        ? proposedScale
        : session.initialTransform.scaleY;

    const snapThreshold = this.deps.viewport.screenPixelsToLogicalThreshold({
      screenPixels: SNAP_THRESHOLD_SCREEN_PIXELS,
    });
    const { x: xSnap, y: ySnap } = this.deps.input.isShiftHeld()
      ? {
          x: {
            snappedScale: proposedScaleX,
            snapDistance: Infinity,
            activeLines: [] as SnapLine[],
          },
          y: {
            snappedScale: proposedScaleY,
            snapDistance: Infinity,
            activeLines: [] as SnapLine[],
          },
        }
      : snapScaleAxes({
          proposedScaleX,
          proposedScaleY,
          position: session.initialTransform.position,
          baseWidth: session.baseWidth,
          baseHeight: session.baseHeight,
          rotation: session.initialTransform.rotate,
          canvasSize: this.deps.scene.getCanvasSize(),
          snapThreshold,
          preferredEdges: getPreferredEdge({ edge: session.edge }),
        });

    const relevantSnap =
      session.edge === "right" || session.edge === "left" ? xSnap : ySnap;
    this.deps.preview.onSnapLinesChange?.(relevantSnap.activeLines);

    this.deps.timeline.previewElements([
      {
        trackId: session.trackId,
        elementId: session.elementId,
        updates: {
          params: buildParamsWithTransform({
            params: session.initialParams,
            transform: {
              ...session.initialTransform,
              scaleX:
                session.edge === "right" || session.edge === "left"
                  ? xSnap.snappedScale
                  : session.initialTransform.scaleX,
              scaleY:
                session.edge === "bottom"
                  ? ySnap.snappedScale
                  : session.initialTransform.scaleY,
            },
          }),
          ...(session.shouldClearScaleAnimation && {
            animations: session.animationsWithoutScale,
          }),
        },
      },
    ]);
  }

  private previewRotation({
    session,
    position,
  }: {
    session: RotationSession;
    position: Point;
  }): void {
    const deltaX = position.x - session.initialBoundsCx;
    const deltaY = position.y - session.initialBoundsCy;
    const currentAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    let deltaAngle = currentAngle - session.initialAngle;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    const newRotate = session.initialTransform.rotate + deltaAngle;
    const { snappedRotation } = this.deps.input.isShiftHeld()
      ? { snappedRotation: newRotate }
      : snapRotation({ proposedRotation: newRotate });

    this.deps.timeline.previewElements([
      {
        trackId: session.trackId,
        elementId: session.elementId,
        updates: {
          params: buildParamsWithTransform({
            params: session.initialParams,
            transform: {
              ...session.initialTransform,
              rotate: snappedRotation,
            },
          }),
        },
      },
    ]);
  }
}

function buildParamsWithTransform({
  params,
  transform,
}: {
  params: ParamValues;
  transform: Transform;
}): ParamValues {
  return {
    ...params,
    "transform.positionX": transform.position.x,
    "transform.positionY": transform.position.y,
    "transform.scaleX": transform.scaleX,
    "transform.scaleY": transform.scaleY,
    "transform.rotate": transform.rotate,
  };
}
