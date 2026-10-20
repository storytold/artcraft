// desktopMediaActions.download.spec: checks what the user is told when "Download" fails or succeeds on a finished item.
// There are two ways a download can run. By default the Rust command saves the file into the download folder, and when
// that fails Rust itself flashes a "Failed to download file" toast (MainApp.tsx listens for that event and shows it).
// With the "Ask location before download" setting on, the user picks a save path and the file is fetched by the Tauri
// upload plugin instead; that path never goes through Rust's download command, so nothing flashes a toast for it.
// If the plugin fails (network down, expired link, HTTP error) and the app says nothing, the user sees no "Downloaded"
// toast and no error either, and can't tell whether anything happened.
// Everything the module imports is replaced with small stand-ins, so only the decision logic is exercised.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Shared handles the mock factories below can see (vi.mock calls are hoisted above normal variables).
const m = vi.hoisted(() => ({
  // The toast library: the two calls this module can make after a download.
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  // The Tauri download helpers: where to save, the Rust command, and the plugin download to a chosen path.
  promptDownloadLocationIfNeeded: vi.fn(),
  downloadUrlToPath: vi.fn(),
  downloadUrl: vi.fn(),
}));

// The toast library: a default export with the three calls the module may use.
vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: m.toastSuccess,
    error: m.toastError,
    loading: vi.fn(),
  }),
}));
// The web API package: only the media-class names are read by the download function.
vi.mock("@storyteller/api", () => ({
  FilterMediaClasses: { DIMENSIONAL: "dimensional" },
  PromptsApi: class {},
}));
// The Tauri bridge: the three download helpers are the ones under test's collaborators; the rest are inert.
vi.mock("@storyteller/tauri-api", () => ({
  DownloadUrl: m.downloadUrl,
  downloadUrlToPath: m.downloadUrlToPath,
  promptDownloadLocationIfNeeded: m.promptDownloadLocationIfNeeded,
  pickDownloadDirectory: vi.fn(),
  useModelsStore: { getState: () => ({}) },
}));
// Stores and lists the other functions in this module use; nothing here touches them.
vi.mock("@storyteller/ui-promptbox", () => ({
  usePromptImageStore: { getState: () => ({}) },
  usePromptVideoStore: { getState: () => ({}) },
}));
vi.mock("@storyteller/ui-model-selector", () => ({
  useClassyModelSelectorStore: { getState: () => ({}) },
  ModelPage: {},
}));
vi.mock("@storyteller/model-list", () => ({
  IMAGE_MODELS_BY_ID: new Map(),
  VIDEO_MODELS_BY_ID: new Map(),
  CommonAspectRatio: {},
  CommonResolution: {},
  videoResolutionValue: () => undefined,
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({
  galleryModalLightboxVisible: { value: false },
  galleryModalVisibleDuringDrag: { value: false },
  galleryModalVisibleViewMode: { value: false },
}));
vi.mock("@storyteller/ui-generation-list", () => ({ getCachedPrompt: vi.fn() }));
vi.mock("~/pages/Stores/TabState", () => ({
  useTabStore: { getState: () => ({ setActiveTab: vi.fn() }) },
}));

import { downloadMediaFileToDisk } from "./desktopMediaActions";

// The file the tests "download"; the address is never fetched because the helpers are stand-ins.
const URL = "https://cdn.example/generated.png";

describe("downloadMediaFileToDisk feedback", () => {
  beforeEach(() => {
    // Start each test from clean stand-ins, and keep the expected error logs out of the test output.
    Object.values(m).forEach((fn) => fn.mockReset());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tells the user when the download to a chosen path fails", async () => {
    // "Ask location" is on: the user picked a path, then the plugin download is rejected (for example the network dropped).
    m.promptDownloadLocationIfNeeded.mockResolvedValue("/Users/me/Pictures/out.png");
    m.downloadUrlToPath.mockRejectedValue(new Error("HTTP 403"));
    await downloadMediaFileToDisk(URL, "image", "flux");
    // Nothing else reports this failure, so the app must.
    expect(m.toastError).toHaveBeenCalledTimes(1);
    expect(m.toastError).toHaveBeenCalledWith("Failed to download file");
    // And it must not also claim success.
    expect(m.toastSuccess).not.toHaveBeenCalled();
  });

  it("tells the user when working out the save location itself fails", async () => {
    // The Rust call that suggests a file name (or the native save dialog) is rejected before any download starts.
    m.promptDownloadLocationIfNeeded.mockRejectedValue(new Error("preferences unreadable"));
    await downloadMediaFileToDisk(URL, "image", "flux");
    expect(m.toastError).toHaveBeenCalledWith("Failed to download file");
    expect(m.downloadUrl).not.toHaveBeenCalled();
    expect(m.toastSuccess).not.toHaveBeenCalled();
  });

  it("stays silent when the user cancels the save dialog", async () => {
    // null = the user dismissed the picker; that is a choice, not a failure.
    m.promptDownloadLocationIfNeeded.mockResolvedValue(null);
    await downloadMediaFileToDisk(URL, "image", "flux");
    expect(m.toastError).not.toHaveBeenCalled();
    expect(m.toastSuccess).not.toHaveBeenCalled();
    expect(m.downloadUrlToPath).not.toHaveBeenCalled();
    expect(m.downloadUrl).not.toHaveBeenCalled();
  });

  it("adds no second error toast when the default Rust download fails (Rust already flashed one)", async () => {
    // "Ask location" is off (undefined = use the default folder) and the Rust command rejects after flashing its toast.
    m.promptDownloadLocationIfNeeded.mockResolvedValue(undefined);
    m.downloadUrl.mockRejectedValue(new Error("download_url_command failed"));
    await downloadMediaFileToDisk(URL, "image", "flux");
    // Two toasts for one failure would be noise; the Rust-flashed one is the single report.
    expect(m.toastError).not.toHaveBeenCalled();
    expect(m.toastSuccess).not.toHaveBeenCalled();
  });

  it("says 'Downloaded image' after a successful download to a chosen path", async () => {
    m.promptDownloadLocationIfNeeded.mockResolvedValue("/Users/me/Pictures/out.png");
    m.downloadUrlToPath.mockResolvedValue(undefined);
    await downloadMediaFileToDisk(URL, "image", "flux");
    expect(m.downloadUrlToPath).toHaveBeenCalledWith(URL, "/Users/me/Pictures/out.png");
    expect(m.toastSuccess).toHaveBeenCalledWith("Downloaded image");
    expect(m.toastError).not.toHaveBeenCalled();
  });

  it("says 'Downloaded 3D model' after a successful default download of a 3D model", async () => {
    m.promptDownloadLocationIfNeeded.mockResolvedValue(undefined);
    m.downloadUrl.mockResolvedValue({});
    await downloadMediaFileToDisk(URL, "dimensional", "hunyuan");
    expect(m.downloadUrl).toHaveBeenCalledWith(URL, { model: "hunyuan" });
    expect(m.toastSuccess).toHaveBeenCalledWith("Downloaded 3D model");
    expect(m.toastError).not.toHaveBeenCalled();
  });
});
