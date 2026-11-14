import { expect, it } from "vitest";
import { outputDimensions } from "./outputDimensions";

it.each([undefined, "auto", "auto_2k", "toString", "__proto__", "unknown"])("preserves source dimensions for %s", (ratio) => {
  expect(outputDimensions({ width: 1200, height: 800 }, ratio)).toEqual({ width: 1200, height: 800 });
});

it.each([
  ["square", 1024, 1024], ["wide_three_by_two", 1024, 683], ["tall_two_by_three", 683, 1024],
  ["wide_sixteen_by_nine", 1024, 576], ["tall_nine_by_sixteen", 576, 1024],
  ["wide", 1024, 768], ["tall", 768, 1024],
] as const)("maps %s to the requested canvas geometry", (ratio, width, height) => {
  expect(outputDimensions({ width: 1024, height: 683 }, ratio)).toEqual({ width, height });
});
