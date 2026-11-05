import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UploadFiles3D } from "./UploadFiles3D";
// The real state enum (numeric): the callbacks the component receives carry these values, not strings.
import { UploaderStates } from "../Types";

// Shared handles for the mocks below (vi.hoisted makes them usable inside the vi.mock factories).
const h = vi.hoisted(() => ({
  // Every upload3DObjectsBatch call UploadFiles3D made (the argument object, so a test can fire the callbacks).
  batches: [] as any[],
}));

// The real batch uploader talks to the network. This stand-in records the call and replays what the real one does
// synchronously up front (mark every file "uploading", report 0 progress), then stays pending so the test decides
// when each file finishes.
vi.mock("./utilities/upload3DObjectsBatch", () => ({
  upload3DObjectsBatch: vi.fn((args: any) => {
    h.batches.push(args);
    args.files.forEach((_: File, i: number) => args.onFileStatusChange(i, "uploading"));
    args.onOverallProgress(0, args.files.length);
    return new Promise<void>(() => undefined);
  }),
}));

// The single-file uploader is not used by these tests (no per-row Retry); an inert stand-in keeps the import cheap.
vi.mock("./utilities/upload3DObjects", () => ({
  upload3DObjects: vi.fn(() => new Promise<void>(() => undefined)),
}));

// The utilities barrel: the 3D preview needs WebGL (jsdom has none), FBX conversion needs a worker, and the clip
// reader needs a parsed GLB. The component only needs these handles back.
vi.mock("./utilities", () => ({
  convertFbxToGlb: vi.fn(),
  loadPreviewOnCanvas: vi.fn(() => ({
    renderer: { setSize: vi.fn() },
    camera: { updateProjectionMatrix: vi.fn() },
    selectAnimation: vi.fn(),
    setSkeletonVisible: vi.fn(),
    dispose: vi.fn(),
  })),
  readGlbAnimationDurationMillis: vi.fn(),
  snapshotCanvasAsThumbnail: vi.fn(),
}));

// three is only used for TYPES in this component; give the imports something to resolve to.
vi.mock("three", () => ({ WebGLRenderer: class {}, PerspectiveCamera: class {} }));

// Types.ts re-exports FilterEngineCategories from the API package; the real package is not under test here.
vi.mock("@storyteller/api", () => ({
  FilterEngineCategories: { OBJECT: "object", ANIMATION: "animation", CHARACTER: "character" },
}));

// Plain stand-ins for the shared UI pieces so the component's own logic is what runs.
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));
vi.mock("@storyteller/ui-list-dropdown", () => ({ ListDropdown: () => null }));
vi.mock("@storyteller/ui-select", () => ({ Select: () => null }));
vi.mock("@storyteller/ui-file-uploader", () => ({
  FileUploader: () => <div>picker</div>,
}));
// Panels only lay the list out; render their children directly.
vi.mock("react-resizable-panels", () => ({
  PanelGroup: ({ children }: any) => <div>{children}</div>,
  Panel: ({ children }: any) => <div>{children}</div>,
  PanelResizeHandle: ({ children }: any) => <div>{children}</div>,
}));

// Build a tiny named GLB file.
const glb = (name: string) => new File(["x"], name, { type: "model/gltf-binary" });

// The list row (<li>) that shows a given file name, or null when that name is not listed.
const rowFor = (name: string) => screen.queryByTitle(name)?.closest("li") ?? null;

// Row status helper: the green check means "uploaded".
const isTicked = (name: string) => !!rowFor(name)?.querySelector(".text-green-400");

// Report the outcome of file `index` of a batch, as the real uploader does when that upload ends.
const finish = (batch: any, index: number, status: "success" | "error") =>
  act(() => {
    batch.onFileStatusChange(index, status, status === "error" ? "boom" : undefined);
  });

// End a batch, as the real uploader does after its last file reported.
const complete = (batch: any, allSucceeded: boolean, anySucceeded: boolean) =>
  act(() => {
    batch.onComplete(allSucceeded, anySucceeded);
  });

// jsdom has no ResizeObserver; the preview canvas registers one. A do-nothing class is enough.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("UploadFiles3D: Retry Failed after a partly successful upload", () => {
  const onUploadProgress = vi.fn();

  beforeEach(() => {
    h.batches.length = 0;
    onUploadProgress.mockClear();
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const mount = (initial: File[]) =>
    render(
      <UploadFiles3D
        title="Upload 3D"
        fileTypes={["glb"]}
        engineCategory={"object" as any}
        initialFiles={initial}
        onClose={vi.fn()}
        onUploadProgress={onUploadProgress}
      />,
    );

  // Press Upload (async: handleSubmit awaits nothing for a non-animation upload, but its state updates settle in act).
  const pressUpload = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    });
  };

  // First batch of two files: a1 fails, a2 is saved. The picker now shows a red row, a green row and Retry Failed.
  const firstBatchPartlyFails = async () => {
    mount([glb("a1.glb"), glb("a2.glb")]);
    await pressUpload();
    const first = h.batches[0];
    finish(first, 0, "error");
    finish(first, 1, "success");
    complete(first, false, true);
  };

  it("does not tell the person 'All uploads failed.' when Retry Failed fails again but a2.glb was saved", async () => {
    await firstBatchPartlyFails();
    // A partly successful batch leaves the modal on the picker, so nothing has been reported up yet.
    expect(onUploadProgress).not.toHaveBeenCalled();

    // Press Retry Failed: a second batch carrying only the failed file starts.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));
    });
    expect(h.batches).toHaveLength(2);
    expect(h.batches[1].files.map((f: File) => f.name)).toEqual(["a1.glb"]);

    // The retry fails too.
    finish(h.batches[1], 0, "error");
    complete(h.batches[1], false, false);

    // a2.glb IS in the library, so the modal must not switch to an error screen that says every upload failed.
    expect(onUploadProgress).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: UploaderStates.assetError }),
    );
    // The picker keeps showing the truth per row and still offers another try.
    expect(isTicked("a2.glb")).toBe(true);
    expect(screen.getByRole("button", { name: "Retry Failed" })).toBeTruthy();
  });

  // Controls: these must pass on the old code AND the fixed code, so the fix does not over-block.
  it("control: when Retry Failed succeeds, the modal is told the whole upload succeeded", async () => {
    await firstBatchPartlyFails();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));
    });

    finish(h.batches[1], 0, "success");
    complete(h.batches[1], true, true);

    expect(onUploadProgress).toHaveBeenCalledWith({ status: UploaderStates.success });
  });

  it("control: when the FIRST batch fails completely, the modal still shows the error screen", async () => {
    mount([glb("a1.glb"), glb("a2.glb")]);
    await pressUpload();
    const first = h.batches[0];
    finish(first, 0, "error");
    finish(first, 1, "error");
    complete(first, false, false);

    expect(onUploadProgress).toHaveBeenCalledWith({
      status: UploaderStates.assetError,
      errorMessage: "All uploads failed.",
    });
  });
});
