import { afterEach, expect, it } from "vitest";
import { AspectRatioType, useSceneStore } from "./SceneState";

afterEach(() => useSceneStore.getState().RESET());

it.each([
  { bitmap: null, info: { url: "", mediaToken: "blank", isBlankCanvas: true } },
  { bitmap: null, info: { url: "", mediaToken: "blank", isBlankCanvas: true, blankCanvasWidth: 1200, blankCanvasHeight: 800 } },
  { bitmap: { width: 1200, height: 800 } as HTMLImageElement, info: { url: "", mediaToken: "mf_base" } },
])("applies exact output ratios to a blank or fixed-size canvas without replacing its base", ({ bitmap, info }) => {
  useSceneStore.setState({ baseImageBitmap: bitmap, baseImageInfo: info });
  const state = useSceneStore.getState();
  const original = state.getAspectRatioDimensions();
  const longest = Math.max(original.width, original.height);
  state.setAspectRatioType(AspectRatioType.SQUARE, "square");
  expect(state.getAspectRatioDimensions()).toEqual({ width: longest, height: longest });
  state.setAspectRatioType(AspectRatioType.NONE, "wide_sixteen_by_nine");
  expect(state.getAspectRatioDimensions()).toEqual({ width: longest, height: Math.round(longest * 9 / 16) });
  expect(useSceneStore.getState().baseImageBitmap).toBe(bitmap);
  expect(useSceneStore.getState().baseImageInfo).toBe(info);
  state.setAspectRatioType(AspectRatioType.NONE, "auto");
  expect(state.getAspectRatioDimensions()).toEqual(original);
  state.setAspectRatioType(AspectRatioType.NONE);
  expect(state.getAspectRatioDimensions()).toEqual(original);
});

it("clears an output override when resetting the editor", () => {
  useSceneStore.getState().setAspectRatioType(AspectRatioType.SQUARE, "square");
  useSceneStore.getState().RESET();
  expect(useSceneStore.getState().outputAspectRatio).toBeUndefined();
});
