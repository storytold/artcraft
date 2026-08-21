// UI-facing dispatchers for the animation timeline. Thin wrappers that
// forward to editor.timelineController (mirrors the other files in this
// folder). Pure-UI state (expanded, selected keyframe) is set directly on
// the store by components and has no dispatcher here.

import type Editor from "../engine/editor";
import type { EasingSpec } from "../engine/timeline/types";
import { RemoveClipLaneAction } from "../engine/editor/actions/RemoveClipLaneAction";
import { usePageSceneStore } from "../PageSceneStore";

// The clip source only needs an id + label — both a full MediaItem (drawer
// click) and a drag payload (drop) satisfy this.
interface ClipSource {
  media_id: string;
  name?: string;
}

// Default on-timeline width (seconds) for a fresh strip. Deliberately compact:
// the strip is the play WINDOW, not the clip length — long clips get one
// second by default and the user trims the strip wider to reveal more. Strips
// only auto-shrink below this when the clip itself is shorter.
const DEFAULT_CLIP_DURATION = 1;

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
// row has no free slot. Strips start at the compact DEFAULT_CLIP_DURATION
// width (the play window — trim wider to reveal more of the clip); once the
// GLB loads the strip shrinks if the clip is shorter (autoDuration).
// Strips default to LOOPING: dragging a strip wider than the clip's natural
// length keeps the motion cycling (a walk keeps walking), matching the old
// studio's behavior — the strip's loop chip opts into play-once/hold-last-
// frame instead.
// A successful add expands the timeline and scrolls its row list to the
// character (timelineRevealObjectUuid, consumed by TimelineEditor) so the
// new strip is immediately visible.
export function addClipToCharacter(
  editor: Editor,
  characterUuid: string,
  item: ClipSource,
  atTime?: number,
): string | null {
  if (!item.media_id) return null;
  const startTime = atTime ?? editor.timelineController.getPlayhead();
  const laneId = editor.timelineController.addClipLane(characterUuid, {
    sourceMediaId: item.media_id,
    name: item.name ?? "Animation",
    startTime,
    duration: DEFAULT_CLIP_DURATION,
    loop: true,
    autoDuration: true,
  });
  if (laneId) {
    const store = usePageSceneStore.getState();
    store.setTimelineRevealObjectUuid(characterUuid);
    store.setTimelineExpanded(true);
  }
  return laneId;
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
    duration: Math.min(clip.duration || DEFAULT_CLIP_DURATION, DEFAULT_CLIP_DURATION),
    // Loop by default, same as library strips (see addClipToCharacter).
    loop: true,
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

// Set (or clear, with null) the opt-in pose transition from `laneId`'s strip
// into the next strip on its row.
export function setClipTransitionEasing(
  editor: Editor,
  laneId: string,
  easing: EasingSpec | null,
): void {
  editor.timelineController.setClipTransitionEasing(laneId, easing);
}

// Open a gap after `laneId`'s strip for a transition to play in, when its
// boundary with the next strip is flush/too tight. Returns false when the
// row is too packed to make room (callers toast).
export function ensureClipTransitionGap(
  editor: Editor,
  laneId: string,
): boolean {
  return editor.timelineController.ensureTransitionGap(laneId);
}

// Individually undoable (RemoveClipLaneAction) — both the strip's × button
// and Del/Backspace route through here.
export function removeClipLane(editor: Editor, laneId: string): void {
  const lane = editor.timelineController.getClipLane(laneId);
  if (!lane) return;
  const action = new RemoveClipLaneAction(editor.timelineController, lane);
  action.apply();
  editor.history.record(action);
}

export function saveTimeline(editor: Editor): void {
  editor.timelineController.save();
}

export function cancelTimeline(editor: Editor): void {
  editor.timelineController.cancel();
}
