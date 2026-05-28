// Partial bookmarks barrel — non-React utilities + the TimelineBookmarksRow
// UI component (ported with the Timeline UI subsystem). The React hooks
// (useBookmarkDrag) and preview-overlay-source land in a later batch.

export {
  findBookmarkIndex,
  isBookmarkAtTime,
  toggleBookmarkInArray,
  removeBookmarkFromArray,
  updateBookmarkInArray,
  moveBookmarkInArray,
  getFrameTime,
  getBookmarkAtTime,
  getBookmarksActiveAtTime,
} from "./utils";
export { getBookmarkSnapPoints } from "./snap-source";
export { TimelineBookmarksRow } from "./components/bookmarks";
// TODO: useBookmarkDrag + BookmarkDragState belong to the hooks port (parallel agent).
// Once available, re-export from "./hooks/use-bookmark-drag".

