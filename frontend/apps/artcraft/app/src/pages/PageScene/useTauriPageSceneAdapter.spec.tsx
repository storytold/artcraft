import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

const m = vi.hoisted(() => ({
  signalScene: vi.fn(),
  getMediaFileByToken: vi.fn(),
}));

vi.mock("uuid", () => ({ v4: () => "uuid" }));
vi.mock("@storyteller/tauri-api", () => ({
  GenerateImage: vi.fn(),
  LoadWithoutCors: vi.fn(),
}));
vi.mock("@storyteller/tauri-utils", () => ({ FetchProxy: vi.fn() }));
vi.mock("@storyteller/api", () => ({
  MediaFilesApi: class {
    GetMediaFileByToken = m.getMediaFileByToken;
  },
  StorytellerApiHostStore: {
    getInstance: () => ({ getApiSchemeAndHost: () => "https://api.test" }),
  },
  UploadImageMedia: vi.fn(),
}));
vi.mock("@storyteller/ui-pagescene", () => ({ ToastTypes: {} }));
vi.mock("@storyteller/ui-upload-modal", () => ({
  UploadModal3D: () => null,
  UploadModalImage: () => null,
  UploadModalSplat: () => null,
}));
vi.mock("~/api/GetCdnOrigin", () => ({ GetCdnOrigin: () => "https://cdn.test" }));
vi.mock("~/api/BucketConfig", () => ({ BucketConfig: class {} }));
vi.mock("~/Classes/ApiManager", () => ({ MediaFilesApi: class {} }));
vi.mock("~/components/reusable/UploadModalMedia/uploadImage", () => ({
  uploadImage: vi.fn(),
}));
vi.mock("~/components/reusable/UploadModalMedia/uploadPlane", () => ({
  uploadPlaneFromMediaToken: vi.fn(),
}));
vi.mock("~/pages/Stores/TabState", () => ({ useTabStore: { getState: () => ({}) } }));
vi.mock("~/signals/authentication/utilities", () => ({ setLogoutStates: vi.fn() }));
vi.mock("~/signals", () => ({
  addToast: vi.fn(),
  authentication: { userInfo: { value: undefined } },
  pageHeight: { value: 0 },
  pageWidth: { value: 0 },
  signalScene: m.signalScene,
}));
vi.mock("./sceneOutputAdapter", () => ({ sceneOutputAdapter: {} }));

import { FetchProxy } from "@storyteller/tauri-utils";
import { useTauriPageSceneAdapter } from "./useTauriPageSceneAdapter";

const respond = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, json: async () => body, blob: async () => new Blob([String(body)]) }) as never;

const stubFetch = (metadata: unknown, fileText: string) => {
  globalThis.fetch = vi.fn(async (url: string) =>
    String(url).includes("/v1/media_files/file/")
      ? respond(metadata)
      : ({ ok: true, status: 200, text: async () => fileText } as never),
  ) as never;
};

const meta = (creator: unknown) => ({
  media_file: {
    maybe_title: "Castle",
    maybe_creator_user: creator,
    public_bucket_path: "/p/scene.json",
  },
});

beforeEach(() => m.signalScene.mockReset());
afterEach(() => cleanup());

const loadScene = () => renderHook(() => useTauriPageSceneAdapter()).result.current.loadScene;

describe("loadScene", () => {
  it("returns the parsed scene and records its metadata", async () => {
    stubFetch(meta({ user_token: "U1" }), '{"a":1}');
    await expect(loadScene()("tok")).resolves.toEqual({ a: 1 });
    expect(m.signalScene).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Castle", token: "tok", ownerToken: "U1" }),
    );
  });

  it("still loads when the scene has no creator", async () => {
    stubFetch(meta(null), '{"a":1}');
    await expect(loadScene()("tok")).resolves.toEqual({ a: 1 });
  });

  it("rejects (instead of hanging) when the scene file is not valid JSON", async () => {
    stubFetch(meta({ user_token: "U1" }), "not json");
    await expect(loadScene()("tok")).rejects.toThrow();
  });
});

// The header and the Save button take the open scene's title/token from `signalScene`. If the scene file then fails
// to arrive, the editor still holds the previous scene (or an empty one), so signalling early made Save write that
// content over the scene the user tried to open.
describe("loadScene when the scene file fails after its details were found", () => {
  // Details lookup answers normally; the file download answers `fileResponse` or throws.
  const stubFileStep = (fileResponse: () => unknown) => {
    globalThis.fetch = vi.fn(async (url: string) =>
      String(url).includes("/v1/media_files/file/")
        ? respond(meta({ user_token: "U1" }))
        : fileResponse(),
    ) as never;
  };

  it("does not point the editor at the scene when the file download is refused", async () => {
    stubFileStep(() => ({ ok: false, status: 500, text: async () => "" }));
    await expect(loadScene()("tok")).rejects.toThrow();
    expect(m.signalScene).not.toHaveBeenCalled();
  });

  it("does not point the editor at the scene when the file download throws (offline)", async () => {
    stubFileStep(() => {
      throw new TypeError("Failed to fetch");
    });
    await expect(loadScene()("tok")).rejects.toThrow();
    expect(m.signalScene).not.toHaveBeenCalled();
  });

  it("does not point the editor at the scene when the file is not valid JSON", async () => {
    stubFileStep(() => ({ ok: true, status: 200, text: async () => "<html>" }));
    await expect(loadScene()("tok")).rejects.toThrow();
    expect(m.signalScene).not.toHaveBeenCalled();
  });

  // Controls: these pass on the old code and must keep passing.
  it("control: a refused details lookup rejects and records nothing", async () => {
    globalThis.fetch = vi.fn(async () => respond({}, false, 404)) as never;
    await expect(loadScene()("tok")).rejects.toThrow("Failed to load scene");
    expect(m.signalScene).not.toHaveBeenCalled();
  });

  it("control: a file that loads is recorded exactly once, after it was read", async () => {
    stubFileStep(() => ({ ok: true, status: 200, text: async () => '{"a":1}' }));
    await expect(loadScene()("tok")).resolves.toEqual({ a: 1 });
    expect(m.signalScene).toHaveBeenCalledTimes(1);
  });
});

describe("saveScene", () => {
  const adapter = () => renderHook(() => useTauriPageSceneAdapter()).result.current;
  const args = (over: Record<string, unknown> = {}) =>
    ({
      saveJson: "{}",
      sceneTitle: "Castle",
      sceneToken: undefined,
      sceneThumbnail: new Blob(["png"]),
      ...over,
    }) as never;

  // FetchProxy carries the scene upload; global fetch carries cover calls.
  const sceneUpload = (body: unknown) =>
    vi.mocked(FetchProxy).mockResolvedValue({ json: async () => body } as never);
  const coverFetch = (impl: (url: string) => unknown) => {
    // `_init` is unused but keeps the mock's signature fetch-shaped for toHaveBeenCalledWith(url, init).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fn = vi.fn(async (url: string, _init?: unknown) => impl(String(url)));
    globalThis.fetch = fn as never;
    return fn;
  };

  beforeEach(() => {
    vi.mocked(FetchProxy).mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("returns the new scene token and sets the cover image", async () => {
    sceneUpload({ success: true, media_file_token: "S1" });
    const f = coverFetch((url) =>
      url.endsWith("/upload/image")
        ? respond({ success: true, media_file_token: "C1" })
        : respond({}),
    );
    await expect(adapter().saveScene(args())).resolves.toBe("S1");
    expect(f).toHaveBeenCalledWith(
      "https://api.test/v1/media_files/cover_image/S1",
      expect.anything(),
    );
  });

  it("still returns the saved token when the cover upload fails", async () => {
    sceneUpload({ success: true, media_file_token: "S1" });
    coverFetch(() => respond({}, false, 500));
    await expect(adapter().saveScene(args())).resolves.toBe("S1");
  });

  it("falls back to the given sceneToken when an update omits media_file_token", async () => {
    sceneUpload({ success: true });
    const f = coverFetch((url) =>
      url.endsWith("/upload/image")
        ? respond({ success: true, media_file_token: "C1" })
        : respond({}),
    );
    await expect(adapter().saveScene(args({ sceneToken: "OLD" }))).resolves.toBe("OLD");
    expect(f).toHaveBeenCalledWith(
      "https://api.test/v1/media_files/cover_image/OLD",
      expect.anything(),
    );
  });

  it("still reports failure when the scene itself did not save", async () => {
    sceneUpload({ success: false });
    await expect(adapter().saveScene(args())).resolves.toBe("");
  });
});

describe("getMediaUrlByToken", () => {
  beforeEach(() => m.getMediaFileByToken.mockReset());
  const adapter = () => renderHook(() => useTauriPageSceneAdapter()).result.current;

  it("returns the cdn url", async () => {
    m.getMediaFileByToken.mockResolvedValue({
      data: { media_links: { cdn_url: "https://cdn/x" } },
    });
    await expect(adapter().getMediaUrlByToken("T")).resolves.toBe("https://cdn/x");
  });

  it("throws a clear error naming the token on a failed lookup", async () => {
    m.getMediaFileByToken.mockResolvedValue({ success: false });
    await expect(adapter().getMediaUrlByToken("T9")).rejects.toThrow(/T9/);
  });
});
