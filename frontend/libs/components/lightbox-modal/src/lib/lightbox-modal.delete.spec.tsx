// lightbox-modal.delete.spec: checks what the full-screen viewer does when the person deletes the media they are looking at.
// Pressing "Delete" opens a confirmation ("Delete this media?"); confirming calls the Rust delete command. That command
// rejects when the delete does not happen (offline, signed out, server error) and sends the "File deleted." event only on
// success. The other delete confirmations in the app (gallery card, gallery bulk delete, characters) all show an error
// toast when the delete fails; the viewer must too, and it should stay open so the person sees the item is still there
// and can try again. After a successful delete the viewer closes, because the media it shows is gone.
// The viewer itself is rendered for real; the confirmation dialog, the Rust command and the toast are replaced by small
// stand-ins so the test can "press Confirm" by calling the dialog's confirm action directly (the real dialog's Confirm
// button is wired to exactly that function).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";

// Shared handles the mock factories below can see (vi.mock calls are hoisted above normal variables).
const m = vi.hoisted(() => ({
  // The two media / prompt lookups the viewer makes when it opens.
  getMedia: vi.fn(),
  getPrompt: vi.fn(),
  // The Rust delete command and the two toast calls.
  mediaFileDelete: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  // What the viewer asked the confirmation dialog to show; the test reads `onPrimaryAction` from here.
  shown: { current: null as null | { onPrimaryAction: () => Promise<void> | void } },
  // The "dialog is open" signal the viewer flips to false when it is done with the dialog.
  dialogOpen: { value: false },
}));

// The web API: only the two lookups the viewer makes on open.
vi.mock("@storyteller/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    MediaFilesApi: class {
      GetMediaFileByToken = m.getMedia;
      GetMediaFilesByBatchToken = vi.fn();
    },
    PromptsApi: class {
      GetPromptsByToken = m.getPrompt;
    },
  };
});
// Analytics: the shipped page defines a global `gtag` in index.html and every button press reports through it; jsdom has
// no such global, so the report is replaced by a no-op (it is not what this spec is about).
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));
// The Rust bridge: the delete command is the one under test; everything else the viewer imports from it is inert.
vi.mock("@storyteller/tauri-api", () => ({ MediaFileDelete: m.mediaFileDelete }));
// The toast the viewer shows.
vi.mock("@storyteller/ui-toaster", () => ({
  toast: { success: m.toastSuccess, error: m.toastError },
}));
// The confirmation dialog: remember what was shown, and expose the "is the dialog open" flag.
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  showActionReminder: (props: { onPrimaryAction: () => Promise<void> | void }) => {
    m.shown.current = props;
    m.dialogOpen.value = true;
  },
  isActionReminderOpen: m.dialogOpen,
}));
// jsdom has no IntersectionObserver / matchMedia, which the carousel needs; the carousel is irrelevant here.
vi.mock("embla-carousel-react", () => ({
  default: () => [() => undefined, undefined],
}));
// Tooltips just render the thing they wrap.
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { LightboxModal } from "./lightbox-modal";

describe("LightboxModal delete", () => {
  // Counts how often the viewer asked to close itself.
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Fresh stand-ins for every test.
    onClose = vi.fn();
    m.getMedia.mockReset().mockResolvedValue({ success: true, data: { maybe_prompt_token: "p1" } });
    m.getPrompt.mockReset().mockResolvedValue({ success: true, data: { maybe_positive_prompt: "hello" } });
    m.mediaFileDelete.mockReset();
    m.toastError.mockReset();
    m.toastSuccess.mockReset();
    m.shown.current = null;
    m.dialogOpen.value = false;
    // jsdom has no matchMedia, which the carousel reads on init.
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }));
    // The viewer logs nothing on this path, but a failing delete may be logged; keep the output readable.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Open the viewer on one image, press "Delete", and hand back the confirm action the dialog was given.
  const openAndPressDelete = async () => {
    const view = render(
      <LightboxModal
        isOpen
        onClose={onClose}
        onCloseGallery={() => undefined}
        mediaId="m_image_1"
        imageUrl="https://cdn/img.png"
        mediaClass="image"
      />,
    );
    // The Delete button sits in the side panel, which appears once the lookups settle.
    const deleteButton = await waitFor(
      () => {
        const el = view.getByText("Delete");
        expect(el).toBeTruthy();
        return el;
      },
      { timeout: 3000 },
    );
    fireEvent.click(deleteButton);
    // Pressing Delete must have opened the confirmation with a confirm action.
    expect(m.shown.current).not.toBeNull();
    return m.shown.current as { onPrimaryAction: () => Promise<void> | void };
  };

  // Press Confirm: run the dialog's confirm action and let any promise it started settle.
  const confirm = async (dialog: { onPrimaryAction: () => Promise<void> | void }) => {
    await act(async () => {
      // A rejection that escapes the confirm action is swallowed here so the test can look at what the person would see.
      await Promise.resolve(dialog.onPrimaryAction()).catch(() => undefined);
    });
  };

  it("deletes the pressed media by its token", async () => {
    m.mediaFileDelete.mockResolvedValue({ status: "success" });
    const dialog = await openAndPressDelete();
    await confirm(dialog);
    expect(m.mediaFileDelete).toHaveBeenCalledWith("m_image_1");
  });

  it("closes the dialog and the viewer after a successful delete", async () => {
    m.mediaFileDelete.mockResolvedValue({ status: "success" });
    const dialog = await openAndPressDelete();
    await confirm(dialog);
    expect(m.dialogOpen.value).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(m.toastError).not.toHaveBeenCalled();
  });

  it("tells the person when the delete fails", async () => {
    // The Rust command returns Err("delete failed"), which makes the invoke call reject.
    m.mediaFileDelete.mockRejectedValue("delete failed");
    const dialog = await openAndPressDelete();
    await confirm(dialog);
    // Nothing else reports this (the "File deleted." event is only sent on success), so the viewer must.
    expect(m.toastError).toHaveBeenCalledTimes(1);
    expect(m.toastSuccess).not.toHaveBeenCalled();
  });

  it("keeps the viewer open after a failed delete, so the item can be seen and retried", async () => {
    m.mediaFileDelete.mockRejectedValue("delete failed");
    const dialog = await openAndPressDelete();
    await confirm(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("still closes the confirmation dialog after a failed delete", async () => {
    m.mediaFileDelete.mockRejectedValue("delete failed");
    const dialog = await openAndPressDelete();
    await confirm(dialog);
    expect(m.dialogOpen.value).toBe(false);
  });

  it("lets the person delete again after a failure (no stuck state)", async () => {
    // First attempt fails, second succeeds.
    m.mediaFileDelete.mockRejectedValueOnce("delete failed").mockResolvedValueOnce({ status: "success" });
    const first = await openAndPressDelete();
    await confirm(first);
    expect(onClose).not.toHaveBeenCalled();
    // Press Delete again on the still-open viewer (the button is still on screen) and confirm a second time.
    m.shown.current = null;
    fireEvent.click(document.body.querySelector("button[class*='text-red-500']") as HTMLElement);
    expect(m.shown.current).not.toBeNull();
    await confirm(m.shown.current as unknown as { onPrimaryAction: () => Promise<void> | void });
    expect(m.mediaFileDelete).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
