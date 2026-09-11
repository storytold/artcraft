import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { GenerationProvider } from "@storyteller/common";
import ProviderSetupModal from "./provider-setup-modal";

const mocks = vi.hoisted(() => ({
  onLogin: (_event: { provider: GenerationProvider }) => {},
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@storyteller/tauri-events", () => ({
  useShowProviderLoginModalEvent: (callback: typeof mocks.onLogin) => {
    mocks.onLogin = callback;
  },
}));
vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}));

afterEach(() => {
  cleanup();
  mocks.invoke.mockClear();
});

it.each([GenerationProvider.Sora, GenerationProvider.WorldLabs])(
  "ignores login events from the retired %s integration",
  async (provider) => {
    render(<ProviderSetupModal />);
    await act(async () => mocks.onLogin({ provider }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mocks.invoke).not.toHaveBeenCalled();
  },
);

it("still opens login for a supported direct provider", async () => {
  render(<ProviderSetupModal />);
  await act(async () => mocks.onLogin({ provider: GenerationProvider.Midjourney }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Set up Midjourney" }));
  });
  expect(mocks.invoke).toHaveBeenCalledWith("midjourney_open_login_command");
  expect(screen.queryByRole("dialog")).toBeNull();
});
