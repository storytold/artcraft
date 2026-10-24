import { describe, expect, it, vi } from "vitest";

import Scene from "./scene";

// Scene imports Spark for splat loading; this spec never loads a splat.
vi.mock("@sparkjsdev/spark", async () => {
  const { Object3D } = await import("three");
  return {
    SplatMesh: class extends Object3D {},
    SparkRenderer: class extends Object3D {},
  };
});

// The Addons barrel pulls in a lottie canvas module jsdom cannot run; Scene
// only needs these two names from it.
vi.mock("three/examples/jsm/Addons.js", async () => {
  const { Mesh } = await import("three");
  return { MMDAnimationHelper: class {}, Water: class extends Mesh {} };
});

// Build a Scene whose media-URL lookup succeeds, with a fake placeholder
// manager (the thing that shows/removes the "Loading: <name>" 3D text) so the
// test can see exactly which placeholders were added and removed.
function makeSceneWithFakePlaceholders() {
  const scene = new Scene("test", "::CAM::", () => undefined, 1, {
    getCameras: () => [],
    getSelectedCameraId: () => "main",
    fetchAsset: () => Promise.reject(new Error("no network in tests")),
    getMediaUrlByToken: () => Promise.resolve("https://cdn.invalid/model.pmx"),
  });
  const placeholders = { add: vi.fn(async () => {}), remove: vi.fn(async () => {}) };
  scene.placeholder_manager = placeholders as never;
  return { scene, placeholders };
}

describe("Scene.loadMMDWithPlaceholder", () => {
  it("removes its loading placeholder when the MMD fails to load", async () => {
    // Arrange: the MMD loader itself fails (corrupt file / 404 / parse error).
    const { scene, placeholders } = makeSceneWithFakePlaceholders();
    (scene as never as { load_mmd_wrapped: unknown }).load_mmd_wrapped = vi
      .fn()
      .mockRejectedValue(new Error("mmd load failed"));

    // Act + Assert: the caller still sees the original error...
    await expect(
      scene.loadMMDWithPlaceholder("m_abc", "Miku"),
    ).rejects.toThrow("mmd load failed");

    // ...and the "Loading: Miku" placeholder that was added is removed again,
    // using the same key it was added with. Before the fix remove() was never
    // called, so the loading text stayed in the scene forever.
    expect(placeholders.add).toHaveBeenCalledTimes(1);
    const addedKey = (placeholders.add.mock.calls[0] as unknown[])[0];
    expect(placeholders.remove).toHaveBeenCalledWith(addedKey);
  });
});
