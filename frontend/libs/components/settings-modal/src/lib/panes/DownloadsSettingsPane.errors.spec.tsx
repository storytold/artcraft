import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DownloadsSettingsPane } from "./DownloadsSettingsPane";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  reveal: vi.fn(),
  pickDirectory: vi.fn(),
}));

vi.mock("@storyteller/tauri-api", () => ({
  GetAppPreferences: mocks.get,
  UpdateAppPreferences: mocks.update,
  DownloadDirectoryReveal: mocks.reveal,
  getAskLocationBeforeDownload: () => false,
  setAskLocationBeforeDownload: vi.fn(),
  PreferenceName: {
    AutoDownload: "auto_download",
    PreferredDownloadDirectory: "preferred_download_directory",
    PreferredDownloadFilename: "preferred_download_filename",
  },
}));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: mocks.pickDirectory }));

// Fails the test if any handler lets a rejection escape unhandled.
const unhandled = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  mocks.get.mockReset();
  mocks.update.mockReset();
  mocks.reveal.mockReset();
  mocks.pickDirectory.mockReset();
  mocks.get.mockResolvedValue({
    preferences: {
      preferred_download_directory: { custom: "/existing/downloads" },
      auto_download: false,
      preferred_download_filename: "artcraft_convention",
    },
  });
  mocks.update.mockResolvedValue({ success: true });
  mocks.reveal.mockResolvedValue(undefined);
  unhandled.mockReset();
  process.on("unhandledRejection", unhandled);
});

afterEach(() => {
  process.off("unhandledRejection", unhandled);
  cleanup();
  vi.unstubAllGlobals();
});

// Lets a would-be unhandled rejection be reported before asserting on it.
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

it("shows an alert instead of an unhandled rejection when saving the chosen directory fails", async () => {
  const user = userEvent.setup();
  mocks.pickDirectory.mockResolvedValue("/new/place");
  mocks.update.mockRejectedValueOnce(new Error("disk is read-only"));
  render(<DownloadsSettingsPane />);
  await screen.findByText("/existing/downloads");

  await user.click(screen.getByRole("button", { name: "Choose Directory" }));

  expect((await screen.findByRole("alert")).textContent).toBe(
    "Error: disk is read-only",
  );
  await settle();
  expect(unhandled).not.toHaveBeenCalled();
  // The shown path is still the one actually saved.
  expect(screen.getByText("/existing/downloads")).toBeTruthy();
});

it("shows an alert when resetting to the default directory fails", async () => {
  const user = userEvent.setup();
  mocks.update.mockRejectedValueOnce(new Error("preferences locked"));
  render(<DownloadsSettingsPane />);
  await screen.findByText("/existing/downloads");

  await user.click(screen.getByRole("button", { name: "Use Default" }));

  expect((await screen.findByRole("alert")).textContent).toBe(
    "Error: preferences locked",
  );
  await settle();
  expect(unhandled).not.toHaveBeenCalled();
});

it("shows an alert when revealing the directory fails", async () => {
  const user = userEvent.setup();
  mocks.reveal.mockRejectedValueOnce(new Error("folder is missing"));
  render(<DownloadsSettingsPane />);
  await screen.findByText("/existing/downloads");

  await user.click(screen.getByRole("button", { name: "Show Directory" }));

  expect((await screen.findByRole("alert")).textContent).toBe(
    "Error: folder is missing",
  );
  await settle();
  expect(unhandled).not.toHaveBeenCalled();
});

it("still saves the picked directory and clears an earlier error on success", async () => {
  const user = userEvent.setup();
  mocks.reveal.mockRejectedValueOnce(new Error("folder is missing"));
  mocks.pickDirectory.mockResolvedValue("/new/place");
  render(<DownloadsSettingsPane />);
  await screen.findByText("/existing/downloads");
  await user.click(screen.getByRole("button", { name: "Show Directory" }));
  await screen.findByRole("alert");

  await user.click(screen.getByRole("button", { name: "Choose Directory" }));

  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith({
      preference: "preferred_download_directory",
      value: { custom: "/new/place" },
    }),
  );
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});
