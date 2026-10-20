import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared handle so each test can decide what the media-file lookup answers (and so the test can see which token was asked for).
const m = vi.hoisted(() => ({ getByToken: vi.fn() }));

// Only the media-file lookup matters here; the class stands in for the real API client.
vi.mock("@storyteller/api", () => ({
  MediaFilesApi: class {
    GetMediaFileByToken = m.getByToken;
  },
  UploadImageMedia: vi.fn(),
}));
// Everything below is imported by the adapter file but is not under test; bare stand-ins keep the import light.
vi.mock("@storyteller/common", () => ({ UploaderStates: { success: "success" } }));
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("@storyteller/ui-login-modal", () => ({
  useLoginModalStore: { getState: () => ({ openModal: vi.fn() }) },
}));
vi.mock("@storyteller/ui-promptbox", () => ({
  usePromptImageStore: { getState: () => ({ referenceImages: [], setReferenceImages: vi.fn() }) },
}));
vi.mock("../Stores/TabState", () => ({
  useTabStore: { getState: () => ({ setActiveTab: vi.fn() }) },
}));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn() } }));

import { desktopMoodboardAdapter } from "./desktopMoodboardAdapter";

// The adapter field is optional in the type; the desktop adapter must provide it, so assert it and call it through one helper.
const resolve = (token: string) => {
  const fn = desktopMoodboardAdapter.resolveMediaUrl;
  if (!fn) throw new Error("desktop adapter has no resolveMediaUrl");
  return fn(token);
};

beforeEach(() => {
  m.getByToken.mockReset();
  vi.restoreAllMocks();
});

describe("desktopMoodboardAdapter.resolveMediaUrl", () => {
  it("asks the media service about the uploaded token and returns its CDN address", async () => {
    m.getByToken.mockResolvedValue({
      success: true,
      data: {
        media_links: { cdn_url: "https://cdn.example.test/a.png" },
        public_bucket_url: "https://bucket.example.test/a.png",
      },
    });
    await expect(resolve("tok1")).resolves.toBe("https://cdn.example.test/a.png");
    expect(m.getByToken).toHaveBeenCalledWith({ mediaFileToken: "tok1" });
  });

  it("falls back to the public bucket address when there is no CDN address", async () => {
    m.getByToken.mockResolvedValue({
      success: true,
      data: { media_links: {}, public_bucket_url: "https://bucket.example.test/a.png" },
    });
    await expect(resolve("tok1")).resolves.toBe("https://bucket.example.test/a.png");
  });

  it("answers null when the media service reports failure", async () => {
    m.getByToken.mockResolvedValue({ success: false, errorMessage: "nope" });
    await expect(resolve("tok1")).resolves.toBeNull();
  });

  it("answers null when the file has no usable address", async () => {
    m.getByToken.mockResolvedValue({ success: true, data: { media_links: {} } });
    await expect(resolve("tok1")).resolves.toBeNull();
  });

  it("answers null instead of throwing when the lookup itself throws", async () => {
    // The moodboard treats a rejection from this seam as "keep the blob"; the adapter still must not let one escape.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    m.getByToken.mockRejectedValue(new Error("offline"));
    await expect(resolve("tok1")).resolves.toBeNull();
    errSpy.mockRestore();
  });
});
