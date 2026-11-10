import { beforeEach, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { download } from "@tauri-apps/plugin-upload";
import { downloadUrlToPath } from "./LocalDownloads";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/plugin-upload", () => ({ download: vi.fn() }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn(), save: vi.fn() }));
beforeEach(() => {
  vi.mocked(invoke).mockReset();
  vi.mocked(download).mockReset();
});

it.each([
  ["asset://localhost/%2FUsers%2Fme%2Fimg.png", "/Users/me/Pictures/sunset.png", "/Users/me/Pictures", "sunset.png"],
  ["http://asset.localhost/%2FUsers%2Fme%2Fimg.png", "C:\\Users\\me\\Pictures\\sunset.png", "C:\\Users\\me\\Pictures", "sunset.png"],
])("keeps the chosen filename when saving local image %s", async (url, path, directory, filename) => {
  await downloadUrlToPath(url, path);
  expect(download).not.toHaveBeenCalled();
  expect(invoke).toHaveBeenCalledWith("download_url_command", {
    request: { url, directory, filename },
  });
});

it("downloads remote urls straight to the chosen path", async () => {
  const url = "https://cdn.example.com/media/img.png";
  await downloadUrlToPath(url, "/Users/me/Pictures/sunset.png");
  expect(download).toHaveBeenCalledWith(url, "/Users/me/Pictures/sunset.png");
  expect(invoke).not.toHaveBeenCalled();
});
