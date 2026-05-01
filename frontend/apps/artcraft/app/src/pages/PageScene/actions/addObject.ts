import * as THREE from "three";
import type Editor from "../engine/editor";
import { MediaItem } from "../models";
import { usePageSceneStore } from "../PageSceneStore";

export async function addObject(
  editor: Editor,
  item: MediaItem,
  position?: THREE.Vector3,
): Promise<string | undefined> {
  const obj = await editor.sceneManager?.create(
    item.media_id,
    item.name ?? "object",
    position ?? new THREE.Vector3(),
  );
  if (!obj) return undefined;

  usePageSceneStore.getState().addObject({
    id: obj.uuid,
    kind: "object",
    name: obj.name || (item.name ?? "object"),
    mediaId: item.media_id,
  });
  editor.selection.refreshOutliner();
  return obj.uuid;
}
