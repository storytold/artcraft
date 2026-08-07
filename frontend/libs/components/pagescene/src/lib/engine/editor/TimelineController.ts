// TimelineController owns the animation timeline + playback for the 3D
// editor. It is the authoritative holder of the keyframe data; the store
// only mirrors it (via events → EngineStoreBridge) for the React UI.
//
// Playback contract: transforms are written to THREE objects ONLY while
// playing or on an explicit seek. When idle, the controller does not touch
// object transforms, so manual editing in build mode is unaffected.

import * as THREE from "three";
import type Editor from "../editor";
import { snapshotTransform, writeTransform } from "./actions/snapshots";
import { SaveTimelineAction } from "./actions/SaveTimelineAction";
import { sampleTrackAt } from "../timeline/interpolation";
import {
  cloneTimeline,
  DEFAULT_EASING,
  DEFAULT_TIMELINE_DURATION,
  DEFAULT_TIMELINE_FPS,
  type ClipLane,
  type ClipStrip,
  type EasingSpec,
  type Keyframe,
  type TimelineData,
  type TimelineTrack,
} from "../timeline/types";
import {
  TimelineChangedEvent,
  TimelinePlayheadEvent,
} from "../events/EngineEvent";

export class TimelineController {
  private timeline: TimelineData | null = null;
  private saved: TimelineData | null = null;
  private playhead = 0;
  private isPlaying = false;

  constructor(private readonly editor: Editor) {}

  // ─── queries ──────────────────────────────────────────────────────────

  exists(): boolean {
    return this.timeline !== null;
  }

  getTimeline(): TimelineData | null {
    return this.timeline;
  }

  getPlayhead(): number {
    return this.playhead;
  }

  // ─── lifecycle ────────────────────────────────────────────────────────

  create(): void {
    if (this.timeline) return;
    this.timeline = {
      duration: DEFAULT_TIMELINE_DURATION,
      fps: DEFAULT_TIMELINE_FPS,
      tracks: [],
      clipLanes: [],
    };
    this.saved = cloneTimeline(this.timeline);
    this.playhead = 0;
    this.isPlaying = false;
    this.emitChanged();
    this.emitPlayhead();
  }

  clear(): void {
    this.timeline = null;
    this.saved = null;
    this.playhead = 0;
    this.isPlaying = false;
    this.editor.characterAnimationManager.clear();
    this.emitChanged();
    this.emitPlayhead();
  }

  // Replace the live timeline wholesale (used by undo/redo of a save).
  loadTimeline(data: TimelineData): void {
    this.timeline = cloneTimeline(data);
    // Backfill defensively so legacy/partial saved timelines don't break the
    // frame-quantized UI (which assumes a valid fps) or produce a 0 duration.
    if (!this.timeline.fps || this.timeline.fps <= 0) {
      this.timeline.fps = DEFAULT_TIMELINE_FPS;
    }
    if (!this.timeline.duration || this.timeline.duration <= 0) {
      this.timeline.duration = DEFAULT_TIMELINE_DURATION;
    }
    if (!Array.isArray(this.timeline.tracks)) this.timeline.tracks = [];
    if (!Array.isArray(this.timeline.clipLanes)) this.timeline.clipLanes = [];
    this.saved = cloneTimeline(this.timeline);
    this.playhead = Math.min(this.playhead, this.timeline.duration);
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
    this.emitPlayhead();
  }

  // ─── transport ────────────────────────────────────────────────────────

  play(): void {
    if (!this.timeline) return;
    if (this.playhead >= this.timeline.duration) this.playhead = 0;
    this.isPlaying = true;
    this.emitPlayhead();
  }

  pause(): void {
    this.isPlaying = false;
    this.emitPlayhead();
  }

  seekTo(time: number): void {
    if (!this.timeline) return;
    this.playhead = Math.max(0, Math.min(time, this.timeline.duration));
    this.evaluate();
    this.emitPlayhead();
  }

  // Set the max timeline duration (seconds). Clamped to [1, 60] — covers the
  // required 5–30s range with headroom. Keeps the playhead in range.
  setDuration(seconds: number): void {
    if (!this.timeline || !Number.isFinite(seconds)) return;
    this.timeline.duration = Math.max(1, Math.min(60, seconds));
    if (this.playhead > this.timeline.duration) {
      this.playhead = this.timeline.duration;
    }
    this.emitChanged();
    this.emitPlayhead();
  }

  // Advanced once per frame from editor.renderSingleFrame().
  tick(delta: number): void {
    if (!this.timeline || !this.isPlaying) return;
    this.playhead += delta;
    if (this.playhead >= this.timeline.duration) {
      this.playhead = this.timeline.duration;
      this.isPlaying = false;
    }
    this.evaluate();
    this.emitPlayhead();
  }

  // ─── keyframe editing ──────────────────────────────────────────────────

  // Auto-key: when an ALREADY-keyframed object is mutated, capture its current
  // transform at the playhead — replacing the keyframe there or creating one at
  // the current scrub point. No-op for objects that have never been keyframed
  // (the first keyframe is always added explicitly).
  autoKeyIfTracked(objectUuid: string): void {
    if (!this.timeline) return;
    const track = this.timeline.tracks.find(
      (t) => t.objectUuid === objectUuid,
    );
    if (!track || track.keyframes.length === 0) return;
    this.addKeyframe(objectUuid, this.playhead);
  }

  addKeyframe(objectUuid: string, atTime?: number): void {
    if (!this.timeline) return;
    const obj = this.editor.activeScene.scene.getObjectByProperty(
      "uuid",
      objectUuid,
    );
    if (!obj) return;
    const time = Math.max(
      0,
      Math.min(atTime ?? this.playhead, this.timeline.duration),
    );
    const keyframe: Keyframe = {
      id: THREE.MathUtils.generateUUID(),
      time,
      transform: snapshotTransform(obj),
      easing: { ...DEFAULT_EASING },
    };
    let track = this.timeline.tracks.find((t) => t.objectUuid === objectUuid);
    if (!track) {
      track = { objectUuid, keyframes: [] };
      this.timeline.tracks.push(track);
    }
    // Replace an existing keyframe at (nearly) the same time, else insert.
    const existingIdx = track.keyframes.findIndex(
      (k) => Math.abs(k.time - time) < 1e-3,
    );
    if (existingIdx >= 0) track.keyframes[existingIdx] = keyframe;
    else track.keyframes.push(keyframe);
    this.sortTrack(track);
    this.emitChanged();
  }

  deleteKeyframe(keyframeId: string): void {
    if (!this.timeline) return;
    for (const track of this.timeline.tracks) {
      const idx = track.keyframes.findIndex((k) => k.id === keyframeId);
      if (idx >= 0) {
        track.keyframes.splice(idx, 1);
        break;
      }
    }
    // Drop now-empty tracks so the row disappears.
    this.timeline.tracks = this.timeline.tracks.filter(
      (t) => t.keyframes.length > 0,
    );
    this.emitChanged();
  }

  moveKeyframe(keyframeId: string, time: number): void {
    if (!this.timeline) return;
    const clamped = Math.max(0, Math.min(time, this.timeline.duration));
    for (const track of this.timeline.tracks) {
      const kf = track.keyframes.find((k) => k.id === keyframeId);
      if (kf) {
        kf.time = clamped;
        this.sortTrack(track);
        break;
      }
    }
    this.evaluate();
    this.emitChanged();
  }

  setEasing(keyframeId: string, easing: EasingSpec): void {
    if (!this.timeline) return;
    for (const track of this.timeline.tracks) {
      const kf = track.keyframes.find((k) => k.id === keyframeId);
      if (kf) {
        kf.easing = { ...easing };
        break;
      }
    }
    this.evaluate();
    this.emitChanged();
  }

  // ─── clip lanes (skeletal animation) ─────────────────────────────────────

  // Add a new stacked clip lane for `objectUuid` (a character). The clip is
  // dropped at `startTime`, clamped so it starts within the timeline. Returns
  // the new lane id, or null if there is no timeline or no free slot left on
  // the character's row (callers surface that to the user).
  addClipLane(objectUuid: string, strip: Omit<ClipStrip, "id">): string | null {
    if (!this.timeline) return null;
    // Characters hold clips on a single row: snap the drop to the nearest free
    // slot so strips never overlap (see resolveFreeStart).
    const startTime = this.resolveFreeStart(
      objectUuid,
      null,
      strip.startTime,
      strip.duration,
    );
    if (startTime === null) return null;
    const lane: ClipLane = {
      id: THREE.MathUtils.generateUUID(),
      objectUuid,
      strip: { ...strip, id: THREE.MathUtils.generateUUID(), startTime },
    };
    this.timeline.clipLanes.push(lane);
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
    return lane.id;
  }

  // Move a clip strip along its lane. Snaps to the nearest overlap-free slot so
  // it never runs into a neighbour, and stays within the timeline.
  moveClipLane(laneId: string, startTime: number): void {
    if (!this.timeline) return;
    const lane = this.timeline.clipLanes.find((l) => l.id === laneId);
    if (!lane) return;
    const freeStart = this.resolveFreeStart(
      lane.objectUuid,
      laneId,
      startTime,
      lane.strip.duration,
    );
    // No free slot for the drag target — keep the strip where it was (its
    // current position is always valid since it's excluded from the search).
    if (freeStart === null) return;
    lane.strip.startTime = freeStart;
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
  }

  // User trim (right edge): set the strip's on-timeline length. Clamped to at
  // least one frame and so its end never crosses the next clip or the timeline
  // end. Marks the duration as hand-set so a later clip (re)load won't overwrite it.
  resizeClipLane(laneId: string, duration: number): void {
    if (!this.timeline) return;
    const lane = this.timeline.clipLanes.find((l) => l.id === laneId);
    if (!lane) return;
    const minDur = 1 / (this.timeline.fps || DEFAULT_TIMELINE_FPS);
    const nextStart = this.nextStartAfter(
      lane.objectUuid,
      laneId,
      lane.strip.startTime,
    );
    const maxDur = nextStart - lane.strip.startTime;
    lane.strip.duration = Math.max(minDur, Math.min(duration, maxDur));
    lane.strip.autoDuration = false;
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
  }

  // Toggle whether a clip loops for the remainder of its strip.
  setClipLoop(laneId: string, loop: boolean): void {
    if (!this.timeline) return;
    const lane = this.timeline.clipLanes.find((l) => l.id === laneId);
    if (!lane) return;
    lane.strip.loop = loop;
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
  }

  // Called by CharacterAnimationManager once a clip GLB has loaded and its
  // real length is known. Fresh strips default to a compact width
  // (DEFAULT_CLIP_DURATION in actions/timeline.ts); if the clip is actually
  // SHORTER than that placeholder, shrink the strip so it never claims time
  // the clip can't fill. Never grows — a long clip stays at the compact
  // width until the user trims it out. User-trimmed strips are untouched.
  resolveClipDuration(laneId: string, naturalDuration: number): void {
    if (!this.timeline || !(naturalDuration > 0)) return;
    const lane = this.timeline.clipLanes.find((l) => l.id === laneId);
    if (!lane || lane.strip.autoDuration === false) return;
    lane.strip.duration = Math.min(lane.strip.duration, naturalDuration);
    lane.strip.autoDuration = false;
    // Keep the runtime's strip window in sync with the (possibly shrunk) width.
    this.syncClipLanes();
    this.emitChanged();
  }

  // Removal is SESSION-INDEPENDENT (it carries its own undo step via
  // RemoveClipLaneAction), so it is mirrored into the `saved` snapshot too:
  // otherwise Cancel would resurrect the deleted strip and the next Save
  // would double-record the removal (its before-state still holding the
  // strip costs the user a phantom undo step).
  removeClipLane(laneId: string): void {
    if (!this.timeline) return;
    this.timeline.clipLanes = this.timeline.clipLanes.filter(
      (l) => l.id !== laneId,
    );
    if (this.saved) {
      this.saved.clipLanes = this.saved.clipLanes.filter(
        (l) => l.id !== laneId,
      );
    }
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
  }

  getClipLane(laneId: string): ClipLane | null {
    return this.timeline?.clipLanes.find((l) => l.id === laneId) ?? null;
  }

  // The lane's entry in the `saved` snapshot (which may hold an older
  // placement than the live one, or none if the strip was added after the
  // last save). RemoveClipLaneAction captures it so undo can restore BOTH
  // worlds exactly.
  getSavedClipLane(laneId: string): ClipLane | null {
    const lane = this.saved?.clipLanes.find((l) => l.id === laneId);
    return lane ? JSON.parse(JSON.stringify(lane)) : null;
  }

  // Re-insert a previously removed lane verbatim (undo of a removal). The
  // strip returns to its exact prior slot; in the rare case another clip was
  // moved onto that slot after the delete, the strips can momentarily
  // overlap — the overlap guard re-applies on the next add/move.
  // `savedLane` (when the strip existed in the last-saved snapshot) undoes
  // the removal's `saved` mirroring at its saved-time placement, so a later
  // Cancel restores exactly the pre-removal saved state.
  restoreClipLane(lane: ClipLane, savedLane?: ClipLane): void {
    if (!this.timeline) return;
    if (this.timeline.clipLanes.some((l) => l.id === lane.id)) return;
    this.timeline.clipLanes.push(JSON.parse(JSON.stringify(lane)));
    if (
      savedLane &&
      this.saved &&
      !this.saved.clipLanes.some((l) => l.id === savedLane.id)
    ) {
      this.saved.clipLanes.push(JSON.parse(JSON.stringify(savedLane)));
    }
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
  }

  // All clip lanes for one character (stacked lanes, drop order).
  clipLanesFor(objectUuid: string): ClipLane[] {
    if (!this.timeline) return [];
    return this.timeline.clipLanes.filter((l) => l.objectUuid === objectUuid);
  }

  // ─── save / cancel ──────────────────────────────────────────────────────

  save(): void {
    if (!this.timeline) return;
    const before = this.saved
      ? cloneTimeline(this.saved)
      : cloneTimeline(this.timeline);
    const action = new SaveTimelineAction(this, before);
    this.saved = cloneTimeline(this.timeline);
    if (action.commit()) this.editor.history.record(action);
    this.emitChanged();
  }

  cancel(): void {
    if (!this.saved) return;
    this.timeline = cloneTimeline(this.saved);
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
    this.emitPlayhead();
  }

  // ─── internals ────────────────────────────────────────────────────────

  private evaluate(): void {
    if (!this.timeline) return;
    const cameraController = this.editor.cameraController;
    for (const track of this.timeline.tracks) {
      const snap = sampleTrackAt(track, this.playhead);
      if (!snap) continue;
      writeTransform(this.editor, track.objectUuid, snap);
      // In camera view the canvas renders through the viewport camera and
      // CameraController.tickPerFrame copies camera → cam_obj (the user's
      // flying drives the proxy). Timeline-driven camera motion goes the
      // other way, so mirror it onto the viewport camera here — otherwise
      // playback/scrubbing shows no movement while looking through the
      // camera (it's only visible as the frustum moving in viewport mode).
      if (
        cameraController.getCameraPersonMode() &&
        cameraController.cam_obj?.uuid === track.objectUuid &&
        cameraController.camera
      ) {
        cameraController.camera.position.copy(
          cameraController.cam_obj.position,
        );
        cameraController.camera.rotation.copy(
          cameraController.cam_obj.rotation,
        );
      }
    }
    // Pose characters from their skeletal clip lanes at the same playhead.
    this.editor.characterAnimationManager.evaluateAt(this.playhead);
  }

  // ─── clip-lane overlap guard (single row per character) ─────────────────

  // Snap `desiredStart` to the nearest position where a `duration`-long strip
  // fits without overlapping the character's other clips, within the timeline.
  // Used by add + move so a character's clips stay a non-overlapping sequence.
  // Returns null when the row has no free slot for `duration` at all.
  private resolveFreeStart(
    characterUuid: string,
    exceptLaneId: string | null,
    desiredStart: number,
    duration: number,
  ): number | null {
    if (!this.timeline) return desiredStart;
    const maxStart = Math.max(0, this.timeline.duration - duration);
    const clamp = (s: number) => Math.max(0, Math.min(s, maxStart));
    const others = this.otherStripIntervals(characterUuid, exceptLaneId);
    const desired = clamp(desiredStart);
    if (!this.overlapsAny(desired, duration, others)) return desired;
    // Candidate slots: flush before/after each neighbour, plus the two ends.
    const candidates = [0, maxStart];
    for (const iv of others) {
      candidates.push(iv.end);
      candidates.push(iv.start - duration);
    }
    const valid = candidates
      .map(clamp)
      .filter((s) => !this.overlapsAny(s, duration, others));
    if (valid.length === 0) return null; // row is full — reject the drop
    valid.sort((a, b) => Math.abs(a - desired) - Math.abs(b - desired));
    return valid[0];
  }

  // Start of the nearest clip that begins at/after `start` (excluding
  // `exceptLaneId`), or the timeline end if there is none. Bounds trim/length.
  private nextStartAfter(
    characterUuid: string,
    exceptLaneId: string | null,
    start: number,
  ): number {
    if (!this.timeline) return start;
    let next = this.timeline.duration;
    for (const iv of this.otherStripIntervals(characterUuid, exceptLaneId)) {
      if (iv.start >= start) next = Math.min(next, iv.start);
    }
    return next;
  }

  // Occupied [start, end] intervals of a character's OTHER clip strips, sorted.
  private otherStripIntervals(
    characterUuid: string,
    exceptLaneId: string | null,
  ): Array<{ start: number; end: number }> {
    if (!this.timeline) return [];
    return this.timeline.clipLanes
      .filter((l) => l.objectUuid === characterUuid && l.id !== exceptLaneId)
      .map((l) => ({
        start: l.strip.startTime,
        end: l.strip.startTime + l.strip.duration,
      }))
      .sort((a, b) => a.start - b.start);
  }

  private overlapsAny(
    start: number,
    duration: number,
    intervals: Array<{ start: number; end: number }>,
  ): boolean {
    const end = start + duration;
    return intervals.some((iv) => start < iv.end && end > iv.start);
  }

  // Reconcile the skeletal-animation runtime whenever the clip-lane set changes.
  private syncClipLanes(): void {
    this.editor.characterAnimationManager.sync(this.timeline?.clipLanes ?? []);
  }

  private sortTrack(track: TimelineTrack): void {
    track.keyframes.sort((a, b) => a.time - b.time);
  }

  private emitChanged(): void {
    this.editor.bus.emit(
      new TimelineChangedEvent(
        this.timeline !== null,
        this.timeline?.duration ?? DEFAULT_TIMELINE_DURATION,
        this.timeline ? cloneTimeline(this.timeline).tracks : [],
        this.timeline ? cloneTimeline(this.timeline).clipLanes : [],
      ),
    );
  }

  private emitPlayhead(): void {
    this.editor.bus.emit(
      new TimelinePlayheadEvent(this.playhead, this.isPlaying),
    );
  }
}
