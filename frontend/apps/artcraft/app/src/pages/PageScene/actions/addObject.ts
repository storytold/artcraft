import * as THREE from "three";
import type Editor from "../engine/editor";
import { MediaItem } from "../models";
import { CreateAction } from "../engine/editor/actions/CreateAction";
import { ObjectAddedEvent } from "../engine/events/EngineEvent";

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

  editor.history.record(new CreateAction(editor, obj));

  editor.bus.emit(
    new ObjectAddedEvent({
      id: obj.uuid,
      kind: "object",
      name: obj.name || (item.name ?? "object"),
      mediaId: item.media_id,
    }),
  );
  editor.selection.refreshOutliner();
  return obj.uuid;
}
