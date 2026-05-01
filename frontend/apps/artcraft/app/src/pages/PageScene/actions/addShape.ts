import * as THREE from "three";
import type Editor from "../engine/editor";
import { MediaItem } from "../models";
import { usePageSceneStore } from "../PageSceneStore";

export async function addShape(
  editor: Editor,
  item: MediaItem,
  position?: THREE.Vector3,
): Promise<string | undefined> {
  const obj = await editor.sceneManager?.create(
    "Parim",
    item.media_id,
    position ?? new THREE.Vector3(),
  );
  if (!obj) return undefined;
  obj.name = item.name ?? "shape";

  usePageSceneStore.getState().addShape({
    id: obj.uuid,
    kind: "shape",
    name: obj.name,
    mediaId: item.media_id,
  });
  editor.selection.refreshOutliner();
  return obj.uuid;
}
