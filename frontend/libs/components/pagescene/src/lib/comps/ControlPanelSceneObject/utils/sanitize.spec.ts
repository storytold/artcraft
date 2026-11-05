import { describe, expect, it } from "vitest";
import { sanitize } from "./sanitize";
import { objectMismatch } from "./objectMismatch";

describe("sanitize", () => {
  it("reads a number typed without a leading zero", () => {
    expect(sanitize({ x: ".5" })).toEqual({ x: 0.5 });
  });

  it("reads a negative number typed without a leading zero", () => {
    expect(sanitize({ x: "-.5" })).toEqual({ x: -0.5 });
  });

  it("keeps ordinary values unchanged", () => {
    expect(sanitize({ a: "5", b: "-2.25", c: "0.5", d: "7." })).toEqual({
      a: 5,
      b: -2.25,
      c: 0.5,
      d: 7,
    });
  });

  it("does not report a change when .5 is typed over an unchanged 0.5", () => {
    expect(objectMismatch({ x: "0.5" }, sanitize({ x: ".5" }))).toBe(false);
  });
});
