import { getThumbnailUrl } from "@storyteller/common";

/** Minimal shape both the modal's `GalleryFolder` and the webapp's `UiFolder` satisfy. */
interface SortableFolder {
  name: string;
  hasStar?: boolean;
}

/** Sort order for folder lists: starred first, then alphabetical (case-insensitive). */
export const compareFolders = (a: SortableFolder, b: SortableFolder): number =>
  Number(!!b.hasStar) - Number(!!a.hasStar) ||
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/** Preset folder colors shown in the color picker (shared by both context menus). */
export const FOLDER_COLOR_PRESETS: string[] = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
];

/** A folder thumbnail descriptor from the API (cdn_url + optional resize template). */
interface FolderThumbLike {
  cdn_url: string;
  maybe_thumbnail_template?: string | null;
  media_class?: string;
}

/**
 * Resolve a folder thumbnail to a usable image url: the resize template if present,
 * otherwise the raw cdn url — except for video, whose `cdn_url` is the video file
 * itself (unrenderable in an `<img>`), so we return null rather than a broken tile.
 */
export const resolveFolderThumb = (
  thumb: FolderThumbLike | null | undefined,
  width: number,
): string | null => {
  if (!thumb) return null;
  const fromTemplate = getThumbnailUrl(thumb.maybe_thumbnail_template, { width });
  if (fromTemplate) return fromTemplate;
  if (thumb.media_class === "video") return null;
  return thumb.cdn_url;
};
