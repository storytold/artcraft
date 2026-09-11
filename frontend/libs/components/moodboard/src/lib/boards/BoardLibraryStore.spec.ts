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
