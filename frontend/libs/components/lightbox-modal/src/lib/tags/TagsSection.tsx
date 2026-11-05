// React hooks used below: `useEffect` runs side effects (network calls) after render, `useMemo` builds the API client once,
// `useRef` keeps values that must survive re-renders without causing one, `useState` holds what the screen shows.
import { useEffect, useMemo, useRef, useState } from "react";
// The small tag icon drawn next to the "Tags" heading.
import { TagIcon } from "lucide-react";
// `TagsApi` talks to the backend's tag endpoints (list a file's tags, list all of the user's tags, set a file's tags).
// `UsersApi` is only used to ask "who is logged in" (the session). `TagDetails` / `UserInfo` are the shapes the backend returns.
import {
  TagsApi,
  UsersApi,
  type TagDetails,
  type UserInfo,
} from "@storyteller/api";
// The app-wide toast popup; used here only to tell the user a save failed.
import { toast } from "@storyteller/ui-toaster";
// The chip box itself (the part the user types into) and the shape of one autocomplete suggestion.
import { TagChipInput, type TagSuggestion } from "./TagChipInput";

// What the lightbox (the only caller, `lightbox-modal.tsx` around line 1066) may hand to this section. The shipped app passes
// only `mediaToken` and `creator`; the other three are for a host app (the website) that already has the data.
export interface TagsSectionProps {
  // The token (id) of the media file whose tags are shown. No token = nothing to show, the section renders nothing.
  mediaToken?: string | null;
  // The person who made the file. Only its `username` is read, to decide whether the viewer owns the file.
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
  // Which file the save is for (the lightbox can move to another file while a save is still waiting).
  token: string;
  // The complete list of tag texts the file should have after this save (a snapshot, not a "add this one" change).
  values: string[];
}

// Session + own-tags lookups are module-cached so reopening the lightbox
// doesn't refetch (only used when the host doesn't supply the data).
// `cachedUsername`: undefined = never asked (or the last ask failed), null = asked and nobody is logged in, string = the user.
// It lives at module level, so it outlives the component: it is shared by every mount for the whole app run and is never
// cleared by logout or an in-app sign-up (note N-110 in BUGS.md; signing in reloads the page, which does reset it).
let cachedUsername: string | null | undefined;
// The request that is currently on its way, so two sections mounting together share one request instead of sending two.
let usernameInFlight: Promise<string | null> | null = null;

// Answers "who is logged in" as a username, or null for "nobody / could not find out". Never rejects.
const resolveSessionUsername = (): Promise<string | null> => {
  // A real answer is already remembered: hand it back at once, no network call.
  if (cachedUsername !== undefined) return Promise.resolve(cachedUsername);
  // Nothing remembered and nothing on its way: start one request.
  if (!usernameInFlight) {
    // `GetSession` calls the backend's session endpoint through the shared API client.
    usernameInFlight = new UsersApi()
      .GetSession()
      .then((res) => {
        // WHY: the API client never throws, it answers `success: false` for any failed request (offline, server error, a
        // reply that is not JSON), so the `.catch` below was never reached for those. The failed answer used to be stored as
        // "nobody is logged in" for the rest of the app run: the owner was never recognised again and could not edit tags on
        // their own files until the app was restarted. A failed lookup is now not remembered, so the next lightbox visit asks
        // again; only a real answer ("logged in as X" or "nobody is logged in") is kept.
        if (!res.success) {
          // Forget the request that just failed so the next call starts a fresh one (and `cachedUsername` stays undefined).
          usernameInFlight = null;
          // This visit gets "unknown", which the caller treats like "not the owner" (read-only).
          return null;
        }
        // A real answer: the username when someone is logged in and the reply carries the user, otherwise null ("nobody").
        // Stored in the module-level variable, so every later mount reads it from there.
        cachedUsername =
          res.data?.loggedIn && res.data.user ? res.data.user.username : null;
        // Hand the same value to whoever is waiting on this request.
        return cachedUsername;
      })
      .catch(() => {
        // Defensive: if the client ever does throw, forget the request (so a later visit asks again) and answer "unknown".
        usernameInFlight = null;
        return null;
      });
  }
  // Everyone who asks while the request is on its way gets the same promise.
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
  // One API client for the life of this section (an empty dependency list means it is built once and reused every render).
  const tagsApi = useMemo(() => new TagsApi(), []);

  // Session: prop wins; otherwise resolve (and cache) it ourselves.
  // The username this section looked up itself; null until the lookup answers (or when it answered "nobody / unknown").
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(null);
  // Runs on mount and whenever `currentUsername` changes. In the shipped app it runs exactly once per lightbox visit, so a
  // failed lookup is not retried within the same visit (the next visit mounts a fresh section and asks again; see B-171).
  useEffect(() => {
    // The host already told us who is logged in (a string or null): nothing to look up.
    if (currentUsername !== undefined) return;
    // Set by the cleanup below, so an answer that arrives after the section is gone is not written into state.
    let cancelled = false;
    resolveSessionUsername().then((username) => {
      if (!cancelled) setResolvedUsername(username);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUsername]);
  // The prop wins when it is a string; `??` also falls through when it is null, so a host saying "logged out" still lets the
  // own lookup run first and its (null) answer is the same thing in the end.
  const effectiveUsername = currentUsername ?? resolvedUsername;
  // The viewer owns the file only when both names exist and are equal; either one missing means read-only.
  const isOwner =
    !!effectiveUsername &&
    !!creator?.username &&
    creator.username === effectiveUsername;

  // null until the first fetch resolves — the section doesn't render (and
  // can't be edited) before we know the file's current tags.
  const [tags, setTags] = useState<TagDetails[] | null>(null);
  // Always holds the file the lightbox is on right now. A ref (not state) so the save loop, which started earlier, can read the
  // CURRENT file after its `await` without a stale copy; it is assigned on every render.
  const mediaTokenRef = useRef(mediaToken);
  mediaTokenRef.current = mediaToken;
  /** Last server-confirmed tag set — the revert target on save failure. */
  const lastAckedRef = useRef<TagDetails[]>([]);
  // The newest save request that has not been sent yet (at most one: a newer edit replaces an older waiting one).
  const pendingRef = useRef<PendingSave | null>(null);
  // True while the save loop `runQueue` is running, so a second loop is never started alongside it.
  const savingRef = useRef(false);

  // Loads the file's tags whenever the lightbox moves to another file (`mediaToken` changes).
  useEffect(() => {
    // Start from "unknown" so the previous file's chips are never shown on the new file.
    setTags(null);
    // Forget the previous file's confirmed tags and any save that was still waiting for it.
    lastAckedRef.current = [];
    pendingRef.current = null;
    // No file, nothing to load.
    if (!mediaToken) return;
    // Lets the cleanup below discard the answer if the lightbox has already moved on (an older answer must not overwrite
    // a newer file's tags).
    let cancelled = false;
    tagsApi.ListMediaFileTags({ mediaFileToken: mediaToken }).then((res) => {
      if (cancelled) return;
      // WHY: a failed lookup (the API client answers `success: false`, it does not throw) says nothing about the
      // file's tags. Treating it as "no tags" showed the owner an empty box, and the next edit saved a snapshot of
      // just the new tag, which replaced the tags the file really has. Leave `tags` null (section hidden, not
      // editable) until a lookup succeeds; moving to another file or reopening the lightbox asks again.
      if (!res.success || !res.data) return;
      // Show the tags and remember them as the last thing the server confirmed (the revert target if a save fails).
      setTags(res.data);
      lastAckedRef.current = res.data;
    });
    return () => {
      cancelled = true;
    };
  }, [mediaToken, tagsApi]);

  // Autocomplete fallback: when the host doesn't supply suggestions, fetch
  // the user's tags once per mount (merged with canonical tags after saves).
  // The suggestions this section fetched itself (empty until the fetch finishes, or forever if it keeps failing).
  const [ownTags, setOwnTags] = useState<TagSuggestion[]>([]);
  // True once one complete, uncancelled, unfailed fetch has finished; stops the effect from fetching a second time.
  const ownTagsLoadedRef = useRef(false);
  // Runs when the owner status first becomes true (and again if it flips off and on, which the lightbox causes on every
  // Next / Previous because it clears `creator` for a moment).
  useEffect(() => {
    // Skip when the host supplies suggestions, when the viewer is not the owner (they cannot add tags, so no autocomplete is
    // needed), or when a finished fetch is already in hand.
    if (suggestions !== undefined || !isOwner || ownTagsLoadedRef.current) {
      return;
    }
    // Set by the cleanup below when the effect is torn down mid-fetch.
    let cancelled = false;
    // WHY: the "loaded" flag used to be set here, before the request even left. The lightbox clears `creator` on every
    // next/prev (so `isOwner` flips off and on), which runs this effect's cleanup and drops the answer that was still
    // on its way; a failed request also ended the run. Either way the flag stayed set, so the next owner file never
    // asked again and autocomplete stayed empty until the lightbox was closed. Now the flag is set only after a run
    // that was not cancelled and did not fail, so an interrupted or failed run is tried again the next time an owner
    // file is shown (a finished run still is not repeated).
    let failed = false;
    (async () => {
      // Every tag from every page, collected before anything is shown.
      const all: TagDetails[] = [];
      // Where the next page starts; undefined asks for the first page.
      let cursor: string | undefined = undefined;
      // At most 50 pages, one request after another (a safety stop so a misbehaving cursor cannot loop forever).
      for (let page = 0; page < 50; page++) {
        const res = await tagsApi.ListTags({ cursor });
        // A failed page ends the fetch; what was collected so far is still shown, but the run does not count as finished.
        if (!res.success || !res.data) {
          failed = true;
          break;
        }
        all.push(...res.data);
        // No cursor in the reply = that was the last page.
        const next = res.pagination?.maybe_cursor;
        if (!next) break;
        cursor = next ?? undefined;
      }
      // The effect was torn down while we waited: drop the answer without touching state or the flag.
      if (cancelled) return;
      // Only a run that finished cleanly is remembered as "done" (see the WHY note above).
      if (!failed) ownTagsLoadedRef.current = true;
      setOwnTags(
        all
          // Most-used tags first; ties broken alphabetically so the order is stable.
          .sort(
            (a, b) =>
              b.use_count - a.use_count ||
              a.tag_value_lowercase.localeCompare(b.tag_value_lowercase),
          )
          // Reduce each tag to the two things the dropdown needs: its text and how often it is used.
          .map((t) => ({ value: t.tag_value, useCount: t.use_count })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [suggestions, isOwner, tagsApi]);

  // Host-supplied suggestions win; otherwise the ones fetched above.
  const effectiveSuggestions = suggestions ?? ownTags;

  // The save loop. Sends the waiting snapshot, waits for the answer, and repeats while a newer snapshot has been queued
  // meanwhile. `savingRef` guarantees only one copy of this loop runs, so two saves are never in flight at once.
  const runQueue = async () => {
    savingRef.current = true;
    while (pendingRef.current) {
      // Take the waiting snapshot out of the queue; an edit made while this request is in flight lands in the queue again.
      const { token, values } = pendingRef.current;
      pendingRef.current = null;
      // Writes the whole tag list for that file on the backend (a replace, not an add).
      const res = await tagsApi.SetMediaFileTags({
        mediaFileToken: token,
        tags: values,
      });
      if (res.success && res.data) {
        // Tell the host (if it asked) the canonical tags the server now holds.
        onSaved?.(res.data.tags);
        if (suggestions === undefined && res.data.tags.length > 0) {
          // Keep the self-fetched suggestion list fresh with new tags.
          setOwnTags((prev) => {
            // Lower-cased texts already in the list, to avoid adding a tag twice.
            const known = new Set(prev.map((s) => s.value.toLowerCase()));
            // Tags the server returned that the list does not have yet.
            const added = res.data!.tags
              .filter((t) => !known.has(t.tag_value_lowercase))
              .map((t) => ({ value: t.tag_value, useCount: t.use_count }));
            // Return the same array when nothing is new so React skips a re-render.
            return added.length > 0 ? [...prev, ...added] : prev;
          });
        }
        // Only touch what is on screen when the lightbox is still on the file this save was for.
        if (mediaTokenRef.current === token) {
          // The server's answer becomes the new revert target.
          lastAckedRef.current = res.data.tags;
          // Don't clobber newer optimistic chips a queued edit represents.
          if (!pendingRef.current) setTags(res.data.tags);
        }
      } else {
        // Tell the user; the server's message when it sent one, a generic line otherwise.
        toast.error(res.errorMessage || "Failed to save tags.");
        if (mediaTokenRef.current === token) {
          // Drop any edit queued behind the failed one (it was built on top of tags the server never accepted) and put the
          // chips back to the last list the server confirmed.
          pendingRef.current = null;
          setTags(lastAckedRef.current);
        }
      }
    }
    // Queue empty: the next edit may start a new loop.
    savingRef.current = false;
  };

  // Queues a snapshot for the current file and starts the loop if it is not already running. A snapshot that is already
  // waiting is replaced (coalescing): only the newest desired tag list is ever sent.
  const enqueueSave = (values: string[]) => {
    if (!mediaToken) return;
    pendingRef.current = { token: mediaToken, values };
    if (!savingRef.current) void runQueue();
  };

  // The user committed one or more new tags in the box.
  const handleAdd = (values: string[]) => {
    // Existing chips followed by the new ones; the new ones get an empty token and zero use count until the server answers.
    const next = [
      ...(tags ?? []),
      ...values.map((value) => ({
        tag_token: "",
        tag_value: value,
        tag_value_lowercase: value.toLowerCase(),
        use_count: 0,
      })),
    ];
    // Show the chips at once (optimistic), then send the full list.
    setTags(next);
    enqueueSave(next.map((t) => t.tag_value));
  };

  // The user removed one chip: keep every other tag and send the shorter list.
  const handleRemove = (value: string) => {
    const next = (tags ?? []).filter((t) => t.tag_value !== value);
    setTags(next);
    enqueueSave(next.map((t) => t.tag_value));
  };

  // The "Clear" link: empty the list and send the empty list.
  const handleClear = () => {
    setTags([]);
    enqueueSave([]);
  };

  // Nothing to show without a file, or before the file's tags have loaded.
  if (!mediaToken || tags === null) return null;
  // A viewer who is not the owner (including "could not find out who is logged in") sees nothing on a file with no tags.
  if (!isOwner && tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-base-fg/60">
          <TagIcon />
          <span>Tags</span>
        </div>
        {/* "Clear" appears for the owner once there are two or more chips; one chip is removed with its own x. */}
        {isOwner && tags.length >= 2 && (
          <button
            onClick={handleClear}
            className="text-xs text-base-fg/60 hover:text-base-fg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      {/* The chip box; for a non-owner it is `disabled`, which shows the chips without an input. */}
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
