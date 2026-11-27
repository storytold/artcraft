import { expect, it } from "vitest";
import { thumbnailSize } from "./thumbnail";

it.each([
  [8192, 1, 1280, 1],
  [1, 8192, 1, 720],
  [96, 48, 96, 48],
  [4096, 2048, 1280, 640],
  [2048, 4096, 360, 720],
  [1280, 720, 1280, 720],
])("sizes a %dx%d image to a nonempty %dx%d thumbnail", (width, height, expectedWidth, expectedHeight) => {
  expect(thumbnailSize({ width, height })).toEqual({
    width: expectedWidth,
    height: expectedHeight,
  });
});

it.each([
  [0, 8192, 0, 720],
  [8192, 0, 1280, 0],
  [Infinity, 1, 1280, 0],
  [1, Infinity, 0, 720],
  [NaN, 8192, NaN, 720],
  [-1, 8192, -0, 720],
  [8192, -1, 1280, -0],
])("preserves sizing behavior for invalid %dx%d dimensions", (width, height, expectedWidth, expectedHeight) => {
  expect(thumbnailSize({ width, height })).toEqual({
    width: expectedWidth,
    height: expectedHeight,
  });
});
