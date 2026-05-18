import * as THREE from "three";
import type Editor from "../engine/editor";
import { MediaItem } from "../models";
import { CreateAction } from "../engine/editor/actions/CreateAction";
import { ObjectAddedEvent } from "../engine/events/EngineEvent";

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
  // Default userData.color so the inspector's color swatch + native
  // picker always read a valid #RRGGBB (the input would otherwise be
  // uncontrolled-value=undefined and some browsers refuse to open the
  // color dialog).
  obj.userData.color = "#ffffff";
  obj.name = item.name ?? "shape";

  editor.history.record(new CreateAction(editor, obj));

  editor.bus.emit(
    new ObjectAddedEvent({
      id: obj.uuid,
      kind: "shape",
      name: obj.name,
      mediaId: item.media_id,
    }),
  );
  editor.selection.refreshOutliner();
  return obj.uuid;
}
