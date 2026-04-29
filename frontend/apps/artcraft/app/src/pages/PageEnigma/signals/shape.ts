import { MediaItem } from "~/pages/PageEnigma/models";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";

export function addShape(item: MediaItem) {
  // TODO: After editor.ts is migrated, replace with actions/addShape which
  // calls editor.addShape(item) and updates the store in one step.
  usePageEnigmaStore.getState().addShape({
    id: item.object_uuid ?? item.media_id,
    kind: "shape",
    name: item.name ?? "shape",
    mediaId: item.media_id,
  });
}
