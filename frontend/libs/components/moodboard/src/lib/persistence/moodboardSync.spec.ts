import { act, cleanup, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import type { MoodboardPersistenceAdapter } from "../adapter";

const TOMBSTONE_STORAGE_KEY = "artcraft_moodboard_deleted_tokens_v1";

describe("moodboard deletion during a save", () => {
  let sync: typeof import("./moodboardSync");
  let library: typeof import("../boards/BoardLibraryStore").useBoardLibraryStore;
  let persistence: MoodboardPersistenceAdapter;
  let removeRemote: Mock<(token: string) => Promise<boolean>>;
  let finishSave: (result: { success: boolean; token?: string }) => void;
  let pageHideListeners: EventListener[];

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    localStorage.clear();
    pageHideListeners = [];
    const addEventListener = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation(
      (type, listener, options) => {
        if (type === "pagehide")
          pageHideListeners.push(listener as EventListener);
        addEventListener(type, listener, options);
      },
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    sync = await import("./moodboardSync");
    library = (await import("../boards/BoardLibraryStore"))
      .useBoardLibraryStore;
    removeRemote = vi.fn().mockResolvedValue(true);
    persistence = {
      getUserId: () => "user-1",
      listBoards: vi.fn().mockResolvedValue({ success: true, boards: [] }),
      loadBoard: vi.fn(),
      saveBoard: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            finishSave = resolve;
          }),
      ),
      deleteBoard: removeRemote,
    };
  });

  afterEach(() => {
    cleanup();
    for (const listener of pageHideListeners) {
      window.removeEventListener("pagehide", listener);
    }
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("deletes the remote row created after its local board was deleted", async () => {
    const boardId = await startSave();

    await act(async () => {
      await sync.deleteBoardEverywhere(boardId);
    });
    expect(persistence.deleteBoard).not.toHaveBeenCalled();
    await act(async () => {
      finishSave({ success: true, token: "remote-1" });
    });

    expect(library.getState().boards[boardId]).toBeUndefined();
    expect(persistence.deleteBoard).toHaveBeenCalledExactlyOnceWith("remote-1");
    expect(readTombstones()).toEqual([]);
  });

  it.each(["failure", "rejection", "unsupported"])(
    "keeps a durable tombstone when remote deletion ends in %s",
    async (outcome) => {
      if (outcome === "failure") removeRemote.mockResolvedValue(false);
      if (outcome === "rejection")
        removeRemote.mockRejectedValue(new Error("offline"));
      if (outcome === "unsupported") persistence.deleteBoard = undefined;
      const boardId = await startSave();

      await act(async () => {
        await sync.deleteBoardEverywhere(boardId);
      });
      await act(async () => {
        finishSave({ success: true, token: "remote-1" });
      });

      expect(library.getState().boards[boardId]).toBeUndefined();
      expect(readTombstones()).toEqual(["remote-1"]);
    },
  );

  it("does not delete a board that still exists when its save completes", async () => {
    const boardId = await startSave();

    await act(async () => {
      finishSave({ success: true, token: "remote-1" });
    });

    expect(library.getState().boards[boardId].remoteToken).toBe("remote-1");
    expect(library.getState().boards[boardId].needsSync).toBe(false);
    expect(persistence.deleteBoard).not.toHaveBeenCalled();
    expect(readTombstones()).toEqual([]);
  });

  it("repeats deletion if an update finishes after a linked board was deleted", async () => {
    const boardId = await startSave("existing-remote");

    await act(async () => {
      await sync.deleteBoardEverywhere(boardId);
    });
    expect(persistence.deleteBoard).toHaveBeenCalledExactlyOnceWith(
      "existing-remote",
    );
    // Updates need not return a token; the original board already has it.
    await act(async () => {
      finishSave({ success: true });
    });

    expect(persistence.deleteBoard).toHaveBeenCalledTimes(2);
    expect(persistence.deleteBoard).toHaveBeenLastCalledWith("existing-remote");
    expect(readTombstones()).toEqual([]);
  });

  it.each([true, false])(
    "does not restore a tombstoned board from the pre-delete listing (retry succeeds: %s)",
    async (deleted) => {
      localStorage.setItem(TOMBSTONE_STORAGE_KEY, JSON.stringify(["remote-1"]));
      vi.mocked(persistence.listBoards).mockResolvedValue({
        success: true,
        boards: [
          {
            token: "remote-1",
            name: "Deleted board",
            updatedAt: "2026-10-19T00:00:00Z",
          },
        ],
      });
      removeRemote.mockResolvedValue(deleted);
      vi.mocked(persistence.loadBoard).mockResolvedValue({
        success: true,
        documentJson: JSON.stringify({
          version: 1,
          board: { name: "Deleted board" },
        }),
      });

      renderHook(() =>
        sync.useMoodboardSync({
          sendToGeneration: () => undefined,
          persistence,
        }),
      );
      await act(async () => undefined);

      expect(persistence.deleteBoard).toHaveBeenCalledExactlyOnceWith(
        "remote-1",
      );
      expect(persistence.loadBoard).not.toHaveBeenCalled();
      expect(library.getState().boardOrder).toEqual([]);
      expect(readTombstones()).toEqual(deleted ? [] : ["remote-1"]);
    },
  );

  async function startSave(remoteToken?: string): Promise<string> {
    const boardId = library.getState().createBoard("Draft");
    if (remoteToken)
      library.getState().setBoardRemoteToken(boardId, remoteToken);
    const hook = renderHook(() =>
      sync.useMoodboardSync({
        sendToGeneration: () => undefined,
        persistence,
      }),
    );
    // Finish the initial empty remote listing before starting a manual save.
    await act(async () => undefined);
    act(() => hook.result.current.saveNow());
    expect(persistence.saveBoard).toHaveBeenCalledTimes(1);
    return boardId;
  }

  function readTombstones(): string[] {
    return JSON.parse(localStorage.getItem(TOMBSTONE_STORAGE_KEY) ?? "[]");
  }
});
