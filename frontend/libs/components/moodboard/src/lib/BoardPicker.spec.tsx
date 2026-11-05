import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useBoardLibraryStore } from "./boards/BoardLibraryStore";
import { BoardPicker } from "./BoardPicker";

// Shared spies for the two persistence modules BoardPicker calls. vi.hoisted makes them available inside the
// vi.mock factories below (vi.mock calls are lifted above the imports).
const m = vi.hoisted(() => ({
  // deleteBoardEverywhere is the destructive call: it drops the board locally AND deletes the synced remote copy.
  deleteBoardEverywhere: vi.fn(async (_boardId: string) => undefined),
  // The canvas bridge calls BoardPicker makes after a switch / delete. The canvas itself is not under test.
  applyCanvasDocument: vi.fn(),
  getCanvasForBoard: vi.fn((_boardId: string) => ({ canvas: "next" })),
  switchActiveBoard: vi.fn(),
  createBoardAndSwitch: vi.fn(),
}));

// Replace the canvas bridge so no real canvas / persistence code runs.
vi.mock("./persistence/canvasBridge", () => ({
  applyCanvasDocument: m.applyCanvasDocument,
  getCanvasForBoard: m.getCanvasForBoard,
  switchActiveBoard: m.switchActiveBoard,
  createBoardAndSwitch: m.createBoardAndSwitch,
}));

// Replace the sync module so a delete is only recorded, never sent anywhere.
vi.mock("./persistence/moodboardSync", () => ({
  deleteBoardEverywhere: m.deleteBoardEverywhere,
}));

// What the desktop app really installs as window.confirm. The Tauri dialog plugin injects (tauri-plugin-dialog
// 2.7.1, src/init-iife.js):  window.confirm = async function (message) { return await invoke("plugin:dialog|confirm", ...) }
// so confirm() hands back a PROMISE, never a boolean. This stand-in is the best case for the old code: it resolves
// false, as if the person had pressed Cancel. A Promise is still truthy, so `!window.confirm(...)` is false.
const installDesktopConfirm = () => {
  window.confirm = vi.fn(async () => false) as unknown as typeof window.confirm;
};

// Seed two boards ("Alpha" is active) in the real zustand store and return their ids.
const seedBoards = () => {
  const store = useBoardLibraryStore.getState();
  const alphaId = store.createBoard("Alpha");
  const betaId = store.createBoard("Beta");
  useBoardLibraryStore.getState().setActiveBoard(alphaId);
  return { alphaId, betaId };
};

// Open the board dropdown by pressing the "Switch board" button.
const openPicker = () => {
  fireEvent.click(screen.getByRole("button", { name: "Switch board" }));
};

describe("BoardPicker delete", () => {
  beforeEach(() => {
    // Fresh store per test (the same reset the store's own spec uses), and fresh spies.
    useBoardLibraryStore.setState({
      boards: {},
      boardOrder: [],
      activeBoardId: null,
      selectedItemIds: new Set(),
    });
    vi.clearAllMocks();
    installDesktopConfirm();
  });
  afterEach(() => {
    cleanup();
  });

  it("asks before deleting: the trash button alone deletes nothing", async () => {
    const { alphaId } = seedBoards();
    render(<BoardPicker />);
    openPicker();

    // Press the trash button on "Beta" and let any async work settle.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete Beta" }));
    });

    // Nothing is deleted yet, and the person is shown the question.
    expect(m.deleteBoardEverywhere).not.toHaveBeenCalled();
    expect(screen.getByText(/Delete "Beta"\?/)).toBeTruthy();
    // Both boards are still in the library.
    expect(Object.keys(useBoardLibraryStore.getState().boards)).toHaveLength(2);
    expect(useBoardLibraryStore.getState().boards[alphaId]).toBeTruthy();
  });

  it("Cancel keeps the board and puts the row back", async () => {
    seedBoards();
    render(<BoardPicker />);
    openPicker();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete Beta" }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel deleting Beta" }));
    });

    // Nothing was deleted, the question is gone and the normal trash button is back.
    expect(m.deleteBoardEverywhere).not.toHaveBeenCalled();
    expect(screen.queryByText(/Delete "Beta"\?/)).toBeNull();
    expect(screen.getByRole("button", { name: "Delete Beta" })).toBeTruthy();
  });

  it("confirming deletes exactly the chosen board", async () => {
    const { betaId } = seedBoards();
    render(<BoardPicker />);
    openPicker();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete Beta" }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm deleting Beta" }));
    });

    // One delete, for the board the person chose, and the question is gone.
    expect(m.deleteBoardEverywhere).toHaveBeenCalledTimes(1);
    expect(m.deleteBoardEverywhere).toHaveBeenCalledWith(betaId);
    expect(screen.queryByText(/Delete "Beta"\?/)).toBeNull();
  });

  it("closing the picker drops a pending question instead of leaving it armed", async () => {
    seedBoards();
    render(<BoardPicker />);
    openPicker();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete Beta" }));
    });

    // Click somewhere else on the page: the picker closes (window pointerdown outside the picker).
    await act(async () => {
      fireEvent(document.body, new MouseEvent("pointerdown", { bubbles: true }));
    });
    // Open it again later.
    openPicker();

    // The old question must not still be waiting; nothing was deleted either.
    expect(screen.queryByText(/Delete "Beta"\?/)).toBeNull();
    expect(m.deleteBoardEverywhere).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete Beta" })).toBeTruthy();
  });

  it("after confirming the ACTIVE board, shows the canvas of the board that became active", async () => {
    const { alphaId, betaId } = seedBoards();
    // Make the mocked delete behave like the real one for the store: remove the board from the library.
    m.deleteBoardEverywhere.mockImplementationOnce(async (id: string) => {
      useBoardLibraryStore.getState().deleteBoard(id);
      return undefined;
    });
    render(<BoardPicker />);
    openPicker();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete Alpha" }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm deleting Alpha" }));
    });

    // Alpha was active, so the canvas must switch to whichever board the store made active (Beta).
    expect(m.deleteBoardEverywhere).toHaveBeenCalledWith(alphaId);
    expect(useBoardLibraryStore.getState().activeBoardId).toBe(betaId);
    expect(m.getCanvasForBoard).toHaveBeenCalledWith(betaId);
    expect(m.applyCanvasDocument).toHaveBeenCalledWith({ canvas: "next" });
  });
});
