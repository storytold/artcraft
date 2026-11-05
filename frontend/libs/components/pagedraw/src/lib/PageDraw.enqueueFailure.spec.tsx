// PageDraw.enqueueFailure.spec: checks what the Draw (2D) page does when pressing Generate cannot start a generation.
// Generate does three things in a row: it bakes the canvas into a PNG, uploads that PNG as a "scene snapshot", and then
// asks the Rust app to enqueue the image job (adapter.enqueueEditImage / enqueueInpaint, which call the Tauri command
// generate_image_command). Every one of those can fail: offline, signed out, bad input, no provider available, a server error.
// Rust only opens a pop-up for billing / Grok / Midjourney problems; for every other failure the command just rejects,
// and the rejection reaches the person only if the page catches it. Every other page that enqueues an image
// (Angles, Remove Background, the Image and Video prompt boxes) shows an error toast then. The Draw page used to show nothing:
// a rejected enqueue escaped as an unhandled promise rejection, and a failed snapshot upload / canvas bake only wrote to the
// developer console, so the button simply became clickable again with no hint that nothing was started.
// (Remove background on this page is NOT covered here: the Rust bg-removal command also emits an event that the app shell
// already turns into a "Couldn't enqueue background removal!" toast.)
// The real PageDraw is rendered; the parts that need a browser canvas or the Rust app (the scene store, the Konva surface,
// the model picker, the worker pipeline, the upload API and the toast) are replaced by small stand-ins, and the test presses
// Generate by calling the same `onGenerateClick` function the page hands to the prompt box.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";

// Shared handles the mock factories below can see (vi.mock calls are hoisted above normal variables).
const h = vi.hoisted(() => {
  // Two fake Konva layers: PageDraw looks them up by id to read the drawing and the inpaint mask.
  const drawLayer = { id: () => "draw-layer", toCanvas: () => ({}) };
  const inpaintLayer = { id: () => "inpaint-layer", toCanvas: () => ({}) };
  return {
    // Toast calls (react-hot-toast's default export is what PageDraw uses).
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
    toastLoading: vi.fn(),
    // The "upload the baked canvas" web call and the two worker calls.
    uploadSceneSnapshot: vi.fn(),
    compositeInWorker: vi.fn(),
    maskInWorker: vi.fn(),
    // The props the page last gave the prompt editor; the test reads `onGenerateClick` from here.
    promptEditor: {
      current: null as null | {
        onGenerateClick: (
          prompt: string,
          options?: Record<string, unknown>,
        ) => Promise<void>;
      },
    },
    // The image model the picker reports; each test sets the flags it needs.
    model: {
      id: "model-1",
      tauriId: "flux_test",
      // Typed as plain booleans / functions so the tests can switch them (a bare `false` would be typed as the literal false).
      editingIsInpainting: false as boolean,
      usesInpaintingMask: false as boolean,
      isNanoBananaModel: (() => false) as () => boolean,
    },
    // The fake canvas stage and base-image rectangle the (mocked) paint surface hands back through the page's refs.
    stage: {
      getLayers: () => [drawLayer, inpaintLayer],
      x: () => 0,
      y: () => 0,
      scaleX: () => 1,
      scaleY: () => 1,
      // offsetWidth 0 makes the page's "fit canvas" loop keep waiting instead of touching the fake further.
      container: () => ({ offsetWidth: 0 }),
    },
    baseImage: { width: () => 512, height: () => 512 },
    // The "scene store" values the page reads. Anything not listed here is filled in with a vi.fn() by the Proxy below.
    scene: {} as Record<string, unknown>,
    // The prompt-box store values (generation count and system-prompt flag).
    promptStore: { generationCount: 2, setGenerationCount: vi.fn(), useSystemPrompt: true },
  };
});

// Toast library: only the three calls PageDraw makes.
vi.mock("react-hot-toast", () => ({
  default: { error: h.toastError, success: h.toastSuccess, loading: h.toastLoading },
}));
// The web API: PageDraw only needs PromptsApi.uploadSceneSnapshot.
vi.mock("@storyteller/api", () => ({
  PromptsApi: class {
    uploadSceneSnapshot = h.uploadSceneSnapshot;
  },
}));
// The worker pipeline (needs a real Worker, which jsdom lacks): bake and mask are stand-ins.
vi.mock("./utilities/generatePipeline", () => ({
  compositeInWorker: h.compositeInWorker,
  maskInWorker: h.maskInWorker,
}));
// 3D helper: not used by Generate.
vi.mock("./utilities/render3DModel", () => ({
  render3DModelToDataUrl: vi.fn(),
  DEFAULT_MODEL3D_PARAMS: {},
}));
// The scene store: a plain object whose unknown keys are vi.fn() stand-ins, exposed through the same hook shape
// (`useSceneStore(selector)` and `useSceneStore.getState()`) the page uses.
vi.mock("./stores/SceneState", () => {
  const state = new Proxy(h.scene, {
    get: (target, key: string) => {
      if (!(key in target)) target[key] = vi.fn();
      return target[key];
    },
  });
  const useSceneStore = Object.assign(
    (selector: (s: unknown) => unknown) => selector(state),
    { getState: () => state },
  );
  return {
    useSceneStore,
    AspectRatioType: { PORTRAIT: "portrait", LANDSCAPE: "landscape", SQUARE: "square", NONE: "none" },
  };
});
// The paint surface: instead of drawing, it fills in the page's stage / base-image refs with the fakes above.
vi.mock("./PaintSurface", () => ({
  DRAW_LAYER_ID: "draw-layer",
  INPAINT_LAYER_ID: "inpaint-layer",
  PaintSurface: (props: { stageRef: { current: unknown }; baseImageRef: { current: unknown } }) => {
    props.stageRef.current = h.stage;
    props.baseImageRef.current = h.baseImage;
    return null;
  },
}));
// The prompt editor: remember the props the page gave it (the test calls onGenerateClick like the Generate button would).
vi.mock("./PromptEditor/PromptEditor", () => ({
  default: (props: { onGenerateClick: (prompt: string, options?: Record<string, unknown>) => Promise<void> }) => {
    h.promptEditor.current = props;
    return null;
  },
}));
// Inert UI pieces that are not part of the Generate flow.
vi.mock("./components/ui/SideToolbar", () => ({ default: () => null }));
vi.mock("./components/ui/InpaintToolBar", () => ({ default: () => null }));
vi.mock("./components/ui/ContextMenu", () => ({
  ContextMenuContainer: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));
vi.mock("./components/Model3DOverlay", () => ({ Model3DOverlay: () => null }));
vi.mock("./HistoryStack", () => ({ HistoryStack: () => null }));
vi.mock("./hooks/usePagedrawKeybinds", () => ({ usePagedrawKeybinds: vi.fn() }));
vi.mock("@storyteller/keybinds", () => ({
  Cheatsheet: () => null,
  useCheatsheetVisibility: () => false,
}));
// The model picker hooks: the selected model is the mutable `h.model`.
vi.mock("@storyteller/ui-model-selector", () => ({
  ModelPage: { Canvas2D: "canvas2d" },
  useCanvas2dPageModelList: () => [],
  ClassyModelSelector: () => null,
  useSelectedImageModel: () => h.model,
  useSelectedProviderForModel: () => undefined,
}));
vi.mock("@storyteller/ui-help-menu", () => ({ HelpMenuButton: () => null }));
vi.mock("@storyteller/ui-pricing-modal", () => ({ CostCalculatorButton: () => null }));
vi.mock("@storyteller/ui-promptbox", () => ({
  usePrompt2DStore: (selector: (s: unknown) => unknown) => selector(h.promptStore),
}));

import PageDraw from "./PageDraw";

// The host adapter: every Rust-facing call is a vi.fn() the test can make succeed or fail.
function makeAdapter() {
  return {
    onEnqueueMeta: vi.fn(),
    enqueueEditImage: vi.fn().mockResolvedValue({ status: "success" }),
    enqueueInpaint: vi.fn().mockResolvedValue({ status: "success" }),
    enqueueBgRemoval: vi.fn().mockResolvedValue(undefined),
    uploadImage: vi.fn(),
    renderBaseImageSelector: vi.fn(() => null),
  };
}

// Renders the page and returns its adapter.
function renderPage() {
  const adapter = makeAdapter();
  render(<PageDraw adapter={adapter} />);
  return adapter;
}

// Presses Generate the way the prompt box does and reports whether the page's handler resolved or rejected.
// The prompt box wraps the call in try/finally with no catch, so a rejection here is an unhandled rejection in the app.
async function pressGenerate() {
  const onGenerateClick = h.promptEditor.current!.onGenerateClick;
  let outcome: { kind: "resolved" } | { kind: "rejected"; error: unknown } = { kind: "resolved" };
  await act(async () => {
    try {
      await onGenerateClick("a red fox", { aspectRatio: "square", resolution: "1k", images: [] });
    } catch (error) {
      outcome = { kind: "rejected", error };
    }
  });
  return outcome;
}

beforeEach(() => {
  // Fresh mocks and a fresh scene for every test.
  vi.clearAllMocks();
  h.promptEditor.current = null;
  for (const key of Object.keys(h.scene)) delete h.scene[key];
  Object.assign(h.scene, {
    baseImageInfo: { mediaToken: "m_base", url: "https://cdn.example/base.png", isBlankCanvas: true },
    baseImageBitmap: null,
    drawNodes: [],
    inpaintLineNodes: [],
    selectedNodeIds: [],
    activeTool: "select",
    currentShape: null,
    historyImageBundles: [],
    pendingGenerations: [],
    getAspectRatioDimensions: () => ({ width: 1024, height: 1024 }),
    addPendingGeneration: vi.fn(),
  });
  // Default model: a plain edit model (not Nano Banana, not inpainting).
  h.model.editingIsInpainting = false;
  h.model.usesInpaintingMask = false;
  h.model.isNanoBananaModel = () => false;
  // Happy-path defaults; each test breaks exactly one step.
  h.uploadSceneSnapshot.mockResolvedValue({ success: true, data: "m_snapshot" });
  h.compositeInWorker.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
  h.maskInWorker.mockResolvedValue(new Uint8Array([1, 2, 3]));
  // jsdom has no createImageBitmap; the bake only passes its result on to the (mocked) worker.
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({}));
  // Run requestAnimationFrame callbacks immediately: Generate waits one frame before it starts.
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  // The page logs the technical detail with console.error; keep the test output clean.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  // Unmount the page (this also clears its pre-bake timer) and undo the global stubs.
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PageDraw Generate: a failure to start is reported to the person", () => {
  it("shows the command's message when the enqueue is rejected (edit model)", async () => {
    // Rust rejects with its error object when, for example, the person is signed out.
    const adapter = renderPage();
    adapter.enqueueEditImage.mockRejectedValue({ error_message: "You need to log in to generate." });
    const outcome = await pressGenerate();
    // The person is told why nothing started...
    expect(h.toastError).toHaveBeenCalledTimes(1);
    expect(h.toastError).toHaveBeenCalledWith("You need to log in to generate.");
    // ...the page's handler resolves (the prompt box has no catch of its own)...
    expect(outcome.kind).toBe("resolved");
    // ...and no empty "generating" placeholder is added.
    expect(h.scene.addPendingGeneration).not.toHaveBeenCalled();
  });

  it("does not let a rejected enqueue escape the page's handler as an unhandled rejection", async () => {
    // The prompt box calls onGenerateClick inside try/finally with no catch, so whatever the page's handler throws becomes
    // an unhandled promise rejection in the app. This test looks only at that: the handler must resolve.
    const adapter = renderPage();
    adapter.enqueueEditImage.mockRejectedValue({ error_message: "Server error." });
    const outcome = await pressGenerate();
    expect(outcome.kind).toBe("resolved");
  });

  it("uses a plain fallback message when the rejection carries no message", async () => {
    const adapter = renderPage();
    adapter.enqueueEditImage.mockRejectedValue(undefined);
    const outcome = await pressGenerate();
    expect(h.toastError).toHaveBeenCalledTimes(1);
    expect(h.toastError).toHaveBeenCalledWith("Failed to generate image");
    expect(outcome.kind).toBe("resolved");
  });

  it("uses an Error's message for a rejection from a non-Tauri host", async () => {
    const adapter = renderPage();
    adapter.enqueueEditImage.mockRejectedValue(new Error("Network request failed"));
    await pressGenerate();
    expect(h.toastError).toHaveBeenCalledWith("Network request failed");
  });

  it("shows the message when the enqueue is rejected (Nano Banana model)", async () => {
    h.model.isNanoBananaModel = () => true;
    const adapter = renderPage();
    adapter.enqueueEditImage.mockRejectedValue({ error_message: "Not enough credits." });
    const outcome = await pressGenerate();
    expect(h.toastError).toHaveBeenCalledWith("Not enough credits.");
    expect(outcome.kind).toBe("resolved");
  });

  it("shows the message when the enqueue is rejected (inpainting model)", async () => {
    h.model.editingIsInpainting = true;
    h.model.usesInpaintingMask = true;
    const adapter = renderPage();
    adapter.enqueueInpaint.mockRejectedValue({ error_message: "No provider is available." });
    const outcome = await pressGenerate();
    expect(h.toastError).toHaveBeenCalledWith("No provider is available.");
    expect(outcome.kind).toBe("resolved");
  });

  it("tells the person when the canvas snapshot upload is refused, and does not enqueue", async () => {
    // The web call returns { success: false } (offline / signed out / server error).
    const adapter = renderPage();
    h.uploadSceneSnapshot.mockResolvedValue({ success: false });
    const outcome = await pressGenerate();
    expect(h.toastError).toHaveBeenCalledTimes(1);
    expect(h.toastError.mock.calls[0][0]).toMatch(/upload/i);
    expect(adapter.enqueueEditImage).not.toHaveBeenCalled();
    expect(outcome.kind).toBe("resolved");
  });

  it("tells the person when the canvas snapshot upload throws", async () => {
    const adapter = renderPage();
    h.uploadSceneSnapshot.mockRejectedValue(new Error("fetch failed"));
    const outcome = await pressGenerate();
    expect(h.toastError).toHaveBeenCalledWith("fetch failed");
    expect(adapter.enqueueEditImage).not.toHaveBeenCalled();
    expect(outcome.kind).toBe("resolved");
  });

  it("tells the person when the canvas cannot be baked into an image, and does not enqueue", async () => {
    // The worker rejects; the page's bake step turns that into "no composite file".
    const adapter = renderPage();
    h.compositeInWorker.mockRejectedValue(new Error("worker crashed"));
    const outcome = await pressGenerate();
    expect(h.toastError).toHaveBeenCalledTimes(1);
    expect(h.toastError.mock.calls[0][0]).toMatch(/canvas/i);
    expect(adapter.enqueueEditImage).not.toHaveBeenCalled();
    expect(h.uploadSceneSnapshot).not.toHaveBeenCalled();
    expect(outcome.kind).toBe("resolved");
  });
});

describe("PageDraw Generate: controls that already behaved", () => {
  it("enqueues once and adds the pending placeholder on success, with no error toast", async () => {
    const adapter = renderPage();
    const outcome = await pressGenerate();
    expect(outcome.kind).toBe("resolved");
    // The snapshot token from the upload is what gets enqueued.
    expect(adapter.enqueueEditImage).toHaveBeenCalledTimes(1);
    expect(adapter.enqueueEditImage.mock.calls[0][0].canvasImageMediaToken).toBe("m_snapshot");
    // The placeholder is added for the requested number of images.
    expect(h.scene.addPendingGeneration).toHaveBeenCalledTimes(1);
    expect((h.scene.addPendingGeneration as ReturnType<typeof vi.fn>).mock.calls[0][1]).toBe(2);
    expect(h.toastError).not.toHaveBeenCalled();
  });

  it("lets the person retry after a failure (the in-flight guard is released)", async () => {
    const adapter = renderPage();
    adapter.enqueueEditImage
      .mockRejectedValueOnce({ error_message: "Server error." })
      .mockResolvedValueOnce({ status: "success" });
    await pressGenerate();
    // Second press, after the failure.
    await pressGenerate();
    // Both presses reached the enqueue, and only the second one (which succeeded) added a placeholder.
    expect(adapter.enqueueEditImage).toHaveBeenCalledTimes(2);
    expect(h.scene.addPendingGeneration).toHaveBeenCalledTimes(1);
  });
});
