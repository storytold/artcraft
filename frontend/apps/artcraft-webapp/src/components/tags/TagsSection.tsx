import { useEffect, useMemo } from "react";
import type { UserInfo } from "@storyteller/api";
import { TagsSection as SharedTagsSection } from "@storyteller/ui-lightbox-modal";
import { useSession } from "../../lib/session";
import {
  compareTagsByUseCount,
  useLibraryTagsStore,
} from "../../pages/library/library-tags-store";

interface TagsSectionProps {
  mediaToken?: string | null;
  creator?: UserInfo | null;
}

/**
 * Store-wired wrapper around the shared tags editor (from
 * `@storyteller/ui-lightbox-modal`, also used by the desktop gallery):
 * session comes from the webapp session store, autocomplete suggestions from
 * the preloaded tags store, and saves feed fresh use counts back into it so
 * the sidebar and tag browser stay current.
 */
export function TagsSection({ mediaToken, creator }: TagsSectionProps) {
  const { user, loggedIn } = useSession();
  const storeTags = useLibraryTagsStore((s) => s.tags);
  const loadTags = useLibraryTagsStore((s) => s.loadTags);
  const upsertTags = useLibraryTagsStore((s) => s.upsertTags);

  const currentUsername = loggedIn ? (user?.username ?? null) : null;
  const isOwner =
    !!currentUsername && creator?.username === currentUsername;

  // Preload the user's tag list once for autocomplete.
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

  return (
    <SharedTagsSection
      mediaToken={mediaToken}
      creator={creator}
      currentUsername={currentUsername}
      suggestions={suggestions}
      onSaved={upsertTags}
    />
  );
}
