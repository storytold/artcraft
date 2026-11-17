import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTauri } from "@tauri-apps/api/core";
import { CheckForUpdates, InstallUpdate, OpenUrl, type UpdateInfo } from "@storyteller/tauri-api";
import { UpdateDialog } from "./update-dialog";

vi.mock("@tauri-apps/api/core", () => ({ isTauri: vi.fn() }));
vi.mock("@storyteller/tauri-api", () => ({ CheckForUpdates: vi.fn(), InstallUpdate: vi.fn(), OpenUrl: vi.fn() }));
vi.mock("@storyteller/ui-button", () => ({ Button: ({ children, variant: _variant, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock("@storyteller/ui-modal", () => ({ Modal: ({ isOpen, title, onClose, showClose, children }: any) => isOpen ? (
  <section role="dialog" aria-label={title}><button aria-label="Close" disabled={!showClose} onClick={onClose}>×</button>{children}</section>
) : null }));

const INFO: UpdateInfo = { current_version: "0.42.0", maybe_available_version: "0.42.1", can_install: true,
  tasks_running: false, releases_url: "https://github.com/storytold/artcraft/releases" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isTauri).mockReturnValue(true);
  vi.mocked(CheckForUpdates).mockResolvedValue(INFO);
  vi.mocked(InstallUpdate).mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("manual updates", () => {
  it("does not check while closed and cancelling never installs", async () => {
    const close = vi.fn();
    const view = render(<UpdateDialog isOpen={false} onClose={close} />);
    expect(CheckForUpdates).not.toHaveBeenCalled();
    view.rerender(<UpdateDialog isOpen onClose={close} />);
    await screen.findByText("0.42.1 is available.");
    expect(screen.getByText("ArtCraft 0.42.0")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(close).toHaveBeenCalledOnce();
    expect(InstallUpdate).not.toHaveBeenCalled();
  });

  it("shares StrictMode checks while progress remains visible", async () => {
    let complete!: (info: UpdateInfo) => void;
    vi.mocked(CheckForUpdates).mockReturnValue(new Promise((resolve) => { complete = resolve; }));
    render(<StrictMode><UpdateDialog isOpen onClose={vi.fn()} /></StrictMode>);
    expect(CheckForUpdates).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain("Checking for updates");
    expect((screen.getByRole("button", { name: "Check again" }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { complete(INFO); });
    expect(screen.getByText("0.42.1 is available.")).toBeTruthy();
  });

  it("requires an install click and prevents dismissal during installation", async () => {
    vi.mocked(InstallUpdate).mockReturnValue(new Promise(() => {}));
    const close = vi.fn();
    render(<UpdateDialog isOpen onClose={close} />);
    await screen.findByText("0.42.1 is available.");
    expect(InstallUpdate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Update and restart" }));
    expect(InstallUpdate).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain("Downloading and verifying");
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect((screen.getByRole("button", { name: "Close" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Update and restart" }) as HTMLButtonElement).disabled).toBe(true);
    expect(close).not.toHaveBeenCalled();
  });

  it("reports a check failure and allows another manual check", async () => {
    vi.mocked(CheckForUpdates).mockRejectedValueOnce("Network unavailable");
    render(<UpdateDialog isOpen onClose={vi.fn()} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Network unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    await screen.findByText("0.42.1 is available.");
    expect(CheckForUpdates).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("restores controls after verification fails without closing the app", async () => {
    vi.mocked(InstallUpdate).mockRejectedValue("Signature verification failed");
    const close = vi.fn();
    render(<UpdateDialog isOpen onClose={close} />);
    await screen.findByText("0.42.1 is available.");
    fireEvent.click(screen.getByRole("button", { name: "Update and restart" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Signature verification failed");
    expect((screen.getByRole("button", { name: "Update and restart" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(close).not.toHaveBeenCalled();
  });

  it.each([false, true])("cannot install a managed or busy copy (tasks running: %s)", async (running) => {
    vi.mocked(CheckForUpdates).mockResolvedValue({ ...INFO, can_install: false, tasks_running: running });
    render(<UpdateDialog isOpen onClose={vi.fn()} />);
    await screen.findByText("0.42.1 is available.");
    const button = screen.getByRole("button", { name: "Update and restart" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(InstallUpdate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Releases" }));
    expect(OpenUrl).toHaveBeenCalledWith(INFO.releases_url);
  });

  it("offers browser users a reload without invoking native commands", () => {
    vi.mocked(isTauri).mockReturnValue(false);
    render(<UpdateDialog isOpen onClose={vi.fn()} />);
    expect(screen.getByRole("status").textContent).toContain("updates when you reload");
    expect(CheckForUpdates).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Update and restart" })).toBeNull();
  });
});
