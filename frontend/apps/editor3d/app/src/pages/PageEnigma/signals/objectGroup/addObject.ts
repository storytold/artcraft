import { MediaItem, ObjectTrack, Keyframe } from "~/pages/PageEnigma/models";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { objectGroup } from "~/pages/PageEnigma/signals";

export function addObject(
  object: MediaItem & { position?: { x: number; y: number; z: number } }
) {
  Queue.publish({
    queueName: QueueNames.TO_ENGINE,
    action: toEngineActions.ADD_OBJECT,
    data: object,
  });
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
