import { create } from "zustand";
import {
  FoldersApi,
  MediaFilesApi,
  type FolderInfo,
  type FolderMediaFileListItem,
} from "@storyteller/api";
import type { GalleryItem } from "@storyteller/ui-gallery-modal";
import {
  mapFolderInfo,
  galleryItemToCollageUrl,
  mergeCollageUrls,
} from "@storyteller/ui-gallery-modal";
import { getMediaThumbnail, THUMBNAIL_SIZES } from "@storyteller/common";
import { toast } from "../../components/toast/toast";

// ── Types ──────────────────────────────────────────────────────────────────

/** Folder shape the UI navigates + renders by. */
export interface UiFolder {
  id: string;
  name: string;
  parentId: string | null;
  hasStar?: boolean;
  colorCode?: string | null;
  coverUrl?: string | null;
  collageUrls?: string[];
}

interface LibraryFoldersState {
  folders: UiFolder[];
  foldersLoaded: boolean;
  activeFolderId: string | null;
  /** Resolved media items per folder, cached so reopening is instant. */
  folderMediaItems: Record<string, GalleryItem[]>;
  folderContentLoading: boolean;
  /** Bottom spinner while paginating the open folder's media. */
  folderLoadingMore: boolean;
  /** Whether the open folder has more media pages to load. */
  folderHasMore: Record<string, boolean>;
  // Dialog state — rendered by the library page, triggered from sidebar or page.
  newFolderModal: { open: boolean; parentId: string | null };
  renameTarget: string | null;
  contextMenu: { folderId: string; x: number; y: number } | null;

  loadFolders: () => Promise<void>;
  setActiveFolder: (id: string | null) => void;
  loadFolderMedia: (folderId: string, reset?: boolean) => Promise<void>;
  createFolder: (name: string, parentId: string | null) => Promise<void>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  setFolderStar: (folderId: string, hasStar: boolean) => Promise<void>;
  setFolderColor: (folderId: string, colorCode: string | null) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  addMediaToFolder: (
    itemIds: string[],
    folderId: string,
    known: GalleryItem[],
  ) => Promise<void>;
  moveMediaToFolder: (
    itemIds: string[],
    sourceFolderId: string,
    targetFolderId: string,
    known: GalleryItem[],
  ) => Promise<void>;
  removeMediaFromFolder: (
    itemIds: string[],
    folderId: string,
  ) => Promise<void>;
  openNewFolderModal: (parentId: string | null) => void;
  closeNewFolderModal: () => void;
  setRenameTarget: (folderId: string | null) => void;
  setContextMenu: (
    menu: { folderId: string; x: number; y: number } | null,
  ) => void;
}

// ── Singletons + mappers ────────────────────────────────────────────────────

const foldersApi = new FoldersApi();
const mediaFilesApi = new MediaFilesApi();

// Folder media is paginated via cursor; one scroll page at a time.
const FOLDER_PAGE_SIZE = 60;
// Non-reactive per-folder cursor + in-flight guard (singleton store).
const folderCursors: Record<string, string | undefined> = {};
const folderInFlight: Record<string, boolean> = {};

const getLabel = (item: any): string => {
  if (item.maybe_title) return item.maybe_title;
  switch (item.media_class) {
    case "image":
      return "Image Generation";
    case "video":
      return "Video Generation";
    case "dimensional":
      return "3D Mesh";
    default:
      return "Generation";
  }
};

/** Map a raw user-media list row (origin_category shape) → GalleryItem (root library). */
export function mapRawToGalleryItem(item: any): GalleryItem {
  const thumbnail =
    item.media_class === "dimensional"
      ? (item.cover_image?.maybe_cover_image_public_bucket_url ?? null)
      : getMediaThumbnail(item.media_links, item.media_class, {
          size: THUMBNAIL_SIZES.LARGE,
        });
  return {
    id: item.token,
    label: getLabel(item),
    thumbnail,
    thumbnailUrlTemplate: item.media_links?.maybe_thumbnail_template,
    fullImage: item.media_links?.cdn_url ?? null,
    createdAt: item.created_at,
    mediaClass: item.media_class || "image",
    isUpload: item.origin_category === "upload",
    batchImageToken: item.maybe_batch_token,
  };
}

/** Map a `FolderMediaFileListItem` → GalleryItem (folder view; carries media_links inline). */
function mapFolderListItemToGalleryItem(
  item: FolderMediaFileListItem,
): GalleryItem {
  const thumbnail =
    item.media_class === "dimensional"
      ? (item.cover_image?.maybe_cover_image_public_bucket_url ?? null)
      : getMediaThumbnail(item.media_links, item.media_class, {
          size: THUMBNAIL_SIZES.LARGE,
        });
  return {
    id: item.token,
    label: getLabel(item),
    thumbnail,
    thumbnailUrlTemplate: item.media_links?.maybe_thumbnail_template ?? undefined,
    fullImage: item.media_links?.cdn_url ?? null,
    createdAt: item.created_at,
    mediaClass: item.media_class || "image",
    isUpload: !!item.is_user_upload,
    batchImageToken: item.maybe_batch_token ?? undefined,
  };
}

// Shared API-folder → UI-folder mapper (UiFolder ≡ GalleryFolder; coalesce
// parentId so the optional GalleryFolder field satisfies UiFolder).
const mapFolder = (f: FolderInfo): UiFolder => {
  const g = mapFolderInfo(f);
  return { ...g, parentId: g.parentId ?? null };
};

const errMsg = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

// NB: only `collageUrls` is touched — `coverUrl` is the user's *custom* cover
// (`maybe_custom_cover_thumbnail`) and must never be derived from the collage,
// or the chip would render one full-bleed image instead of the 2×2 grid.

/** Prepend added items' still-thumbnails to a folder's auto collage (optimistic). */
const withBumpedCollage = (
  folders: UiFolder[],
  folderId: string,
  items: GalleryItem[],
): UiFolder[] =>
  folders.map((f) =>
    f.id === folderId
      ? {
          ...f,
          collageUrls: mergeCollageUrls(
            f.collageUrls,
            items.map(galleryItemToCollageUrl),
          ),
        }
      : f,
  );

/** Drop removed items' thumbnails from a folder's auto collage. */
const withDroppedCollage = (
  folders: UiFolder[],
  folderId: string,
  removeUrls: Set<string>,
): UiFolder[] =>
  folders.map((f) =>
    f.id === folderId
      ? { ...f, collageUrls: (f.collageUrls ?? []).filter((u) => !removeUrls.has(u)) }
      : f,
  );

const collageUrlSet = (items: GalleryItem[]): Set<string> =>
  new Set(
    items.map(galleryItemToCollageUrl).filter((u): u is string => !!u),
  );

// ── Store ───────────────────────────────────────────────────────────────────

export const useLibraryFoldersStore = create<LibraryFoldersState>(
  (set, get) => ({
    folders: [],
    foldersLoaded: false,
    activeFolderId: null,
    folderMediaItems: {},
    folderContentLoading: false,
    folderLoadingMore: false,
    folderHasMore: {},
    newFolderModal: { open: false, parentId: null },
    renameTarget: null,
    contextMenu: null,

    loadFolders: async () => {
      try {
        const all: FolderInfo[] = [];
        let cursor: string | undefined = undefined;
        for (let page = 0; page < 50; page++) {
          const res = await foldersApi.ListAllFolders({ cursor });
          if (!res.success || !res.data) break;
          all.push(...res.data);
          const next = res.pagination?.maybe_cursor;
          if (!next) break;
          cursor = next ?? undefined;
        }
        set({ folders: all.map(mapFolder), foldersLoaded: true });
      } catch (err) {
        console.error("Failed to load folders:", err);
        set({ foldersLoaded: true });
      }
    },

    setActiveFolder: (id) => {
      set({ activeFolderId: id, contextMenu: null });
      if (id) get().loadFolderMedia(id, true);
    },

    // Resolve a folder's media one cursor page at a time. `reset` starts over.
    loadFolderMedia: async (folderId, reset = false) => {
      if (folderInFlight[folderId]) return;
      if (!reset && get().folderHasMore[folderId] === false) return;
      folderInFlight[folderId] = true;
      if (reset) {
        folderCursors[folderId] = undefined;
        set((s) => ({
          folderContentLoading: true,
          folderHasMore: { ...s.folderHasMore, [folderId]: true },
        }));
      } else {
        set({ folderLoadingMore: true });
      }
      try {
        const listRes = await foldersApi.ListFolderMediaFiles({
          folderToken: folderId,
          query: {
            cursor: reset ? undefined : folderCursors[folderId],
            limit: FOLDER_PAGE_SIZE,
          },
        });
        if (!listRes.success || !listRes.data) return;
        const nextCursor = listRes.pagination?.maybe_cursor ?? undefined;
        folderCursors[folderId] = nextCursor;
        // The list item carries media_links/cover, so map directly — no batch-get.
        const ordered = listRes.data.map(mapFolderListItemToGalleryItem);
        set((s) => {
          const existing = reset ? [] : (s.folderMediaItems[folderId] ?? []);
          const seen = new Set(existing.map((i) => i.id));
          const merged = [
            ...existing,
            ...ordered.filter((i) => !seen.has(i.id)),
          ];
          return {
            folderMediaItems: { ...s.folderMediaItems, [folderId]: merged },
            folderHasMore: { ...s.folderHasMore, [folderId]: !!nextCursor },
          };
        });
      } catch (err) {
        console.error("Failed to load folder media:", err);
      } finally {
        folderInFlight[folderId] = false;
        set({ folderContentLoading: false, folderLoadingMore: false });
      }
    },

    createFolder: async (name, parentId) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        const res = await foldersApi.CreateFolder({
          name: trimmed,
          maybe_parent_folder_token: parentId,
        });
        if (res.success && res.data) {
          set((s) => ({ folders: [...s.folders, mapFolder(res.data!)] }));
        } else {
          toast.error(res.errorMessage || "Failed to create folder.");
        }
      } catch (err) {
        toast.error(`Failed to create folder: ${errMsg(err)}`);
      }
    },

    renameFolder: async (folderId, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      set((s) => ({
        folders: s.folders.map((f) =>
          f.id === folderId ? { ...f, name: trimmed } : f,
        ),
      }));
      try {
        const res = await foldersApi.RenameFolder({
          folderToken: folderId,
          newName: trimmed,
        });
        if (!res.success) {
          toast.error(res.errorMessage || "Failed to rename folder.");
          get().loadFolders();
        }
      } catch (err) {
        toast.error(`Failed to rename folder: ${errMsg(err)}`);
        get().loadFolders();
      }
    },

    setFolderStar: async (folderId, hasStar) => {
      set((s) => ({
        folders: s.folders.map((f) =>
          f.id === folderId ? { ...f, hasStar } : f,
        ),
      }));
      try {
        const res = await foldersApi.SetStar({ folderToken: folderId, hasStar });
        if (!res.success) {
          toast.error(res.errorMessage || "Failed to update folder.");
          get().loadFolders();
        }
      } catch (err) {
        toast.error(`Failed to update folder: ${errMsg(err)}`);
        get().loadFolders();
      }
    },

    setFolderColor: async (folderId, colorCode) => {
      set((s) => ({
        folders: s.folders.map((f) =>
          f.id === folderId ? { ...f, colorCode } : f,
        ),
      }));
      try {
        const res = await foldersApi.SetColorCode({
          folderToken: folderId,
          colorCode,
        });
        if (!res.success) {
          toast.error(res.errorMessage || "Failed to update folder color.");
          get().loadFolders();
        }
      } catch (err) {
        toast.error(`Failed to update folder color: ${errMsg(err)}`);
        get().loadFolders();
      }
    },

    deleteFolder: async (folderId) => {
      const folder = get().folders.find((f) => f.id === folderId);
      // Optimistic: drop the folder and reparent its direct children to root
      // (mirrors the server orphaning them), and forget its media cache.
      set((s) => {
        const nextMedia = { ...s.folderMediaItems };
        delete nextMedia[folderId];
        return {
          folders: s.folders
            .filter((f) => f.id !== folderId)
            .map((f) => (f.parentId === folderId ? { ...f, parentId: null } : f)),
          folderMediaItems: nextMedia,
          activeFolderId:
            s.activeFolderId === folderId
              ? (folder?.parentId ?? null)
              : s.activeFolderId,
        };
      });
      try {
        const res = await foldersApi.DeleteFolder({ folderToken: folderId });
        if (!res.success) {
          toast.error(res.errorMessage || "Failed to delete folder.");
        }
      } catch (err) {
        toast.error(`Failed to delete folder: ${errMsg(err)}`);
      }
      get().loadFolders();
    },

    addMediaToFolder: async (itemIds, folderId, known) => {
      if (itemIds.length === 0) return;
      const knownById = new Map(known.map((it) => [it.id, it] as const));
      const addedItems = itemIds
        .map((id) => knownById.get(id))
        .filter((it): it is GalleryItem => !!it);
      set((s) => {
        const folders = withBumpedCollage(s.folders, folderId, addedItems);
        const existing = s.folderMediaItems[folderId];
        if (!existing) return { folders }; // media not loaded → fetched on open
        const seen = new Set(existing.map((i) => i.id));
        const fresh = addedItems.filter((i) => !seen.has(i.id));
        return {
          folders,
          folderMediaItems: fresh.length
            ? { ...s.folderMediaItems, [folderId]: [...fresh, ...existing] }
            : s.folderMediaItems,
        };
      });
      try {
        const res = await foldersApi.AddMediaFiles({
          folderToken: folderId,
          mediaFileTokens: itemIds,
        });
        if (res.success) {
          const name =
            get().folders.find((f) => f.id === folderId)?.name ?? "folder";
          toast.success(
            `Added ${itemIds.length} item${itemIds.length === 1 ? "" : "s"} to ${name}`,
          );
        } else {
          toast.error(res.errorMessage || "Failed to add to folder.");
        }
      } catch (err) {
        toast.error(`Failed to add to folder: ${errMsg(err)}`);
      }
    },

    moveMediaToFolder: async (itemIds, source, target, known) => {
      if (itemIds.length === 0) return;
      const knownById = new Map(known.map((it) => [it.id, it] as const));
      const movedItems = itemIds
        .map((id) => knownById.get(id))
        .filter((it): it is GalleryItem => !!it);
      const idSet = new Set(itemIds);
      const movedUrls = collageUrlSet(movedItems);
      set((s) => {
        const fmi = { ...s.folderMediaItems };
        if (fmi[source]) {
          fmi[source] = fmi[source].filter((it) => !idSet.has(it.id));
        }
        if (fmi[target]) {
          const seen = new Set(fmi[target].map((i) => i.id));
          fmi[target] = [
            ...movedItems.filter((i) => !seen.has(i.id)),
            ...fmi[target],
          ];
        }
        let folders = withBumpedCollage(s.folders, target, movedItems);
        folders = withDroppedCollage(folders, source, movedUrls);
        return { folderMediaItems: fmi, folders };
      });
      try {
        const res = await foldersApi.MoveMediaFiles({
          folderToken: target,
          sourceFolderToken: source,
          mediaFileTokens: itemIds,
        });
        if (res.success) {
          const name =
            get().folders.find((f) => f.id === target)?.name ?? "folder";
          toast.success(
            `Moved ${itemIds.length} item${itemIds.length === 1 ? "" : "s"} to ${name}`,
          );
        } else {
          toast.error(res.errorMessage || "Failed to move items.");
          get().loadFolders();
        }
      } catch (err) {
        toast.error(`Failed to move items: ${errMsg(err)}`);
        get().loadFolders();
      }
    },

    removeMediaFromFolder: async (itemIds, folderId) => {
      if (itemIds.length === 0) return;
      const idSet = new Set(itemIds);
      const existing = get().folderMediaItems[folderId] ?? [];
      const removedUrls = collageUrlSet(
        existing.filter((it) => idSet.has(it.id)),
      );
      set((s) => ({
        folderMediaItems: s.folderMediaItems[folderId]
          ? {
              ...s.folderMediaItems,
              [folderId]: s.folderMediaItems[folderId].filter(
                (it) => !idSet.has(it.id),
              ),
            }
          : s.folderMediaItems,
        folders: withDroppedCollage(s.folders, folderId, removedUrls),
      }));
      try {
        const res = await foldersApi.RemoveMediaFiles({
          folderToken: folderId,
          mediaFileTokens: itemIds,
        });
        if (!res.success) {
          toast.error(res.errorMessage || "Failed to remove from folder.");
          get().loadFolders();
        }
      } catch (err) {
        toast.error(`Failed to remove from folder: ${errMsg(err)}`);
        get().loadFolders();
      }
    },

    openNewFolderModal: (parentId) =>
      set({ newFolderModal: { open: true, parentId }, contextMenu: null }),
    closeNewFolderModal: () =>
      set({ newFolderModal: { open: false, parentId: null } }),
    setRenameTarget: (folderId) => set({ renameTarget: folderId, contextMenu: null }),
    setContextMenu: (menu) => set({ contextMenu: menu }),
  }),
);

/** Delete a media file and drop it from any cached folder views. */
export async function deleteLibraryMedia(mediaToken: string): Promise<boolean> {
  try {
    const res = await mediaFilesApi.DeleteMediaFileByToken({
      mediaFileToken: mediaToken,
      asMod: false,
    });
    if (res.success) {
      useLibraryFoldersStore.setState((s) => {
        const next: Record<string, GalleryItem[]> = {};
        for (const [k, items] of Object.entries(s.folderMediaItems)) {
          next[k] = items.filter((it) => it.id !== mediaToken);
        }
        return { folderMediaItems: next };
      });
    }
    return res.success;
  } catch (err) {
    console.error("Failed to delete media:", err);
    return false;
  }
}
