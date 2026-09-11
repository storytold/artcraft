import { computeFeatherUpdate } from "../../param-update";
import type {
  MaskDefinition,
  MaskParamUpdateArgs,
  SplitMaskParams,
} from "../../types";
import { halfPlaneSign, lineEdgeIntersection } from "../../utils";
import {
  getLineMaskHandlePositions,
  getLineMaskOverlay,
} from "../../handle-positions";
import { snapSplitMaskInteraction } from "../../snap";

// Split mask — bisects the canvas with a single rotated line. The
// opaqueFastPath builds a polygon by walking each canvas edge and
// either keeping endpoints inside the half-plane or interpolating
// to the line crossing point. drawWithFeather uses an analytical
// linear gradient (cheaper than JFA and avoids the two-sided
// distance artifact at canvas edges).

// cos(π/2) returns ~6e-17 in JS, not 0. Values below this threshold are
// snapped to exactly 0 to prevent opposite-sign float noise on canvas
// corners that lie exactly on the split line, which produces spurious
// midpoint vertices.
const NORMAL_SNAP_EPSILON = 1e-10;

// Guards against collinear vertices from float noise at canvas edges.
const MIN_POLYGON_AREA_PX = 0.5;
const INTERSECTION_EPSILON = 1e-6;

function polygonArea({ vertices }: { vertices: [number, number][] }): number {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % vertices.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) * 0.5;
}

function splitLineGeometry({
  centerX,
  centerY,
  rotation,
  width,
  height,
}: {
  centerX: number;
  centerY: number;
  rotation: number;
  width: number;
  height: number;
}): { normalX: number; normalY: number; lineX: number; lineY: number } {
  const angleRad = (rotation * Math.PI) / 180;
  const normalX =
    Math.abs(Math.cos(angleRad)) < NORMAL_SNAP_EPSILON ? 0 : Math.cos(angleRad);
  const normalY =
    Math.abs(Math.sin(angleRad)) < NORMAL_SNAP_EPSILON ? 0 : Math.sin(angleRad);
  const lineX = width / 2 + centerX * width;
  const lineY = height / 2 + centerY * height;
  return { normalX, normalY, lineX, lineY };
}

function pointsEqual({
  a,
  b,
}: {
  a: { x: number; y: number };
  b: { x: number; y: number };
}): boolean {
  return (
    Math.abs(a.x - b.x) <= INTERSECTION_EPSILON &&
    Math.abs(a.y - b.y) <= INTERSECTION_EPSILON
  );
}

// Walks the 4 canvas edges and finds where the split line crosses each.
// Returns the two endpoints of the visible stroke segment, or null if
// the line doesn't actually cross the canvas (rare — only happens when
// the line is positioned entirely off-canvas).
export function getSplitMaskStrokeSegment({
  resolvedParams,
  width,
  height,
}: {
  resolvedParams: SplitMaskParams;
  width: number;
  height: number;
}): [{ x: number; y: number }, { x: number; y: number }] | null {
  const { centerX, centerY, rotation } = resolvedParams;
  const { normalX, normalY, lineX, lineY } = splitLineGeometry({
    centerX,
    centerY,
    rotation,
    width,
    height,
  });

  const edges: [number, number, number, number][] = [
    [0, 0, width, 0],
    [width, 0, width, height],
    [width, height, 0, height],
    [0, height, 0, 0],
  ];
  const intersections: { x: number; y: number }[] = [];

  for (const [x1, y1, x2, y2] of edges) {
    const hit = lineEdgeIntersection({
      lineX,
      lineY,
      normalX,
      normalY,
      x1,
      y1,
      x2,
      y2,
    });

    if (!hit || intersections.some((point) => pointsEqual({ a: point, b: hit }))) {
      continue;
    }

    intersections.push(hit);
  }

  if (intersections.length !== 2) {
    return null;
  }

  return [intersections[0], intersections[1]];
}

function computeSplitMaskParamUpdate({
  handleId,
  startParams,
  deltaX,
  deltaY,
  startCanvasX,
  startCanvasY,
  bounds,
  canvasSize,
}: MaskParamUpdateArgs<SplitMaskParams>): Partial<SplitMaskParams> {
  if (handleId.kind === "position") {
    const rawX = startParams.centerX + deltaX / bounds.width;
    const rawY = startParams.centerY + deltaY / bounds.height;

    const minX = -bounds.cx / bounds.width;
    const maxX = (canvasSize.width - bounds.cx) / bounds.width;
    const minY = -bounds.cy / bounds.height;
    const maxY = (canvasSize.height - bounds.cy) / bounds.height;

    return {
      centerX: Math.max(minX, Math.min(maxX, rawX)),
      centerY: Math.max(minY, Math.min(maxY, rawY)),
    };
  }

  if (handleId.kind === "feather") {
    const angleRad = (startParams.rotation * Math.PI) / 180;
    return computeFeatherUpdate({
      startFeather: startParams.feather,
      deltaX,
      deltaY,
      directionX: -Math.cos(angleRad),
      directionY: -Math.sin(angleRad),
    });
  }

  if (handleId.kind === "rotation") {
    const pivotX = bounds.cx + startParams.centerX * bounds.width;
    const pivotY = bounds.cy + startParams.centerY * bounds.height;
    const startAngle =
      (Math.atan2(startCanvasY - pivotY, startCanvasX - pivotX) * 180) /
      Math.PI;
    const currentAngle =
      (Math.atan2(
        startCanvasY + deltaY - pivotY,
        startCanvasX + deltaX - pivotX,
      ) *
        180) /
      Math.PI;

    let deltaAngle = currentAngle - startAngle;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    return {
      rotation: (((startParams.rotation + deltaAngle) % 360) + 360) % 360,
    };
  }

  return {};
}

export const splitMaskDefinition: MaskDefinition<"split"> = {
  type: "split",
  name: "Split",
  features: {
    hasPosition: true,
    hasRotation: true,
    sizeMode: "none",
  },
  interaction: {
    getInteraction({
      params,
      bounds,
      displayScale,
      scaleX: _scaleX,
      scaleY: _scaleY,
    }) {
      return {
        handles: getLineMaskHandlePositions({
          centerX: params.centerX,
          centerY: params.centerY,
          rotation: params.rotation,
          feather: params.feather,
          bounds,
          displayScale,
        }),
        overlays: [
          getLineMaskOverlay({
            centerX: params.centerX,
            centerY: params.centerY,
            rotation: params.rotation,
            bounds,
          }),
        ],
      };
    },
    snap(args) {
      return snapSplitMaskInteraction(args);
    },
  },
  buildDefault() {
    return {
      type: "split",
      params: {
        feather: 0,
        inverted: false,
        strokeColor: "#ffffff",
        strokeWidth: 0,
        strokeAlign: "center",
        centerX: 0,
        centerY: 0,
        rotation: 0,
      },
    };
  },
  computeParamUpdate: computeSplitMaskParamUpdate,
  params: [
    {
      key: "centerX",
      label: "X",
      type: "number",
      default: 0,
      min: -100,
      max: 100,
      step: 1,
      displayMultiplier: 100,
    },
    {
      key: "centerY",
      label: "Y",
      type: "number",
      default: 0,
      min: -100,
      max: 100,
      step: 1,
      displayMultiplier: 100,
    },
    {
      key: "rotation",
      label: "Rotation",
      type: "number",
      default: 0,
      min: 0,
      max: 360,
      step: 1,
    },
  ],
  renderer: {
    body: {
      kind: "drawWithFeather",
      drawWithFeather({ resolvedParams, ctx, width, height, feather }) {
        const { centerX, centerY, rotation } = resolvedParams;
        const { normalX, normalY, lineX, lineY } = splitLineGeometry({
          centerX,
          centerY,
          rotation,
          width,
          height,
        });

        // Analytical gradient avoids JFA's two-sided distance artifact near canvas edges.
        const featherHalf = feather / 2;
        const gradient = ctx.createLinearGradient(
          lineX - normalX * featherHalf,
          lineY - normalY * featherHalf,
          lineX + normalX * featherHalf,
          lineY + normalY * featherHalf,
        );
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(1, "white");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      },

      opaqueFastPath: {
        buildPath({ resolvedParams, width, height }) {
          const { centerX, centerY, rotation } = resolvedParams;
          const { normalX, normalY, lineX, lineY } = splitLineGeometry({
            centerX,
            centerY,
            rotation,
            width,
            height,
          });

          const edges: [number, number, number, number][] = [
            [0, 0, width, 0],
            [width, 0, width, height],
            [width, height, 0, height],
            [0, height, 0, 0],
          ];

          const isInsideHalfPlane = ({
            x,
            y,
          }: {
            x: number;
            y: number;
          }) => halfPlaneSign({ lineX, lineY, normalX, normalY, x, y }) >= 0;

          const vertices: [number, number][] = [];
          for (const [x1, y1, x2, y2] of edges) {
            const isVertex1Inside = isInsideHalfPlane({ x: x1, y: y1 });
            const isVertex2Inside = isInsideHalfPlane({ x: x2, y: y2 });

            if (isVertex1Inside && isVertex2Inside) {
              vertices.push([x2, y2]);
            } else if (isVertex1Inside && !isVertex2Inside) {
              const hit = lineEdgeIntersection({
                lineX,
                lineY,
                normalX,
                normalY,
                x1,
                y1,
                x2,
                y2,
              });
              if (hit) vertices.push([hit.x, hit.y]);
            } else if (!isVertex1Inside && isVertex2Inside) {
              const hit = lineEdgeIntersection({
                lineX,
                lineY,
                normalX,
                normalY,
                x1,
                y1,
                x2,
                y2,
              });
              if (hit) {
                vertices.push([hit.x, hit.y]);
                vertices.push([x2, y2]);
              }
            }
          }

          if (
            vertices.length < 3 ||
            polygonArea({ vertices }) < MIN_POLYGON_AREA_PX
          ) {
            return new Path2D();
          }

          const path = new Path2D();
          path.moveTo(vertices[0][0], vertices[0][1]);
          for (let i = 1; i < vertices.length; i++) {
            path.lineTo(vertices[i][0], vertices[i][1]);
          }
          path.closePath();
          return path;
        },
      },
    },
    stroke: {
      kind: "strokeFromPath",
      buildStrokePath({ resolvedParams, width, height }) {
        const segment = getSplitMaskStrokeSegment({
          resolvedParams,
          width,
          height,
        });
        const path = new Path2D();

        if (!segment) {
          return path;
        }

        path.moveTo(segment[0].x, segment[0].y);
        path.lineTo(segment[1].x, segment[1].y);
        return path;
      },
    },
  },
};
