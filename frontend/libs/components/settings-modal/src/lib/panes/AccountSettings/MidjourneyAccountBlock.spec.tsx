import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MidjourneyAccountBlock } from "./MidjourneyAccountBlock";

const mocks = vi.hoisted(() => ({
  getInfo: vi.fn(),
  invoke: vi.fn(),
  // Captured so tests can fire the account-refresh event by hand.
  refreshHandler: { current: undefined as undefined | (() => void) },
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@storyteller/tauri-api", () => ({
  MidjourneyGetCredentialInfo: mocks.getInfo,
}));
vi.mock("@storyteller/tauri-events", () => ({
  useRefreshAccountStateEvent: (handler: () => void) => {
    mocks.refreshHandler.current = handler;
  },
}));
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

const loggedIn = {
  payload: { maybe_email: "me@example.com", can_clear_state: true },
};
const loggedOut = { payload: { maybe_email: null, can_clear_state: false } };

// A promise the test settles by hand, to control response order.
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  mocks.getInfo.mockReset();
  mocks.invoke.mockReset();
  mocks.refreshHandler.current = undefined;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("lets the newest session fetch win when an older one resolves last", async () => {
  const mountFetch = deferred<typeof loggedOut>();
  const eventFetch = deferred<typeof loggedIn>();
  mocks.getInfo
    .mockReturnValueOnce(mountFetch.promise)
    .mockReturnValueOnce(eventFetch.promise);
  render(<MidjourneyAccountBlock />);

  // The user finishes logging in; the refresh event starts a second fetch.
  act(() => {
    mocks.refreshHandler.current?.();
  });
  await act(async () => eventFetch.resolve(loggedIn));
  expect(await screen.findByText("me@example.com")).toBeTruthy();

  // The slow mount-time fetch now answers "logged out" and must be ignored.
  await act(async () => mountFetch.resolve(loggedOut));
  expect(screen.getByText("me@example.com")).toBeTruthy();
  expect(screen.queryByText("Not logged in")).toBeNull();
});

it("keeps the spinner until the newest fetch settles", async () => {
  const mountFetch = deferred<typeof loggedOut>();
  const eventFetch = deferred<typeof loggedIn>();
  mocks.getInfo
    .mockReturnValueOnce(mountFetch.promise)
    .mockReturnValueOnce(eventFetch.promise);
  render(<MidjourneyAccountBlock />);
  act(() => {
    mocks.refreshHandler.current?.();
  });

  // The older fetch finishing must not re-enable the button while the newer
  // request is still in flight.
  await act(async () => mountFetch.resolve(loggedOut));
  expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);

  await act(async () => eventFetch.resolve(loggedIn));
  await waitFor(() =>
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false),
  );
});

it("keeps showing the connected account when clearing credentials fails", async () => {
  const user = userEvent.setup();
  mocks.getInfo.mockResolvedValue(loggedIn);
  mocks.invoke.mockRejectedValue(new Error("keychain locked"));
  render(<MidjourneyAccountBlock />);
  const button = await screen.findByRole("button", { name: "Disconnect" });

  await user.click(button);

  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith("midjourney_clear_credentials_command"),
  );
  expect(screen.getByText("me@example.com")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Disconnect" })).toBeTruthy();
});

it("shows logged out after credentials are cleared successfully", async () => {
  const user = userEvent.setup();
  mocks.getInfo.mockResolvedValue(loggedIn);
  mocks.invoke.mockResolvedValue(undefined);
  render(<MidjourneyAccountBlock />);

  await user.click(await screen.findByRole("button", { name: "Disconnect" }));

  expect(await screen.findByText("Not logged in")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Connect" })).toBeTruthy();
});
