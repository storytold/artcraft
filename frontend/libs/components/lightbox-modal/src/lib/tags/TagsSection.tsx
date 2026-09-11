import { useEffect, useMemo, useRef, useState } from "react";
import { TagIcon } from "lucide-react";
import {
  TagsApi,
  UsersApi,
  type TagDetails,
  type UserInfo,
} from "@storyteller/api";
import { toast } from "@storyteller/ui-toaster";
import { TagChipInput, type TagSuggestion } from "./TagChipInput";

export interface TagsSectionProps {
  mediaToken?: string | null;
  creator?: UserInfo | null;
  /**
   * The logged-in username when the host app already knows it (string =
   * user, null = logged out). Left undefined, the section resolves the
   * session itself (cached module-wide).
   */
  currentUsername?: string | null;
  /**
   * Autocomplete suggestions supplied by the host app (e.g. the webapp's
   * tags store). Left undefined, the section fetches the user's tags itself.
   */
  suggestions?: TagSuggestion[];
  /** Canonical tags after every successful save (fresh use counts). */
  onSaved?: (tags: TagDetails[]) => void;
}

/** A queued save: the full desired tag set for one media file. */
interface PendingSave {
  token: string;
  values: string[];
}

// Session + own-tags lookups are module-cached so reopening the lightbox
// doesn't refetch (only used when the host doesn't supply the data).
let cachedUsername: string | null | undefined;
let usernameInFlight: Promise<string | null> | null = null;

const resolveSessionUsername = (): Promise<string | null> => {
  if (cachedUsername !== undefined) return Promise.resolve(cachedUsername);
  if (!usernameInFlight) {
    usernameInFlight = new UsersApi()
      .GetSession()
      .then((res) => {
        cachedUsername =
          res.success && res.data?.loggedIn && res.data.user
            ? res.data.user.username
            : null;
        return cachedUsername;
      })
      .catch(() => {
        usernameInFlight = null;
        return null;
      });
  }
  return usernameInFlight;
};

/**
 * The "Tags" section of the media details panel. Fetches the file's tags,
 * lets the owner edit them as chips (with autocomplete over their existing
 * tags), and renders read-only chips for everyone else. Hidden entirely for
 * non-owners when the file has no tags.
 *
 * Saves send one snapshot `SetMediaFileTags` per commit, serialized and
 * coalesced: while a call is in flight only the latest desired tag set is
 * remembered, so rapid edits collapse into a single follow-up request and
 * add/remove can never interleave.
 */
export function TagsSection({
  mediaToken,
  creator,
  currentUsername,
  suggestions,
  onSaved,
}: TagsSectionProps) {
  const tagsApi = useMemo(() => new TagsApi(), []);

  // Session: prop wins; otherwise resolve (and cache) it ourselves.
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(null);
  useEffect(() => {
    if (currentUsername !== undefined) return;
    let cancelled = false;
    resolveSessionUsername().then((username) => {
      if (!cancelled) setResolvedUsername(username);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUsername]);
  const effectiveUsername = currentUsername ?? resolvedUsername;
  const isOwner =
    !!effectiveUsername &&
    !!creator?.username &&
    creator.username === effectiveUsername;

  // null until the first fetch resolves — the section doesn't render (and
  // can't be edited) before we know the file's current tags.
  const [tags, setTags] = useState<TagDetails[] | null>(null);
  const mediaTokenRef = useRef(mediaToken);
  mediaTokenRef.current = mediaToken;
  /** Last server-confirmed tag set — the revert target on save failure. */
  const lastAckedRef = useRef<TagDetails[]>([]);
  const pendingRef = useRef<PendingSave | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    setTags(null);
    lastAckedRef.current = [];
    pendingRef.current = null;
    if (!mediaToken) return;
    let cancelled = false;
    tagsApi.ListMediaFileTags({ mediaFileToken: mediaToken }).then((res) => {
      if (cancelled) return;
      const fetched = res.success && res.data ? res.data : [];
      setTags(fetched);
      lastAckedRef.current = fetched;
    });
    return () => {
      cancelled = true;
    };
  }, [mediaToken, tagsApi]);

  // Autocomplete fallback: when the host doesn't supply suggestions, fetch
  // the user's tags once per mount (merged with canonical tags after saves).
  const [ownTags, setOwnTags] = useState<TagSuggestion[]>([]);
  const ownTagsLoadedRef = useRef(false);
  useEffect(() => {
    if (suggestions !== undefined || !isOwner || ownTagsLoadedRef.current) {
      return;
    }
    ownTagsLoadedRef.current = true;
    let cancelled = false;
    (async () => {
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
      if (cancelled) return;
      setOwnTags(
        all
          .sort(
            (a, b) =>
              b.use_count - a.use_count ||
              a.tag_value_lowercase.localeCompare(b.tag_value_lowercase),
          )
          .map((t) => ({ value: t.tag_value, useCount: t.use_count })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [suggestions, isOwner, tagsApi]);

  const effectiveSuggestions = suggestions ?? ownTags;

  const runQueue = async () => {
    savingRef.current = true;
    while (pendingRef.current) {
      const { token, values } = pendingRef.current;
      pendingRef.current = null;
      const res = await tagsApi.SetMediaFileTags({
        mediaFileToken: token,
        tags: values,
      });
      if (res.success && res.data) {
        onSaved?.(res.data.tags);
        if (suggestions === undefined && res.data.tags.length > 0) {
          // Keep the self-fetched suggestion list fresh with new tags.
          setOwnTags((prev) => {
            const known = new Set(prev.map((s) => s.value.toLowerCase()));
            const added = res.data!.tags
              .filter((t) => !known.has(t.tag_value_lowercase))
              .map((t) => ({ value: t.tag_value, useCount: t.use_count }));
            return added.length > 0 ? [...prev, ...added] : prev;
          });
        }
        if (mediaTokenRef.current === token) {
          lastAckedRef.current = res.data.tags;
          // Don't clobber newer optimistic chips a queued edit represents.
          if (!pendingRef.current) setTags(res.data.tags);
        }
      } else {
        toast.error(res.errorMessage || "Failed to save tags.");
        if (mediaTokenRef.current === token) {
          pendingRef.current = null;
          setTags(lastAckedRef.current);
        }
      }
    }
    savingRef.current = false;
  };

  const enqueueSave = (values: string[]) => {
    if (!mediaToken) return;
    pendingRef.current = { token: mediaToken, values };
    if (!savingRef.current) void runQueue();
  };

  const handleAdd = (values: string[]) => {
    const next = [
      ...(tags ?? []),
      ...values.map((value) => ({
        tag_token: "",
        tag_value: value,
        tag_value_lowercase: value.toLowerCase(),
        use_count: 0,
      })),
    ];
    setTags(next);
    enqueueSave(next.map((t) => t.tag_value));
  };

  const handleRemove = (value: string) => {
    const next = (tags ?? []).filter((t) => t.tag_value !== value);
    setTags(next);
    enqueueSave(next.map((t) => t.tag_value));
  };

  const handleClear = () => {
    setTags([]);
    enqueueSave([]);
  };

  if (!mediaToken || tags === null) return null;
  if (!isOwner && tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-base-fg/60">
          <TagIcon />
          <span>Tags</span>
        </div>
        {isOwner && tags.length >= 2 && (
          <button
            onClick={handleClear}
            className="text-xs text-base-fg/60 hover:text-base-fg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <TagChipInput
        chips={tags.map((t) => t.tag_value)}
        suggestions={effectiveSuggestions}
        disabled={!isOwner}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </div>
  );
}
