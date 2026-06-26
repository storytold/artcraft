import { useEffect, useState } from "react";
import { dndCoordinator } from "./coordinator";
import { mediaKindFromFile, mediaKindFromMime } from "./mediaKind";

// Window-level HTML5 file-drop wiring that routes OS files into the unified
// drop-target registry. Mount once near an app's root. Reference fields
// (registered via `useDropTarget`) light up and receive the drop directly;
// anything dropped over empty space is handed to `onCatchAllDrop` (if provided)
// so the host can decide what to do — open an upload modal, or nothing.
//
// The desktop app's Tauri path lives in its own handler; this hook is the
// browser/webapp implementation and the canonical HTML5 logic.

export interface UseExternalFileDropOptions {
  /** Disable all wiring (e.g. on platforms that handle drops natively). */
  enabled?: boolean;
  /** When this returns true, the catch-all overlay/fallback is suppressed
   *  (field routing still works). Typically `() => isAnyModalOpen()`. */
  isBlocked?: () => boolean;
  /** Called when files are dropped over no registered field. */
  onCatchAllDrop?: (files: File[], event: DragEvent) => void;
}

export interface UseExternalFileDropResult {
  /** True while dragging files over empty space (not a field, not blocked). */
  isOverCatchAll: boolean;
}

export function useExternalFileDrop(
  opts: UseExternalFileDropOptions = {},
): UseExternalFileDropResult {
  const { enabled = true, isBlocked, onCatchAllDrop } = opts;
  const [isOverCatchAll, setIsOverCatchAll] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let dragDepth = 0;

    const blocked = () => (isBlocked ? isBlocked() : false);

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer?.types.includes("Files")) return;
      dragDepth++;
    };

    const handleDragLeave = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      dragDepth--;
      if (dragDepth <= 0) {
        dragDepth = 0;
        setIsOverCatchAll(false);
        dndCoordinator.endDrag();
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      if (!e.dataTransfer?.types.includes("Files")) return;

      // The File bytes aren't readable mid-drag, but each item's MIME type is.
      let kind = null;
      const items = e.dataTransfer.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          kind = mediaKindFromMime(items[i].type);
          if (kind) break;
        }
      }

      if (kind) {
        dndCoordinator.beginDrag({
          source: "os-file",
          kind,
          fileName: "",
          getFile: async () => {
            throw new Error("file unavailable during hover");
          },
        });
        const { target } = dndCoordinator.updateHover(e.clientX, e.clientY);
        setIsOverCatchAll(!target && !blocked());
      } else {
        dndCoordinator.updateHover(-1, -1);
        setIsOverCatchAll(!blocked());
      }
    };

    const handleDrop = async (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      setIsOverCatchAll(false);
      dragDepth = 0;

      const files = Array.from(e.dataTransfer.files);
      const first = files[0];

      if (first) {
        const kind = mediaKindFromFile(first);
        if (kind) {
          const handled = await dndCoordinator.drop(e.clientX, e.clientY, {
            source: "os-file",
            kind,
            fileName: first.name,
            getFile: async () => first,
          });
          dndCoordinator.endDrag();
          if (handled) return;
        } else {
          dndCoordinator.endDrag();
        }
      }

      if (blocked() || files.length === 0) return;
      onCatchAllDrop?.(files, e);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [enabled, isBlocked, onCatchAllDrop]);

  return { isOverCatchAll };
}
