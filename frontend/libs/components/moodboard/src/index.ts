// Public API for @storyteller/ui-moodboard

// Components — each platform supplies a MoodboardAdapter.
// MoodboardWorkspace is the full surface (Grid + freeform Konva Canvas + Present);
// the individual views are also exported for apps that want to compose their own.
export { MoodboardWorkspace } from "./lib/MoodboardWorkspace";
export { BoardGridView as MoodboardGrid } from "./lib/grid/BoardGridView";
export { PresentationView as MoodboardPresentation } from "./lib/grid/PresentationView";

// Stores + selectors. useMoodboardStore is the Konva canvas runtime state
// (separate from the durable board model in useBoardLibraryStore).
export { useBoardLibraryStore } from "./lib/boards/BoardLibraryStore";
export { useMoodboardStore } from "./lib/canvas/MoodboardStore";
export {
  useActiveBoard,
  filterItems,
  collectTags,
} from "./lib/boards/boardSelectors";

// Adapter (platform seams)
export type {
  MoodboardAdapter,
  MoodboardReference,
  MoodboardPickedItem,
  MoodboardLibraryPickerProps,
} from "./lib/adapter";

// Board model types
export type {
  Board,
  BoardItem,
  BoardImageItem,
  BoardVideoItem,
  BoardTextItem,
  BoardLinkItem,
  BoardColorItem,
  BoardSection,
  BoardItemKind,
  ViewMode,
  GridDensity,
} from "./lib/boards/boardTypes";
