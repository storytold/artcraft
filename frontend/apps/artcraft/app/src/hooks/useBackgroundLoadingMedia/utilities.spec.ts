import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks are hoisted so they exist before ./utilities is imported.
const m = vi.hoisted(() => ({
  list: vi.fn(),
  addToast: vi.fn(),
  setUserMovies: vi.fn(),
  setUserAudioItems: vi.fn(),
  userInfo: { value: { username: "u" } as unknown },
  retrievingMovies: { value: false },
  retrievingAudio: { value: false },
}));

vi.mock("~/enums", () => ({
  FilterMediaClasses: { VIDEO: "video", AUDIO: "audio" },
  ToastTypes: { ERROR: "error" },
}));
vi.mock("~/Classes/ApiManager/MediaFilesApi", () => ({
  MediaFilesApi: class {
    ListUserMediaFiles = m.list;
  },
}));
vi.mock("~/signals", () => ({
  addToast: m.addToast,
  authentication: { userInfo: m.userInfo },
  setUserAudioItems: m.setUserAudioItems,
  setUserMovies: m.setUserMovies,
  isRetreivingAudioItems: m.retrievingAudio,
  isRetreivingUserMovies: m.retrievingMovies,
}));

import { PollUserAudioItems, PollUserGeneratedMovies } from "./utilities";

beforeEach(() => {
  vi.clearAllMocks();
  m.userInfo.value = { username: "u" };
  m.retrievingMovies.value = false;
  m.retrievingAudio.value = false;
});

describe("PollUserGeneratedMovies", () => {
  it("skips the request when nobody is logged in", async () => {
    m.userInfo.value = undefined;
    expect(await PollUserGeneratedMovies()).toBe(true);
    expect(m.list).not.toHaveBeenCalled();
  });

  it("skips the request when one is already in flight", async () => {
    m.retrievingMovies.value = true;
    expect(await PollUserGeneratedMovies()).toBe(true);
    expect(m.list).not.toHaveBeenCalled();
  });

  it("keeps only movies made by inference, and clears the in-flight flag", async () => {
    m.list.mockResolvedValue({
      success: true,
      data: [
        { id: 1, origin_category: "inference" },
        { id: 2, origin_category: "upload" },
      ],
    });
    expect(await PollUserGeneratedMovies()).toBe(true);
    expect(m.list).toHaveBeenCalledWith({ filter_media_classes: ["video"] });
    expect(m.setUserMovies).toHaveBeenCalledWith([{ id: 1, origin_category: "inference" }]);
    expect(m.retrievingMovies.value).toBe(false);
  });

  it("toasts and returns false on failure, still clearing the flag", async () => {
    m.list.mockResolvedValue({ success: false, errorMessage: "nope" });
    expect(await PollUserGeneratedMovies()).toBe(false);
    expect(m.addToast).toHaveBeenCalledWith("error", "nope");
    expect(m.retrievingMovies.value).toBe(false);
  });

  it("clears the in-flight flag and toasts when the request throws", async () => {
    m.list.mockRejectedValue(new Error("boom"));
    expect(await PollUserGeneratedMovies()).toBe(false);
    expect(m.addToast).toHaveBeenCalledWith("error", "boom");
    expect(m.retrievingMovies.value).toBe(false);
  });

  it("uses a generic message when the API gives none", async () => {
    m.list.mockResolvedValue({ success: false });
    await PollUserGeneratedMovies();
    expect(m.addToast).toHaveBeenCalledWith("error", "Unknown Error in Loading My Movies");
  });
});

describe("PollUserAudioItems", () => {
  it("skips the request when nobody is logged in", async () => {
    m.userInfo.value = undefined;
    expect(await PollUserAudioItems()).toBe(true);
    expect(m.list).not.toHaveBeenCalled();
  });

  it("requests up to 100 audio items and stores them", async () => {
    m.list.mockResolvedValue({ success: true, data: [{ id: 9 }] });
    expect(await PollUserAudioItems()).toBe(true);
    expect(m.list).toHaveBeenCalledWith({ page_size: 100, filter_media_classes: ["audio"] });
    expect(m.setUserAudioItems).toHaveBeenCalledWith([{ id: 9 }]);
    expect(m.retrievingAudio.value).toBe(false);
  });

  it("clears the in-flight flag and toasts when the request throws", async () => {
    m.list.mockRejectedValue(new Error("boom"));
    expect(await PollUserAudioItems()).toBe(false);
    expect(m.addToast).toHaveBeenCalledWith("error", "boom");
    expect(m.retrievingAudio.value).toBe(false);
  });

  it("toasts and returns false on failure", async () => {
    m.list.mockResolvedValue({ success: false });
    expect(await PollUserAudioItems()).toBe(false);
    expect(m.addToast).toHaveBeenCalledWith("error", "Unknown Error in Loading My Audio Items");
  });
});
