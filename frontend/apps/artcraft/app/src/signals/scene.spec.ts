import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ setSceneMeta: vi.fn() }));

vi.mock("@storyteller/ui-pagescene", () => ({
  usePageSceneStore: { getState: () => ({ setSceneMeta: m.setSceneMeta }) },
}));

import { getSceneSignals, scene, signalScene } from "./scene";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("scene signal", () => {
  it("starts out initializing with no scene", () => {
    expect(scene.value.isInitializing).toBe(true);
    expect(scene.value.token).toBeUndefined();
  });

  it("signalScene stores the data, clears isInitializing and marks it modified", () => {
    signalScene({ title: "T", token: "tok", ownerToken: "own" });
    expect(getSceneSignals()).toEqual({
      title: "T",
      token: "tok",
      ownerToken: "own",
      isInitializing: false,
      isModified: true,
    });
  });

  it("mirrors the same metadata into the page-scene store", () => {
    signalScene({ title: "T", token: "tok", ownerToken: "own" });
    expect(m.setSceneMeta).toHaveBeenCalledWith({
      title: "T",
      token: "tok",
      ownerToken: "own",
      isModified: true,
      isInitializing: false,
    });
  });
});
