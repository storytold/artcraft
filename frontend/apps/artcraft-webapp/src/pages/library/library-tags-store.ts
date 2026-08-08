import { create } from "zustand";
import { TagsApi, type TagDetails } from "@storyteller/api";
import type { GalleryItem } from "@storyteller/ui-gallery-modal";
import { toast } from "../../components/toast/toast";
import { errMsg, mapLeanListItemToGalleryItem } from "./library-media-map";

// ── Types ──────────────────────────────────────────────────────────────────

/** Tag shape the UI navigates + renders by. */
export interface UiTag {
  token: string;
  value: string;
  /** Lowercased value — the tag's unique key within the account. */
  valueLower: string;
  /** How many media files currently carry this tag. */
  useCount: number;
}

interface LibraryTagsState {
  tags: UiTag[];
  tagsLoaded: boolean;
  activeTagToken: string | null;
  /** Resolved media items per tag, cached so reopening is instant. */
  tagMediaItems: Record<string, GalleryItem[]>;
  tagContentLoading: boolean;
  /** Bottom spinner while paginating the open tag's media. */
  tagLoadingMore: boolean;
  /** Whether the open tag has more media pages to load. */
  tagHasMore: Record<string, boolean>;
  // Dialog state — rendered by the library page, triggered from sidebar or page.
  renameTarget: string | null;
  contextMenu: { tagToken: string; x: number; y: number } | null;

  loadTags: () => Promise<void>;
  setActiveTag: (token: string | null) => void;
  loadTagMedia: (tagToken: string, reset?: boolean) => Promise<void>;
  renameTag: (tagToken: string, newValue: string) => Promise<void>;
  deleteTag: (tagToken: string) => Promise<void>;
  /** Add tags to many media files at once (bulk selection bar). */
  bulkAddTags: (mediaFileTokens: string[], tags: string[]) => Promise<boolean>;
  /** Drop cached media for tags whose contents changed; the open tag reloads. */
  invalidateTagMedia: (tagTokens: string[]) => void;
  /** Merge canonical tags returned by add/set calls (fresh use counts). */
  upsertTags: (tags: TagDetails[]) => void;
  setRenameTarget: (tagToken: string | null) => void;
  setContextMenu: (
    menu: { tagToken: string; x: number; y: number } | null,
  ) => void;
}

// ── Singletons + mappers ────────────────────────────────────────────────────

const tagsApi = new TagsApi();

// Tag media is paginated via cursor; one scroll page at a time.
const TAG_PAGE_SIZE = 60;
// Non-reactive per-tag cursor + in-flight guard (singleton store).
const tagCursors: Record<string, string | undefined> = {};
const tagInFlight: Record<string, boolean> = {};

const mapTag = (t: TagDetails): UiTag => ({
  token: t.tag_token,
  value: t.tag_value,
  valueLower: t.tag_value_lowercase,
  useCount: t.use_count,
});

/** Sort by use count (desc), ties alphabetically — sidebar / "Most used" order. */
export const compareTagsByUseCount = (a: UiTag, b: UiTag): number =>
  b.useCount - a.useCount || a.valueLower.localeCompare(b.valueLower);

// ── Store ───────────────────────────────────────────────────────────────────

export const useLibraryTagsStore = create<LibraryTagsState>((set, get) => ({
  tags: [],
  tagsLoaded: false,
  activeTagToken: null,
  tagMediaItems: {},
  tagContentLoading: false,
  tagLoadingMore: false,
  tagHasMore: {},
  renameTarget: null,
  contextMenu: null,

  loadTags: async () => {
    try {
      const all: TagDetails[] = [];
      let cursor: string | undefined = undefined;
      for (let page = 0; page < 50; page++) {
        const res = await tagsApi.ListTags({ cursor });
        if (!res.success || !res.data) break;
        all.push(...res.data);
        const next = res.pagination?.maybe_cursor;
        if (!next) break;
        cursor = next ?? undefined;
      }
      set({ tags: all.map(mapTag), tagsLoaded: true });
    } catch (err) {
      console.error("Failed to load tags:", err);
      set({ tagsLoaded: true });
    }
  },

  setActiveTag: (token) => {
    set({ activeTagToken: token, contextMenu: null });
    if (token) get().loadTagMedia(token, true);
  },

  // Resolve a tag's media one cursor page at a time. `reset` starts over.
  loadTagMedia: async (tagToken, reset = false) => {
    if (tagInFlight[tagToken]) return;
    if (!reset && get().tagHasMore[tagToken] === false) return;
    tagInFlight[tagToken] = true;
    if (reset) {
      tagCursors[tagToken] = undefined;
      set((s) => ({
        tagContentLoading: true,
        tagHasMore: { ...s.tagHasMore, [tagToken]: true },
      }));
    } else {
      set({ tagLoadingMore: true });
    }
    try {
      const listRes = await tagsApi.ListMediaFilesWithTag({
        tagToken,
        cursor: reset ? undefined : tagCursors[tagToken],
        limit: TAG_PAGE_SIZE,
      });
      if (!listRes.success || !listRes.data) return;
      const nextCursor = listRes.pagination?.maybe_cursor ?? undefined;
      tagCursors[tagToken] = nextCursor;
      const ordered = listRes.data.map(mapLeanListItemToGalleryItem);
      set((s) => {
        const existing = reset ? [] : (s.tagMediaItems[tagToken] ?? []);
        const seen = new Set(existing.map((i) => i.id));
        const merged = [...existing, ...ordered.filter((i) => !seen.has(i.id))];
        return {
          tagMediaItems: { ...s.tagMediaItems, [tagToken]: merged },
          tagHasMore: { ...s.tagHasMore, [tagToken]: !!nextCursor },
        };
      });
    } catch (err) {
      console.error("Failed to load tag media:", err);
    } finally {
      tagInFlight[tagToken] = false;
      set({ tagContentLoading: false, tagLoadingMore: false });
    }
  },

  renameTag: async (tagToken, newValue) => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    set((s) => ({
      tags: s.tags.map((t) =>
        t.token === tagToken
          ? { ...t, value: trimmed, valueLower: trimmed.toLowerCase() }
          : t,
      ),
    }));
    try {
      const res = await tagsApi.RenameTag({ tagToken, newTagValue: trimmed });
      if (!res.success) {
        toast.error(res.errorMessage || "Failed to rename tag.");
        get().loadTags();
      }
    } catch (err) {
      toast.error(`Failed to rename tag: ${errMsg(err)}`);
      get().loadTags();
    }
  },

  deleteTag: async (tagToken) => {
    // Optimistic: drop the tag and forget its media cache. Files keep living
    // in the library — only the links go away.
    set((s) => {
      const nextMedia = { ...s.tagMediaItems };
      delete nextMedia[tagToken];
      const nextHasMore = { ...s.tagHasMore };
      delete nextHasMore[tagToken];
      return {
        tags: s.tags.filter((t) => t.token !== tagToken),
        tagMediaItems: nextMedia,
        tagHasMore: nextHasMore,
        activeTagToken:
          s.activeTagToken === tagToken ? null : s.activeTagToken,
      };
    });
    try {
      const res = await tagsApi.DeleteTag({ tagToken });
      if (!res.success) {
        toast.error(res.errorMessage || "Failed to delete tag.");
        get().loadTags();
      }
    } catch (err) {
      toast.error(`Failed to delete tag: ${errMsg(err)}`);
      get().loadTags();
    }
  },

  bulkAddTags: async (mediaFileTokens, tags) => {
    try {
      const res = await tagsApi.BulkAddTags({ mediaFileTokens, tags });
      if (!res.success || !res.data) {
        toast.error(res.errorMessage || "Failed to add tags.");
        return false;
      }
      // Fresh use counts for the sidebar; tagged listings must refetch.
      get().upsertTags(res.data.tags);
      get().invalidateTagMedia(res.data.tags.map((t) => t.tag_token));
      const count = res.data.accepted_media_file_tokens.length;
      toast.success(`Tagged ${count} ${count === 1 ? "item" : "items"}`);
      return true;
    } catch (err) {
      toast.error(`Failed to add tags: ${errMsg(err)}`);
      return false;
    }
  },

  invalidateTagMedia: (tagTokens) => {
    if (tagTokens.length === 0) return;
    set((s) => {
      const nextMedia = { ...s.tagMediaItems };
      const nextHasMore = { ...s.tagHasMore };
      for (const token of tagTokens) {
        delete nextMedia[token];
        delete nextHasMore[token];
      }
      return { tagMediaItems: nextMedia, tagHasMore: nextHasMore };
    });
    const active = get().activeTagToken;
    if (active && tagTokens.includes(active)) get().loadTagMedia(active, true);
  },

  upsertTags: (incoming) => {
    if (incoming.length === 0) return;
    set((s) => {
      const byToken = new Map(s.tags.map((t) => [t.token, t]));
      for (const raw of incoming) {
        byToken.set(raw.tag_token, mapTag(raw));
      }
      return { tags: Array.from(byToken.values()) };
    });
  },

  setRenameTarget: (tagToken) =>
    set({ renameTarget: tagToken, contextMenu: null }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
}));
