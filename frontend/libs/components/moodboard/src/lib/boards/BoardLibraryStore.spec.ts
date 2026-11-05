import { beforeEach, describe, expect, it } from "vitest";
import { useBoardLibraryStore } from "./BoardLibraryStore";

// Fresh store per test — clear persisted boards and any selection.
const reset = () => {
  useBoardLibraryStore.setState({
    boards: {},
    boardOrder: [],
    activeBoardId: null,
    selectedItemIds: new Set(),
  });
};

const seedItem = (boardId: string): string =>
  useBoardLibraryStore.getState().addTextItem(boardId, "note");

describe("BoardLibraryStore sections", () => {
  beforeEach(reset);

  it("creates, renames, and collapses a section", () => {
    const store = useBoardLibraryStore.getState();
    const boardId = store.createBoard("B");
    const sectionId = store.createSection(boardId, "Refs");

    let board = useBoardLibraryStore.getState().boards[boardId];
    expect(board.sections).toEqual([{ id: sectionId, name: "Refs" }]);

    store.renameSection(boardId, sectionId, "Hero shots");
    store.toggleSectionCollapsed(boardId, sectionId);
    board = useBoardLibraryStore.getState().boards[boardId];
    expect(board.sections[0].name).toBe("Hero shots");
    expect(board.sections[0].collapsed).toBe(true);
  });

  it("falls back to a default name for blank section names", () => {
    const store = useBoardLibraryStore.getState();
    const boardId = store.createBoard("B");
    const sectionId = store.createSection(boardId, "   ");
    const board = useBoardLibraryStore.getState().boards[boardId];
    expect(board.sections.find((s) => s.id === sectionId)?.name).toBe(
      "New section",
    );
  });

  it("assigns items into a section and back to ungrouped", () => {
    const store = useBoardLibraryStore.getState();
    const boardId = store.createBoard("B");
    const itemId = seedItem(boardId);
    const sectionId = store.createSection(boardId);

    store.assignItemsToSection(boardId, [itemId], sectionId);
    expect(
      useBoardLibraryStore.getState().boards[boardId].items[itemId].sectionId,
    ).toBe(sectionId);

    store.assignItemsToSection(boardId, [itemId], null);
    expect(
      useBoardLibraryStore.getState().boards[boardId].items[itemId].sectionId,
    ).toBeNull();
  });

  it("returns items to the ungrouped flow when their section is deleted", () => {
    const store = useBoardLibraryStore.getState();
    const boardId = store.createBoard("B");
    const itemId = seedItem(boardId);
    const sectionId = store.createSection(boardId);
    store.assignItemsToSection(boardId, [itemId], sectionId);

    store.deleteSection(boardId, sectionId);
    const board = useBoardLibraryStore.getState().boards[boardId];
    expect(board.sections).toHaveLength(0);
    expect(board.items[itemId].sectionId).toBeNull();
  });
});

describe("BoardLibraryStore deleteBoard selection", () => {
  beforeEach(reset);

  // The grid's selection bar shows "N selected" for whatever is in selectedItemIds, and its actions
  // (use as reference, group into section, delete) all act on the active board. The selection
  // belongs to the board it was made on: switching boards already clears it, so deleting the board
  // the selection was made on must not carry it over to the board that becomes active.
  it("clears the selection when the active board is deleted", () => {
    const store = useBoardLibraryStore.getState();
    const keepId = store.createBoard("Keep");
    const doomedId = store.createBoard("Doomed");
    const picked = [seedItem(doomedId), seedItem(doomedId)];
    store.setSelection(picked);
    expect(useBoardLibraryStore.getState().activeBoardId).toBe(doomedId);

    store.deleteBoard(doomedId);

    // Deleting the active board hands the workspace to the first remaining board...
    expect(useBoardLibraryStore.getState().activeBoardId).toBe(keepId);
    // ...and the two picked items are gone with their board, so nothing is selected any more.
    expect(useBoardLibraryStore.getState().selectedItemIds.size).toBe(0);
  });

  it("clears the selection when the only board is deleted", () => {
    const store = useBoardLibraryStore.getState();
    const onlyId = store.createBoard("Only");
    store.setSelection([seedItem(onlyId)]);

    store.deleteBoard(onlyId);

    expect(useBoardLibraryStore.getState().activeBoardId).toBeNull();
    expect(useBoardLibraryStore.getState().selectedItemIds.size).toBe(0);
  });

  it("keeps the selection when a board other than the active one is deleted", () => {
    // Control: the selection was made on the active board, which this delete does not touch.
    const store = useBoardLibraryStore.getState();
    const otherId = store.createBoard("Other");
    const activeId = store.createBoard("Active");
    const picked = seedItem(activeId);
    store.setSelection([picked]);

    store.deleteBoard(otherId);

    expect(useBoardLibraryStore.getState().activeBoardId).toBe(activeId);
    expect(Array.from(useBoardLibraryStore.getState().selectedItemIds)).toEqual([picked]);
  });

  it("clears the selection when switching boards (existing behavior)", () => {
    // Control: the rule deleteBoard has to match.
    const store = useBoardLibraryStore.getState();
    const firstId = store.createBoard("First");
    const secondId = store.createBoard("Second");
    store.setActiveBoard(firstId);
    store.setSelection([seedItem(firstId)]);

    store.setActiveBoard(secondId);

    expect(useBoardLibraryStore.getState().selectedItemIds.size).toBe(0);
  });
});
