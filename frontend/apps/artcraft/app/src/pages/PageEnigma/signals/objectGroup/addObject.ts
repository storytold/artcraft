import { MediaItem, ObjectTrack, Keyframe } from "~/pages/PageEnigma/models";
import { objectGroup } from "~/pages/PageEnigma/signals";
import { usePageEnigmaStore } from "~/pages/PageEnigma/PageEnigmaStore";

export function addObject(
  object: MediaItem & { position?: { x: number; y: number; z: number } }
) {
  // TODO: After editor.ts is migrated, replace with actions/addObject which
  // calls editor.addObject(object) and updates the store in one step.
  usePageEnigmaStore.getState().addObject({
    id: object.object_uuid ?? object.media_id,
    kind: "object",
    name: object.name ?? "object",
    mediaId: object.media_id,
  });
  addObjectToTimeline(object);
}

export function addObjectToTimeline(mediaItem: MediaItem) {
  const oldObjectGroup = objectGroup.value;

  const newObject = {
    object_uuid: mediaItem.object_uuid,
    name: mediaItem.name ?? "unknown",
    keyframes: [] as Keyframe[],
  } as ObjectTrack;

  objectGroup.value = {
    ...oldObjectGroup,
    objects: [...oldObjectGroup.objects, newObject].sort((objA, objB) =>
      objA.object_uuid < objB.object_uuid ? -1 : 1,
    ),
  };
}
