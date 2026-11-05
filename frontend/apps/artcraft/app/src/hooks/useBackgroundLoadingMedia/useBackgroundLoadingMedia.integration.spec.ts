import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

// Integration-style: the hook runs against the REAL pollers (./utilities) and the
// real media signals, so effect re-triggering between them is exercised. Only the
// network client and the toast/auth/job signals are faked.
const m = vi.hoisted(() => ({
  list: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock("~/enums", async () => {
  const assetType = await import("~/enums/AssetType");
  return {
    ...assetType,
    FilterMediaClasses: { VIDEO: "video", AUDIO: "audio" },
    ToastTypes: { SUCCESS: "success", ERROR: "error" },
  };
});
vi.mock("~/Classes/ApiManager/MediaFilesApi", () => ({
  MediaFilesApi: class {
    ListUserMediaFiles = m.list;
  },
}));
vi.mock("~/signals", async () => {
  const { signal } = await import("@preact/signals-core");
  const media = await import("~/signals/backgroundLoadedMedia/backgroundLoadedMedia");
  return {
    ...media,
    addToast: m.addToast,
    authentication: { userInfo: signal<unknown>({ username: "u" }) },
    completedWorkflowJobs: signal<unknown[] | undefined>(undefined),
    completedAudioJobs: signal<unknown[] | undefined>(undefined),
  };
});

import * as signals from "~/signals";
import { useBackgroundLoadingMedia } from "./useBackgroundLoadingMedia";

const s = signals as unknown as {
  userMovies: { value: unknown };
  userAudioItems: { value: unknown };
  isRetreivingUserMovies: { value: boolean };
  isRetreivingAudioItems: { value: boolean };
  authentication: { userInfo: { value: unknown } };
};

// The API answers on a macrotask (like a real network round trip). If a regression
// made the hook retry in a loop, this keeps it a countable burst, not a frozen test.
const answerWith = (response: unknown) => {
  m.list.mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve(response), 0)),
  );
};

const requestsFor = (kind: "video" | "audio") =>
  m.list.mock.calls.filter((call) => call[0].filter_media_classes[0] === kind).length;

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });

beforeEach(() => {
  m.list.mockReset();
  m.addToast.mockReset();
  s.userMovies.value = undefined;
  s.userAudioItems.value = undefined;
  s.isRetreivingUserMovies.value = false;
  s.isRetreivingAudioItems.value = false;
  s.authentication.userInfo.value = { username: "u" };
});

afterEach(() => {
  cleanup();
});

describe("useBackgroundLoadingMedia first load with the real pollers", () => {
  it("makes exactly one request per media kind", async () => {
    answerWith({ success: true, data: [] });
    renderHook(() => useBackgroundLoadingMedia());
    await settle();
    expect(requestsFor("video")).toBe(1);
    expect(requestsFor("audio")).toBe(1);
    expect(s.userMovies.value).toEqual([]);
    expect(s.userAudioItems.value).toEqual([]);
  });

  it("keeps only inference-made movies in the stored list", async () => {
    answerWith({
      success: true,
      data: [
        { token: "a", origin_category: "inference" },
        { token: "b", origin_category: "upload" },
      ],
    });
    renderHook(() => useBackgroundLoadingMedia());
    await settle();
    expect(s.userMovies.value).toEqual([{ token: "a", origin_category: "inference" }]);
  });

  it("does not retry in a loop when the request fails (one request, one toast)", async () => {
    answerWith({ success: false, errorMessage: "server down" });
    renderHook(() => useBackgroundLoadingMedia());
    await settle();
    expect(requestsFor("video")).toBe(1);
    expect(requestsFor("audio")).toBe(1);
    expect(m.addToast).toHaveBeenCalledWith("error", "server down");
    // Nothing was stored, and the in-flight flags were released.
    expect(s.userMovies.value).toBeUndefined();
    expect(s.isRetreivingUserMovies.value).toBe(false);
  });

  it("does not retry in a loop when the request throws", async () => {
    m.list.mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error("offline")), 0)),
    );
    renderHook(() => useBackgroundLoadingMedia());
    await settle();
    expect(requestsFor("video")).toBe(1);
    expect(requestsFor("audio")).toBe(1);
    expect(m.addToast).toHaveBeenCalledWith("error", "offline");
  });

  it("waits while logged out, then loads once the user logs in", async () => {
    answerWith({ success: true, data: [] });
    s.authentication.userInfo.value = undefined;
    renderHook(() => useBackgroundLoadingMedia());
    await settle();
    expect(m.list).not.toHaveBeenCalled();

    await act(async () => {
      s.authentication.userInfo.value = { username: "u" };
    });
    await settle();
    expect(requestsFor("video")).toBe(1);
    expect(requestsFor("audio")).toBe(1);
  });
});
