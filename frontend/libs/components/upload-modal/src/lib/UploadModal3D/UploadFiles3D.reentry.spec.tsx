import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UploadFiles3D } from "./UploadFiles3D";
// The real state enum (numeric): the callbacks the component receives carry these values, not strings.
import { UploaderStates } from "../Types";

// Shared handles for the mocks below (vi.hoisted makes them usable inside the vi.mock factories).
const h = vi.hoisted(() => ({
  // Every upload3DObjectsBatch call UploadFiles3D made (the argument object, so a test can fire the callbacks).
  batches: [] as any[],
  // The clip-length reader the animation path awaits. Tests choose between "answers at once" and "answers later".
  readDuration: vi.fn(),
  // Resolvers of the clip-length reads that were left pending on purpose (the GLB parse "still running" window).
  pending: [] as Array<(millis: number | null) => void>,
  // The newest `handleChange` the file chooser was given: calling it is the same as the person picking new files.
  pick: null as null | ((files: File[]) => void),
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

// The single-file uploader: stays pending forever, so a row that started a single-row Retry stays "uploading".
vi.mock("./utilities/upload3DObjects", () => ({
  upload3DObjects: vi.fn(() => new Promise<void>(() => undefined)),
}));

// The utilities barrel: the 3D preview needs WebGL (jsdom has none), FBX conversion needs a worker, and the clip
// reader needs a parsed GLB (here: the hoisted stand-in above).
vi.mock("./utilities", () => ({
  convertFbxToGlb: vi.fn(),
  loadPreviewOnCanvas: vi.fn(() => ({
    renderer: { setSize: vi.fn() },
    camera: { updateProjectionMatrix: vi.fn() },
    selectAnimation: vi.fn(),
    setSkeletonVisible: vi.fn(),
    dispose: vi.fn(),
  })),
  readGlbAnimationDurationMillis: (file: File) => h.readDuration(file),
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
// The file chooser: it keeps the component's latest `handleChange` so a test can "pick files" at any moment.
vi.mock("@storyteller/ui-file-uploader", () => ({
  FileUploader: (props: any) => {
    h.pick = props.handleChange;
    return <div>picker</div>;
  },
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

// Let promise chains started by a click run to the end (React applies updates between the waits).
const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

// Answer every clip-length read that was left pending, then let the code after the await run.
const answerPendingReads = async (millis: number | null) => {
  await act(async () => {
    h.pending.splice(0).forEach((resolve) => resolve(millis));
  });
  await settle();
};

// jsdom has no ResizeObserver; the preview canvas registers one. A do-nothing class is enough.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("UploadFiles3D: re-entry while an upload is being set up or is running", () => {
  const onUploadProgress = vi.fn();

  beforeEach(() => {
    h.batches.length = 0;
    h.pending.length = 0;
    h.pick = null;
    h.readDuration.mockReset();
    onUploadProgress.mockClear();
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const mount = (initial: File[], engineCategory: "object" | "animation" = "object") =>
    render(
      <UploadFiles3D
        title="Upload 3D"
        fileTypes={["glb"]}
        engineCategory={engineCategory as any}
        initialFiles={initial}
        onClose={vi.fn()}
        onUploadProgress={onUploadProgress}
      />,
    );

  // Press Upload and let the submission run as far as it can without help.
  const pressUpload = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    });
    await settle();
  };

  // Make clip-length reads answer at once (the usual case: a small GLB is parsed in a few milliseconds).
  const readsAnswerAtOnce = (millis: number | null = 1000) => h.readDuration.mockImplementation(() => Promise.resolve(millis));

  // Make clip-length reads stay pending until `answerPendingReads` (a big GLB is still being parsed).
  const readsStayPending = () =>
    h.readDuration.mockImplementation(
      () =>
        new Promise((resolve) => {
          h.pending.push(resolve as (millis: number | null) => void);
        }),
    );

  // First batch of two animation files: a1 fails, a2 is saved. The picker shows a red row, a green row and Retry Failed.
  const animationBatchPartlyFails = async () => {
    readsAnswerAtOnce();
    mount([glb("a1.glb"), glb("a2.glb")], "animation");
    await pressUpload();
    expect(h.batches).toHaveLength(1);
    finish(h.batches[0], 0, "error");
    finish(h.batches[0], 1, "success");
    complete(h.batches[0], false, true);
  };

  // The same state for a plain 3D object upload (no clip lengths to read).
  const objectBatchPartlyFails = async () => {
    mount([glb("a1.glb"), glb("a2.glb")]);
    await pressUpload();
    expect(h.batches).toHaveLength(1);
    finish(h.batches[0], 0, "error");
    finish(h.batches[0], 1, "success");
    complete(h.batches[0], false, true);
  };

  describe("Retry Failed (animation upload)", () => {
    it("starts ONE retry batch when the button is pressed twice while the clip length is still being read", async () => {
      await animationBatchPartlyFails();

      // From here on the GLB parse is "slow": the retry has to wait for it before it can start a batch.
      readsStayPending();
      const retry = screen.getByRole("button", { name: "Retry Failed" });
      act(() => {
        fireEvent.click(retry);
      });
      // A second press in the same window (a double click, or an impatient second press).
      act(() => {
        fireEvent.click(retry);
      });
      // No batch can have started yet: both presses are still waiting for a clip length.
      expect(h.batches).toHaveLength(1);

      await answerPendingReads(1000);

      // One retry batch (batch 0 was the first upload). Two would upload a1.glb twice, as two library assets.
      expect(h.batches).toHaveLength(2);
      expect(h.batches[1].files.map((f: File) => f.name)).toEqual(["a1.glb"]);
    });

    it("control: a single press starts one retry batch with the clip length of the failed file", async () => {
      await animationBatchPartlyFails();
      readsAnswerAtOnce(2500);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));
      });
      await settle();

      expect(h.batches).toHaveLength(2);
      expect(h.batches[1].files.map((f: File) => f.name)).toEqual(["a1.glb"]);
      expect(h.batches[1].durationsMillis.get(h.batches[1].files[0])).toBe(2500);
    });

    it("control: after a retry batch fails again, Retry Failed can be pressed again", async () => {
      await animationBatchPartlyFails();
      readsAnswerAtOnce();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));
      });
      await settle();
      expect(h.batches).toHaveLength(2);

      // The retry fails again; the picker goes back to a red row plus the button.
      finish(h.batches[1], 0, "error");
      complete(h.batches[1], false, false);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));
      });
      await settle();
      // The press was not swallowed by a guard left behind by the first retry.
      expect(h.batches).toHaveLength(3);
    });

    it("control: when the failed file has no clip, nothing is retried, and a later press still works", async () => {
      await animationBatchPartlyFails();

      // First press: the file turns out to have no animation clip, so the retry stops before any batch.
      readsAnswerAtOnce(null);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));
      });
      await settle();
      expect(h.batches).toHaveLength(1);
      expect(rowFor("a1.glb")).toBeTruthy();

      // Second press, now with a readable clip: it must not be blocked by the stopped first press.
      readsAnswerAtOnce(1000);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));
      });
      await settle();
      expect(h.batches).toHaveLength(2);
    });
  });

  describe("picking new files while an upload is running", () => {
    it("ignores a new pick while a batch is uploading, so its rows and the Upload state stay truthful", async () => {
      mount([glb("a1.glb"), glb("a2.glb")]);
      await pressUpload();
      expect(h.batches).toHaveLength(1);

      // The person drops two other files on the chooser while a1 and a2 are still uploading.
      act(() => {
        h.pick!([glb("b1.glb"), glb("b2.glb")]);
      });

      // The running list is still the one on screen; the new files did not replace it.
      expect(rowFor("a1.glb")).toBeTruthy();
      expect(rowFor("b1.glb")).toBeNull();

      // When the batch ends, the modal is told about the files that were really uploaded.
      finish(h.batches[0], 0, "success");
      finish(h.batches[0], 1, "success");
      complete(h.batches[0], true, true);
      expect(onUploadProgress).toHaveBeenCalledWith({ status: UploaderStates.success });
    });

    it("ignores a new pick while a single-row Retry is uploading", async () => {
      await objectBatchPartlyFails();

      // Retry a1.glb on its own row (the small arrow); its upload stays pending in this test.
      await act(async () => {
        fireEvent.click(screen.getByTitle("Retry"));
      });
      await settle();

      act(() => {
        h.pick!([glb("b1.glb"), glb("b2.glb")]);
      });

      expect(rowFor("a1.glb")).toBeTruthy();
      expect(rowFor("b1.glb")).toBeNull();
    });

    it("ignores a new pick while Upload is still reading clip lengths (animation upload)", async () => {
      readsStayPending();
      mount([glb("a1.glb"), glb("a2.glb")], "animation");
      // Press Upload but do not let the clip-length reads answer yet.
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Upload" }));
      });

      act(() => {
        h.pick!([glb("b1.glb"), glb("b2.glb")]);
      });

      expect(rowFor("a1.glb")).toBeTruthy();
      expect(rowFor("b1.glb")).toBeNull();

      // Let the submission finish so no promise is left dangling when the test ends.
      await answerPendingReads(1000);
    });

    it("control: a new pick before any upload replaces the list", async () => {
      mount([glb("a1.glb"), glb("a2.glb")]);

      act(() => {
        h.pick!([glb("b1.glb"), glb("b2.glb")]);
      });

      expect(rowFor("a1.glb")).toBeNull();
      expect(rowFor("b1.glb")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Upload" }).hasAttribute("disabled")).toBe(false);
    });

    it("control: a new pick after a partly failed batch has ended replaces the list and re-enables Upload", async () => {
      await objectBatchPartlyFails();

      act(() => {
        h.pick!([glb("b1.glb"), glb("b2.glb")]);
      });

      expect(rowFor("a1.glb")).toBeNull();
      expect(rowFor("b1.glb")).toBeTruthy();
      // The ended batch released its guard, so the new list can be uploaded.
      expect(screen.getByRole("button", { name: "Upload" }).hasAttribute("disabled")).toBe(false);
    });
  });
});
