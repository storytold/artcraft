import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { EditorCore } from "../index";
import { SaveManager } from "./save-manager";

const DEBOUNCE_MS = 10;

describe("SaveManager storage failures", () => {
  const saveCurrentProject = vi.fn<() => Promise<void>>();
  let save: SaveManager;

  beforeEach(() => {
    vi.useFakeTimers();
    saveCurrentProject.mockReset().mockResolvedValue(undefined);
    const editor = {
      project: {
        getActive: () => ({ metadata: { id: "draft" } }),
        getIsLoading: () => false,
        getMigrationState: () => ({ isMigrating: false }),
        saveCurrentProject,
      },
    } as unknown as EditorCore;
    save = new SaveManager({ editor, debounceMs: DEBOUNCE_MS });
  });

  afterEach(() => {
    save.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("keeps a rejected flush dirty until an explicit retry succeeds", async () => {
    const error = new Error("disk full");
    saveCurrentProject.mockRejectedValueOnce(error);

    await expect(save.flush()).rejects.toBe(error);

    expect(save.getIsDirty()).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 100);
    expect(saveCurrentProject).toHaveBeenCalledTimes(1);

    await save.flush();

    expect(saveCurrentProject).toHaveBeenCalledTimes(2);
    expect(save.getIsDirty()).toBe(false);
  });

  test("handles autosave rejection without retrying until another edit", async () => {
    const error = new Error("storage unavailable");
    const logError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    saveCurrentProject.mockRejectedValueOnce(error);

    save.markDirty();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(logError).toHaveBeenCalledWith("Failed to autosave project:", error);
    expect(save.getIsDirty()).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 100);
    expect(saveCurrentProject).toHaveBeenCalledTimes(1);

    save.markDirty();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(saveCurrentProject).toHaveBeenCalledTimes(2);
    expect(save.getIsDirty()).toBe(false);
  });

  test("retains edits made during a failed save without scheduling retries", async () => {
    let rejectSave!: (error: Error) => void;
    saveCurrentProject.mockReturnValueOnce(new Promise<void>((_, reject) => {
      rejectSave = reject;
    }));
    const error = new Error("disk full");
    const saving = expect(save.flush()).rejects.toBe(error);
    save.markDirty();
    rejectSave(error);
    await saving;

    expect(save.getIsDirty()).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 100);
    expect(saveCurrentProject).toHaveBeenCalledTimes(1);

    await save.flush();

    expect(saveCurrentProject).toHaveBeenCalledTimes(2);
    expect(save.getIsDirty()).toBe(false);
  });

  test("retries the retained pending save when autosave resumes", async () => {
    const error = new Error("storage unavailable");
    saveCurrentProject.mockRejectedValueOnce(error);
    await expect(save.flush()).rejects.toBe(error);

    save.pause();
    save.resume();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(saveCurrentProject).toHaveBeenCalledTimes(2);
    expect(save.getIsDirty()).toBe(false);
  });

  test("still queues edits made during a successful save", async () => {
    let resolveSave!: () => void;
    saveCurrentProject.mockReturnValueOnce(new Promise<void>((resolve) => {
      resolveSave = resolve;
    }));
    const saving = save.flush();
    save.markDirty();
    resolveSave();
    await saving;

    expect(save.getIsDirty()).toBe(true);
    expect(saveCurrentProject).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(saveCurrentProject).toHaveBeenCalledTimes(2);
    expect(save.getIsDirty()).toBe(false);
  });
});
