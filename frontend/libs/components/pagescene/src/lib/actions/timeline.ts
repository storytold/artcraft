// UI-facing dispatchers for the animation timeline. Thin wrappers that
// forward to editor.timelineController (mirrors the other files in this
// folder). Pure-UI state (expanded, selected keyframe) is set directly on
// the store by components and has no dispatcher here.
//
// Undo: every DISCRETE edit here records one undo step via
// TimelineController.recordEdit. Continuous gestures (keyframe/strip drags,
// the easing popover) intentionally call the raw move/resize/easing
// dispatchers per event and coalesce into a single step through
// beginTimelineEdit / commitTimelineEdit at the gesture boundaries.

import type Editor from "../engine/editor";
import type { EasingSpec } from "../engine/timeline/types";
import type { TimelineUndoSnapshot } from "../engine/editor/TimelineController";
import { DEFAULT_EASING } from "../engine/timeline/types";
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
  editor.timelineController.recordEdit("Set Timeline Duration", () =>
    editor.timelineController.setDuration(seconds),
  );
}

// Gesture-boundary hooks for continuous edits: capture at pointer-down /
// popover-open, commit at pointer-up / popover-close so the whole gesture
// is ONE undo step (an unchanged timeline records nothing).
export function beginTimelineEdit(editor: Editor): TimelineUndoSnapshot {
  return editor.timelineController.snapshotForUndo();
}

export function commitTimelineEdit(
  editor: Editor,
  label: string,
  before: TimelineUndoSnapshot,
): void {
  editor.timelineController.recordEditSince(label, before);
}

export function addKeyframe(
  editor: Editor,
  objectUuid: string,
  atTime?: number,
): void {
  editor.timelineController.recordEdit("Add Keyframe", () =>
    editor.timelineController.addKeyframe(objectUuid, atTime),
  );
}

export function deleteKeyframe(editor: Editor, keyframeId: string): void {
  editor.timelineController.recordEdit("Delete Keyframe", () =>
    editor.timelineController.deleteKeyframe(keyframeId),
  );
}

// Raw (unrecorded) — drag live-preview. Discrete callers wrap it: drags
// commit via commitTimelineEdit at pointer-up, keyboard nudges via
// nudgeKeyframe below.
export function moveKeyframe(
  editor: Editor,
  keyframeId: string,
  time: number,
): void {
  editor.timelineController.moveKeyframe(keyframeId, time);
}

export function nudgeKeyframe(
  editor: Editor,
  keyframeId: string,
  time: number,
): void {
  editor.timelineController.recordEdit("Move Keyframe", () =>
    editor.timelineController.moveKeyframe(keyframeId, time),
  );
}

// Raw (unrecorded) — the Motion popover fires this per curve-drag event;
// TimelineEditor coalesces one popover session into one undo step.
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
  const laneId = editor.timelineController.recordEdit("Add Animation Clip", () =>
    editor.timelineController.addClipLane(characterUuid, {
      sourceMediaId: item.media_id,
      name: item.name ?? "Animation",
      startTime,
      duration: DEFAULT_CLIP_DURATION,
      loop: true,
      autoDuration: true,
    }),
  );
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
  return editor.timelineController.recordEdit("Add Animation Clip", () =>
    editor.timelineController.addClipLane(objectUuid, {
      sourceMediaId: "",
      bakedClipIndex: clipIndex,
      name: clip.name || `Clip ${clipIndex + 1}`,
      startTime: atTime,
      duration: Math.min(clip.duration || DEFAULT_CLIP_DURATION, DEFAULT_CLIP_DURATION),
      // Loop by default, same as library strips (see addClipToCharacter).
      loop: true,
    }),
  );
}

// Raw (unrecorded) — strip-drag live-preview; the drag commits one undo step
// via commitTimelineEdit at pointer-up. Keyboard nudges use nudgeClipLane.
export function moveClipLane(
  editor: Editor,
  laneId: string,
  startTime: number,
): void {
  editor.timelineController.moveClipLane(laneId, startTime);
}

export function nudgeClipLane(
  editor: Editor,
  laneId: string,
  startTime: number,
): void {
  editor.timelineController.recordEdit("Move Animation Clip", () =>
    editor.timelineController.moveClipLane(laneId, startTime),
  );
}

// Raw (unrecorded) — trim-drag live-preview, committed at pointer-up.
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
  editor.timelineController.recordEdit("Toggle Clip Loop", () =>
    editor.timelineController.setClipLoop(laneId, loop),
  );
}

// Raw (unrecorded) — the Motion popover fires this per curve-drag event;
// TimelineEditor coalesces one popover session (including "Remove
// transition") into one undo step.
export function setClipTransitionEasing(
  editor: Editor,
  laneId: string,
  easing: EasingSpec | null,
): void {
  editor.timelineController.setClipTransitionEasing(laneId, easing);
}

// Enable the pose transition out of `laneId`'s strip: open a gap for it to
// play in when the boundary is flush (a too-packed row returns false and
// mutates nothing — callers toast) and set the default curve. One undo step.
export function enableClipTransition(editor: Editor, laneId: string): boolean {
  const before = editor.timelineController.snapshotForUndo();
  if (!editor.timelineController.ensureTransitionGap(laneId)) return false;
  editor.timelineController.setClipTransitionEasing(laneId, DEFAULT_EASING);
  editor.timelineController.recordEditSince("Enable Transition", before);
  return true;
}

// Individually undoable — both the strip's × button and Del/Backspace route
// through here. removeClipLane also mirrors the removal into the Cancel
// baseline (see TimelineController), and the snapshot captures both worlds.
export function removeClipLane(editor: Editor, laneId: string): void {
  if (!editor.timelineController.getClipLane(laneId)) return;
  editor.timelineController.recordEdit("Remove Animation Clip", () =>
    editor.timelineController.removeClipLane(laneId),
  );
}

export function saveTimeline(editor: Editor): void {
  editor.timelineController.save();
}

export function cancelTimeline(editor: Editor): void {
  editor.timelineController.cancel();
}
