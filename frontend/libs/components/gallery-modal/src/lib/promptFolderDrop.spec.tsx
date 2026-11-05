import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Shared mock handles: the captured reminder options, the open flag and the toast.
const h = vi.hoisted(() => ({
  showActionReminder: vi.fn(),
  isActionReminderOpen: { value: true },
  toastError: vi.fn(),
}));

vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  showActionReminder: h.showActionReminder,
  isActionReminderOpen: h.isActionReminderOpen,
}));
vi.mock("@storyteller/ui-toaster", () => ({
  toast: { error: h.toastError, success: vi.fn() },
}));

import { promptFolderDrop } from "./promptFolderDrop";

// Opens the prompt and returns the options handed to the reminder modal.
const openPrompt = (onMove: () => void | Promise<void>, onAdd: () => void | Promise<void>) => {
  promptFolderDrop({ count: 2, targetFolderName: "Fav", onMove, onAdd });
  return h.showActionReminder.mock.calls[0][0] as {
    onPrimaryAction: () => Promise<void>;
    onSecondaryAction: () => Promise<void>;
  };
};

describe("promptFolderDrop", () => {
  beforeEach(() => {
    h.showActionReminder.mockClear();
    h.toastError.mockClear();
    h.isActionReminderOpen.value = true;
  });
  afterEach(() => vi.clearAllMocks());

  it("runs onMove, closes the modal and shows no toast on success", async () => {
    const onMove = vi.fn().mockResolvedValue(undefined);
    const opts = openPrompt(onMove, vi.fn());
    await opts.onPrimaryAction();
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(h.isActionReminderOpen.value).toBe(false);
    expect(h.toastError).not.toHaveBeenCalled();
  });

  it("does not reject when onMove fails; toasts the error and still closes the modal", async () => {
    const onMove = vi.fn().mockRejectedValue(new Error("folder gone"));
    const opts = openPrompt(onMove, vi.fn());
    // Before the fix this promise rejected (unhandled in the real click handler).
    await expect(opts.onPrimaryAction()).resolves.toBeUndefined();
    expect(h.toastError).toHaveBeenCalledTimes(1);
    expect(h.toastError.mock.calls[0][0]).toContain("move");
    expect(h.toastError.mock.calls[0][0]).toContain("folder gone");
    expect(h.isActionReminderOpen.value).toBe(false);
  });

  it("does not reject when onAdd throws synchronously; toasts and closes", async () => {
    const onAdd = vi.fn(() => {
      throw "boom";
    });
    const opts = openPrompt(vi.fn(), onAdd);
    await expect(opts.onSecondaryAction()).resolves.toBeUndefined();
    expect(h.toastError.mock.calls[0][0]).toContain("copy");
    expect(h.toastError.mock.calls[0][0]).toContain("boom");
    expect(h.isActionReminderOpen.value).toBe(false);
  });
});
