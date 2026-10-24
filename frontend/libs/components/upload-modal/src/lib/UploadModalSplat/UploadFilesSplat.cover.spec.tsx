import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UploadFilesSplat } from "./UploadFilesSplat";

// Shared handles for the mocks below (vi.hoisted makes them usable inside the vi.mock factories).
const h = vi.hoisted(() => ({
  // Every upload3DObjects call the picker made (the argument object, so a test can read the cover it was given).
  singles: [] as any[],
  // When true the stand-in splat mesh never finishes loading (a file the library could not decode).
  splatNeverLoads: false,
  // Called by the renderer stand-in on every frame with the scene being drawn; the Spark stand-in sets it so it can
  // play the library's behaviour (add its renderer to the scene, draw its first sorted frame a few frames later).
  onRender: undefined as undefined | ((scene: any) => void),
  // The timer that plays the preview's animation loop, so the test can stop it.
  loopTimer: undefined as undefined | ReturnType<typeof setInterval>,
}));

// The single-file uploader. It records the call; the network is not under test.
vi.mock("../UploadModal3D/utilities/upload3DObjects", () => ({
  upload3DObjects: vi.fn((args: any) => {
    h.singles.push(args);
    return new Promise<void>(() => undefined);
  }),
}));
vi.mock("../UploadModal3D/utilities/upload3DObjectsBatch", () => ({
  upload3DObjectsBatch: vi.fn(() => new Promise<void>(() => undefined)),
}));

// Keep the REAL preview loader and the REAL snapshot helper (that is the chain under test) but skip the rest of the
// utilities folder, which pulls in the FBX converter and the upload code.
vi.mock("../UploadModal3D/utilities", async () => {
  const loader = await import("../UploadModal3D/utilities/loadPreviewOnCanvas");
  const thumbnails = await import("../UploadModal3D/utilities/thumbnailHelpers");
  return {
    loadPreviewOnCanvas: loader.loadPreviewOnCanvas,
    snapshotCanvasAsThumbnail: thumbnails.snapshotCanvasAsThumbnail,
  };
});

// jsdom has no WebGL: keep three, but swap its renderer for one that draws nothing. It plays the animation loop from
// a short timer (a browser does it every frame) and tells the test what scene each frame holds.
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class WebGLRenderer {
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    setAnimationLoop = vi.fn((fn: null | (() => void)) => {
      clearInterval(h.loopTimer);
      h.loopTimer = fn ? setInterval(fn, 2) : undefined;
    });
    setSize() {}
    render(scene: unknown) {
      h.onRender?.(scene);
    }
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
    load() {}
  },
}));
// A splat mesh that "finishes decoding" a moment after it is built (what the real library does), unless the test
// says the file never decodes. Like the real library, it then needs a few drawn frames before anything is on screen:
// its renderer joins the scene on the first frame that holds the splat, and `defaultView.display` is set on the
// third (in a real browser it is about the tenth).
vi.mock("@sparkjsdev/spark", async () => {
  const { Object3D } = await import("three");
  class SparkRenderer extends Object3D {
    defaultView: { display: unknown } = { display: null };
  }
  return {
    SplatFileType: { SPZ: "spz" },
    SplatMesh: class extends Object3D {
      // The real mesh frees its GPU data here; the preview's dispose() calls it for a mesh that never joined the scene.
      dispose = vi.fn();
      constructor(options: { onLoad?: (mesh: unknown) => void }) {
        super();
        if (h.splatNeverLoads) return;
        queueMicrotask(() => options.onLoad?.(this));
        let spark: InstanceType<typeof SparkRenderer> | null = null;
        let framesWithSplat = 0;
        h.onRender = (scene) => {
          // Nothing to draw until the preview has put the decoded splat into its scene.
          if (this.parent !== scene) return;
          framesWithSplat += 1;
          if (!spark) {
            spark = new SparkRenderer();
            scene.add(spark);
          }
          if (framesWithSplat >= 3) spark.defaultView.display = { drawn: true };
        };
      }
    },
    SparkRenderer,
  };
});
vi.mock("@storyteller/ui-viewer-3d", () => ({
  NodeHierarchyHelper: class {},
  disposeObject3D: vi.fn(),
}));

// The API package: the picker's types need the enum; the thumbnail helpers only import the two client classes.
vi.mock("@storyteller/api", () => ({
  FilterEngineCategories: { SPLAT: "splat" },
  MediaFilesApi: class {},
  MediaUploadApi: class {},
}));

// Plain stand-ins for the shared UI pieces so the picker's own logic is what runs.
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));
vi.mock("@storyteller/ui-list-dropdown", () => ({ ListDropdown: () => null }));
vi.mock("@storyteller/ui-file-uploader", () => ({
  FileUploader: () => null,
}));
vi.mock("react-resizable-panels", () => ({
  PanelGroup: ({ children }: any) => <div>{children}</div>,
  Panel: ({ children }: any) => <div>{children}</div>,
  PanelResizeHandle: ({ children }: any) => <div>{children}</div>,
}));

// jsdom has no ResizeObserver; the preview canvas registers one. A do-nothing class is enough.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// A tiny .spz file whose bytes read straight away.
const spzFile = () => {
  const file = new File(["x"], "scan.spz", { type: "application/octet-stream" });
  file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(0));
  return file;
};

// Give the preview time to load, draw its first frame, report ready, wait its animation frame and take the snapshot.
// Two separate waits: React applies the "ready" status only when the first act() scope ends, and only then does the
// picker start the animation-frame timer that the second wait lets fire.
const letPreviewRun = async () => {
  for (let step = 0; step < 2; step += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
  }
};

describe("UploadFilesSplat gives an uploaded .spz file a cover image", () => {
  beforeEach(() => {
    h.singles.length = 0;
    h.splatNeverLoads = false;
    h.onRender = undefined;
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    // The animation frame runs from a timer so the test controls when it fires.
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => setTimeout(cb, 0) as unknown as number);
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
    // jsdom lacks the blob-URL functions, a WebGL context and canvas encoding.
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null as never);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback: BlobCallback) =>
      callback(new Blob(["png"], { type: "image/png" })),
    );
  });
  afterEach(() => {
    cleanup();
    // Make sure no animation loop outlives the test.
    clearInterval(h.loopTimer);
    h.loopTimer = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const mount = () =>
    render(
      <UploadFilesSplat
        title="Upload a Splat"
        fileTypes={["spz"]}
        engineCategory={"splat" as never}
        initialFiles={[spzFile()]}
        onClose={vi.fn()}
        onUploadProgress={vi.fn()}
      />,
    );

  // The 3D picker sends the snapshot of its preview as the asset's cover; this is the same promise for splats.
  it("passes the preview snapshot to the uploader once the splat has been drawn", async () => {
    mount();
    await letPreviewRun();
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    expect(h.singles).toHaveLength(1);
    expect(h.singles[0].thumbnailSnapshot).toBeInstanceOf(Blob);
  });

  // Control: a file the library could not decode has nothing to photograph, so no cover is sent (and the upload
  // itself still goes ahead).
  it("sends no cover for a splat that never finished loading", async () => {
    h.splatNeverLoads = true;
    mount();
    await letPreviewRun();
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    expect(h.singles).toHaveLength(1);
    expect(h.singles[0].thumbnailSnapshot).toBeUndefined();
  });
});
