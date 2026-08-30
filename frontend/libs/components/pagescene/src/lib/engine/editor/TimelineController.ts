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
import { TimelineEditAction } from "./actions/TimelineEditAction";
import { sampleTrackAt } from "../timeline/interpolation";
import {
  cloneTimeline,
  DEFAULT_EASING,
  DEFAULT_TIMELINE_DURATION,
  DEFAULT_TIMELINE_FPS,
  DEFAULT_TRANSITION_GAP,
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

// Whole-timeline state pair for undo/redo: the live timeline plus the
// last-saved baseline (which Cancel reverts to). TimelineEditAction restores
// both, so undoing past a Save also restores the older baseline.
export interface TimelineUndoSnapshot {
  live: TimelineData | null;
  saved: TimelineData | null;
}

export class TimelineController {
  private timeline: TimelineData | null = null;
  private saved: TimelineData | null = null;
  private playhead = 0;
  private isPlaying = false;

  constructor(private readonly editor: Editor) {}

  // ─── per-edit undo ────────────────────────────────────────────────────
  //
  // Every user-facing timeline edit is one undo step (TimelineEditAction).
  // Discrete edits wrap in recordEdit(); continuous gestures capture
  // snapshotForUndo() at gesture start and call recordEditSince() at the
  // end so the whole drag is a single step. Engine-internal mutations
  // (autoKeyIfTracked riding a gizmo transform) bypass recording on purpose.

  snapshotForUndo(): TimelineUndoSnapshot {
    return {
      live: this.timeline ? cloneTimeline(this.timeline) : null,
      saved: this.saved ? cloneTimeline(this.saved) : null,
    };
  }

  restoreSnapshot(snap: TimelineUndoSnapshot): void {
    this.timeline = snap.live ? cloneTimeline(snap.live) : null;
    this.saved = snap.saved ? cloneTimeline(snap.saved) : null;
    if (this.timeline) {
      this.playhead = Math.min(this.playhead, this.timeline.duration);
    }
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
    this.emitPlayhead();
  }

  recordEdit<T>(label: string, mutate: () => T): T {
    const before = this.snapshotForUndo();
    const result = mutate();
    this.recordEditSince(label, before);
    return result;
  }

  recordEditSince(label: string, before: TimelineUndoSnapshot): void {
    const after = this.snapshotForUndo();
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    this.editor.history.record(
      new TimelineEditAction(this, label, before, after),
    );
  }

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

  // Reset to a fresh empty timeline (scene switch / new scene). Unlike
  // create() — a no-op when a timeline already exists — this REPLACES
  // whatever is loaded, dropping tracks, strips and their runtimes, so a
  // scene saved without a timeline (or a brand-new scene) never inherits
  // the previous scene's animation data.
  reset(): void {
    this.timeline = {
      duration: DEFAULT_TIMELINE_DURATION,
      fps: DEFAULT_TIMELINE_FPS,
      tracks: [],
      clipLanes: [],
    };
    this.saved = cloneTimeline(this.timeline);
    this.playhead = 0;
    this.isPlaying = false;
    this.syncClipLanes(); // disposes every lane runtime, prunes mixers
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
  // required 5–30s range with headroom. Keeps the playhead in range, and
  // re-fits clip strips into the new range: a shrink used to strand strips
  // beyond the end — rendered outside the lane, unreachable by playback, and
  // trimming one computed a NEGATIVE max duration (clamping it to a frame).
  setDuration(seconds: number): void {
    if (!this.timeline || !Number.isFinite(seconds)) return;
    const duration = Math.max(1, Math.min(60, seconds));
    this.timeline.duration = duration;
    if (this.playhead > duration) {
      this.playhead = duration;
    }
    // Ascending order so earlier strips claim room first; a strip longer
    // than the whole timeline shrinks to fit, and resolveFreeStart re-snaps
    // anything now out of range into the nearest free slot.
    const lanes = [...this.timeline.clipLanes].sort(
      (a, b) => a.strip.startTime - b.strip.startTime,
    );
    let lanesChanged = false;
    for (const lane of lanes) {
      const strip = lane.strip;
      if (strip.startTime + strip.duration <= duration) continue;
      lanesChanged = true;
      if (strip.duration > duration) {
        strip.duration = duration;
        strip.autoDuration = false;
      }
      const freeStart = this.resolveFreeStart(
        lane.objectUuid,
        lane.id,
        strip.startTime,
        strip.duration,
      );
      // No free slot in the shrunken timeline: park the strip flush with the
      // end; overlaps (if any) resolve on the next add/move like restore's.
      strip.startTime = freeStart ?? Math.max(0, duration - strip.duration);
    }
    if (lanesChanged) this.syncClipLanes();
    this.evaluate();
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

  // Set (or clear, with null) the opt-in pose transition from `laneId`'s
  // strip into the NEXT strip on its row. Rides the Save/Cancel session
  // like every other clip edit.
  setClipTransitionEasing(laneId: string, easing: EasingSpec | null): void {
    if (!this.timeline) return;
    const lane = this.timeline.clipLanes.find((l) => l.id === laneId);
    if (!lane) return;
    if (easing) lane.strip.transitionEasing = { ...easing };
    else delete lane.strip.transitionEasing;
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
  }

  // Guarantee at least `gap` seconds of daylight between `laneId`'s strip and
  // the NEXT strip on its row, so an enabled transition has room to play.
  // Auto-placement packs strips flush (resolveFreeStart), so this is what
  // makes the boundary chip usable without hand-dragging a gap open first.
  // Makes room by shifting the next strip right (bounded by the strip after
  // it / the timeline end), then by trimming the leading strip when shifting
  // alone isn't enough. Returns false — mutating nothing — when there is no
  // next strip or the row is too packed to make room (callers surface that).
  // Rides the Save/Cancel session like every other clip edit.
  ensureTransitionGap(laneId: string, gap = DEFAULT_TRANSITION_GAP): boolean {
    if (!this.timeline) return false;
    const lead = this.timeline.clipLanes.find((l) => l.id === laneId);
    if (!lead) return false;
    const leadEnd = lead.strip.startTime + lead.strip.duration;
    // Epsilon: a strip trimmed flush against its neighbour can put leadEnd a
    // float-rounding hair PAST the neighbour's start; `>= leadEnd` alone
    // would then miss it and misreport "no next strip".
    const next = this.timeline.clipLanes
      .filter(
        (l) =>
          l.objectUuid === lead.objectUuid &&
          l.id !== lead.id &&
          l.strip.startTime >= leadEnd - 1e-6,
      )
      .sort((a, b) => a.strip.startTime - b.strip.startTime)[0];
    if (!next) return false;
    const needed = gap - (next.strip.startTime - leadEnd);
    if (needed <= 0) return true;
    const followBound = this.nextStartAfter(
      lead.objectUuid,
      next.id,
      next.strip.startTime,
    );
    const shiftAvail = Math.max(
      0,
      followBound - (next.strip.startTime + next.strip.duration),
    );
    const minDur = 1 / (this.timeline.fps || DEFAULT_TIMELINE_FPS);
    const trimAvail = Math.max(0, lead.strip.duration - minDur);
    if (shiftAvail + trimAvail < needed) return false;
    const shift = Math.min(needed, shiftAvail);
    next.strip.startTime += shift;
    const trim = needed - shift;
    if (trim > 0) {
      lead.strip.duration -= trim;
      lead.strip.autoDuration = false;
    }
    this.syncClipLanes();
    this.evaluate();
    this.emitChanged();
    return true;
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

  // Removal is SESSION-INDEPENDENT (its own undo step, recorded by the
  // actions/timeline.ts wrapper), so it is mirrored into the `saved`
  // snapshot too: otherwise Cancel would resurrect the deleted strip. The
  // undo snapshot captures both worlds, so undo restores them exactly.
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

  // All clip lanes for one character (stacked lanes, drop order).
  clipLanesFor(objectUuid: string): ClipLane[] {
    if (!this.timeline) return [];
    return this.timeline.clipLanes.filter((l) => l.objectUuid === objectUuid);
  }

  // ─── save / cancel ──────────────────────────────────────────────────────
  //
  // Individual edits carry their own undo steps (see recordEdit), so Save
  // only moves the Cancel baseline — its undo restores the OLD baseline
  // without jumping the live timeline (Ctrl+Z right after Save still undoes
  // the last edit, not the whole session). Cancel is itself one undo step,
  // so a mis-click can be undone.

  save(): void {
    if (!this.timeline) return;
    this.recordEdit("Save Timeline", () => {
      this.saved = cloneTimeline(this.timeline!);
    });
    this.emitChanged();
  }

  cancel(): void {
    if (!this.saved) return;
    this.recordEdit("Cancel Timeline Edits", () => {
      this.timeline = cloneTimeline(this.saved!);
    });
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
