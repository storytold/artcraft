import { beforeEach, describe, expect, it, vi } from "vitest";

// Counts how many times the GLB loader was asked to load a file (the GLTFLoader mock below records it).
const h = vi.hoisted(() => ({
  glbLoads: 0,
}));

// jsdom has no WebGL; only the dispatch (which loader a file name picks) matters here.
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class WebGLRenderer {
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    setAnimationLoop = vi.fn();
    setSize() {}
    render() {}
  }
  return { ...actual, WebGLRenderer };
});
// A GLTFLoader whose load() only counts the call, so a GLB name that is dispatched shows up as a load.
vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    load() {
      h.glbLoads += 1;
    }
  },
}));
vi.mock("three/addons/loaders/FontLoader.js", () => ({
  FontLoader: class {
    load() {}
  },
}));
vi.mock("@sparkjsdev/spark", async () => {
  const { Object3D } = await import("three");
  return {
    SplatFileType: { SPZ: "spz" },
    SplatMesh: class extends Object3D {},
    SparkRenderer: class extends Object3D {},
  };
});
vi.mock("@storyteller/ui-viewer-3d", () => ({
  NodeHierarchyHelper: class {},
  disposeObject3D: vi.fn(),
}));

import { loadPreviewOnCanvas } from "./loadPreviewOnCanvas";

// A canvas attached to the document with a null WebGL context (jsdom has none).
const attachedCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.getContext = vi.fn(() => null) as never;
  document.body.appendChild(canvas);
  return canvas;
};

describe("loadPreviewOnCanvas picks its loader from the file extension, whatever its letter case", () => {
  beforeEach(() => {
    h.glbLoads = 0;
    // jsdom lacks the blob-URL functions the preview calls.
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  // Control: a lowercase .glb is dispatched to the GLB loader and reports no error.
  it("loads a lowercase .glb without a preview error", () => {
    const statusCallback = vi.fn();
    loadPreviewOnCanvas({
      file: new File([], "robot.glb"),
      canvas: attachedCanvas(),
      statusCallback,
    });
    expect(h.glbLoads).toBe(1);
    expect(statusCallback).not.toHaveBeenCalled();
  });

  // The picker accepts "ROBOT.GLB" (its type check lowercases both sides), so this name reaches the preview.
  it("loads an upper-case .GLB instead of reporting an unknown file type", () => {
    const statusCallback = vi.fn();
    loadPreviewOnCanvas({
      file: new File([], "ROBOT.GLB"),
      canvas: attachedCanvas(),
      statusCallback,
    });
    expect(statusCallback).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unknown file type for loader" }),
    );
    expect(h.glbLoads).toBe(1);
  });

  // Control: a lowercase .spz reads its bytes (the splat branch).
  it("reads a lowercase .spz file for the splat preview", async () => {
    const file = new File([], "scan.spz");
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));
    loadPreviewOnCanvas({ file, canvas: attachedCanvas(), statusCallback: vi.fn() });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(file.arrayBuffer).toHaveBeenCalledTimes(1);
  });

  it("reads an upper-case .SPZ file for the splat preview too", async () => {
    const file = new File([], "SCAN.SPZ");
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));
    const statusCallback = vi.fn();
    loadPreviewOnCanvas({ file, canvas: attachedCanvas(), statusCallback });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(statusCallback).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unknown file type for loader" }),
    );
    expect(file.arrayBuffer).toHaveBeenCalledTimes(1);
  });

  // A name that really is unsupported must still report the error (the fix must not swallow it).
  it("still reports an unknown type for a name with no supported extension", () => {
    const statusCallback = vi.fn();
    loadPreviewOnCanvas({
      file: new File([], "notes.TXT"),
      canvas: attachedCanvas(),
      statusCallback,
    });
    expect(statusCallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unknown file type for loader" }),
    );
  });
});
