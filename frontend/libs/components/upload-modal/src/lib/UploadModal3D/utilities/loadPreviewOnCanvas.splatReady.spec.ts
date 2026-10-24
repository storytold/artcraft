import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared handles for the mocks below (vi.hoisted makes them usable inside the vi.mock factories).
const h = vi.hoisted(() => ({
  // Every option object the (stand-in) splat mesh was constructed with. A test fires `onLoad` by hand to play the
  // moment the real library finishes decoding the file.
  splatOptions: [] as any[],
  // The animation-loop function the preview handed to the renderer. A test calls it to play one frame.
  loop: null as null | (() => void),
  // The scene the preview last rendered, so a test can put the library's renderer stand-in into it.
  scene: null as any,
}));

// jsdom has no WebGL; the renderer stand-in only hands the loop and the scene back to the test.
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class WebGLRenderer {
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    // Keep the loop function (null when the preview stops it) instead of running it on a timer.
    setAnimationLoop = vi.fn((fn: null | (() => void)) => {
      h.loop = fn;
    });
    setSize() {}
    render(scene: unknown) {
      h.scene = scene;
    }
  }
  return { ...actual, WebGLRenderer };
});
// The GLB and font loaders are imported by the module but not used for a .spz file.
vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    load() {}
  },
}));
vi.mock("three/addons/loaders/FontLoader.js", () => ({
  FontLoader: class {
    load() {}
  },
}));
// A splat mesh that only records how it was built; it never "loads" on its own. The library's renderer stand-in
// has the one field the preview reads: `defaultView.display`, which is null until the first sorted frame is drawn.
vi.mock("@sparkjsdev/spark", async () => {
  const { Object3D } = await import("three");
  return {
    SplatFileType: { SPZ: "spz" },
    SplatMesh: class extends Object3D {
      // The real mesh frees its GPU data here; the preview's dispose() calls it for a mesh that never joined the scene.
      dispose = vi.fn();
      constructor(options: unknown) {
        super();
        h.splatOptions.push(options);
      }
    },
    SparkRenderer: class extends Object3D {
      defaultView: { display: unknown } = { display: null };
    },
  };
});
vi.mock("@storyteller/ui-viewer-3d", () => ({
  NodeHierarchyHelper: class {},
  disposeObject3D: vi.fn(),
}));

import { SparkRenderer } from "@sparkjsdev/spark";
import { loadPreviewOnCanvas } from "./loadPreviewOnCanvas";

// A canvas attached to the document with a null WebGL context (jsdom has none).
const attachedCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.getContext = vi.fn(() => null) as never;
  document.body.appendChild(canvas);
  return canvas;
};

// A .spz file whose bytes read straight away.
const spzFile = () => {
  const file = new File([], "scan.spz");
  file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));
  return file;
};

// Let the file's arrayBuffer() promise settle so the splat mesh gets constructed.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// Play `count` animation frames.
const frames = (count: number) => {
  for (let step = 0; step < count; step += 1) h.loop?.();
};

// Start a .spz preview and return everything a test needs: the status spy, the preview, and a way to play the
// library's side (decode finished, first sorted frame drawn).
const startSplatPreview = async () => {
  const statusCallback = vi.fn();
  const preview = loadPreviewOnCanvas({ file: spzFile(), canvas: attachedCanvas(), statusCallback });
  await settle();
  // The library finished decoding the file: it calls the `onLoad` the preview gave the mesh.
  const decodeFinished = () => h.splatOptions[0].onLoad();
  // The library added its renderer to the scene (it does so on the first frame that holds a splat).
  const addLibraryRenderer = () => {
    // The stand-in ignores its argument; the real constructor wants options, hence the cast.
    const spark = new SparkRenderer({} as never);
    h.scene.add(spark);
    return spark;
  };
  return { statusCallback, preview, decodeFinished, addLibraryRenderer };
};

describe("loadPreviewOnCanvas tells the picker when a splat preview is ready", () => {
  beforeEach(() => {
    h.splatOptions.length = 0;
    h.loop = null;
    h.scene = null;
    // jsdom lacks the blob-URL functions the preview calls.
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  // Control: before the library has finished decoding, nothing is reported (a snapshot now would be blank).
  it("reports nothing while the splat is still decoding", async () => {
    const { statusCallback } = await startSplatPreview();
    expect(h.splatOptions).toHaveLength(1);
    frames(3);
    expect(statusCallback).not.toHaveBeenCalled();
  });

  // Control (the naive fix): "decoded" is not "drawn". In a real browser the first ~10 frames after the decode are
  // fully transparent, so a snapshot taken then is a blank cover. The preview must keep waiting.
  it("reports nothing after the decode while the library has not drawn a frame yet", async () => {
    const { statusCallback, decodeFinished, addLibraryRenderer } = await startSplatPreview();
    decodeFinished();
    frames(1);
    addLibraryRenderer();
    frames(5);
    expect(statusCallback).not.toHaveBeenCalled();
  });

  // The picker only takes its cover snapshot when the preview reports "OK" (GLB, PMD and image previews all do).
  it("reports OK, once, when the library has drawn its first sorted frame", async () => {
    const { statusCallback, decodeFinished, addLibraryRenderer } = await startSplatPreview();
    decodeFinished();
    frames(1);
    const spark = addLibraryRenderer();
    frames(2);
    expect(statusCallback).not.toHaveBeenCalled();
    // The library's first sorted result arrives: `display` is set (any non-null value; the preview only checks for null).
    spark.defaultView.display = { sorted: true } as never;
    frames(1);
    expect(statusCallback).toHaveBeenCalledTimes(1);
    expect(statusCallback).toHaveBeenCalledWith(expect.objectContaining({ type: "OK" }));
    // Later frames do not report again (each report would restart the picker's snapshot timer).
    frames(4);
    expect(statusCallback).toHaveBeenCalledTimes(1);
  });

  // Control: a preview that was replaced before the splat was drawn must stay silent, or it would trigger a
  // snapshot of the wrong file.
  it("reports nothing when the preview was disposed before the splat was drawn", async () => {
    const { statusCallback, preview, decodeFinished, addLibraryRenderer } = await startSplatPreview();
    decodeFinished();
    // One frame first, so the preview has rendered (and the test has its scene).
    frames(1);
    const spark = addLibraryRenderer();
    // Keep a handle on the loop: dispose() stops the renderer, but a frame already queued could still run once.
    const queuedFrame = h.loop;
    preview.dispose();
    spark.defaultView.display = { sorted: true } as never;
    queuedFrame?.();
    expect(statusCallback).not.toHaveBeenCalled();
  });
});
