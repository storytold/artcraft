import { describe, expect, it } from "vitest";
import { mediaTimeFromSeconds } from "../wasm";
import { clampAnimationsToDuration, splitAnimationsAtTime } from "./keyframes";
import { resolveAnimationPathValueAtTime } from "./resolve";
import type { ElementAnimations, ScalarAnimationKey } from "./types";
import { resolveOpacityAtTime } from "./values";

// Spec for splitting and clamping keyframe animations. Splitting an element in two (the Split
// command) and shortening it (the duration clamp in the update pipeline) both cut each animated
// property at a time. Whatever the property was showing at the cut has to keep showing on both
// sides: a cut must never change what the user sees on the timeline.

const sec = (seconds: number) => mediaTimeFromSeconds({ seconds });

// The element's own opacity when it has no animation at all. Every expectation below is different
// from it, so "fell back to the static value" shows up as a plain value mismatch.
const BASE_OPACITY = 1;

// A linear scalar keyframe at `seconds` (relative to the element start).
function key(id: string, seconds: number, value: number): ScalarAnimationKey {
  return {
    id,
    time: sec(seconds),
    value,
    segmentToNext: "linear",
    tangentMode: "auto",
  };
}

// An opacity animation built from the given keys (default hold extrapolation on both ends).
function opacityAnimation(...keys: ScalarAnimationKey[]): ElementAnimations {
  return { opacity: { keys } };
}

// The opacity the user sees `seconds` into a half, given that half's animations.
function opacityAt(animations: ElementAnimations | undefined, seconds: number): number {
  return resolveOpacityAtTime({
    baseOpacity: BASE_OPACITY,
    animations,
    localTime: sec(seconds),
  });
}

describe("splitAnimationsAtTime held values", () => {
  it("keeps the last key's value on the right half when the cut is after every key", () => {
    // Fades 0.2 -> 0.8 over the first two seconds, then holds 0.8. Cut at 5s.
    const animations = opacityAnimation(key("a", 0, 0.2), key("b", 2, 0.8));
    const { leftAnimations, rightAnimations } = splitAnimationsAtTime({
      animations,
      splitTime: sec(5),
    });
    // Before the cut the element showed 0.8 and still does at the very end of the left half.
    expect(opacityAt(leftAnimations, 4.9)).toBeCloseTo(0.8, 5);
    // After the cut the right half starts at its own local 0 and has to keep showing 0.8.
    expect(opacityAt(rightAnimations, 0)).toBeCloseTo(0.8, 5);
    expect(opacityAt(rightAnimations, 3)).toBeCloseTo(0.8, 5);
  });

  it("keeps the first key's value on the left half when the cut is before every key", () => {
    // Nothing happens until 3s, when it fades 0.2 -> 0.8. Before the first key it holds 0.2.
    const animations = opacityAnimation(key("a", 3, 0.2), key("b", 5, 0.8));
    const { leftAnimations, rightAnimations } = splitAnimationsAtTime({
      animations,
      splitTime: sec(1),
    });
    // The left half spans 0..1s, entirely before the first key.
    expect(opacityAt(leftAnimations, 0)).toBeCloseTo(0.2, 5);
    expect(opacityAt(leftAnimations, 0.9)).toBeCloseTo(0.2, 5);
    // The right half still has the fade, two seconds in: 0.2 -> 0.8 starts at its local 2s.
    expect(opacityAt(rightAnimations, 2)).toBeCloseTo(0.2, 5);
    expect(opacityAt(rightAnimations, 3)).toBeCloseTo(0.5, 5);
  });

  it("keeps a single key's value on both halves wherever the cut is", () => {
    const animations = opacityAnimation(key("a", 2, 0.4));
    const before = splitAnimationsAtTime({ animations, splitTime: sec(1) });
    const after = splitAnimationsAtTime({ animations, splitTime: sec(3) });
    expect(opacityAt(before.leftAnimations, 0.5)).toBeCloseTo(0.4, 5);
    expect(opacityAt(after.rightAnimations, 0)).toBeCloseTo(0.4, 5);
  });

  it("splits an animation inside a segment into two halves that meet at the cut value", () => {
    // Control: the cut lands inside the 0..4s fade, so both halves get a boundary key.
    const animations = opacityAnimation(key("a", 0, 0), key("b", 4, 1));
    const { leftAnimations, rightAnimations } = splitAnimationsAtTime({
      animations,
      splitTime: sec(2),
    });
    expect(opacityAt(leftAnimations, 2)).toBeCloseTo(0.5, 5);
    expect(opacityAt(rightAnimations, 0)).toBeCloseTo(0.5, 5);
    expect(opacityAt(rightAnimations, 2)).toBeCloseTo(1, 5);
  });

  it("splits exactly on a key without losing that key's value on either side", () => {
    // Control: a cut exactly on the 2s key.
    const animations = opacityAnimation(key("a", 0, 0), key("b", 2, 0.6), key("c", 4, 1));
    const { leftAnimations, rightAnimations } = splitAnimationsAtTime({
      animations,
      splitTime: sec(2),
    });
    expect(opacityAt(leftAnimations, 2)).toBeCloseTo(0.6, 5);
    expect(opacityAt(rightAnimations, 0)).toBeCloseTo(0.6, 5);
    expect(opacityAt(rightAnimations, 2)).toBeCloseTo(1, 5);
  });

  it("keeps an unanimated property unanimated on both halves", () => {
    // Control: no animation in, no animation out; the static value stays in charge.
    const { leftAnimations, rightAnimations } = splitAnimationsAtTime({
      animations: undefined,
      splitTime: sec(2),
    });
    expect(leftAnimations).toBeUndefined();
    expect(rightAnimations).toBeUndefined();
  });

  it("keeps a switch's last state on the right half when the cut is after every key", () => {
    // Control: a boolean (discrete) parameter flips on at 1s. Discrete splits already add a
    // boundary key, so the right half starts "on".
    const animations: ElementAnimations = {
      "params.visible": {
        keys: [
          { id: "a", time: sec(0), value: false },
          { id: "b", time: sec(1), value: true },
        ],
      },
    };
    const { rightAnimations } = splitAnimationsAtTime({ animations, splitTime: sec(5) });
    expect(
      resolveAnimationPathValueAtTime({
        animations: rightAnimations,
        propertyPath: "params.visible",
        localTime: sec(0),
        fallbackValue: false,
      }),
    ).toBe(true);
  });
});

describe("clampAnimationsToDuration held values", () => {
  it("keeps the first key's value when the element is shortened to before every key", () => {
    // The fade starts at 3s; the element is trimmed to 1s long. All its visible time is before the
    // first key, where the property holds 0.2, and it should still show 0.2 after the trim.
    const animations = opacityAnimation(key("a", 3, 0.2), key("b", 5, 0.8));
    const clamped = clampAnimationsToDuration({ animations, duration: sec(1) });
    expect(opacityAt(clamped, 0)).toBeCloseTo(0.2, 5);
    expect(opacityAt(clamped, 1)).toBeCloseTo(0.2, 5);
  });

  it("keeps the animation up to the new end when the element is shortened inside a fade", () => {
    // Control: trimmed to 2s of a 0..4s fade, the visible part still runs 0 -> 0.5.
    const animations = opacityAnimation(key("a", 0, 0), key("b", 4, 1));
    const clamped = clampAnimationsToDuration({ animations, duration: sec(2) });
    expect(opacityAt(clamped, 1)).toBeCloseTo(0.25, 5);
    expect(opacityAt(clamped, 2)).toBeCloseTo(0.5, 5);
  });

  it("leaves an animation that ends before the new duration showing the same values", () => {
    // Control: the keys all sit inside the kept range, so nothing changes.
    const animations = opacityAnimation(key("a", 0, 0.2), key("b", 2, 0.8));
    const clamped = clampAnimationsToDuration({ animations, duration: sec(6) });
    expect(opacityAt(clamped, 1)).toBeCloseTo(0.5, 5);
    expect(opacityAt(clamped, 6)).toBeCloseTo(0.8, 5);
  });
});

describe("splitAnimationsAtTime inside a bezier segment", () => {
  // Two keys joined by a bezier segment: 0 -> 1 over four seconds.
  function bezierOpacity(): ElementAnimations {
    return opacityAnimation(
      { ...key("a", 0, 0), segmentToNext: "bezier" },
      key("b", 4, 1),
    );
  }

  it("leaves exactly one key per id on each half", () => {
    const { leftAnimations, rightAnimations } = splitAnimationsAtTime({
      animations: bezierOpacity(),
      splitTime: sec(2),
    });
    for (const half of [leftAnimations, rightAnimations]) {
      const channel = half?.opacity as { keys: ScalarAnimationKey[] };
      const ids = channel.keys.map((k) => k.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("keeps the curve the user saw on both halves", () => {
    const original = bezierOpacity();
    const { leftAnimations, rightAnimations } = splitAnimationsAtTime({
      animations: original,
      splitTime: sec(2),
    });
    for (const t of [0.5, 1, 1.5]) {
      expect(opacityAt(leftAnimations, t)).toBeCloseTo(opacityAt(original, t), 3);
    }
    for (const t of [0.5, 1, 1.5]) {
      expect(opacityAt(rightAnimations, t)).toBeCloseTo(opacityAt(original, 2 + t), 3);
    }
  });
});
