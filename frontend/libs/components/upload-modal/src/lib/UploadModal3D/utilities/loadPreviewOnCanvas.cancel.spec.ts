import { beforeEach, describe, expect, it, vi } from "vitest";

// Pending font loads stay unresolved until a test fails/finishes them, which
// models a remote fetch that settles after the preview was superseded.
const h = vi.hoisted(() => ({
  fontErrors: [] as Array<(err: unknown) => void>,
}));

// jsdom has no WebGL; only the lifecycle calls matter here.
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
vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    load() {}
  },
}));
vi.mock("three/addons/loaders/FontLoader.js", () => ({
  FontLoader: class {
    load(
      _url: string,
      _onLoad: unknown,
      _onProgress: unknown,
      onError: (err: unknown) => void,
    ) {
      h.fontErrors.push(onError);
    }
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

const attachedCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.getContext = vi.fn(() => null) as never;
  document.body.appendChild(canvas);
  return canvas;
};

describe("loadPreviewOnCanvas error reporting after supersession", () => {
  beforeEach(() => {
    h.fontErrors.length = 0;
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("reports a PMD font load failure while the preview is current", () => {
    const statusCallback = vi.fn();
    loadPreviewOnCanvas({
      file: new File([], "model.pmd"),
      canvas: attachedCanvas(),
      statusCallback,
    });
    h.fontErrors[0](new Error("offline"));
    expect(statusCallback).toHaveBeenCalledWith(
      expect.objectContaining({ type: "PMD Loader Error" }),
    );
  });

  it("drops a PMD font load failure that arrives after dispose", () => {
    const statusCallback = vi.fn();
    const preview = loadPreviewOnCanvas({
      file: new File([], "model.pmd"),
      canvas: attachedCanvas(),
      statusCallback,
    });
    preview.dispose();
    h.fontErrors[0](new Error("offline"));
    // Before the fix this wrote the stale error into the NEXT preview's status.
    expect(statusCallback).not.toHaveBeenCalled();
  });

  it("reports an SPZ read failure while current, but drops it after dispose", async () => {
    const failingSpz = () => {
      const file = new File([], "scan.spz");
      file.arrayBuffer = vi.fn().mockRejectedValue(new Error("gone"));
      return file;
    };

    const liveStatus = vi.fn();
    loadPreviewOnCanvas({
      file: failingSpz(),
      canvas: attachedCanvas(),
      statusCallback: liveStatus,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(liveStatus).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SPLAT Loader Error" }),
    );

    const staleStatus = vi.fn();
    const preview = loadPreviewOnCanvas({
      file: failingSpz(),
      canvas: attachedCanvas(),
      statusCallback: staleStatus,
    });
    preview.dispose();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(staleStatus).not.toHaveBeenCalled();
  });
});
