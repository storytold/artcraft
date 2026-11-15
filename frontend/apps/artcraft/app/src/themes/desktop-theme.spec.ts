import { beforeEach, expect, it, vi } from "vitest";
import { watchDesktopTheme } from "../../../../../libs/components/settings-modal/src/lib/themes/desktop-theme";

const mocks = vi.hoisted(() => ({
  desktop: vi.fn(() => true),
  invoke: vi.fn(async () => undefined),
  unlisten: vi.fn(),
  listen: vi.fn(),
}));

vi.mock("@storyteller/tauri-utils", () => ({ IsDesktopApp: mocks.desktop }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@tauri-apps/api/event", () => ({ listen: mocks.listen }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.desktop.mockReturnValue(true);
  mocks.listen.mockResolvedValue(mocks.unlisten);
});

it("does not import or call desktop APIs in a browser", async () => {
  mocks.desktop.mockReturnValue(false);
  const stop = await watchDesktopTheme(vi.fn());
  stop();
  expect(mocks.listen).not.toHaveBeenCalled();
  expect(mocks.invoke).not.toHaveBeenCalled();
});

it("listens before the initial read, filters stale events, and cleans up exactly once", async () => {
  const change = vi.fn();
  const stop = await watchDesktopTheme(change);
  expect(mocks.listen.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.invoke.mock.invocationCallOrder[0],
  );
  const [command, args] = mocks.invoke.mock.calls[0] as unknown as [
    string,
    { subscriptionId: string },
  ];
  expect(command).toBe("watch_custom_theme_command");
  expect(Object.keys(args)).toEqual(["subscriptionId"]);
  const callback = mocks.listen.mock.calls[0][1];
  const update = { status: "error", reason: "missing" };
  callback({ payload: { subscriptionId: "stale", update } });
  expect(change).not.toHaveBeenCalled();
  callback({ payload: { subscriptionId: args.subscriptionId, update } });
  expect(change).toHaveBeenCalledWith(update);
  stop();
  stop();
  await vi.waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(2));
  expect(mocks.unlisten).toHaveBeenCalledTimes(1);
  expect(mocks.invoke).toHaveBeenLastCalledWith(
    "unwatch_custom_theme_command",
    args,
  );
  callback({ payload: { subscriptionId: args.subscriptionId, update } });
  expect(change).toHaveBeenCalledTimes(1);
});

it("removes its listener if native setup fails and allows a later retry", async () => {
  mocks.invoke.mockRejectedValueOnce(new Error("cannot watch"));
  await expect(watchDesktopTheme(vi.fn())).rejects.toThrow("cannot watch");
  expect(mocks.unlisten).toHaveBeenCalledTimes(1);
  const stop = await watchDesktopTheme(vi.fn());
  stop();
  await vi.waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(3));
  expect(mocks.unlisten).toHaveBeenCalledTimes(2);
});
