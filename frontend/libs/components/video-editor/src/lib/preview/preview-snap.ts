// Snap-to-canvas-edge math for the preview canvas. Two kinds of snaps:
//   - Position snap (snapPosition): snaps the element CENTER + EDGES
//     to canvas center/edges in axis-aligned bounding-box space
//   - Scale snap (snapScale / snapScaleAxes): snaps element AABB
//     edges to canvas center/edges, computing the scale value that
//     would land the edge there
//
// Both account for the element's rotation by computing AABB half-
// extents from the cos/sin of the rotation angle. preferredEdges
// breaks ties when multiple edges are equidistant from a snap target
// (e.g. resizing from the left handle prefers the left edge to snap).

export interface SnapLine {
  type: "horizontal" | "vertical";
  position: number;
}

const ROTATION_SNAP_STEP_DEGREES = 90;
const ROTATION_SNAP_THRESHOLD_DEGREES = 5;
export const MIN_SCALE = 0.01;
export const SNAP_THRESHOLD_SCREEN_PIXELS = 8;

export interface SnapResult {
  snappedPosition: { x: number; y: number };
  activeLines: SnapLine[];
}

type ScaleEdge = "left" | "right" | "top" | "bottom";

export interface ScaleEdgePreference {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
}

function hasPreferredEdge({
  preferredEdges,
  edge,
}: {
  preferredEdges?: ScaleEdgePreference;
  edge: ScaleEdge;
}): boolean {
  return preferredEdges?.[edge] === true;
}

function pickClosestScaleCandidate<T extends { distance: number; edge: ScaleEdge }>({
  candidates,
  preferredEdges,
}: {
  candidates: T[];
  preferredEdges?: ScaleEdgePreference;
}): T | null {
  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((bestCandidate, candidate) => {
    if (candidate.distance < bestCandidate.distance) {
      return candidate;
    }
    if (candidate.distance > bestCandidate.distance) {
      return bestCandidate;
    }

    const shouldPreferCandidate = hasPreferredEdge({
      preferredEdges,
      edge: candidate.edge,
    });
    const shouldPreferBestCandidate = hasPreferredEdge({
      preferredEdges,
      edge: bestCandidate.edge,
    });

    return shouldPreferCandidate && !shouldPreferBestCandidate
      ? candidate
      : bestCandidate;
  });
}

export function snapPosition({
  proposedPosition,
  canvasSize,
  elementSize,
  rotation = 0,
  snapThreshold,
}: {
  proposedPosition: { x: number; y: number };
  canvasSize: { width: number; height: number };
  elementSize: { width: number; height: number };
  rotation?: number;
  snapThreshold: { x: number; y: number };
}): SnapResult {
  const centerX = 0;
  const centerY = 0;
  const left = -canvasSize.width / 2;
  const right = canvasSize.width / 2;
  const top = -canvasSize.height / 2;
  const bottom = canvasSize.height / 2;

  const rotRad = (rotation * Math.PI) / 180;
  const cosR = Math.abs(Math.cos(rotRad));
  const sinR = Math.abs(Math.sin(rotRad));
  const halfWidth = (elementSize.width * cosR + elementSize.height * sinR) / 2;
  const halfHeight = (elementSize.width * sinR + elementSize.height * cosR) / 2;
  const activeLines: SnapLine[] = [];

  type AxisSnapCandidate = {
    snappedPosition: number;
    line: SnapLine;
    distance: number;
  };

  function getClosestAxisSnap({
    candidates,
    threshold,
  }: {
    candidates: AxisSnapCandidate[];
    threshold: number;
  }): AxisSnapCandidate | null {
    const snapCandidatesWithinThreshold = candidates.filter(
      (candidate) => candidate.distance <= threshold,
    );
    if (snapCandidatesWithinThreshold.length === 0) {
      return null;
    }
    return snapCandidatesWithinThreshold.reduce((closest, current) =>
      current.distance < closest.distance ? current : closest,
    );
  }

  const verticalTargets = [centerX, left, right];
  const horizontalTargets = [centerY, top, bottom];

  const xCandidates: AxisSnapCandidate[] = [];
  for (const targetX of verticalTargets) {
    xCandidates.push({
      snappedPosition: targetX,
      line: { type: "vertical", position: targetX },
      distance: Math.abs(proposedPosition.x - targetX),
    });
    xCandidates.push({
      snappedPosition: targetX + halfWidth,
      line: { type: "vertical", position: targetX },
      distance: Math.abs(proposedPosition.x - halfWidth - targetX),
    });
    xCandidates.push({
      snappedPosition: targetX - halfWidth,
      line: { type: "vertical", position: targetX },
      distance: Math.abs(proposedPosition.x + halfWidth - targetX),
    });
  }
  const yCandidates: AxisSnapCandidate[] = [];
  for (const targetY of horizontalTargets) {
    yCandidates.push({
      snappedPosition: targetY,
      line: { type: "horizontal", position: targetY },
      distance: Math.abs(proposedPosition.y - targetY),
    });
    yCandidates.push({
      snappedPosition: targetY + halfHeight,
      line: { type: "horizontal", position: targetY },
      distance: Math.abs(proposedPosition.y - halfHeight - targetY),
    });
    yCandidates.push({
      snappedPosition: targetY - halfHeight,
      line: { type: "horizontal", position: targetY },
      distance: Math.abs(proposedPosition.y + halfHeight - targetY),
    });
  }

  const closestX = getClosestAxisSnap({
    candidates: xCandidates,
    threshold: snapThreshold.x,
  });
  const closestY = getClosestAxisSnap({
    candidates: yCandidates,
    threshold: snapThreshold.y,
  });

  const x = closestX?.snappedPosition ?? proposedPosition.x;
  const y = closestY?.snappedPosition ?? proposedPosition.y;
  if (closestX) {
    activeLines.push(closestX.line);
  }
  if (closestY) {
    activeLines.push(closestY.line);
  }

  return {
    snappedPosition: { x, y },
    activeLines,
  };
}

export interface ScaleSnapResult {
  snappedScale: number;
  activeLines: SnapLine[];
}

export function snapScale({
  proposedScale,
  position,
  baseWidth,
  baseHeight,
  rotation = 0,
  canvasSize,
  snapThreshold,
  preferredEdges,
}: {
  proposedScale: number;
  position: { x: number; y: number };
  baseWidth: number;
  baseHeight: number;
  rotation?: number;
  canvasSize: { width: number; height: number };
  snapThreshold: { x: number; y: number };
  preferredEdges?: ScaleEdgePreference;
}): ScaleSnapResult {
  const centerX = 0;
  const centerY = 0;
  const left = -canvasSize.width / 2;
  const right = canvasSize.width / 2;
  const top = -canvasSize.height / 2;
  const bottom = canvasSize.height / 2;

  const rotRad = (rotation * Math.PI) / 180;
  const cosR = Math.abs(Math.cos(rotRad));
  const sinR = Math.abs(Math.sin(rotRad));
  const aabbBaseHalfW = (baseWidth * cosR + baseHeight * sinR) / 2;
  const aabbBaseHalfH = (baseWidth * sinR + baseHeight * cosR) / 2;

  const leftEdge = position.x - aabbBaseHalfW * proposedScale;
  const rightEdge = position.x + aabbBaseHalfW * proposedScale;
  const topEdge = position.y - aabbBaseHalfH * proposedScale;
  const bottomEdge = position.y + aabbBaseHalfH * proposedScale;

  interface SnapCandidate {
    scale: number;
    distance: number;
    lines: SnapLine[];
    edge: ScaleEdge;
  }

  const candidates: SnapCandidate[] = [];

  const verticalTargets = [
    { position: left, line: { type: "vertical" as const, position: left } },
    {
      position: centerX,
      line: { type: "vertical" as const, position: centerX },
    },
    { position: right, line: { type: "vertical" as const, position: right } },
  ];

  for (const target of verticalTargets) {
    const distanceLeft = Math.abs(leftEdge - target.position);
    if (distanceLeft <= snapThreshold.x) {
      const scale = (position.x - target.position) / aabbBaseHalfW;
      if (Math.abs(scale) > MIN_SCALE) {
        candidates.push({
          scale,
          distance: distanceLeft,
          lines: [target.line],
          edge: "left",
        });
      }
    }
    const distanceRight = Math.abs(rightEdge - target.position);
    if (distanceRight <= snapThreshold.x) {
      const scale = (target.position - position.x) / aabbBaseHalfW;
      if (Math.abs(scale) > MIN_SCALE) {
        candidates.push({
          scale,
          distance: distanceRight,
          lines: [target.line],
          edge: "right",
        });
      }
    }
  }

  const horizontalTargets = [
    { position: top, line: { type: "horizontal" as const, position: top } },
    {
      position: centerY,
      line: { type: "horizontal" as const, position: centerY },
    },
    {
      position: bottom,
      line: { type: "horizontal" as const, position: bottom },
    },
  ];

  for (const target of horizontalTargets) {
    const distanceTop = Math.abs(topEdge - target.position);
    if (distanceTop <= snapThreshold.y) {
      const scale = (position.y - target.position) / aabbBaseHalfH;
      if (Math.abs(scale) > MIN_SCALE) {
        candidates.push({
          scale,
          distance: distanceTop,
          lines: [target.line],
          edge: "top",
        });
      }
    }
    const distanceBottom = Math.abs(bottomEdge - target.position);
    if (distanceBottom <= snapThreshold.y) {
      const scale = (target.position - position.y) / aabbBaseHalfH;
      if (Math.abs(scale) > MIN_SCALE) {
        candidates.push({
          scale,
          distance: distanceBottom,
          lines: [target.line],
          edge: "bottom",
        });
      }
    }
  }

  const best = pickClosestScaleCandidate({
    candidates,
    preferredEdges,
  });
  if (!best) {
    return { snappedScale: proposedScale, activeLines: [] };
  }

  const snappedLeft = position.x - aabbBaseHalfW * best.scale;
  const snappedRight = position.x + aabbBaseHalfW * best.scale;
  const snappedTop = position.y - aabbBaseHalfH * best.scale;
  const snappedBottom = position.y + aabbBaseHalfH * best.scale;

  const activeLines: SnapLine[] = [];
  const seenKeys = new Set<string>();

  function addLine({ line }: { line: SnapLine }) {
    const key = `${line.type}-${line.position}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      activeLines.push(line);
    }
  }

  for (const target of verticalTargets) {
    if (
      (hasPreferredEdge({ preferredEdges, edge: "left" }) &&
        Math.abs(snappedLeft - target.position) <= 1) ||
      (hasPreferredEdge({ preferredEdges, edge: "right" }) &&
        Math.abs(snappedRight - target.position) <= 1) ||
      (!preferredEdges &&
        (Math.abs(snappedLeft - target.position) <= 1 ||
          Math.abs(snappedRight - target.position) <= 1))
    ) {
      addLine({ line: target.line });
    }
  }
  for (const target of horizontalTargets) {
    if (
      (hasPreferredEdge({ preferredEdges, edge: "top" }) &&
        Math.abs(snappedTop - target.position) <= 1) ||
      (hasPreferredEdge({ preferredEdges, edge: "bottom" }) &&
        Math.abs(snappedBottom - target.position) <= 1) ||
      (!preferredEdges &&
        (Math.abs(snappedTop - target.position) <= 1 ||
          Math.abs(snappedBottom - target.position) <= 1))
    ) {
      addLine({ line: target.line });
    }
  }

  return {
    snappedScale: best.scale,
    activeLines,
  };
}

export interface AxisSnapResult {
  snappedScale: number;
  // Infinity when no snap candidate was within threshold
  snapDistance: number;
  activeLines: SnapLine[];
}

export function snapScaleAxes({
  proposedScaleX,
  proposedScaleY,
  position,
  baseWidth,
  baseHeight,
  rotation = 0,
  canvasSize,
  snapThreshold,
  preferredEdges,
}: {
  proposedScaleX: number;
  proposedScaleY: number;
  position: { x: number; y: number };
  baseWidth: number;
  baseHeight: number;
  rotation?: number;
  canvasSize: { width: number; height: number };
  snapThreshold: { x: number; y: number };
  preferredEdges?: ScaleEdgePreference;
}): { x: AxisSnapResult; y: AxisSnapResult } {
  const canvasLeft = -canvasSize.width / 2;
  const canvasRight = canvasSize.width / 2;
  const canvasTop = -canvasSize.height / 2;
  const canvasBottom = canvasSize.height / 2;

  const rotRad = (rotation * Math.PI) / 180;
  const cosR = Math.abs(Math.cos(rotRad));
  const sinR = Math.abs(Math.sin(rotRad));
  const EPSILON = 1e-6;

  // Current AABB edges at proposed scales
  const currentAabbHalfW = (baseWidth * proposedScaleX * cosR + baseHeight * proposedScaleY * sinR) / 2;
  const currentAabbHalfH = (baseWidth * proposedScaleX * sinR + baseHeight * proposedScaleY * cosR) / 2;
  const currentLeftEdge = position.x - currentAabbHalfW;
  const currentRightEdge = position.x + currentAabbHalfW;
  const currentTopEdge = position.y - currentAabbHalfH;
  const currentBottomEdge = position.y + currentAabbHalfH;

  interface Candidate {
    scale: number;
    distance: number;
    line: SnapLine;
    edge: ScaleEdge;
  }

  function bestCandidate({
    candidates,
    proposedScale,
  }: {
    candidates: Candidate[];
    proposedScale: number;
  }): AxisSnapResult {
    const best = pickClosestScaleCandidate({
      candidates,
      preferredEdges,
    });
    if (!best) {
      return { snappedScale: proposedScale, snapDistance: Infinity, activeLines: [] };
    }
    return { snappedScale: best.scale, snapDistance: best.distance, activeLines: [best.line] };
  }

  // sX candidates: snap via vertical targets (left/right AABB edges) — only valid when cosR ≠ 0
  // snap via horizontal targets (top/bottom AABB edges) — only valid when sinR ≠ 0
  const xCandidates: Candidate[] = [];
  const yContribW = baseHeight * proposedScaleY * sinR;
  const yContribH = baseHeight * proposedScaleY * cosR;

  if (cosR > EPSILON) {
    for (const T of [canvasLeft, 0, canvasRight]) {
      const line: SnapLine = { type: "vertical", position: T };
      const distLeft = Math.abs(currentLeftEdge - T);
      if (distLeft <= snapThreshold.x) {
        const scale = (2 * (position.x - T) - yContribW) / (baseWidth * cosR);
        if (Math.abs(scale) > MIN_SCALE) xCandidates.push({ scale, distance: distLeft, line, edge: "left" });
      }
      const distRight = Math.abs(currentRightEdge - T);
      if (distRight <= snapThreshold.x) {
        const scale = (2 * (T - position.x) - yContribW) / (baseWidth * cosR);
        if (Math.abs(scale) > MIN_SCALE) xCandidates.push({ scale, distance: distRight, line, edge: "right" });
      }
    }
  }

  if (sinR > EPSILON) {
    for (const T of [canvasTop, 0, canvasBottom]) {
      const line: SnapLine = { type: "horizontal", position: T };
      const distTop = Math.abs(currentTopEdge - T);
      if (distTop <= snapThreshold.y) {
        const scale = (2 * (position.y - T) - yContribH) / (baseWidth * sinR);
        if (Math.abs(scale) > MIN_SCALE) xCandidates.push({ scale, distance: distTop, line, edge: "top" });
      }
      const distBottom = Math.abs(currentBottomEdge - T);
      if (distBottom <= snapThreshold.y) {
        const scale = (2 * (T - position.y) - yContribH) / (baseWidth * sinR);
        if (Math.abs(scale) > MIN_SCALE) xCandidates.push({ scale, distance: distBottom, line, edge: "bottom" });
      }
    }
  }

  // sY candidates: snap via vertical targets — only valid when sinR ≠ 0
  // snap via horizontal targets — only valid when cosR ≠ 0
  const yCandidates: Candidate[] = [];
  const xContribW = baseWidth * proposedScaleX * cosR;
  const xContribH = baseWidth * proposedScaleX * sinR;

  if (sinR > EPSILON) {
    for (const T of [canvasLeft, 0, canvasRight]) {
      const line: SnapLine = { type: "vertical", position: T };
      const distLeft = Math.abs(currentLeftEdge - T);
      if (distLeft <= snapThreshold.x) {
        const scale = (2 * (position.x - T) - xContribW) / (baseHeight * sinR);
        if (Math.abs(scale) > MIN_SCALE) yCandidates.push({ scale, distance: distLeft, line, edge: "left" });
      }
      const distRight = Math.abs(currentRightEdge - T);
      if (distRight <= snapThreshold.x) {
        const scale = (2 * (T - position.x) - xContribW) / (baseHeight * sinR);
        if (Math.abs(scale) > MIN_SCALE) yCandidates.push({ scale, distance: distRight, line, edge: "right" });
      }
    }
  }

  if (cosR > EPSILON) {
    for (const T of [canvasTop, 0, canvasBottom]) {
      const line: SnapLine = { type: "horizontal", position: T };
      const distTop = Math.abs(currentTopEdge - T);
      if (distTop <= snapThreshold.y) {
        const scale = (2 * (position.y - T) - xContribH) / (baseHeight * cosR);
        if (Math.abs(scale) > MIN_SCALE) yCandidates.push({ scale, distance: distTop, line, edge: "top" });
      }
      const distBottom = Math.abs(currentBottomEdge - T);
      if (distBottom <= snapThreshold.y) {
        const scale = (2 * (T - position.y) - xContribH) / (baseHeight * cosR);
        if (Math.abs(scale) > MIN_SCALE) yCandidates.push({ scale, distance: distBottom, line, edge: "bottom" });
      }
    }
  }

  return {
    x: bestCandidate({ candidates: xCandidates, proposedScale: proposedScaleX }),
    y: bestCandidate({ candidates: yCandidates, proposedScale: proposedScaleY }),
  };
}

export interface RotationSnapResult {
  snappedRotation: number;
  isSnapped: boolean;
}

export function snapRotation({
  proposedRotation,
}: {
  proposedRotation: number;
}): RotationSnapResult {
  const nearestRotationSnap =
    Math.round(proposedRotation / ROTATION_SNAP_STEP_DEGREES) *
    ROTATION_SNAP_STEP_DEGREES;
  const distanceToNearestSnap = Math.abs(
    proposedRotation - nearestRotationSnap,
  );
  if (distanceToNearestSnap <= ROTATION_SNAP_THRESHOLD_DEGREES) {
    return { snappedRotation: nearestRotationSnap, isSnapped: true };
  }
  return { snappedRotation: proposedRotation, isSnapped: false };
}
