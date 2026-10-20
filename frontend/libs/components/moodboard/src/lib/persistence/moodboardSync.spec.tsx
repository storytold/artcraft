import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { MoodboardPersistenceAdapter } from "../adapter";

// Spec for the remote sync controller's account lifecycle. The controller keeps its state at module
// level (current account, phase, dirty set), so every test loads a fresh copy of the modules and
// starts from empty storage. The persistence adapter is a fake whose signed-in account the test
// switches by hand, the same way a real session resolving, expiring or changing would.

type SaveArgs = Parameters<MoodboardPersistenceAdapter["saveBoard"]>[0];

// A persistence adapter whose account can be changed from the test. `setUserId` also fires the auth
// subscription, which is what tells the hook to re-read the account.
function createFakeAdapter(initialUserId: string | null) {
  let userId = initialUserId;
  const listeners = new Set<() => void>();
  const saveBoard = vi.fn(async (_args: SaveArgs) => ({
    success: true,
    token: "remote-1",
  }));
  const persistence: MoodboardPersistenceAdapter = {
    getUserId: () => userId,
    subscribeAuthState: (onChange) => {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    saveBoard,
    listBoards: async () => ({ success: true, boards: [] }),
    loadBoard: async () => ({ success: false }),
  };
  return {
    persistence,
    saveBoard,
    setUserId: (next: string | null) => {
      userId = next;
      listeners.forEach((listener) => listener());
    },
  };
}

// Loads the sync controller and the board store as one fresh pair of modules.
async function loadModules() {
  vi.resetModules();
  const sync = await import("./moodboardSync");
  const { useBoardLibraryStore } = await import("../boards/BoardLibraryStore");
  return { sync, library: useBoardLibraryStore };
}

// Lets the pending hydration / save promises run, advancing the fake clock a little.
async function settle(ms = 10) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

// Creates a board that has real content, so the controller does not skip it as an untouched scratch
// board.
function addBoardWithContent(library: Awaited<ReturnType<typeof loadModules>>["library"]) {
  const boardId = library.getState().createBoard("Trip ideas");
  library.getState().addTextItem(boardId, "note");
  return boardId;
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useMoodboardSync account lifecycle", () => {
  it("pushes a board when Save is pressed after the first sign-in", async () => {
    // Control: the plain path, nobody logs out.
    const { sync, library } = await loadModules();
    const fake = createFakeAdapter("user-1");
    const { result } = renderHook(() =>
      sync.useMoodboardSync({ sendToGeneration: vi.fn(), persistence: fake.persistence }),
    );
    await settle();

    addBoardWithContent(library);
    act(() => result.current.saveNow());
    await settle();

    expect(fake.saveBoard).toHaveBeenCalledTimes(1);
  });

  it("pushes after an account switch (control)", async () => {
    // Control: a different account signing in resets the controller and hydrates for that account.
    const { sync, library } = await loadModules();
    const fake = createFakeAdapter("user-1");
    const { result } = renderHook(() =>
      sync.useMoodboardSync({ sendToGeneration: vi.fn(), persistence: fake.persistence }),
    );
    await settle();

    act(() => fake.setUserId(null));
    await settle();
    act(() => fake.setUserId("user-2"));
    await settle();

    addBoardWithContent(library);
    act(() => result.current.saveNow());
    await settle();

    expect(fake.saveBoard).toHaveBeenCalledTimes(1);
  });

  it("pushes again when the same account signs back in after a logout", async () => {
    const { sync, library } = await loadModules();
    const fake = createFakeAdapter("user-1");
    const { result } = renderHook(() =>
      sync.useMoodboardSync({ sendToGeneration: vi.fn(), persistence: fake.persistence }),
    );
    await settle();

    // The session ends and the same person signs straight back in, without reloading the page.
    act(() => fake.setUserId(null));
    await settle();
    act(() => fake.setUserId("user-1"));
    await settle();

    addBoardWithContent(library);
    act(() => result.current.saveNow());
    await settle();

    // Save has to reach the server; before, the controller stayed idle and the press did nothing.
    expect(fake.saveBoard).toHaveBeenCalledTimes(1);
  });

  it("pushes edits made while logged out once the same account signs back in", async () => {
    const { sync, library } = await loadModules();
    const fake = createFakeAdapter("user-1");
    renderHook(() =>
      sync.useMoodboardSync({ sendToGeneration: vi.fn(), persistence: fake.persistence }),
    );
    await settle();

    act(() => fake.setUserId(null));
    await settle();
    // An edit while signed out is kept locally with its durable "needs sync" flag.
    addBoardWithContent(library);
    await settle();
    expect(fake.saveBoard).not.toHaveBeenCalled();

    act(() => fake.setUserId("user-1"));
    // Past the autosave debounce: the backlog goes up without anyone pressing Save.
    await settle(5000);

    expect(fake.saveBoard).toHaveBeenCalledTimes(1);
  });

  it("does not push while logged out", async () => {
    // Control: nothing leaves the machine without an account.
    const { sync, library } = await loadModules();
    const fake = createFakeAdapter("user-1");
    const { result } = renderHook(() =>
      sync.useMoodboardSync({ sendToGeneration: vi.fn(), persistence: fake.persistence }),
    );
    await settle();

    act(() => fake.setUserId(null));
    await settle();
    addBoardWithContent(library);
    act(() => result.current.saveNow());
    await settle(5000);

    expect(fake.saveBoard).not.toHaveBeenCalled();
  });
});
