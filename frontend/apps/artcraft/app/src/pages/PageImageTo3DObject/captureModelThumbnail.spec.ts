import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { captureModelThumbnail } from "./captureModelThumbnail";

const { renderers, pendingLoads } = vi.hoisted(() => ({
  renderers: [] as Array<{
    dispose: ReturnType<typeof vi.fn>;
    forceContextLoss: ReturnType<typeof vi.fn>;
  }>,
  pendingLoads: [] as Array<{
    onLoad: (gltf: { scene: THREE.Object3D }) => void;
    onError: (error: unknown) => void;
  }>,
}));

// jsdom has no WebGL; only the teardown calls matter here.
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class WebGLRenderer {
    domElement = { toDataURL: () => "data:image/png;base64,AAAA" };
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    constructor() {
      renderers.push(this);
    }
    setSize() {}
    setPixelRatio() {}
    render() {}
  }
  return { ...actual, WebGLRenderer };
});

// Loads stay pending until a test settles them.
vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    setCrossOrigin() {}
    load(
      _url: string,
      onLoad: (gltf: { scene: THREE.Object3D }) => void,
      _onProgress: unknown,
      onError: (error: unknown) => void,
    ) {
      pendingLoads.push({ onLoad, onError });
    }
  },
}));

describe("captureModelThumbnail", () => {
  beforeEach(() => {
    renderers.length = 0;
    pendingLoads.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the frame and frees the model, renderer and context once", async () => {
    const { model, onDispose } = trackedModel();
    const capture = captureModelThumbnail("model.glb");

    pendingLoads[0].onLoad({ scene: model });
    const dataUrl = await capture;
    vi.runAllTimers();

    expect(dataUrl).toMatch(/^data:image\/png/);
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(renderers[0].dispose).toHaveBeenCalledTimes(1);
    expect(renderers[0].forceContextLoss).toHaveBeenCalledTimes(1);
  });

  it("frees the renderer and context when the model fails to load", async () => {
    const capture = captureModelThumbnail("missing.glb");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    pendingLoads[0].onError(new Error("404"));

    expect(await capture).toBeNull();
    expect(renderers[0].dispose).toHaveBeenCalledTimes(1);
    expect(renderers[0].forceContextLoss).toHaveBeenCalledTimes(1);
  });

  it("gives up after the timeout and frees a model that loads later", async () => {
    const capture = captureModelThumbnail("slow.glb");

    vi.advanceTimersByTime(30000);
    expect(await capture).toBeNull();
    expect(renderers[0].forceContextLoss).toHaveBeenCalledTimes(1);

    const { model, onDispose } = trackedModel();
    pendingLoads[0].onLoad({ scene: model });

    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(renderers[0].dispose).toHaveBeenCalledTimes(1);
  });
});

function trackedModel() {
  const geometry = new THREE.BoxGeometry();
  const onDispose = vi.fn();
  geometry.addEventListener("dispose", onDispose);
  const model = new THREE.Group();
  model.add(new THREE.Mesh(geometry));
  return { model, onDispose };
}
