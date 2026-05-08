import * as THREE from "three";
import type Editor from "../engine/editor";
import { MediaItem } from "../models";
import { usePageSceneStore } from "../PageSceneStore";
import { CreateAction } from "../engine/editor/actions/CreateAction";

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
  // Stash the geometry key (Box / Sphere / PointLight / ...) so undo/redo
  // can re-route through scene.instantiate's name switch. obj.name gets
  // overridden below with the display label ("Cube", "Point Light").
  obj.userData.shapeKey = item.media_id;
  obj.name = item.name ?? "shape";

  editor.history.record(new CreateAction(editor, obj));

  usePageSceneStore.getState().addShape({
    id: obj.uuid,
    kind: "shape",
    name: obj.name,
    mediaId: item.media_id,
  });
  editor.selection.refreshOutliner();
  return obj.uuid;
}
