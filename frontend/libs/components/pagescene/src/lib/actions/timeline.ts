// UI-facing dispatchers for the animation timeline. Thin wrappers that
// forward to editor.timelineController (mirrors the other files in this
// folder). Pure-UI state (expanded, selected keyframe) is set directly on
// the store by components and has no dispatcher here.

import type Editor from "../engine/editor";
import type { EasingSpec } from "../engine/timeline/types";

// The clip source only needs an id + label — both a full MediaItem (drawer
// click) and a drag payload (drop) satisfy this.
interface ClipSource {
  media_id: string;
  name?: string;
}

// Placeholder strip length (seconds) until the clip GLB reports its real
// duration; playback uses the loaded clip's actual length regardless.
const DEFAULT_CLIP_DURATION = 2;

export function createTimeline(editor: Editor): void {
  editor.timelineController.create();
}

export function playTimeline(editor: Editor): void {
  editor.timelineController.play();
}

export function pauseTimeline(editor: Editor): void {
  editor.timelineController.pause();
}

export function seekTimeline(editor: Editor, time: number): void {
  editor.timelineController.seekTo(time);
}

export function setTimelineDuration(editor: Editor, seconds: number): void {
  editor.timelineController.setDuration(seconds);
}

export function addKeyframe(
  editor: Editor,
  objectUuid: string,
  atTime?: number,
): void {
  editor.timelineController.addKeyframe(objectUuid, atTime);
}

export function deleteKeyframe(editor: Editor, keyframeId: string): void {
  editor.timelineController.deleteKeyframe(keyframeId);
}

export function moveKeyframe(
  editor: Editor,
  keyframeId: string,
  time: number,
): void {
  editor.timelineController.moveKeyframe(keyframeId, time);
}

export function setKeyframeEasing(
  editor: Editor,
  keyframeId: string,
  easing: EasingSpec,
): void {
  editor.timelineController.setEasing(keyframeId, easing);
}

// Place a skeletal-animation clip on `characterUuid`'s single clip row.
// Defaults to the current playhead; pass an explicit `atTime` for a precise
// timeline drop, or 0 to take the earliest free slot. Either way the
// controller snaps to a non-overlapping position and returns null when the
// row has no free slot. The real clip length replaces DEFAULT_CLIP_DURATION
// once the GLB loads (the strip starts at the placeholder width, flagged
// autoDuration).
export function addClipToCharacter(
  editor: Editor,
  characterUuid: string,
  item: ClipSource,
  atTime?: number,
): string | null {
  if (!item.media_id) return null;
  const startTime = atTime ?? editor.timelineController.getPlayhead();
  return editor.timelineController.addClipLane(characterUuid, {
    sourceMediaId: item.media_id,
    name: item.name ?? "Animation",
    startTime,
    duration: DEFAULT_CLIP_DURATION,
    loop: false,
    autoDuration: true,
  });
}

// Place one of an object's own baked clips (object.animations[clipIndex]) on
// its clip row at the earliest free slot (or an explicit `atTime`). The clip's
// real length is known up front, so no autoDuration placeholder is needed.
// Returns null when the object/clip doesn't exist or the row has no free slot.
export function addBakedClipToObject(
  editor: Editor,
  objectUuid: string,
  clipIndex: number,
  atTime = 0,
): string | null {
  const object = editor.activeScene.scene.getObjectByProperty(
    "uuid",
    objectUuid,
  );
  const clip = object?.animations?.[clipIndex];
  if (!clip) return null;
  return editor.timelineController.addClipLane(objectUuid, {
    sourceMediaId: "",
    bakedClipIndex: clipIndex,
    name: clip.name || `Clip ${clipIndex + 1}`,
    startTime: atTime,
    duration: clip.duration || DEFAULT_CLIP_DURATION,
    loop: false,
  });
}

export function moveClipLane(
  editor: Editor,
  laneId: string,
  startTime: number,
): void {
  editor.timelineController.moveClipLane(laneId, startTime);
}

export function resizeClipLane(
  editor: Editor,
  laneId: string,
  duration: number,
): void {
  editor.timelineController.resizeClipLane(laneId, duration);
}

export function setClipLoop(
  editor: Editor,
  laneId: string,
  loop: boolean,
): void {
  editor.timelineController.setClipLoop(laneId, loop);
}

export function removeClipLane(editor: Editor, laneId: string): void {
  editor.timelineController.removeClipLane(laneId);
}

export function saveTimeline(editor: Editor): void {
  editor.timelineController.save();
}

export function cancelTimeline(editor: Editor): void {
  editor.timelineController.cancel();
}
