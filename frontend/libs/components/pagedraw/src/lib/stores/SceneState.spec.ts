import { afterEach, expect, it } from "vitest";
import { AspectRatioType, useSceneStore } from "./SceneState";

afterEach(() => useSceneStore.getState().RESET());

it.each([
  { bitmap: null, info: { url: "", mediaToken: "blank", isBlankCanvas: true } },
  { bitmap: null, info: { url: "", mediaToken: "blank", isBlankCanvas: true, blankCanvasWidth: 1200, blankCanvasHeight: 800 } },
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

it("keeps a loaded bitmap and its marks in native coordinates when changing the requested output ratio", () => {
  const bitmap = { width: 1024, height: 683 } as HTMLImageElement;
  const mark = { id: "mark", type: "line" as const, points: [100, 341.5, 200, 341.5], stroke: "red", strokeWidth: 10, draggable: true, timestamp: 1 };
  useSceneStore.setState({ baseImageBitmap: bitmap, drawNodes: [mark], inpaintLineNodes: [mark] });
  for (const ratio of ["square", "wide_sixteen_by_nine", "auto"]) {
    useSceneStore.getState().setAspectRatioType(AspectRatioType.NONE, ratio);
    expect(useSceneStore.getState().getAspectRatioDimensions()).toEqual({ width: 1024, height: 683 });
    expect(useSceneStore.getState().drawNodes).toEqual([mark]);
    expect(useSceneStore.getState().inpaintLineNodes).toEqual([mark]);
    expect(useSceneStore.getState().baseImageBitmap).toBe(bitmap);
    expect(useSceneStore.getState().outputAspectRatio).toBe(ratio);
  }
});

it("clears an output override when resetting the editor", () => {
  useSceneStore.getState().setAspectRatioType(AspectRatioType.SQUARE, "square");
  useSceneStore.getState().RESET();
  expect(useSceneStore.getState().outputAspectRatio).toBeUndefined();
});
