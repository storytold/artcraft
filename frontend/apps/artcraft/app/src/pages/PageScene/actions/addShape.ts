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
    item.media_id,
    item.name ?? "shape",
    position ?? new THREE.Vector3(),
  );
  if (!obj) return undefined;

  usePageSceneStore.getState().addShape({
    id: obj.uuid,
    kind: "shape",
    name: obj.name || (item.name ?? "shape"),
    mediaId: item.media_id,
  });
  editor.updateOutliner?.();
  return obj.uuid;
}
