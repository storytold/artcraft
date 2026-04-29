import * as THREE from "three";
import type Editor from "../Editor/editor";
import { MediaItem } from "../models";
import { usePageEnigmaStore } from "../PageEnigmaStore";

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

  usePageEnigmaStore.getState().addCharacter({
    id: obj.uuid,
    kind: "character",
    name: obj.name || (item.name ?? "character"),
    mediaId: item.media_id,
  });
  editor.updateOutliner?.();
  return obj.uuid;
}
