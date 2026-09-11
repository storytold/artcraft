import * as THREE from "three";
import type Editor from "../engine/editor";
import { MediaItem } from "../models";
import { CreateAction } from "../engine/editor/actions/CreateAction";
import { ObjectAddedEvent } from "../engine/events/EngineEvent";

export async function addCharacter(
  editor: Editor,
  item: MediaItem,
  position?: THREE.Vector3,
): Promise<string | undefined> {
  const obj = await editor.sceneManager?.create(
    item.media_id,
    item.name ?? "character",
    position ?? new THREE.Vector3(),
  );
  if (!obj) return undefined;

  obj.userData.isCharacter = true;

  // Animate it in (see addObject).
  editor.entranceAnimator.play(obj);

  editor.history.record(new CreateAction(editor, obj));

  editor.bus.emit(
    new ObjectAddedEvent({
      id: obj.uuid,
      kind: "character",
      name: obj.name || (item.name ?? "character"),
      mediaId: item.media_id,
    }),
  );
  editor.selection.refreshOutliner();
  return obj.uuid;
}
