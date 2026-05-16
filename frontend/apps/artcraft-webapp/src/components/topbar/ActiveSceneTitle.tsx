// Header scene-title display for the /edit-3d* routes.
//
// Mirrors the artcraft Tauri desktop app's SceneTitleInput: a dimmed
// "Edit Scene /" prefix followed by the scene title rendered as a
// clickable pill. Owners see a pencil icon inside the pill; clicking
// anywhere on the pill enters edit mode. The input is centered, fixed
// width, with a brand-primary focus outline and a brand-secondary
// outline while a rename is in flight.
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
import { faPencil, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { MediaFilesApi } from "@storyteller/api";
import { usePageSceneStore } from "@storyteller/ui-pagescene";
import { showToast } from "../toast/toast";

const PAGESCENE_ROUTE_PREFIX = "/edit-3d";
const DEFAULT_TITLE = "Untitled Scene";
const PAGE_NAME = "Edit Scene";

export function ActiveSceneTitle() {
  const { pathname } = useLocation();
  const sceneMeta = usePageSceneStore((s) => s.sceneMeta);
  const setSceneMeta = usePageSceneStore((s) => s.setSceneMeta);
  const currentUserToken = usePageSceneStore((s) => s.currentUserToken);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus + select-all exactly once when entering edit mode. Keyed on
  // isEditing (NOT draft) so it does not re-fire and re-select on every
  // keystroke, which was the source of the typing jank.
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
    setIsValid(true);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft("");
    setIsValid(true);
  };

  const commit = async () => {
    if (!isEditing) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setIsValid(false);
      showToast("error", "Scene name cannot be empty.");
      inputRef.current?.focus();
      return;
    }
    if (trimmed === title || !sceneMeta.token) {
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
      setSceneMeta({ title: trimmed });
      cancelEdit();
    } catch {
      showToast("error", "Failed to rename scene");
      cancelEdit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-w-0 items-center justify-center gap-1.5">
      {!isEditing && (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-nowrap text-sm opacity-60">{PAGE_NAME}</span>
          <span className="text-sm opacity-60">/</span>
          {canRename ? (
            <button
              type="button"
              onClick={startEdit}
              title="Rename scene"
              aria-label="Rename scene"
              className="-ml-1 flex min-w-0 items-center rounded-md px-2 py-1 text-sm font-semibold text-white transition-all hover:cursor-text hover:bg-white/[0.08]"
            >
              <span className="truncate">{title}</span>
              <FontAwesomeIcon
                icon={faPencil}
                className="ml-2 shrink-0 text-sm opacity-50"
              />
            </button>
          ) : (
            <div className="-ml-1 truncate rounded-md px-2 py-1 text-sm font-semibold text-white">
              {title}
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value.trim() !== "") setIsValid(true);
          }}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
            }
          }}
          disabled={isSubmitting}
          maxLength={120}
          className={twMerge(
            "h-8 w-[420px] max-w-full rounded-md border border-white/[0.12] bg-white/[0.04] px-2 text-center text-sm font-semibold text-white outline-none focus:outline focus:outline-2 focus:outline-brand-primary",
            isSubmitting && "outline outline-2 outline-brand-secondary",
            !isValid &&
              "border-danger focus:outline-danger focus:outline-2",
          )}
        />
      )}

      {isSubmitting && (
        <FontAwesomeIcon
          icon={faSpinnerThird}
          spin
          className="shrink-0 text-sm opacity-70"
        />
      )}
    </div>
  );
}
