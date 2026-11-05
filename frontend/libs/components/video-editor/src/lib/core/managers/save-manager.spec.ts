import { afterEach, describe, expect, it, vi } from "vitest";

import { SaveManager } from "./save-manager";
import type { EditorCore } from "../index";

// Builds the smallest fake "editor" that SaveManager touches. Only the four
// project methods and the two subscribe hooks are needed. `saveCurrentProject`
// is a vi.fn so each test chooses whether the write succeeds or fails.
function buildFakeEditor(saveCurrentProject: () => Promise<void>) {
  const editor = {
    scenes: { subscribe: vi.fn(() => () => {}) },
    timeline: { subscribe: vi.fn(() => () => {}) },
    project: {
      getActive: () => ({ metadata: { id: "p1" } }),
      getIsLoading: () => false,
      getMigrationState: () => ({ isMigrating: false }),
      saveCurrentProject: vi.fn(saveCurrentProject),
    },
  };
  return editor;
}

describe("SaveManager failed save", () => {
  afterEach(() => {
    // Always hand real timers back so one test can't leak fake timers.
    vi.useRealTimers();
  });

  it("stays dirty after a failed flush so the edits are not forgotten", async () => {
    // The storage write rejects, like a full disk or a closed IndexedDB.
    const editor = buildFakeEditor(() => Promise.reject(new Error("disk full")));
    const manager = new SaveManager({
      editor: editor as unknown as EditorCore,
      debounceMs: 10,
    });

    // The user edited something, then the host asks us to flush.
    manager.markDirty();
    await expect(manager.flush()).rejects.toThrow("disk full");

    // The write failed, so the project must still count as unsaved.
    // (Old code cleared the flag before writing, so this was false.)
    expect(manager.getIsDirty()).toBe(true);

    // Stop the debounce timer queued by markDirty so nothing outlives the test.
    manager.stop();
  });

  it("a failed timer-triggered autosave is handled and retried on the next edit", async () => {
    // Fake timers let us "wait" the 800 ms debounce instantly.
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // Record any promise rejection nobody handled. The timer path used to
    // call `void saveNow()`, which leaves a rejection with no catch handler.
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on("unhandledRejection", onUnhandled);

    // First write fails, every later write succeeds.
    const saveMock = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("disk full"))
      .mockResolvedValue(undefined);
    const editor = buildFakeEditor(saveMock);
    const manager = new SaveManager({
      editor: editor as unknown as EditorCore,
      debounceMs: 800,
    });

    try {
      // An edit arrives; after the debounce the timer fires the autosave.
      manager.markDirty();
      await vi.advanceTimersByTimeAsync(800);
      expect(saveMock).toHaveBeenCalledTimes(1);

      // Switch back to real timers and let Node's unhandled-rejection
      // detection run (it fires after the current macrotask).
      vi.useRealTimers();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // The failure must have been caught and logged, not left unhandled,
      // and the project must still be flagged as unsaved.
      expect(unhandled).toEqual([]);
      expect(consoleError).toHaveBeenCalled();
      expect(manager.getIsDirty()).toBe(true);

      // The next edit retries the save, and this time it succeeds.
      vi.useFakeTimers();
      manager.markDirty();
      await vi.advanceTimersByTimeAsync(800);
      expect(saveMock).toHaveBeenCalledTimes(2);
      expect(manager.getIsDirty()).toBe(false);
    } finally {
      process.off("unhandledRejection", onUnhandled);
      consoleError.mockRestore();
      manager.stop();
    }
  });

  it("does not loop retrying a failing save on its own", async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // Every write fails.
    const saveMock = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error("disk full"));
    const editor = buildFakeEditor(saveMock);
    const manager = new SaveManager({
      editor: editor as unknown as EditorCore,
      debounceMs: 800,
    });

    try {
      manager.markDirty();
      // Let a long time pass: if the manager retried by itself we would see
      // many save attempts. It should attempt exactly once.
      await vi.advanceTimersByTimeAsync(10_000);
      expect(saveMock).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
      manager.stop();
    }
  });
});

// A write the test can finish by hand, so "a save is still in flight" can be
// held open for as long as an assertion needs.
function controllableWrite() {
  let finish!: () => void;
  let fail!: (error: Error) => void;
  const promise = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  return { promise, finish, fail };
}

describe("SaveManager flush while an autosave is in flight", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for the running save, then saves the edits made during it", async () => {
    vi.useFakeTimers();
    const slowWrite = controllableWrite();
    const saveMock = vi
      .fn<() => Promise<void>>()
      .mockReturnValueOnce(slowWrite.promise)
      .mockResolvedValue(undefined);
    const editor = buildFakeEditor(saveMock);
    const manager = new SaveManager({
      editor: editor as unknown as EditorCore,
      debounceMs: 800,
    });

    try {
      // An edit arrives and the debounced autosave starts a slow write.
      manager.markDirty();
      await vi.advanceTimersByTimeAsync(800);
      expect(saveMock).toHaveBeenCalledTimes(1);

      // The user keeps editing while that write is still running, then hits
      // Exit. The editor's exit path awaits flush() and then closes the project.
      manager.markDirty();
      let flushed = false;
      const flushPromise = manager.flush().then(() => {
        flushed = true;
      });
      await vi.advanceTimersByTimeAsync(0);

      // flush() must NOT report "saved" while the first write is unfinished and
      // the newest edit is not on disk. (Old code returned immediately because a
      // save was already running, so the project closed and that edit was lost.)
      expect(flushed).toBe(false);

      // Once the slow write ends, flush() must save the newer edit itself.
      slowWrite.finish();
      await flushPromise;
      expect(saveMock).toHaveBeenCalledTimes(2);
      expect(manager.getIsDirty()).toBe(false);
    } finally {
      manager.stop();
    }
  });

  it("keeps two overlapping flushes waiting until their own writes finish", async () => {
    vi.useFakeTimers();
    const slowWrite = controllableWrite();
    const secondWrite = controllableWrite();
    const saveMock = vi
      .fn<() => Promise<void>>()
      .mockReturnValueOnce(slowWrite.promise)
      .mockReturnValueOnce(secondWrite.promise)
      .mockResolvedValue(undefined);
    const editor = buildFakeEditor(saveMock);
    const manager = new SaveManager({
      editor: editor as unknown as EditorCore,
      debounceMs: 800,
    });

    try {
      manager.markDirty();
      await vi.advanceTimersByTimeAsync(800);

      const done = { first: false, second: false };
      const first = manager.flush().then(() => {
        done.first = true;
      });
      const second = manager.flush().then(() => {
        done.second = true;
      });

      // The first autosave ends. One flush starts its own write; the other must
      // keep waiting for it rather than treating "a save is running" as done.
      slowWrite.finish();
      await vi.advanceTimersByTimeAsync(0);
      expect(done).toEqual({ first: false, second: false });

      // Only after the flush's own write ends may both calls resolve.
      secondWrite.finish();
      await Promise.all([first, second]);
      expect(done).toEqual({ first: true, second: true });
    } finally {
      manager.stop();
    }
  });

  it("still saves in flush when the running save fails", async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const slowWrite = controllableWrite();
    const saveMock = vi
      .fn<() => Promise<void>>()
      .mockReturnValueOnce(slowWrite.promise)
      .mockResolvedValue(undefined);
    const editor = buildFakeEditor(saveMock);
    const manager = new SaveManager({
      editor: editor as unknown as EditorCore,
      debounceMs: 800,
    });

    try {
      manager.markDirty();
      await vi.advanceTimersByTimeAsync(800);

      let flushed = false;
      const flushPromise = manager.flush().then(() => {
        flushed = true;
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(flushed).toBe(false);

      // The running autosave fails. flush() must not hang on it, and must not
      // give up: it makes its own attempt, which succeeds here.
      slowWrite.fail(new Error("disk full"));
      await flushPromise;
      expect(saveMock).toHaveBeenCalledTimes(2);
      expect(manager.getIsDirty()).toBe(false);
    } finally {
      consoleError.mockRestore();
      manager.stop();
    }
  });
});
