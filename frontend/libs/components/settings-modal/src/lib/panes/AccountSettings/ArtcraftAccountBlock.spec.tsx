import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ArtcraftAccountBlock } from "./ArtcraftAccountBlock";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  logout: vi.fn(),
  invoke: vi.fn(),
  triggerRecheck: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@storyteller/api", () => ({
  UsersApi: class {
    GetSession = mocks.getSession;
    Logout = mocks.logout;
  },
}));
vi.mock("@storyteller/ui-login-modal", () => ({
  useLoginModalStore: () => ({ triggerRecheck: mocks.triggerRecheck }),
}));
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

beforeEach(() => {
  mocks.getSession.mockReset();
  mocks.logout.mockReset();
  mocks.invoke.mockReset();
  mocks.triggerRecheck.mockReset();
  mocks.getSession.mockResolvedValue({
    data: { loggedIn: true, user: { display_name: "Rene" } },
  });
  mocks.logout.mockResolvedValue({ success: true });
  // Both console channels are noisy here and not under test.
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("logs out, notifies the app, rechecks and purges stored credentials", async () => {
  const user = userEvent.setup();
  const onLogout = vi.fn();
  mocks.invoke.mockResolvedValue({ success: true });
  render(<ArtcraftAccountBlock globalAccountLogoutCallback={onLogout} />);

  await user.click(await screen.findByRole("button", { name: "Log Out" }));

  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith(
      "storyteller_purge_credentials_command",
    ),
  );
  expect(onLogout).toHaveBeenCalledTimes(1);
  expect(mocks.triggerRecheck).toHaveBeenCalledTimes(1);
  expect(await screen.findByText("Not logged in")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Log In" })).toBeTruthy();
});

it("does not leak an unhandled rejection when purging credentials fails", async () => {
  const user = userEvent.setup();
  const unhandled = vi.fn();
  process.on("unhandledRejection", unhandled);
  mocks.invoke.mockRejectedValue(new Error("cannot delete credentials"));
  render(<ArtcraftAccountBlock globalAccountLogoutCallback={vi.fn()} />);

  await user.click(await screen.findByRole("button", { name: "Log Out" }));
  await waitFor(() => expect(mocks.invoke).toHaveBeenCalled());
  // Give a would-be unhandled rejection a macrotask to be reported.
  await new Promise((resolve) => setTimeout(resolve, 20));
  process.off("unhandledRejection", unhandled);

  expect(unhandled).not.toHaveBeenCalled();
  // The user-visible logout still completed and the button is usable again.
  expect(screen.getByRole("button", { name: "Log In" })).toBeTruthy();
});
