import { beforeEach, describe, expect, it, vi } from "vitest";
import { effect } from "@preact/signals-core";

// A fresh module per test: the signals are module-level singletons.
const load = async () => {
  vi.resetModules();
  return await import("./loadingBar");
};

beforeEach(() => {
  vi.resetModules();
});

describe("loading bar signals", () => {
  it("starts hidden, showing the editor-engine label at 5% with no message", async () => {
    const { loadingBarData, loadingBarIsShowing } = await load();
    expect(loadingBarIsShowing.value).toBe(false);
    expect(loadingBarData.value).toEqual({
      label: "Loading Editor Engine... 🦊",
      progress: 5,
      message: "",
    });
  });

  it("applies a whole-object update to the progress data", async () => {
    const { loadingBarData } = await load();
    loadingBarData.value = { label: "Saving", progress: 80, message: "almost there" };
    expect(loadingBarData.value).toEqual({
      label: "Saving",
      progress: 80,
      message: "almost there",
    });
  });

  it("notifies subscribers when the data is replaced, but not when it is mutated in place", async () => {
    const { loadingBarData } = await load();
    const progressSeen: number[] = [];
    const stop = effect(() => {
      progressSeen.push(loadingBarData.value.progress);
    });

    // In-place mutation does not change the signal's value reference, so no re-run.
    loadingBarData.value.progress = 40;
    expect(progressSeen).toEqual([5]);

    // Replacing the object (what callers must do) does.
    loadingBarData.value = { ...loadingBarData.value, progress: 60 };
    stop();
    expect(progressSeen).toEqual([5, 60]);
  });

  it("shows and hides independently of the data", async () => {
    const { loadingBarData, loadingBarIsShowing } = await load();
    loadingBarIsShowing.value = true;
    expect(loadingBarIsShowing.value).toBe(true);
    expect(loadingBarData.value.progress).toBe(5);

    loadingBarIsShowing.value = false;
    expect(loadingBarIsShowing.value).toBe(false);
  });
});
