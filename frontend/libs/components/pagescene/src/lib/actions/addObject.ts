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

  // Animate it in (mask-reveal for meshes, per-gaussian radial settle for
  // splats). Runs synchronously before the next render frame, so the object is
  // never shown fully-formed first.
  editor.entranceAnimator.play(obj);

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
