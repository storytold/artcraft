import type { Bookmark } from "../types";
import type { SnapPoint } from "../snapping";
import type { MediaTime } from "../../wasm";

// Produces a snap point for each bookmark, optionally excluding one
// (used when dragging an existing bookmark — it shouldn't snap to its
// own home position).
export function getBookmarkSnapPoints({
  bookmarks,
  excludeBookmarkTime,
}: {
  bookmarks: Bookmark[];
  excludeBookmarkTime?: MediaTime;
}): SnapPoint[] {
  return bookmarks.flatMap((bookmark) => {
    if (excludeBookmarkTime != null && bookmark.time === excludeBookmarkTime) {
      return [];
    }

    return [
      { time: bookmark.time, type: "bookmark" satisfies SnapPoint["type"] },
    ];
  });
}
