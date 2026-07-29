// "Edit on Canvas" handoff: open an existing image in the PageDraw editor.
//
// Mirrors the Tauri app's handleEditFromGallery — RESET the editor, seed the
// chosen image as the base (and into history), then route to /edit-image.
// Seeding the lib's store before navigating means the editor mounts straight
// into the image, same store-based handoff the create-image/create-video
// "Recreate" and "Make Video" buttons use (see lib/recreate.ts).

import type { NavigateFunction } from "react-router-dom";
import { useSceneStore } from "@storyteller/ui-pagedraw";

export function applyEditOnCanvasFromImage(
  mediaToken: string,
  mediaUrl: string,
  navigate: NavigateFunction,
): void {
  const store = useSceneStore.getState();
  const baseImage = {
    url: mediaUrl,
    mediaToken,
    fullImageUrl: mediaUrl,
  };
  store.RESET();
  store.addHistoryImageBundle({ images: [baseImage] });
  store.setBaseImageInfo(baseImage);
  navigate("/edit-image");
}
