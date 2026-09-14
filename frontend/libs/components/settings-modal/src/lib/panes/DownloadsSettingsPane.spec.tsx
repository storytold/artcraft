import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DownloadsSettingsPane } from "./DownloadsSettingsPane";

const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));

vi.mock("@storyteller/tauri-api", () => ({
  GetAppPreferences: api.get,
  UpdateAppPreferences: api.update,
  DownloadDirectoryReveal: vi.fn(),
  PreferenceName: {
    AutoDownload: "auto_download",
    PreferredDownloadDirectory: "preferred_download_directory",
    PreferredDownloadFilename: "preferred_download_filename",
  },
}));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn() }));
vi.mock("@storyteller/api", () => ({
  getAskLocationBeforeDownload: () => false,
  setAskLocationBeforeDownload: vi.fn(),
}));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  let preferences = {
    preferred_download_directory: { custom: "/existing/downloads" },
    auto_download: false,
    preferred_download_filename: "artcraft_convention" as string | { custom_format: string },
  };
  api.get.mockImplementation(async () => ({ preferences: { ...preferences } }));
  api.update.mockImplementation(async ({ preference, value }) => {
    preferences = { ...preferences, [preference]: value };
    return { success: true };
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it("persists Auto Download using Tauri and keeps the existing directory", async () => {
  const user = userEvent.setup();
  render(<DownloadsSettingsPane />);
  await screen.findByText("/existing/downloads");
  const checkbox = screen.getByRole("checkbox", { name: "Auto Download" }) as HTMLInputElement;
  expect(checkbox.checked).toBe(false);
  expect(screen.getByText("Downloads to your system the minute generations complete")).toBeTruthy();

  await user.click(checkbox);
  await waitFor(() => expect(checkbox.checked).toBe(true));
  expect(api.update).toHaveBeenCalledWith({ preference: "auto_download", value: true });
  cleanup();
  render(<DownloadsSettingsPane />);
  await screen.findByText("/existing/downloads");
  expect((screen.getByRole("checkbox", { name: "Auto Download" }) as HTMLInputElement).checked).toBe(true);
});

it("saves a custom format explicitly, reloads it, and restores the app convention", async () => {
  const user = userEvent.setup();
  render(<DownloadsSettingsPane />);
  await screen.findByText("/existing/downloads");
  await user.click(screen.getByRole("button", { name: "Preferred download naming scheme" }));
  await user.click(screen.getByRole("option", { name: "Custom format" }));
  const input = screen.getByRole("textbox", { name: "Custom format" });
  await user.clear(input);
  // paste preserves braces, which userEvent.type otherwise treats as keys.
  await user.paste("project_{model}_{YYYY}_{batch_index}");
  expect(api.update).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Save format" }));
  await waitFor(() => expect(api.update).toHaveBeenCalledWith({
    preference: "preferred_download_filename",
    value: { custom_format: "project_{model}_{YYYY}_{batch_index}" },
  }));
  cleanup();
  render(<DownloadsSettingsPane />);
  expect((await screen.findByRole("textbox", { name: "Custom format" }) as HTMLInputElement).value).toBe("project_{model}_{YYYY}_{batch_index}");
  await user.click(screen.getByRole("button", { name: "Preferred download naming scheme" }));
  await user.click(screen.getByRole("option", { name: "ArtCraft convention" }));
  await waitFor(() => expect(screen.queryByRole("textbox", { name: "Custom format" })).toBeNull());
  expect(api.update).toHaveBeenLastCalledWith({ preference: "preferred_download_filename", value: "artcraft_convention" });
});

it("rejects unsafe names and shows persistence failures without enabling Auto Download", async () => {
  const user = userEvent.setup();
  render(<DownloadsSettingsPane />);
  await screen.findByText("/existing/downloads");
  await user.click(screen.getByRole("button", { name: "Preferred download naming scheme" }));
  await user.click(screen.getByRole("option", { name: "Custom format" }));
  await user.clear(screen.getByRole("textbox", { name: "Custom format" }));
  await user.paste("../escape");
  await user.click(screen.getByRole("button", { name: "Save format" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(api.update).not.toHaveBeenCalled();

  api.update.mockRejectedValueOnce(new Error("Cannot save preferences"));
  await user.click(screen.getByRole("checkbox", { name: "Auto Download" }));
  await screen.findByText("Error: Cannot save preferences");
  expect((screen.getByRole("checkbox", { name: "Auto Download" }) as HTMLInputElement).checked).toBe(false);
});
