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

  // ─── lifecycle ────────────────────────────────────────────────────────

  create(): void {
    if (this.timeline) return;
    this.timeline = {
      duration: DEFAULT_TIMELINE_DURATION,
      fps: DEFAULT_TIMELINE_FPS,
      tracks: [],
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
    this.saved = cloneTimeline(this.timeline);
    this.playhead = Math.min(this.playhead, this.timeline.duration);
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
      ),
    );
  }

  private emitPlayhead(): void {
    this.editor.bus.emit(
      new TimelinePlayheadEvent(this.playhead, this.isPlaying),
    );
  }
}
