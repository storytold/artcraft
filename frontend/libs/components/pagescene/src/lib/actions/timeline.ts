// UI-facing dispatchers for the animation timeline. Thin wrappers that
// forward to editor.timelineController (mirrors the other files in this
// folder). Pure-UI state (expanded, selected keyframe) is set directly on
// the store by components and has no dispatcher here.

import type Editor from "../engine/editor";
import type { EasingSpec } from "../engine/timeline/types";
import type { MediaItem } from "../models";

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

// Place a skeletal-animation clip (a Mixamo demo item) as a new stacked lane
// under `characterUuid`, dropped at the current playhead. The real clip length
// is resolved after the GLB loads; `length` here seeds the strip width only.
export function addClipToCharacter(
  editor: Editor,
  characterUuid: string,
  item: MediaItem,
): string | null {
  if (!item.media_id) return null;
  const startTime = editor.timelineController.getPlayhead();
  return editor.timelineController.addClipLane(characterUuid, {
    sourceMediaId: item.media_id,
    name: item.name ?? "Animation",
    startTime,
    duration: DEFAULT_CLIP_DURATION,
    loop: false,
  });
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
