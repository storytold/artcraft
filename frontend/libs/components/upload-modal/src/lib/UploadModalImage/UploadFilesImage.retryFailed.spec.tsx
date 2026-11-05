import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UploadFilesImage } from "./UploadFilesImage";
// The real state enum (numeric): the callbacks the component receives carry these values, not strings.
import { UploaderStates } from "../Types";

// Shared handles for the mocks below (vi.hoisted makes them usable inside the vi.mock factories).
const h = vi.hoisted(() => ({
  // Every uploadImagesBatch call UploadFilesImage made. Each entry is the argument object, so a test can fire the
  // status callbacks later, exactly as the real network code does when each upload finishes.
  batches: [] as any[],
}));

// The real batch uploader talks to the network. This stand-in records the call and replays the two things the real
// one does synchronously up front (mark every file "uploading", report 0 progress), then stays pending so the test
// decides when each file finishes.
vi.mock("./utilities/uploadImagesBatch", () => ({
  uploadImagesBatch: vi.fn((args: any) => {
    h.batches.push(args);
    args.files.forEach((_: File, i: number) => args.onFileStatusChange(i, "uploading"));
    args.onOverallProgress(0, args.files.length);
    return new Promise<void>(() => undefined);
  }),
}));

// The single-file uploader is not used by these tests (no per-row Retry); an inert stand-in keeps the import cheap.
vi.mock("./utilities/uploadImage", () => ({
  uploadImage: vi.fn(() => new Promise<void>(() => undefined)),
}));

// Types.ts re-exports FilterEngineCategories from the API package; the real package is not under test here.
vi.mock("@storyteller/api", () => ({ FilterEngineCategories: { IMAGE_PLANE: "image_plane" } }));

// Plain stand-ins for the shared UI pieces so the component's own logic is what runs.
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));
vi.mock("@storyteller/ui-file-uploader", () => ({
  FileUploader: () => <div>picker</div>,
}));
// Panels only lay the list out; render their children directly.
vi.mock("react-resizable-panels", () => ({
  PanelGroup: ({ children }: any) => <div>{children}</div>,
  Panel: ({ children }: any) => <div>{children}</div>,
  PanelResizeHandle: ({ children }: any) => <div>{children}</div>,
}));

// Build a tiny named image file.
const png = (name: string) => new File(["x"], name, { type: "image/png" });

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

describe("UploadFilesImage: Retry Failed after a partly successful upload", () => {
  const onUploadProgress = vi.fn();
  // jsdom has no URL.createObjectURL; the preview needs one. Keep the originals to restore.
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    h.batches.length = 0;
    onUploadProgress.mockClear();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    cleanup();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  const mount = (initial: File[]) =>
    render(
      <UploadFilesImage
        title="Upload image"
        fileTypes={["png"]}
        initialFiles={initial}
        onClose={vi.fn()}
        onUploadProgress={onUploadProgress}
      />,
    );

  // First batch of two files: a1 fails, a2 is saved. The picker now shows a red row, a green row and Retry Failed.
  const firstBatchPartlyFails = () => {
    mount([png("a1.png"), png("a2.png")]);
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    const first = h.batches[0];
    finish(first, 0, "error");
    finish(first, 1, "success");
    complete(first, false, true);
  };

  it("does not tell the person 'All uploads failed.' when Retry Failed fails again but a2.png was saved", () => {
    firstBatchPartlyFails();
    // A partly successful batch leaves the modal on the picker, so nothing has been reported up yet.
    expect(onUploadProgress).not.toHaveBeenCalled();

    // Press Retry Failed: a second batch carrying only the failed file starts.
    fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));
    expect(h.batches).toHaveLength(2);
    expect(h.batches[1].files.map((f: File) => f.name)).toEqual(["a1.png"]);

    // The retry fails too.
    finish(h.batches[1], 0, "error");
    complete(h.batches[1], false, false);

    // a2.png IS in the library, so the modal must not switch to an error screen that says every upload failed.
    expect(onUploadProgress).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: UploaderStates.assetError }),
    );
    // The picker keeps showing the truth per row and still offers another try.
    expect(isTicked("a2.png")).toBe(true);
    expect(screen.getByRole("button", { name: "Retry Failed" })).toBeTruthy();
  });

  // Controls: these must pass on the old code AND the fixed code, so the fix does not over-block.
  it("control: when Retry Failed succeeds, the modal is told the whole upload succeeded", () => {
    firstBatchPartlyFails();
    fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));

    finish(h.batches[1], 0, "success");
    complete(h.batches[1], true, true);

    expect(onUploadProgress).toHaveBeenCalledWith({ status: UploaderStates.success });
  });

  it("control: when the FIRST batch fails completely, the modal still shows the error screen", () => {
    mount([png("a1.png"), png("a2.png")]);
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
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
