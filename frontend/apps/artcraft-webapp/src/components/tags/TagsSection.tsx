import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag } from "@fortawesome/pro-solid-svg-icons";
import { TagsApi, type TagDetails, type UserInfo } from "@storyteller/api";
import { toast } from "../toast/toast";
import { useSession } from "../../lib/session";
import {
  compareTagsByUseCount,
  useLibraryTagsStore,
} from "../../pages/library/library-tags-store";
import { TagChipInput } from "./TagChipInput";

interface TagsSectionProps {
  mediaToken?: string | null;
  creator?: UserInfo | null;
}

/** A queued save: the full desired tag set for one media file. */
interface PendingSave {
  token: string;
  values: string[];
}

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
export function TagsSection({ mediaToken, creator }: TagsSectionProps) {
  const tagsApi = useMemo(() => new TagsApi(), []);
  const { user, loggedIn } = useSession();
  const isOwner =
    loggedIn && !!creator?.username && creator.username === user?.username;

  // null until the first fetch resolves — the section doesn't render (and
  // can't be edited) before we know the file's current tags.
  const [tags, setTags] = useState<TagDetails[] | null>(null);
  const mediaTokenRef = useRef(mediaToken);
  mediaTokenRef.current = mediaToken;
  /** Last server-confirmed tag set — the revert target on save failure. */
  const lastAckedRef = useRef<TagDetails[]>([]);
  const pendingRef = useRef<PendingSave | null>(null);
  const savingRef = useRef(false);

  const storeTags = useLibraryTagsStore((s) => s.tags);
  const loadTags = useLibraryTagsStore((s) => s.loadTags);
  const upsertTags = useLibraryTagsStore((s) => s.upsertTags);

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

  // Preload the user's tag list once for autocomplete (client-side filtering;
  // no per-keystroke network).
  useEffect(() => {
    if (isOwner && !useLibraryTagsStore.getState().tagsLoaded) loadTags();
  }, [isOwner, loadTags]);

  const suggestions = useMemo(
    () =>
      [...storeTags]
        .sort(compareTagsByUseCount)
        .map((t) => ({ value: t.value, useCount: t.useCount })),
    [storeTags],
  );

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
        // Fresh use counts for the sidebar / autocomplete.
        upsertTags(res.data.tags);
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
        <div className="flex items-center gap-2 text-xs font-medium text-white/60">
          <FontAwesomeIcon icon={faTag} />
          <span>Tags</span>
        </div>
        {isOwner && tags.length >= 2 && (
          <button
            onClick={handleClear}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <TagChipInput
        chips={tags.map((t) => t.tag_value)}
        suggestions={suggestions}
        disabled={!isOwner}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </div>
  );
}
