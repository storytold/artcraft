import { useEffect } from "react";
import {
  dndCoordinator,
  useExternalFileDrop,
  type MediaKind,
} from "@storyteller/ui-dnd";
import { toast } from "./toast/toast";

// Plural noun for reject toasts ("… doesn't accept videos.").
function kindNoun(kind: MediaKind): string {
  switch (kind) {
    case "image":
      return "images";
    case "video":
      return "videos";
    case "audio":
      return "audio";
    case "model3d":
      return "3D models";
    case "splat":
      return "splats";
  }
}

// Mounts the window-level OS-file drop wiring for the web app. Dragging an image
// or video file from the desktop onto a reference field attaches it directly
// (the field highlights via `useDropTarget`). There is no global upload target
// in the web app, so files dropped over empty space are simply ignored — the
// browser's default "open the file" is still prevented by the hook.
export function GlobalFileDropHandler() {
  useExternalFileDrop();

  // Toast when a drag is released over a field that can't accept its media kind.
  useEffect(() => {
    dndCoordinator.setRejectHandler((payload, targetLabel) => {
      toast.error(`${targetLabel ?? "This field"} doesn't accept ${kindNoun(payload.kind)}.`);
    });
    return () => dndCoordinator.setRejectHandler(null);
  }, []);

  return null;
}
