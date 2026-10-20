import { describe, expect, it, vi } from "vitest";

import { SaveManager, type SaveManagerDeps } from "./save_manager";
import { EditorLoaderEvent } from "./events/EngineEvent";

// SaveManager only uses the proxy scene to serialise the scene graph. That
// code pulls in the whole Three.js scene stack, which is irrelevant here, so
// we replace it with a tiny stand-in that "serialises" to an empty object.
vi.mock("../proxy/storyteller_proxy_scene", () => ({
  StoryTellerProxyScene: class {
    saveToScene() {
      return {};
    }
  },
}));

// Build a SaveManager wired to fake dependencies. `saveSceneState` is the one
// the tests vary (resolve vs. reject); everything else is a harmless stub.
// The fake bus simply records every event so a test can inspect the loader
// events (visible=true means "show spinner", visible=false means "hide it").
function makeManager(saveSceneState: SaveManagerDeps["saveSceneState"]) {
  const events: unknown[] = [];
  const deps = {
    getVersion: () => 1,
    setVersion: vi.fn(),
    getActiveScene: () => ({ scene: { children: [] }, skybox: "m_1" }),
    getRenderer: () => undefined, // no renderer -> no thumbnail, resolves undefined
    removeTransformControls: vi.fn(),
    getCamera: () => null,
    refreshCamObj: vi.fn(),
    changeRenderCameraAspectRatio: vi.fn(),
    setPositivePrompt: vi.fn(),
    saveSceneState,
    loadSceneState: vi.fn(),
    getCameras: () => [],
    getSelectedCameraId: () => "",
    getTimeline: () => null,
    loadTimeline: vi.fn(),
    resetTimeline: vi.fn(),
    getRenderCameraTransform: () => null,
    recreateCameraObject: vi.fn(),
    bus: { emit: (event: unknown) => events.push(event) },
  } as unknown as SaveManagerDeps;
  return { manager: new SaveManager(deps), events };
}

// Pull out just the `visible` flag of each loader event, in order.
function loaderVisibility(events: unknown[]): boolean[] {
  return events
    .filter((e): e is EditorLoaderEvent => e instanceof EditorLoaderEvent)
    .map((e) => e.visible);
}

const saveArgs = {
  sceneTitle: "My scene",
  sceneGenerationMetadata: {} as never,
};

describe("SaveManager.saveScene loader", () => {
  it("shows then hides the loader when the save succeeds", async () => {
    // Arrange: the backend save resolves with a media token.
    const { manager, events } = makeManager(async () => "m_token");

    // Act
    const result = await manager.saveScene(saveArgs);

    // Assert: the token is returned and the spinner went on, then off.
    expect(result).toBe("m_token");
    expect(loaderVisibility(events)).toEqual([true, false]);
  });

  it("hides the loader again when the backend save rejects", async () => {
    // Arrange: the backend save throws (e.g. network down / 500).
    const { manager, events } = makeManager(async () => {
      throw new Error("backend down");
    });

    // Act + Assert: the error still reaches the caller...
    await expect(manager.saveScene(saveArgs)).rejects.toThrow("backend down");

    // ...and the spinner that was switched on is switched off again. Before
    // the fix this was [true] only, so the loader stayed on screen forever.
    expect(loaderVisibility(events)).toEqual([true, false]);
  });
});
