// Header scene-title display for the /edit-3d* routes.
//
// Renders the active scene's title in the topbar's middle slot as plain,
// prominent text. Renaming is a deliberate action: the title itself is
// NOT clickable — a separate, dimmed pencil button (owner-only, and only
// once the scene has a token to rename against) enters edit mode. This
// prevents accidental renames from a stray click on the title.
//
// sceneMeta (the lib's Zustand store) is the single source of truth.
// Local state exists only while editing; a failed rename just discards
// it and re-renders from the untouched store (automatic rollback).
//
// New/unsaved scenes still show their default title (the engine emits
// "Untitled New Scene" on newScene/init). We return null only off-route
// or while the store is still initializing.

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/pro-solid-svg-icons";
import { MediaFilesApi } from "@storyteller/api";
import { usePageSceneStore } from "@storyteller/ui-pagescene";
import { showToast } from "../toast/toast";

const PAGESCENE_ROUTE_PREFIX = "/edit-3d";
const DEFAULT_TITLE = "Untitled Scene";

export function ActiveSceneTitle() {
  const { pathname } = useLocation();
  const sceneMeta = usePageSceneStore((s) => s.sceneMeta);
  const setSceneMeta = usePageSceneStore((s) => s.setSceneMeta);
  const currentUserToken = usePageSceneStore((s) => s.currentUserToken);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus + select-all exactly once when entering edit mode. Keyed on
  // isEditing (NOT draft) so it does not re-fire and re-select on every
  // keystroke — that was the source of the typing jank.
  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const onPageSceneRoute =
    pathname === PAGESCENE_ROUTE_PREFIX ||
    pathname.startsWith(`${PAGESCENE_ROUTE_PREFIX}/`);
  if (!onPageSceneRoute) return null;

  // Wait for the store to settle so we don't flash a stale/blank title
  // mid-load. A token-less new scene still passes this gate.
  if (sceneMeta.isInitializing) return null;

  const title = sceneMeta.title ?? DEFAULT_TITLE;
  const isOwner =
    !!currentUserToken && sceneMeta.ownerToken === currentUserToken;
  // Renaming goes through RenameMediaFileByToken, which needs a saved
  // scene's token. An unsaved new scene shows the title as plain text
  // with no pencil until it's been saved.
  const canRename = isOwner && !!sceneMeta.token;

  const startEdit = () => {
    if (!canRename) return;
    setDraft(title);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft("");
  };

  const commit = async () => {
    if (!isEditing) return;
    const trimmed = draft.trim();
    // No-op cases: empty, unchanged, or missing token → just exit edit.
    if (!trimmed || trimmed === title || !sceneMeta.token) {
      cancelEdit();
      return;
    }
    setIsSubmitting(true);
    try {
      const resp = await new MediaFilesApi().RenameMediaFileByToken({
        mediaToken: sceneMeta.token,
        name: trimmed,
      });
      if (!resp.success) {
        showToast("error", resp.errorMessage ?? "Failed to rename scene");
        cancelEdit();
        return;
      }
      // Single-source-of-truth write; local edit state is discarded.
      setSceneMeta({ title: trimmed });
      cancelEdit();
    } catch {
      showToast("error", "Failed to rename scene");
      cancelEdit();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancelEdit();
          }
        }}
        disabled={isSubmitting}
        maxLength={120}
        className="h-8 max-w-[28rem] truncate rounded-md border border-white/[0.08] bg-white/[0.04] px-2 text-sm font-semibold text-white outline-none focus:border-white/20"
      />
    );
  }

  return (
    <div className="group flex min-w-0 items-center gap-2">
      <span className="truncate text-sm font-semibold text-white">
        {title}
      </span>
      {canRename && (
        <button
          type="button"
          onClick={startEdit}
          title="Rename scene"
          aria-label="Rename scene"
          className="shrink-0 rounded p-1 text-white/30 transition-colors group-hover:text-white/70 hover:!text-white hover:bg-white/[0.06]"
        >
          <FontAwesomeIcon icon={faPen} className="text-[11px]" />
        </button>
      )}
    </div>
  );
}
