import { describe, expect, it } from "vitest";
import { mediaTimeFromSeconds } from "../wasm";
import { retimeElementKeyframe } from "./keyframes";
import type { ScalarAnimationChannel, ScalarAnimationKey } from "./types";

// Spec for dragging a keyframe onto another keyframe's time. The moved key must REPLACE the key
// underneath (the same rule inserting a key at an occupied time already follows), never leave two
// keys at one time.

const sec = (seconds: number) => mediaTimeFromSeconds({ seconds });

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

describe("retimeElementKeyframe onto an occupied time", () => {
  it("replaces the key underneath instead of leaving two keys at the same time", () => {
    const animations = { opacity: { keys: [key("a", 0, 0.1), key("b", 1, 0.5), key("c", 2, 0.9)] } };

    // Drag "c" back onto "b" at 1s.
    const result = retimeElementKeyframe({
      animations,
      propertyPath: "opacity",
      keyframeId: "c",
      time: sec(1),
    });

    const keys = (result?.opacity as ScalarAnimationChannel).keys;
    // Old code kept all three keys, two of them at 1s.
    expect(keys.map((k) => k.id)).toEqual(["a", "c"]);
    // The dragged key's value wins at the shared time.
    expect(keys[1].value).toBe(0.9);
    expect(keys[1].time).toBe(sec(1));
  });

  it("still just moves the key when the target time is free", () => {
    const animations = { opacity: { keys: [key("a", 0, 0.1), key("b", 1, 0.5)] } };

    const result = retimeElementKeyframe({
      animations,
      propertyPath: "opacity",
      keyframeId: "b",
      time: sec(3),
    });

    const keys = (result?.opacity as ScalarAnimationChannel).keys;
    expect(keys.map((k) => k.id)).toEqual(["a", "b"]);
    expect(keys[1].time).toBe(sec(3));
  });
});
