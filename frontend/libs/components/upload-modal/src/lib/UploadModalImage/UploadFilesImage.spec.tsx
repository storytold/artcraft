import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UploadFilesImage } from "./UploadFilesImage";
// The real state enum (numeric): the callbacks the component receives carry these values, not strings.
import { UploaderStates } from "../Types";

// Shared handles for the mocks below. vi.hoisted makes them usable inside the vi.mock factories (vi.mock calls are
// lifted above the imports).
const h = vi.hoisted(() => ({
  // The files the stand-in picker hands to handleChange the next time the person "chooses files".
  nextPick: [] as File[],
  // Every uploadImagesBatch call UploadFilesImage made. Each entry is the argument object, so a test can fire the
  // status callbacks later, exactly as the real network code does when each upload finishes.
  batches: [] as any[],
  // Every uploadImage call (the single-row Retry path).
  singles: [] as any[],
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

// The single-file uploader (used by the per-row Retry button). Recorded and left pending the same way.
vi.mock("./utilities/uploadImage", () => ({
  uploadImage: vi.fn((args: any) => {
    h.singles.push(args);
    return new Promise<void>(() => undefined);
  }),
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
// The stand-in picker is ALWAYS enabled and ALWAYS rendered, like the real FileUploader (which is never disabled
// and never unmounted while the files list shows). Pressing it calls handleChange with whatever nextPick holds.
vi.mock("@storyteller/ui-file-uploader", () => ({
  FileUploader: ({ handleChange }: any) => (
    <button onClick={() => handleChange(h.nextPick)}>Choose files</button>
  ),
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

// Row status helpers: the green check means "uploaded", the spinner means "uploading".
const isTicked = (name: string) => !!rowFor(name)?.querySelector(".text-green-400");
const isSpinning = (name: string) => !!rowFor(name)?.querySelector(".animate-spin");

// Press the Upload button.
const pressUpload = () => fireEvent.click(screen.getByRole("button", { name: "Upload" }));

// Press the picker with a given selection.
const pick = (files: File[]) => {
  h.nextPick = files;
  fireEvent.click(screen.getByRole("button", { name: "Choose files" }));
};

// Report the outcome of file `index` of a batch, as the real uploader does when that upload ends.
const finish = (batch: any, index: number, status: "success" | "error") =>
  act(() => {
    batch.onFileStatusChange(index, status, status === "error" ? "boom" : undefined);
  });

describe("UploadFilesImage: choosing files while an upload is running", () => {
  const onUploadProgress = vi.fn();
  // jsdom has no URL.createObjectURL; the preview needs one. Keep the originals to restore.
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    h.nextPick = [];
    h.batches.length = 0;
    h.singles.length = 0;
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

  it("keeps the picker on screen while a batch uploads (so a re-pick is possible at all)", () => {
    mount([png("a1.png"), png("a2.png"), png("a3.png")]);
    pressUpload();

    // The batch is running: three rows spin and the progress line is showing.
    expect(h.batches).toHaveLength(1);
    expect(isSpinning("a1.png")).toBe(true);
    expect(screen.getByText("Uploading 0 / 3...")).toBeTruthy();
    // The picker is still there and enabled, and the modal has not switched to another view.
    expect(screen.getByRole("button", { name: "Choose files" })).toBeTruthy();
    expect(onUploadProgress).not.toHaveBeenCalled();
  });

  it("does not let a re-pick mid-upload relabel the new files as uploaded when the old batch reports back", () => {
    mount([png("a1.png"), png("a2.png"), png("a3.png")]);
    pressUpload();
    const batch = h.batches[0];

    // Mid-upload the person chooses two different files.
    pick([png("b1.png"), png("b2.png")]);

    // The old batch now reports each of ITS files as uploaded.
    finish(batch, 0, "success");
    finish(batch, 1, "success");
    finish(batch, 2, "success");

    // The new files were never uploaded, so they must not be listed with a green check (nothing sent them).
    expect(isTicked("b1.png")).toBe(false);
    expect(isTicked("b2.png")).toBe(false);
    // The list still tells the truth about what was uploaded: the first three files, each ticked.
    expect(isTicked("a1.png")).toBe(true);
    expect(isTicked("a2.png")).toBe(true);
    expect(isTicked("a3.png")).toBe(true);
  });

  it("does not bring the Upload button back mid-upload (a second concurrent batch would corrupt the first)", () => {
    mount([png("a1.png"), png("a2.png"), png("a3.png")]);
    pressUpload();

    // Mid-upload re-pick.
    pick([png("b1.png"), png("b2.png")]);

    // The Upload button stays hidden (it was hidden because an upload started), and no second batch can start.
    expect(screen.queryByRole("button", { name: "Upload" })).toBeNull();
    expect(h.batches).toHaveLength(1);
  });

  it("ignores a re-pick while a single-row Retry is uploading", () => {
    mount([png("a1.png"), png("a2.png")]);
    pressUpload();
    const batch = h.batches[0];
    // Row 1 fails, row 2 succeeds, the batch ends: the Retry button for row 1 appears.
    finish(batch, 0, "error");
    finish(batch, 1, "success");
    act(() => {
      batch.onComplete(false, true);
    });

    // Retry the failed row; its upload stays pending.
    fireEvent.click(screen.getByTitle("Retry"));
    expect(h.singles).toHaveLength(1);
    expect(isSpinning("a1.png")).toBe(true);

    // Re-pick while that retry runs, then let the retry succeed.
    pick([png("b1.png"), png("b2.png")]);
    act(() => {
      h.singles[0].progressCallback({ status: UploaderStates.success });
    });

    // The retry belongs to a1.png, so a1.png is the one that is ticked; the new files never uploaded.
    expect(isTicked("a1.png")).toBe(true);
    expect(rowFor("b1.png")).toBeNull();
    expect(rowFor("b2.png")).toBeNull();
  });

  // Controls: these must pass on the old code AND the fixed code, so the fix does not over-block.
  it("control: before any upload, choosing other files replaces the list", () => {
    mount([png("a1.png"), png("a2.png")]);

    pick([png("b1.png"), png("b2.png"), png("b3.png")]);

    expect(rowFor("a1.png")).toBeNull();
    expect(rowFor("b1.png")).not.toBeNull();
    expect(rowFor("b3.png")).not.toBeNull();
    // Nothing has been uploaded yet, so Upload is available.
    expect(screen.getByRole("button", { name: "Upload" })).toBeTruthy();
  });

  it("control: once a batch has ended (some files failed), choosing other files replaces the list again", () => {
    mount([png("a1.png"), png("a2.png")]);
    pressUpload();
    const batch = h.batches[0];
    finish(batch, 0, "error");
    finish(batch, 1, "success");
    act(() => {
      batch.onComplete(false, true);
    });

    // The upload is over, so the picker works again and the new rows start fresh.
    pick([png("b1.png"), png("b2.png")]);

    expect(rowFor("a1.png")).toBeNull();
    expect(rowFor("b1.png")).not.toBeNull();
    expect(isTicked("b1.png")).toBe(false);
    expect(screen.getByRole("button", { name: "Upload" })).toBeTruthy();
  });

  it("control: a batch left alone finishes normally and reports success to the modal", () => {
    mount([png("a1.png"), png("a2.png")]);
    pressUpload();
    const batch = h.batches[0];

    finish(batch, 0, "success");
    finish(batch, 1, "success");
    act(() => {
      batch.onComplete(true, true);
    });

    expect(isTicked("a1.png")).toBe(true);
    expect(isTicked("a2.png")).toBe(true);
    expect(onUploadProgress).toHaveBeenCalledWith({ status: UploaderStates.success });
  });
});
