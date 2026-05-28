import {
  getDefaultLeftHandle,
  getDefaultRightHandle,
} from "./bezier";
import type {
  CurveHandle,
  NormalizedCubicBezier,
  ScalarAnimationKey,
} from "./types";
import { roundMediaTime } from "../wasm";

// Maps between the two representations of a Bezier segment:
//   - Internal: per-key dt/dv handles in time/value space
//   - "Normalized" cubic Bezier: [x1, y1, x2, y2] tuple in 0..1 space
//     used by the visual curve picker (CSS-easing-style)
// The bridge lets the curve picker UI work in normalized space while
// the underlying animation channel stores absolute handles.

const VALUE_EPSILON = 1e-6;

function clamp01({ value }: { value: number }): number {
  return Math.max(0, Math.min(1, value));
}

export function getNormalizedCubicBezierForScalarSegment({
  leftKey,
  rightKey,
  referenceSpanValue,
}: {
  leftKey: ScalarAnimationKey;
  rightKey: ScalarAnimationKey;
  // Fallback Y-axis scale used when the segment is flat (spanValue ≈ 0).
  referenceSpanValue?: number;
}): NormalizedCubicBezier | null {
  const spanTime = rightKey.time - leftKey.time;
  const spanValue = rightKey.value - leftKey.value;
  const effectiveSpanValue =
    Math.abs(spanValue) > VALUE_EPSILON
      ? spanValue
      : referenceSpanValue !== undefined && Math.abs(referenceSpanValue) > VALUE_EPSILON
        ? referenceSpanValue
        : null;

  if (spanTime === 0 || effectiveSpanValue === null) {
    return null;
  }

  const rightHandle =
    leftKey.rightHandle ?? getDefaultRightHandle({ leftKey, rightKey });
  const leftHandle =
    rightKey.leftHandle ?? getDefaultLeftHandle({ leftKey, rightKey });

  return [
    clamp01({ value: rightHandle.dt / spanTime }),
    rightHandle.dv / effectiveSpanValue,
    clamp01({ value: 1 + leftHandle.dt / spanTime }),
    1 + leftHandle.dv / effectiveSpanValue,
  ];
}

export function getCurveHandlesForNormalizedCubicBezier({
  leftKey,
  rightKey,
  cubicBezier,
  referenceSpanValue,
}: {
  leftKey: ScalarAnimationKey;
  rightKey: ScalarAnimationKey;
  cubicBezier: NormalizedCubicBezier;
  referenceSpanValue?: number;
}): {
  rightHandle: CurveHandle;
  leftHandle: CurveHandle;
} | null {
  const spanTime = rightKey.time - leftKey.time;
  const spanValue = rightKey.value - leftKey.value;
  const effectiveSpanValue =
    Math.abs(spanValue) > VALUE_EPSILON
      ? spanValue
      : referenceSpanValue !== undefined && Math.abs(referenceSpanValue) > VALUE_EPSILON
        ? referenceSpanValue
        : null;

  if (spanTime === 0 || effectiveSpanValue === null) {
    return null;
  }

  const [rawX1, y1, rawX2, y2] = cubicBezier;
  const x1 = clamp01({ value: rawX1 });
  const x2 = clamp01({ value: rawX2 });

  return {
    rightHandle: {
      dt: roundMediaTime({ time: spanTime * x1 }),
      dv: effectiveSpanValue * y1,
    },
    leftHandle: {
      dt: roundMediaTime({ time: spanTime * (x2 - 1) }),
      dv: effectiveSpanValue * (y2 - 1),
    },
  };
}
